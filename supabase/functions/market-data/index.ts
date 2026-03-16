import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MarketDataRequest {
  action: "get_price" | "get_candles" | "ingest_tick" | "generate_candle" | "list_symbols";
  symbol?: string;
  exchange?: string;
  timeframe?: string;
  limit?: number;
  from?: string;
  to?: string;
  tick_data?: {
    bid: number;
    ask: number;
    volume?: number;
  };
}

// Rate limiter helper
async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  endpoint: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();

  const { count } = await supabase
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .gte("window_start", windowStart);

  if ((count ?? 0) >= maxRequests) return false;

  await supabase.from("rate_limits").insert({
    user_id: userId,
    endpoint,
    window_start: new Date().toISOString(),
  });

  return true;
}

// HMAC signature generation for broker API calls
function generateHMAC(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  ).then(key =>
    crypto.subtle.sign("HMAC", key, encoder.encode(payload))
  ).then(sig =>
    Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: 60 requests per minute for market data
    const allowed = await checkRateLimit(supabase, user.id, "market-data", 60, 60);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Max 60 requests/minute." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: MarketDataRequest = await req.json();

    switch (body.action) {
      case "get_price": {
        if (!body.symbol) {
          return new Response(JSON.stringify({ error: "symbol required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data } = await supabase
          .from("market_data")
          .select("*")
          .eq("symbol", body.symbol.toUpperCase())
          .eq("data_type", "tick")
          .order("timestamp", { ascending: false })
          .limit(1)
          .single();

        return new Response(JSON.stringify({ price: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_candles": {
        if (!body.symbol) {
          return new Response(JSON.stringify({ error: "symbol required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        let query = supabase
          .from("market_data")
          .select("*")
          .eq("symbol", body.symbol.toUpperCase())
          .eq("data_type", "candle")
          .eq("timeframe", body.timeframe || "1m")
          .order("timestamp", { ascending: false })
          .limit(body.limit || 100);

        if (body.from) query = query.gte("timestamp", body.from);
        if (body.to) query = query.lte("timestamp", body.to);

        const { data, error } = await query;
        if (error) throw error;

        return new Response(JSON.stringify({ candles: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "ingest_tick": {
        if (!body.symbol || !body.tick_data) {
          return new Response(JSON.stringify({ error: "symbol and tick_data required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const mid = (body.tick_data.bid + body.tick_data.ask) / 2;
        const spread = body.tick_data.ask - body.tick_data.bid;

        const { data: tick, error } = await supabase
          .from("market_data")
          .insert({
            symbol: body.symbol.toUpperCase(),
            exchange: body.exchange || "binance",
            data_type: "tick",
            bid: body.tick_data.bid,
            ask: body.tick_data.ask,
            close: mid,
            spread,
            volume: body.tick_data.volume || 0,
            timestamp: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ tick }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "generate_candle": {
        if (!body.symbol || !body.timeframe) {
          return new Response(JSON.stringify({ error: "symbol and timeframe required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get ticks for the timeframe window
        const windowMinutes = parseTimeframe(body.timeframe);
        const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

        const { data: ticks } = await supabase
          .from("market_data")
          .select("close, volume, timestamp")
          .eq("symbol", body.symbol.toUpperCase())
          .eq("data_type", "tick")
          .gte("timestamp", windowStart)
          .order("timestamp", { ascending: true });

        if (!ticks || ticks.length === 0) {
          return new Response(JSON.stringify({ error: "No tick data available" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const prices = ticks.map(t => t.close as number);
        const candle = {
          symbol: body.symbol.toUpperCase(),
          exchange: body.exchange || "binance",
          data_type: "candle",
          timeframe: body.timeframe,
          open: prices[0],
          high: Math.max(...prices),
          low: Math.min(...prices),
          close: prices[prices.length - 1],
          volume: ticks.reduce((sum, t) => sum + ((t.volume as number) || 0), 0),
          timestamp: new Date().toISOString(),
        };

        const { data: saved, error } = await supabase
          .from("market_data")
          .insert(candle)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ candle: saved }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list_symbols": {
        const { data } = await supabase
          .from("market_data")
          .select("symbol, exchange")
          .order("symbol")
          .limit(500);

        const unique = [...new Set((data || []).map(d => `${d.exchange}:${d.symbol}`))];
        return new Response(JSON.stringify({ symbols: unique }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: unknown) {
    console.error("Market Data Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function parseTimeframe(tf: string): number {
  const num = parseInt(tf) || 1;
  if (tf.endsWith("m")) return num;
  if (tf.endsWith("h")) return num * 60;
  if (tf.endsWith("d")) return num * 1440;
  if (tf.endsWith("w")) return num * 10080;
  return num;
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PortfolioRequest {
  action: "snapshot" | "summary" | "history" | "position_open" | "position_close" | "positions_list";
  position_id?: string;
  symbol?: string;
  side?: "buy" | "sell";
  quantity?: number;
  avg_entry_price?: number;
  stop_loss?: number;
  take_profit?: number;
  leverage?: number;
  bot_id?: string;
  broker_connection_id?: string;
  close_price?: number;
  realized_pnl?: number;
  days?: number;
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

    const body: PortfolioRequest = await req.json();

    switch (body.action) {
      case "summary": {
        // Get open positions
        const { data: positions } = await supabase
          .from("positions")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_open", true);

        // Get latest snapshot
        const { data: latestSnapshot } = await supabase
          .from("portfolio_snapshots")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const totalUnrealizedPnl = (positions || []).reduce(
          (sum, p) => sum + (Number(p.unrealized_pnl) || 0), 0
        );
        const totalRealizedPnl = (positions || []).reduce(
          (sum, p) => sum + (Number(p.realized_pnl) || 0), 0
        );
        const totalMarginUsed = (positions || []).reduce(
          (sum, p) => sum + (Number(p.margin_used) || 0), 0
        );

        // Exposure by asset
        const exposureByAsset: Record<string, number> = {};
        (positions || []).forEach((p) => {
          const value = Number(p.quantity) * Number(p.avg_entry_price);
          exposureByAsset[p.symbol] = (exposureByAsset[p.symbol] || 0) + value;
        });

        const snapshot = latestSnapshot?.[0];

        return new Response(JSON.stringify({
          total_equity: snapshot?.total_equity || 0,
          total_balance: snapshot?.total_balance || 0,
          unrealized_pnl: totalUnrealizedPnl,
          realized_pnl: totalRealizedPnl,
          total_margin_used: totalMarginUsed,
          drawdown_percent: snapshot?.drawdown_percent || 0,
          max_drawdown_percent: snapshot?.max_drawdown_percent || 0,
          open_positions_count: (positions || []).length,
          exposure_by_asset: exposureByAsset,
          positions: positions || [],
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "snapshot": {
        const { data: positions } = await supabase
          .from("positions")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_open", true);

        const totalUnrealizedPnl = (positions || []).reduce(
          (sum, p) => sum + (Number(p.unrealized_pnl) || 0), 0
        );
        const totalRealizedPnl = (positions || []).reduce(
          (sum, p) => sum + (Number(p.realized_pnl) || 0), 0
        );

        const exposureByAsset: Record<string, number> = {};
        (positions || []).forEach((p) => {
          const value = Number(p.quantity) * Number(p.avg_entry_price);
          exposureByAsset[p.symbol] = (exposureByAsset[p.symbol] || 0) + value;
        });

        const { data: snapshot, error } = await supabase
          .from("portfolio_snapshots")
          .insert({
            user_id: user.id,
            total_equity: totalUnrealizedPnl + totalRealizedPnl,
            total_balance: totalRealizedPnl,
            unrealized_pnl: totalUnrealizedPnl,
            realized_pnl: totalRealizedPnl,
            open_positions_count: (positions || []).length,
            exposure_by_asset: exposureByAsset,
            snapshot_type: "manual",
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ snapshot }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "history": {
        const days = body.days || 30;
        const since = new Date();
        since.setDate(since.getDate() - days);

        const { data: snapshots, error } = await supabase
          .from("portfolio_snapshots")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", since.toISOString())
          .order("created_at", { ascending: true });

        if (error) throw error;

        return new Response(JSON.stringify({ snapshots }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "position_open": {
        if (!body.symbol || !body.side || !body.quantity || !body.avg_entry_price) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: position, error } = await supabase
          .from("positions")
          .insert({
            user_id: user.id,
            symbol: body.symbol,
            side: body.side,
            quantity: body.quantity,
            avg_entry_price: body.avg_entry_price,
            stop_loss: body.stop_loss,
            take_profit: body.take_profit,
            leverage: body.leverage || 1,
            bot_id: body.bot_id,
            broker_connection_id: body.broker_connection_id,
            is_open: true,
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ position }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "position_close": {
        if (!body.position_id) {
          return new Response(
            JSON.stringify({ error: "position_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: position, error } = await supabase
          .from("positions")
          .update({
            is_open: false,
            closed_at: new Date().toISOString(),
            realized_pnl: body.realized_pnl || 0,
            current_price: body.close_price,
          })
          .eq("id", body.position_id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ position }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "positions_list": {
        const { data: positions, error } = await supabase
          .from("positions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) throw error;

        return new Response(JSON.stringify({ positions }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("Portfolio Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

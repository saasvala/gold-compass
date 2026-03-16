import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limiter
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
  await supabase.from("rate_limits").insert({ user_id: userId, endpoint, window_start: new Date().toISOString() });
  return true;
}

interface OrderRequest {
  action: "create" | "cancel" | "update_status" | "list" | "get";
  order_id?: string;
  symbol?: string;
  side?: "buy" | "sell";
  order_type?: "market" | "limit" | "stop" | "stop_limit" | "trailing_stop";
  quantity?: number;
  price?: number;
  stop_price?: number;
  trail_percent?: number;
  time_in_force?: string;
  bot_id?: string;
  broker_connection_id?: string;
  strategy_id?: string;
  status?: string;
  metadata?: Record<string, unknown>;
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

    // Rate limit: 30 order actions per minute
    const allowed = await checkRateLimit(supabase, user.id, "order-management", 30, 60);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Max 30 requests/minute." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: OrderRequest = await req.json();
    switch (body.action) {
      case "create": {
        if (!body.symbol || !body.side || !body.quantity) {
          return new Response(
            JSON.stringify({ error: "Missing required fields: symbol, side, quantity" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Risk validation
        const riskCheck = await validateRisk(supabase, user.id, body);
        if (!riskCheck.passed) {
          // Log risk event
          await supabase.from("risk_events").insert({
            user_id: user.id,
            bot_id: body.bot_id || null,
            event_type: "order_rejected",
            severity: "warning",
            description: riskCheck.reason,
            action_taken: "order_blocked",
          });

          return new Response(
            JSON.stringify({ error: riskCheck.reason, risk_blocked: true }),
            { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: order, error } = await supabase.from("orders").insert({
          user_id: user.id,
          symbol: body.symbol,
          side: body.side,
          order_type: body.order_type || "market",
          quantity: body.quantity,
          price: body.price,
          stop_price: body.stop_price,
          trail_percent: body.trail_percent,
          time_in_force: body.time_in_force || "GTC",
          bot_id: body.bot_id,
          broker_connection_id: body.broker_connection_id,
          strategy_id: body.strategy_id,
          status: "pending",
          metadata: body.metadata || {},
        }).select().single();

        if (error) throw error;

        // Log audit
        await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: "order_created",
          resource: `order:${order.id}`,
          severity: "info",
          details: { symbol: body.symbol, side: body.side, quantity: body.quantity, order_type: body.order_type },
        });

        return new Response(JSON.stringify({ order }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "cancel": {
        if (!body.order_id) {
          return new Response(
            JSON.stringify({ error: "order_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: existing } = await supabase
          .from("orders")
          .select("*")
          .eq("id", body.order_id)
          .eq("user_id", user.id)
          .single();

        if (!existing) {
          return new Response(JSON.stringify({ error: "Order not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (["filled", "cancelled", "rejected"].includes(existing.status)) {
          return new Response(
            JSON.stringify({ error: `Cannot cancel order with status: ${existing.status}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: cancelled, error } = await supabase
          .from("orders")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("id", body.order_id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;

        await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: "order_cancelled",
          resource: `order:${body.order_id}`,
          severity: "info",
        });

        return new Response(JSON.stringify({ order: cancelled }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_status": {
        if (!body.order_id || !body.status) {
          return new Response(
            JSON.stringify({ error: "order_id and status required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updateData: Record<string, unknown> = { status: body.status };
        if (body.status === "filled") updateData.filled_at = new Date().toISOString();
        if (body.status === "cancelled") updateData.cancelled_at = new Date().toISOString();

        const { data: updated, error } = await supabase
          .from("orders")
          .update(updateData)
          .eq("id", body.order_id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ order: updated }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list": {
        const query = supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100);

        const { data: orders, error } = await query;
        if (error) throw error;

        return new Response(JSON.stringify({ orders }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get": {
        if (!body.order_id) {
          return new Response(
            JSON.stringify({ error: "order_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: order, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", body.order_id)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ order }), {
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
    console.error("OMS Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function validateRisk(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  order: OrderRequest
): Promise<{ passed: boolean; reason: string }> {
  // Check open positions count
  const { count: openPositions } = await supabase
    .from("positions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_open", true);

  if ((openPositions ?? 0) >= 20) {
    return { passed: false, reason: "Maximum open positions limit (20) reached" };
  }

  // Check pending orders count
  const { count: pendingOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "pending");

  if ((pendingOrders ?? 0) >= 50) {
    return { passed: false, reason: "Maximum pending orders limit (50) reached" };
  }

  // Check daily loss limit from portfolio snapshots
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: todaySnapshot } = await supabase
    .from("portfolio_snapshots")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", today.toISOString())
    .order("created_at", { ascending: true })
    .limit(1);

  if (todaySnapshot && todaySnapshot.length > 0) {
    const dailyLoss = todaySnapshot[0].realized_pnl;
    if (dailyLoss < -500) {
      return { passed: false, reason: "Daily loss limit ($500) exceeded — circuit breaker active" };
    }
  }

  return { passed: true, reason: "" };
}

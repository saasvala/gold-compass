// TRADE EXECUTION ENGINE
// Order validation -> risk gate -> smart order routing -> broker execution
// -> fill reconciliation -> position management -> audit logging.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptSecret } from "../_shared/crypto.ts";
import {
  cancelOrder as brokerCancel,
  fetchOrderStatus,
  placeOrder,
  supportedBroker,
  type BrokerCredentials,
  type ExecutionReport,
} from "../_shared/brokers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Supa = ReturnType<typeof createClient>;

interface ExecRequest {
  action: "execute" | "cancel" | "modify" | "sync" | "sync_all" | "routes";
  order_id?: string;
  broker_connection_id?: string;
  symbol?: string;
  side?: "buy" | "sell";
  order_type?: "market" | "limit" | "stop" | "stop_limit" | "trailing_stop";
  quantity?: number;
  price?: number;
  stop_price?: number;
  trail_percent?: number;
  time_in_force?: string;
  bot_id?: string;
  strategy_id?: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function checkRateLimit(supabase: Supa, userId: string, endpoint: string, max: number, windowSeconds: number) {
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const { count } = await supabase
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .gte("window_start", windowStart);
  if ((count ?? 0) >= max) return false;
  await supabase.from("rate_limits").insert({ user_id: userId, endpoint, window_start: new Date().toISOString() });
  return true;
}

async function audit(
  supabase: Supa,
  userId: string,
  action: string,
  resource: string,
  severity: string,
  details: Record<string, unknown>,
) {
  await supabase.from("audit_logs").insert({ user_id: userId, action, resource, severity, details });
}

async function loadCredentials(
  supabase: Supa,
  userId: string,
  connectionId: string,
): Promise<{ creds?: BrokerCredentials; error?: string }> {
  const { data: conn } = await supabase
    .from("broker_connections")
    .select("*")
    .eq("id", connectionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!conn) return { error: "Broker connection not found" };
  if (!conn.is_active) return { error: "Broker connection is not active" };
  if (!Array.isArray(conn.permissions) || !conn.permissions.includes("trade")) {
    return { error: "Broker connection lacks 'trade' permission" };
  }
  if (!conn.api_key_encrypted || !conn.api_secret_encrypted) {
    return { error: "Broker credentials missing — reconnect the broker" };
  }
  if (!supportedBroker(conn.broker_name)) {
    return { error: `Unsupported broker: ${conn.broker_name}` };
  }

  return {
    creds: {
      apiKey: await decryptSecret(conn.api_key_encrypted),
      apiSecret: await decryptSecret(conn.api_secret_encrypted),
      passphrase: conn.passphrase_encrypted ? await decryptSecret(conn.passphrase_encrypted) : undefined,
      isTestnet: Boolean(conn.is_testnet),
      brokerName: String(conn.broker_name).toLowerCase(),
      metadata: (conn.metadata ?? {}) as Record<string, unknown>,
    },
  };
}

// SMART ORDER ROUTING — pick the venue with trade permission, preferring the
// explicitly requested one, then the connection that most recently confirmed
// connectivity (lowest expected latency / highest reliability).
async function routeOrder(
  supabase: Supa,
  userId: string,
  requested?: string,
): Promise<{ connectionId?: string; error?: string }> {
  if (requested) return { connectionId: requested };

  const { data: conns } = await supabase
    .from("broker_connections")
    .select("id, broker_name, permissions, is_active, connection_status, last_connected_at")
    .eq("user_id", userId)
    .eq("is_active", true)
    .eq("connection_status", "connected")
    .order("last_connected_at", { ascending: false });

  const candidate = (conns ?? []).find(
    (c: Record<string, unknown>) =>
      Array.isArray(c.permissions) && (c.permissions as string[]).includes("trade") &&
      supportedBroker(String(c.broker_name)),
  );
  if (!candidate) return { error: "No active broker connection with trade permission available" };
  return { connectionId: String(candidate.id) };
}

async function riskGate(authHeader: string, body: ExecRequest) {
  try {
    const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/risk-engine`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      },
      body: JSON.stringify({
        action: "evaluate",
        symbol: body.symbol,
        side: body.side,
        quantity: body.quantity,
        price: body.price ?? body.stop_price,
        stop_loss: body.stop_price,
        bot_id: body.bot_id,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { passed: false, violations: [], reason: data?.error ?? "Risk engine unavailable" };
    const violations = data.violations ?? [];
    return {
      passed: Boolean(data.passed),
      violations,
      reason: violations.map((v: { message: string }) => v.message).join("; ") || "Risk check failed",
    };
  } catch (_e) {
    return { passed: false, violations: [], reason: "Risk engine unavailable — execution blocked for safety" };
  }
}

// Apply a fill (full or partial) to the user's position book.
async function applyFill(
  supabase: Supa,
  userId: string,
  order: Record<string, unknown>,
  fillQty: number,
  fillPrice: number,
) {
  if (fillQty <= 0 || !fillPrice) return;
  const symbol = String(order.symbol);
  const side = String(order.side) as "buy" | "sell";

  const { data: existing } = await supabase
    .from("positions")
    .select("*")
    .eq("user_id", userId)
    .eq("symbol", symbol)
    .eq("is_open", true)
    .maybeSingle();

  if (!existing) {
    await supabase.from("positions").insert({
      user_id: userId,
      bot_id: order.bot_id ?? null,
      broker_connection_id: order.broker_connection_id ?? null,
      symbol,
      side,
      quantity: fillQty,
      avg_entry_price: fillPrice,
      current_price: fillPrice,
      unrealized_pnl: 0,
      realized_pnl: 0,
      is_open: true,
      opened_at: new Date().toISOString(),
    });
    return;
  }

  const posQty = Number(existing.quantity);
  const posEntry = Number(existing.avg_entry_price);
  const sameSide = existing.side === side;

  if (sameSide) {
    const newQty = posQty + fillQty;
    await supabase.from("positions").update({
      quantity: newQty,
      avg_entry_price: (posQty * posEntry + fillQty * fillPrice) / newQty,
      current_price: fillPrice,
    }).eq("id", existing.id);
    return;
  }

  // Opposing fill — reduce or flip
  const closedQty = Math.min(posQty, fillQty);
  const direction = existing.side === "buy" ? 1 : -1;
  const realized = Number(existing.realized_pnl ?? 0) + direction * (fillPrice - posEntry) * closedQty;
  const remaining = posQty - fillQty;

  if (remaining > 0) {
    await supabase.from("positions").update({
      quantity: remaining,
      realized_pnl: realized,
      current_price: fillPrice,
    }).eq("id", existing.id);
  } else {
    await supabase.from("positions").update({
      quantity: 0,
      realized_pnl: realized,
      current_price: fillPrice,
      unrealized_pnl: 0,
      is_open: false,
      closed_at: new Date().toISOString(),
    }).eq("id", existing.id);

    if (remaining < 0) {
      await supabase.from("positions").insert({
        user_id: userId,
        bot_id: order.bot_id ?? null,
        broker_connection_id: order.broker_connection_id ?? null,
        symbol,
        side,
        quantity: Math.abs(remaining),
        avg_entry_price: fillPrice,
        current_price: fillPrice,
        unrealized_pnl: 0,
        realized_pnl: 0,
        is_open: true,
        opened_at: new Date().toISOString(),
      });
    }
  }
}

// Reconcile a broker execution report against the stored order (handles partial fills).
async function reconcile(
  supabase: Supa,
  userId: string,
  order: Record<string, unknown>,
  report: ExecutionReport,
) {
  const previouslyFilled = Number(order.filled_quantity ?? 0);
  const newlyFilled = Math.max(0, report.filledQuantity - previouslyFilled);

  const update: Record<string, unknown> = {
    status: report.status,
    broker_order_id: report.brokerOrderId ?? order.broker_order_id ?? null,
    filled_quantity: Math.max(previouslyFilled, report.filledQuantity),
    avg_fill_price: report.avgFillPrice ?? order.avg_fill_price ?? null,
    commission: report.commission ?? order.commission ?? null,
    rejection_reason: report.rejectionReason,
    metadata: {
      ...((order.metadata ?? {}) as Record<string, unknown>),
      last_latency_ms: report.latencyMs,
      last_sync_at: new Date().toISOString(),
    },
  };
  if (report.status === "submitted" && !order.submitted_at) update.submitted_at = new Date().toISOString();
  if (report.status === "filled") update.filled_at = new Date().toISOString();
  if (report.status === "cancelled") update.cancelled_at = new Date().toISOString();

  const { data: updated } = await supabase
    .from("orders")
    .update(update)
    .eq("id", order.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (newlyFilled > 0 && report.avgFillPrice) {
    await applyFill(supabase, userId, { ...order, ...update }, newlyFilled, report.avgFillPrice);
  }

  return updated;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !user) return json({ error: "Invalid token" }, 401);

    const allowed = await checkRateLimit(supabase, user.id, "trade-execution", 60, 60);
    if (!allowed) return json({ error: "Rate limit exceeded. Max 60 executions/minute." }, 429);

    const body: ExecRequest = await req.json();

    switch (body.action) {
      case "routes": {
        const { data: conns } = await supabase
          .from("broker_connections")
          .select("id, broker_name, broker_type, is_testnet, is_active, permissions, connection_status, last_connected_at")
          .eq("user_id", user.id)
          .eq("is_active", true);
        const routes = (conns ?? []).filter(
          (c: Record<string, unknown>) =>
            Array.isArray(c.permissions) && (c.permissions as string[]).includes("trade") &&
            supportedBroker(String(c.broker_name)),
        );
        return json({ routes });
      }

      case "execute": {
        // 1. Validation
        if (!body.symbol || !body.side || !body.quantity || body.quantity <= 0) {
          return json({ error: "symbol, side and a positive quantity are required" }, 400);
        }
        const orderType = body.order_type ?? "market";
        if ((orderType === "limit" || orderType === "stop_limit") && !body.price) {
          return json({ error: `price is required for ${orderType} orders` }, 400);
        }
        if ((orderType === "stop" || orderType === "stop_limit") && !body.stop_price) {
          return json({ error: `stop_price is required for ${orderType} orders` }, 400);
        }

        // 2. Risk gate (fail closed)
        const risk = await riskGate(authHeader, body);
        if (!risk.passed) {
          await audit(supabase, user.id, "execution_risk_blocked", `symbol:${body.symbol}`, "warning", {
            reason: risk.reason,
          });
          return json({ error: risk.reason, risk_blocked: true, violations: risk.violations }, 422);
        }

        // 3. Smart order routing
        const route = await routeOrder(supabase, user.id, body.broker_connection_id);
        if (!route.connectionId) return json({ error: route.error }, 400);

        const { creds, error: credError } = await loadCredentials(supabase, user.id, route.connectionId);
        if (!creds) return json({ error: credError }, 400);

        // 4. Persist the order before touching the venue (audit trail first)
        const { data: order, error: insertError } = await supabase.from("orders").insert({
          user_id: user.id,
          symbol: body.symbol,
          side: body.side,
          order_type: orderType,
          quantity: body.quantity,
          price: body.price ?? null,
          stop_price: body.stop_price ?? null,
          trail_percent: body.trail_percent ?? null,
          time_in_force: body.time_in_force ?? "GTC",
          bot_id: body.bot_id ?? null,
          strategy_id: body.strategy_id ?? null,
          broker_connection_id: route.connectionId,
          status: "pending",
          filled_quantity: 0,
          metadata: { routed_broker: creds.brokerName, testnet: creds.isTestnet },
        }).select().single();
        if (insertError) throw insertError;

        // 5. Execute at the venue
        let report: ExecutionReport;
        try {
          report = await placeOrder(creds, {
            symbol: body.symbol,
            side: body.side,
            orderType,
            quantity: body.quantity,
            price: body.price,
            stopPrice: body.stop_price,
            trailPercent: body.trail_percent,
            timeInForce: body.time_in_force,
            clientOrderId: `lv${String(order.id).replace(/-/g, "").slice(0, 20)}`,
          });
        } catch (e) {
          report = {
            brokerOrderId: null, status: "rejected", filledQuantity: 0, avgFillPrice: null,
            commission: null, rejectionReason: e instanceof Error ? e.message : "Execution failed",
            raw: null, latencyMs: 0,
          };
        }

        const finalOrder = await reconcile(supabase, user.id, order, report);

        await audit(
          supabase,
          user.id,
          report.status === "rejected" ? "execution_rejected" : "order_executed",
          `order:${order.id}`,
          report.status === "rejected" ? "warning" : "info",
          {
            broker: creds.brokerName,
            testnet: creds.isTestnet,
            symbol: body.symbol,
            side: body.side,
            quantity: body.quantity,
            status: report.status,
            filled: report.filledQuantity,
            latency_ms: report.latencyMs,
            rejection_reason: report.rejectionReason,
          },
        );

        return json(
          { order: finalOrder, execution: { ...report, raw: undefined }, routed_to: creds.brokerName },
          report.status === "rejected" ? 422 : 201,
        );
      }

      case "cancel": {
        if (!body.order_id) return json({ error: "order_id required" }, 400);
        const { data: order } = await supabase
          .from("orders").select("*").eq("id", body.order_id).eq("user_id", user.id).maybeSingle();
        if (!order) return json({ error: "Order not found" }, 404);
        if (["filled", "cancelled", "rejected", "expired"].includes(String(order.status))) {
          return json({ error: `Cannot cancel order with status: ${order.status}` }, 400);
        }

        if (order.broker_order_id && order.broker_connection_id) {
          const { creds, error: credError } = await loadCredentials(
            supabase, user.id, String(order.broker_connection_id),
          );
          if (!creds) return json({ error: credError }, 400);
          const res = await brokerCancel(creds, String(order.symbol), String(order.broker_order_id));
          if (!res.ok) return json({ error: "Broker rejected the cancel request", details: res.body }, 502);
        }

        const { data: cancelled } = await supabase
          .from("orders")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("id", order.id).eq("user_id", user.id).select().single();

        await audit(supabase, user.id, "order_cancelled", `order:${order.id}`, "info", { symbol: order.symbol });
        return json({ order: cancelled });
      }

      case "modify": {
        // Cancel/replace semantics — the standard way to modify on both venues.
        if (!body.order_id) return json({ error: "order_id required" }, 400);
        const { data: order } = await supabase
          .from("orders").select("*").eq("id", body.order_id).eq("user_id", user.id).maybeSingle();
        if (!order) return json({ error: "Order not found" }, 404);
        if (["filled", "cancelled", "rejected", "expired"].includes(String(order.status))) {
          return json({ error: `Cannot modify order with status: ${order.status}` }, 400);
        }

        if (order.broker_order_id && order.broker_connection_id) {
          const { creds, error: credError } = await loadCredentials(
            supabase, user.id, String(order.broker_connection_id),
          );
          if (!creds) return json({ error: credError }, 400);
          const res = await brokerCancel(creds, String(order.symbol), String(order.broker_order_id));
          if (!res.ok) return json({ error: "Broker rejected the modify (cancel leg)", details: res.body }, 502);
        }

        await supabase.from("orders")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("id", order.id).eq("user_id", user.id);

        const remaining = Number(order.quantity) - Number(order.filled_quantity ?? 0);
        const replacement: ExecRequest = {
          action: "execute",
          symbol: String(order.symbol),
          side: order.side as "buy" | "sell",
          order_type: (body.order_type ?? order.order_type) as ExecRequest["order_type"],
          quantity: body.quantity ?? remaining,
          price: body.price ?? (order.price as number | null) ?? undefined,
          stop_price: body.stop_price ?? (order.stop_price as number | null) ?? undefined,
          trail_percent: body.trail_percent ?? (order.trail_percent as number | null) ?? undefined,
          time_in_force: body.time_in_force ?? String(order.time_in_force),
          bot_id: (order.bot_id as string | null) ?? undefined,
          strategy_id: (order.strategy_id as string | null) ?? undefined,
          broker_connection_id: (order.broker_connection_id as string | null) ?? undefined,
        };

        const replaceRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/trade-execution`, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
            apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
          },
          body: JSON.stringify(replacement),
        });
        const replaceBody = await replaceRes.json();
        await audit(supabase, user.id, "order_modified", `order:${order.id}`, "info", {
          replaced_by: replaceBody?.order?.id ?? null,
        });
        return json({ cancelled_order_id: order.id, ...replaceBody }, replaceRes.status);
      }

      case "sync": {
        if (!body.order_id) return json({ error: "order_id required" }, 400);
        const { data: order } = await supabase
          .from("orders").select("*").eq("id", body.order_id).eq("user_id", user.id).maybeSingle();
        if (!order) return json({ error: "Order not found" }, 404);
        if (!order.broker_order_id || !order.broker_connection_id) {
          return json({ error: "Order has no broker reference to sync" }, 400);
        }
        const { creds, error: credError } = await loadCredentials(
          supabase, user.id, String(order.broker_connection_id),
        );
        if (!creds) return json({ error: credError }, 400);

        const report = await fetchOrderStatus(creds, String(order.symbol), String(order.broker_order_id));
        const updated = await reconcile(supabase, user.id, order, report);
        return json({ order: updated, execution: { ...report, raw: undefined } });
      }

      case "sync_all": {
        const { data: openOrders } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .in("status", ["submitted", "partial_fill"])
          .not("broker_order_id", "is", null)
          .limit(50);

        const results: unknown[] = [];
        for (const order of openOrders ?? []) {
          if (!order.broker_connection_id) continue;
          const { creds } = await loadCredentials(supabase, user.id, String(order.broker_connection_id));
          if (!creds) continue;
          try {
            const report = await fetchOrderStatus(creds, String(order.symbol), String(order.broker_order_id));
            const updated = await reconcile(supabase, user.id, order, report);
            results.push({ order_id: order.id, status: updated?.status, filled: report.filledQuantity });
          } catch (e) {
            results.push({ order_id: order.id, error: e instanceof Error ? e.message : "sync failed" });
          }
        }
        return json({ synced: results.length, results });
      }

      default:
        return json({ error: "Invalid action" }, 400);
    }
  } catch (error: unknown) {
    console.error("Execution engine error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

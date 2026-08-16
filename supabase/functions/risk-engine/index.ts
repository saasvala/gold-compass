import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type SB = ReturnType<typeof createClient>;

interface RiskRequest {
  action: "get_limits" | "update_limits" | "evaluate" | "position_size" | "exposure" | "kill_switch" | "resume";
  limits?: Record<string, unknown>;
  symbol?: string;
  side?: "buy" | "sell";
  quantity?: number;
  price?: number;
  leverage?: number;
  stop_loss?: number;
  bot_id?: string;
  reason?: string;
}

const UPDATABLE = [
  "max_risk_per_trade_percent",
  "max_daily_loss_percent",
  "max_total_drawdown_percent",
  "max_open_positions",
  "max_pending_orders",
  "max_exposure_per_symbol_percent",
  "max_leverage",
  "account_balance",
  "kill_switch_enabled",
  "trading_paused",
] as const;

interface Limits {
  max_risk_per_trade_percent: number;
  max_daily_loss_percent: number;
  max_total_drawdown_percent: number;
  max_open_positions: number;
  max_pending_orders: number;
  max_exposure_per_symbol_percent: number;
  max_leverage: number;
  account_balance: number;
  kill_switch_enabled: boolean;
  trading_paused: boolean;
  pause_reason: string | null;
}

async function getLimits(supabase: SB, userId: string): Promise<Limits> {
  const { data } = await supabase.from("risk_limits").select("*").eq("user_id", userId).maybeSingle();
  if (data) return data as unknown as Limits;
  const { data: created, error } = await supabase
    .from("risk_limits")
    .insert({ user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return created as unknown as Limits;
}

interface Violation {
  code: string;
  severity: "warning" | "critical";
  message: string;
  trigger_value?: number;
  threshold_value?: number;
}

async function evaluate(
  supabase: SB,
  userId: string,
  req: RiskRequest
): Promise<{ passed: boolean; violations: Violation[]; limits: Limits; metrics: Record<string, number> }> {
  const limits = await getLimits(supabase, userId);
  const violations: Violation[] = [];

  // Kill switch / pause
  if (limits.kill_switch_enabled) {
    violations.push({ code: "kill_switch", severity: "critical", message: "Kill switch is active — all trading blocked" });
  }
  if (limits.trading_paused) {
    violations.push({
      code: "trading_paused",
      severity: "critical",
      message: `Trading paused${limits.pause_reason ? `: ${limits.pause_reason}` : ""}`,
    });
  }

  // Open positions
  const { count: openPositions } = await supabase
    .from("positions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_open", true);
  if ((openPositions ?? 0) >= limits.max_open_positions) {
    violations.push({
      code: "max_open_positions",
      severity: "critical",
      message: `Maximum open positions limit (${limits.max_open_positions}) reached`,
      trigger_value: openPositions ?? 0,
      threshold_value: limits.max_open_positions,
    });
  }

  // Pending orders
  const { count: pendingOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["pending", "submitted", "partial_fill"]);
  if ((pendingOrders ?? 0) >= limits.max_pending_orders) {
    violations.push({
      code: "max_pending_orders",
      severity: "critical",
      message: `Maximum pending orders limit (${limits.max_pending_orders}) reached`,
      trigger_value: pendingOrders ?? 0,
      threshold_value: limits.max_pending_orders,
    });
  }

  // Leverage
  if (req.leverage && req.leverage > limits.max_leverage) {
    violations.push({
      code: "max_leverage",
      severity: "critical",
      message: `Leverage ${req.leverage}x exceeds maximum allowed ${limits.max_leverage}x`,
      trigger_value: req.leverage,
      threshold_value: limits.max_leverage,
    });
  }

  const balance = Number(limits.account_balance) || 0;

  // Daily loss / drawdown from today's snapshots
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const { data: snapshots } = await supabase
    .from("portfolio_snapshots")
    .select("realized_pnl, unrealized_pnl, drawdown_percent, created_at")
    .eq("user_id", userId)
    .gte("created_at", today.toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  let dailyLossPercent = 0;
  let drawdownPercent = 0;
  if (snapshots && snapshots.length > 0 && balance > 0) {
    const s = snapshots[0] as Record<string, number>;
    const netPnl = Number(s.realized_pnl ?? 0) + Number(s.unrealized_pnl ?? 0);
    dailyLossPercent = netPnl < 0 ? (Math.abs(netPnl) / balance) * 100 : 0;
    drawdownPercent = Number(s.drawdown_percent ?? 0);

    if (dailyLossPercent >= limits.max_daily_loss_percent) {
      violations.push({
        code: "daily_loss_limit",
        severity: "critical",
        message: `Daily loss ${dailyLossPercent.toFixed(2)}% exceeds limit ${limits.max_daily_loss_percent}% — circuit breaker active`,
        trigger_value: dailyLossPercent,
        threshold_value: limits.max_daily_loss_percent,
      });
    }
    if (drawdownPercent >= limits.max_total_drawdown_percent) {
      violations.push({
        code: "max_drawdown",
        severity: "critical",
        message: `Drawdown ${drawdownPercent.toFixed(2)}% exceeds maximum ${limits.max_total_drawdown_percent}%`,
        trigger_value: drawdownPercent,
        threshold_value: limits.max_total_drawdown_percent,
      });
    }
  }

  // Per-trade risk + symbol exposure
  let tradeRiskPercent = 0;
  let symbolExposurePercent = 0;
  if (req.symbol && req.quantity && balance > 0) {
    const price = req.price ?? 0;
    const notional = req.quantity * price;

    if (req.stop_loss && price > 0) {
      const riskUsd = Math.abs(price - req.stop_loss) * req.quantity;
      tradeRiskPercent = (riskUsd / balance) * 100;
      if (tradeRiskPercent > limits.max_risk_per_trade_percent) {
        violations.push({
          code: "max_risk_per_trade",
          severity: "critical",
          message: `Trade risk ${tradeRiskPercent.toFixed(2)}% exceeds max ${limits.max_risk_per_trade_percent}% per trade`,
          trigger_value: tradeRiskPercent,
          threshold_value: limits.max_risk_per_trade_percent,
        });
      }
    }

    if (notional > 0) {
      const { data: symbolPositions } = await supabase
        .from("positions")
        .select("quantity, current_price, avg_entry_price")
        .eq("user_id", userId)
        .eq("is_open", true)
        .eq("symbol", req.symbol);

      const existingNotional = (symbolPositions ?? []).reduce((sum: number, p: Record<string, number>) => {
        const px = Number(p.current_price ?? p.avg_entry_price ?? 0);
        return sum + Number(p.quantity ?? 0) * px;
      }, 0);

      symbolExposurePercent = ((existingNotional + notional) / balance) * 100;
      if (symbolExposurePercent > limits.max_exposure_per_symbol_percent) {
        violations.push({
          code: "max_symbol_exposure",
          severity: "critical",
          message: `Exposure on ${req.symbol} would reach ${symbolExposurePercent.toFixed(2)}%, above max ${limits.max_exposure_per_symbol_percent}%`,
          trigger_value: symbolExposurePercent,
          threshold_value: limits.max_exposure_per_symbol_percent,
        });
      }
    }
  }

  // Liquidation protection — warn on positions near liquidation
  const { data: riskyPositions } = await supabase
    .from("positions")
    .select("symbol, current_price, liquidation_price")
    .eq("user_id", userId)
    .eq("is_open", true)
    .not("liquidation_price", "is", null);

  for (const p of (riskyPositions ?? []) as Record<string, number | string>[]) {
    const current = Number(p.current_price ?? 0);
    const liq = Number(p.liquidation_price ?? 0);
    if (current > 0 && liq > 0) {
      const distance = (Math.abs(current - liq) / current) * 100;
      if (distance < 5) {
        violations.push({
          code: "liquidation_risk",
          severity: "critical",
          message: `${p.symbol} is ${distance.toFixed(2)}% from liquidation — new exposure blocked`,
          trigger_value: distance,
          threshold_value: 5,
        });
      }
    }
  }

  const passed = violations.filter((v) => v.severity === "critical").length === 0;

  if (!passed) {
    await supabase.from("risk_events").insert(
      violations.map((v) => ({
        user_id: userId,
        bot_id: req.bot_id ?? null,
        event_type: v.code,
        severity: v.severity,
        description: v.message,
        trigger_value: v.trigger_value ?? null,
        threshold_value: v.threshold_value ?? null,
        action_taken: "order_blocked",
        metadata: { symbol: req.symbol ?? null, side: req.side ?? null, quantity: req.quantity ?? null },
      }))
    );
  }

  return {
    passed,
    violations,
    limits,
    metrics: {
      open_positions: openPositions ?? 0,
      pending_orders: pendingOrders ?? 0,
      daily_loss_percent: Number(dailyLossPercent.toFixed(4)),
      drawdown_percent: Number(drawdownPercent.toFixed(4)),
      trade_risk_percent: Number(tradeRiskPercent.toFixed(4)),
      symbol_exposure_percent: Number(symbolExposurePercent.toFixed(4)),
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) return json({ error: "Invalid token" }, 401);

    const body: RiskRequest = await req.json();

    switch (body.action) {
      case "get_limits": {
        const limits = await getLimits(supabase, user.id);
        return json({ limits });
      }

      case "update_limits": {
        const patch: Record<string, unknown> = {};
        for (const key of UPDATABLE) {
          if (body.limits && key in body.limits) patch[key] = body.limits[key];
        }
        if (Object.keys(patch).length === 0) return json({ error: "No valid fields to update" }, 400);
        if (patch.trading_paused === false) patch.pause_reason = null;

        await getLimits(supabase, user.id);
        const { data, error } = await supabase
          .from("risk_limits")
          .update(patch)
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) throw error;

        await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: "risk_limits_updated",
          resource: "risk_limits",
          severity: "info",
          details: patch,
        });

        return json({ limits: data });
      }

      case "evaluate": {
        const result = await evaluate(supabase, user.id, body);
        return json(result);
      }

      case "position_size": {
        const limits = await getLimits(supabase, user.id);
        const balance = Number(limits.account_balance) || 0;
        const price = body.price ?? 0;
        const stop = body.stop_loss ?? 0;
        if (!price || !stop || price === stop) {
          return json({ error: "price and stop_loss are required and must differ" }, 400);
        }
        const riskUsd = (balance * limits.max_risk_per_trade_percent) / 100;
        const perUnitRisk = Math.abs(price - stop);
        const quantity = perUnitRisk > 0 ? riskUsd / perUnitRisk : 0;
        return json({
          quantity: Number(quantity.toFixed(6)),
          risk_usd: Number(riskUsd.toFixed(2)),
          risk_percent: limits.max_risk_per_trade_percent,
          per_unit_risk: perUnitRisk,
          notional: Number((quantity * price).toFixed(2)),
        });
      }

      case "exposure": {
        const limits = await getLimits(supabase, user.id);
        const balance = Number(limits.account_balance) || 0;
        const { data: positions } = await supabase
          .from("positions")
          .select("symbol, side, quantity, current_price, avg_entry_price, unrealized_pnl, margin_used")
          .eq("user_id", user.id)
          .eq("is_open", true);

        const bySymbol: Record<string, { notional: number; quantity: number; unrealized_pnl: number; exposure_percent: number }> = {};
        let totalNotional = 0;
        let totalMargin = 0;

        for (const p of (positions ?? []) as Record<string, number | string>[]) {
          const symbol = String(p.symbol);
          const px = Number(p.current_price ?? p.avg_entry_price ?? 0);
          const notional = Number(p.quantity ?? 0) * px;
          totalNotional += notional;
          totalMargin += Number(p.margin_used ?? 0);
          bySymbol[symbol] ??= { notional: 0, quantity: 0, unrealized_pnl: 0, exposure_percent: 0 };
          bySymbol[symbol].notional += notional;
          bySymbol[symbol].quantity += Number(p.quantity ?? 0);
          bySymbol[symbol].unrealized_pnl += Number(p.unrealized_pnl ?? 0);
        }
        for (const key of Object.keys(bySymbol)) {
          bySymbol[key].exposure_percent = balance > 0 ? Number(((bySymbol[key].notional / balance) * 100).toFixed(2)) : 0;
        }

        return json({
          total_notional: Number(totalNotional.toFixed(2)),
          total_margin_used: Number(totalMargin.toFixed(2)),
          gross_exposure_percent: balance > 0 ? Number(((totalNotional / balance) * 100).toFixed(2)) : 0,
          by_symbol: bySymbol,
          limits,
        });
      }

      case "kill_switch": {
        await getLimits(supabase, user.id);
        const { data, error } = await supabase
          .from("risk_limits")
          .update({
            kill_switch_enabled: true,
            trading_paused: true,
            pause_reason: body.reason || "Emergency kill switch activated",
          })
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) throw error;

        const { data: cancelled } = await supabase
          .from("orders")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString(), rejection_reason: "Kill switch activated" })
          .eq("user_id", user.id)
          .in("status", ["pending", "submitted", "partial_fill"])
          .select("id");

        await supabase.from("risk_events").insert({
          user_id: user.id,
          event_type: "kill_switch",
          severity: "critical",
          description: body.reason || "Emergency kill switch activated",
          action_taken: `cancelled_${cancelled?.length ?? 0}_orders`,
        });

        await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: "kill_switch_activated",
          resource: "risk_limits",
          severity: "critical",
          details: { cancelled_orders: cancelled?.length ?? 0 },
        });

        return json({ limits: data, cancelled_orders: cancelled?.length ?? 0 });
      }

      case "resume": {
        await getLimits(supabase, user.id);
        const { data, error } = await supabase
          .from("risk_limits")
          .update({ kill_switch_enabled: false, trading_paused: false, pause_reason: null })
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) throw error;

        await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: "trading_resumed",
          resource: "risk_limits",
          severity: "warning",
        });

        return json({ limits: data });
      }

      default:
        return json({ error: "Invalid action" }, 400);
    }
  } catch (error: unknown) {
    console.error("Risk Engine Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return json({ error: msg }, 500);
  }
});

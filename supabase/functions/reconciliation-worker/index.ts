// SCHEDULED RECONCILIATION WORKER
// Compares broker truth (positions + fills) against the internal position book
// and records every drift. Designed to be invoked by pg_cron.
//
// Safety rails (mandatory for background jobs):
//   1. Bounded work per run   — CONNECTION_BATCH connections, ORDER_BATCH orders per run.
//   2. Single-flight lock     — acquire_worker_lock() lease in the database.
//   3. Idempotent progress    — reconciliation_checkpoints cursor + unique drift fingerprints.
//   4. Circuit breaker        — pauses the job after MAX_FAILURES consecutive failed runs.
//   5. Paused-state guard     — every entry point exits while paused, except one probe connection.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptSecret } from "../_shared/crypto.ts";
import {
  fetchBrokerFills,
  fetchBrokerPositions,
  fetchOrderStatus,
  supportedBroker,
  type BrokerCredentials,
  type BrokerPosition,
} from "../_shared/brokers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const JOB_NAME = "position-reconciliation";
const LEASE_SECONDS = 240;
const CONNECTION_BATCH = 10;
const ORDER_BATCH = 40;
const MAX_FAILURES = 5;
const QTY_TOLERANCE = 1e-8;
const QTY_TOLERANCE_PCT = 0.001; // 0.1% — below this, treat as rounding noise
const PRICE_TOLERANCE_PCT = 0.005; // 0.5%

type Supa = ReturnType<typeof createClient>;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface DriftRecord {
  user_id: string;
  broker_connection_id: string | null;
  position_id?: string | null;
  order_id?: string | null;
  symbol: string;
  drift_type: string;
  severity: "info" | "warning" | "critical";
  internal_quantity?: number | null;
  broker_quantity?: number | null;
  quantity_diff?: number | null;
  internal_avg_price?: number | null;
  broker_avg_price?: number | null;
  details: Record<string, unknown>;
}

// A drift is the same drift while the same mismatch persists — the fingerprint keeps
// repeat runs from stacking duplicate rows for one unresolved problem.
function fingerprint(d: DriftRecord): string {
  const q = (n: number | null | undefined) => (n == null ? "na" : Number(n).toFixed(8));
  return [
    d.user_id, d.broker_connection_id ?? "none", d.symbol, d.drift_type,
    d.order_id ?? "", q(d.internal_quantity), q(d.broker_quantity),
  ].join("|");
}

async function recordDrifts(supabase: Supa, drifts: DriftRecord[]) {
  if (!drifts.length) return 0;
  const rows = drifts.map((d) => ({ ...d, fingerprint: fingerprint(d) }));
  const { error } = await supabase
    .from("position_drifts")
    .upsert(rows, { onConflict: "fingerprint", ignoreDuplicates: true });
  if (error) console.error("Failed to record drifts:", error.message);

  // Notify on the serious ones only.
  const critical = drifts.filter((d) => d.severity === "critical");
  if (critical.length) {
    await supabase.from("notifications").insert(
      critical.map((d) => ({
        user_id: d.user_id,
        type: "risk",
        title: `Position drift detected — ${d.symbol}`,
        message: `${d.drift_type.replace(/_/g, " ")}: broker ${d.broker_quantity ?? "n/a"} vs internal ${d.internal_quantity ?? "n/a"}.`,
      })),
    );
  }
  return rows.length;
}

async function loadCredentials(conn: Record<string, unknown>): Promise<BrokerCredentials | null> {
  if (!conn.api_key_encrypted || !conn.api_secret_encrypted) return null;
  if (!supportedBroker(String(conn.broker_name))) return null;
  return {
    apiKey: await decryptSecret(String(conn.api_key_encrypted)),
    apiSecret: await decryptSecret(String(conn.api_secret_encrypted)),
    passphrase: conn.passphrase_encrypted ? await decryptSecret(String(conn.passphrase_encrypted)) : undefined,
    isTestnet: Boolean(conn.is_testnet),
    brokerName: String(conn.broker_name).toLowerCase(),
    metadata: (conn.metadata ?? {}) as Record<string, unknown>,
  };
}

function normalize(symbol: string) {
  return symbol.replace(/[-/_]/g, "").toUpperCase();
}

/* ------------------------- Stage 1: order/fill drift ------------------------- */

async function reconcileOrders(
  supabase: Supa,
  creds: BrokerCredentials,
  conn: Record<string, unknown>,
): Promise<DriftRecord[]> {
  const drifts: DriftRecord[] = [];
  const userId = String(conn.user_id);

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .eq("broker_connection_id", conn.id)
    .not("broker_order_id", "is", null)
    .in("status", ["submitted", "partial_fill", "pending", "filled"])
    .order("updated_at", { ascending: true })
    .limit(ORDER_BATCH);

  for (const order of orders ?? []) {
    try {
      const report = await fetchOrderStatus(creds, String(order.symbol), String(order.broker_order_id));
      const internalFilled = Number(order.filled_quantity ?? 0);
      const brokerFilled = report.filledQuantity;
      const diff = brokerFilled - internalFilled;
      const tolerance = Math.max(QTY_TOLERANCE, Number(order.quantity) * QTY_TOLERANCE_PCT);

      if (Math.abs(diff) > tolerance) {
        drifts.push({
          user_id: userId,
          broker_connection_id: String(conn.id),
          order_id: String(order.id),
          symbol: String(order.symbol),
          drift_type: diff > 0 ? "unrecorded_fill" : "overstated_fill",
          severity: "critical",
          internal_quantity: internalFilled,
          broker_quantity: brokerFilled,
          quantity_diff: diff,
          internal_avg_price: order.avg_fill_price as number | null,
          broker_avg_price: report.avgFillPrice,
          details: {
            broker: creds.brokerName,
            broker_order_id: order.broker_order_id,
            internal_status: order.status,
            broker_status: report.status,
          },
        });
      } else if (report.status !== order.status) {
        drifts.push({
          user_id: userId,
          broker_connection_id: String(conn.id),
          order_id: String(order.id),
          symbol: String(order.symbol),
          drift_type: "status_mismatch",
          severity: "warning",
          internal_quantity: internalFilled,
          broker_quantity: brokerFilled,
          quantity_diff: 0,
          details: { internal_status: order.status, broker_status: report.status },
        });
      }

      // Safe, non-financial self-heal: statuses and fill counters converge to venue truth.
      await supabase.from("orders").update({
        status: report.status,
        filled_quantity: brokerFilled,
        avg_fill_price: report.avgFillPrice ?? order.avg_fill_price,
        commission: report.commission ?? order.commission,
        metadata: {
          ...((order.metadata ?? {}) as Record<string, unknown>),
          last_reconciled_at: new Date().toISOString(),
        },
      }).eq("id", order.id);
    } catch (e) {
      console.error(`Order sync failed for ${order.id}:`, e instanceof Error ? e.message : e);
    }
  }

  return drifts;
}

/* ----------------------- Stage 2: position book drift ------------------------ */

async function reconcilePositions(
  supabase: Supa,
  creds: BrokerCredentials,
  conn: Record<string, unknown>,
  brokerPositions: BrokerPosition[],
): Promise<{ drifts: DriftRecord[]; checked: number }> {
  const drifts: DriftRecord[] = [];
  const userId = String(conn.user_id);

  const { data: internal } = await supabase
    .from("positions")
    .select("*")
    .eq("user_id", userId)
    .eq("broker_connection_id", conn.id)
    .eq("is_open", true);

  const internalBySymbol = new Map<string, Record<string, unknown>>();
  for (const p of internal ?? []) internalBySymbol.set(normalize(String(p.symbol)), p);

  const brokerBySymbol = new Map<string, BrokerPosition>();
  for (const p of brokerPositions) brokerBySymbol.set(normalize(p.symbol), p);

  // Broker-side positions: missing, mismatched size, wrong side, or price divergence.
  for (const [symbol, bp] of brokerBySymbol) {
    const ip = internalBySymbol.get(symbol);

    if (!ip) {
      drifts.push({
        user_id: userId,
        broker_connection_id: String(conn.id),
        symbol,
        drift_type: "ghost_position_at_broker",
        severity: "critical",
        internal_quantity: 0,
        broker_quantity: bp.quantity,
        quantity_diff: bp.quantity,
        broker_avg_price: bp.avgEntryPrice,
        details: { side: bp.side, broker: creds.brokerName, mark_price: bp.markPrice },
      });
      continue;
    }

    const iQty = Number(ip.quantity);
    const diff = bp.quantity - iQty;
    const tolerance = Math.max(QTY_TOLERANCE, Math.max(iQty, bp.quantity) * QTY_TOLERANCE_PCT);

    if (String(ip.side) !== bp.side) {
      drifts.push({
        user_id: userId,
        broker_connection_id: String(conn.id),
        position_id: String(ip.id),
        symbol,
        drift_type: "side_mismatch",
        severity: "critical",
        internal_quantity: iQty,
        broker_quantity: bp.quantity,
        quantity_diff: diff,
        details: { internal_side: ip.side, broker_side: bp.side },
      });
    } else if (Math.abs(diff) > tolerance) {
      drifts.push({
        user_id: userId,
        broker_connection_id: String(conn.id),
        position_id: String(ip.id),
        symbol,
        drift_type: "quantity_mismatch",
        severity: "critical",
        internal_quantity: iQty,
        broker_quantity: bp.quantity,
        quantity_diff: diff,
        internal_avg_price: ip.avg_entry_price as number,
        broker_avg_price: bp.avgEntryPrice,
        details: { broker: creds.brokerName },
      });
    } else if (
      bp.avgEntryPrice && ip.avg_entry_price &&
      Math.abs(bp.avgEntryPrice - Number(ip.avg_entry_price)) / bp.avgEntryPrice > PRICE_TOLERANCE_PCT
    ) {
      drifts.push({
        user_id: userId,
        broker_connection_id: String(conn.id),
        position_id: String(ip.id),
        symbol,
        drift_type: "entry_price_divergence",
        severity: "warning",
        internal_quantity: iQty,
        broker_quantity: bp.quantity,
        quantity_diff: 0,
        internal_avg_price: Number(ip.avg_entry_price),
        broker_avg_price: bp.avgEntryPrice,
        details: { broker: creds.brokerName },
      });
    }

    // Mark-to-market refresh from venue truth (safe, non-structural).
    if (bp.markPrice) {
      await supabase.from("positions").update({
        current_price: bp.markPrice,
        unrealized_pnl: bp.unrealizedPnl ?? ip.unrealized_pnl,
      }).eq("id", ip.id);
    }
  }

  // Internal positions the broker does not know about.
  for (const [symbol, ip] of internalBySymbol) {
    if (brokerBySymbol.has(symbol)) continue;
    drifts.push({
      user_id: userId,
      broker_connection_id: String(conn.id),
      position_id: String(ip.id),
      symbol,
      drift_type: "phantom_position_internal",
      severity: "critical",
      internal_quantity: Number(ip.quantity),
      broker_quantity: 0,
      quantity_diff: -Number(ip.quantity),
      internal_avg_price: ip.avg_entry_price as number,
      details: { broker: creds.brokerName, note: "Open internally but flat at the broker" },
    });
  }

  return { drifts, checked: brokerBySymbol.size + internalBySymbol.size };
}

/* --------------------- Stage 3: unattributed broker fills -------------------- */

async function reconcileFills(
  supabase: Supa,
  creds: BrokerCredentials,
  conn: Record<string, unknown>,
  symbols: string[],
  sinceMs: number,
): Promise<{ drifts: DriftRecord[]; latestFillTs: number }> {
  const drifts: DriftRecord[] = [];
  const userId = String(conn.user_id);
  let latestFillTs = sinceMs;

  for (const symbol of symbols.slice(0, 10)) {
    let fills;
    try {
      fills = await fetchBrokerFills(creds, symbol, sinceMs);
    } catch (e) {
      console.error(`Fill fetch failed for ${symbol}:`, e instanceof Error ? e.message : e);
      continue;
    }
    if (!fills.length) continue;

    const brokerOrderIds = [...new Set(fills.map((f) => f.brokerOrderId))];
    const { data: known } = await supabase
      .from("orders")
      .select("broker_order_id")
      .eq("user_id", userId)
      .in("broker_order_id", brokerOrderIds);
    const knownIds = new Set((known ?? []).map((o) => String(o.broker_order_id)));

    for (const fill of fills) {
      latestFillTs = Math.max(latestFillTs, Date.parse(fill.executedAt));
      if (knownIds.has(fill.brokerOrderId)) continue;
      drifts.push({
        user_id: userId,
        broker_connection_id: String(conn.id),
        symbol: fill.symbol,
        drift_type: "unattributed_broker_fill",
        severity: "critical",
        internal_quantity: 0,
        broker_quantity: fill.quantity,
        quantity_diff: fill.quantity,
        broker_avg_price: fill.price,
        details: {
          broker: creds.brokerName,
          broker_order_id: fill.brokerOrderId,
          trade_id: fill.tradeId,
          side: fill.side,
          executed_at: fill.executedAt,
          note: "Executed at the venue with no matching internal order",
        },
      });
    }
  }

  return { drifts, latestFillTs };
}

/* --------------------------------- Runner ----------------------------------- */

async function reconcileConnection(supabase: Supa, conn: Record<string, unknown>) {
  const creds = await loadCredentials(conn);
  if (!creds) throw new Error(`Credentials unavailable or broker unsupported (${conn.broker_name})`);

  const { data: checkpoint } = await supabase
    .from("reconciliation_checkpoints")
    .select("*")
    .eq("broker_connection_id", conn.id)
    .maybeSingle();

  const sinceMs = checkpoint?.last_fill_ts
    ? Date.parse(String(checkpoint.last_fill_ts))
    : Date.now() - 24 * 60 * 60 * 1000;

  const allDrifts: DriftRecord[] = [];

  const orderDrifts = await reconcileOrders(supabase, creds, conn);
  allDrifts.push(...orderDrifts);

  const brokerPositions = await fetchBrokerPositions(creds);
  const { drifts: posDrifts, checked } = await reconcilePositions(supabase, creds, conn, brokerPositions);
  allDrifts.push(...posDrifts);

  const symbols = [...new Set([
    ...brokerPositions.map((p) => p.symbol),
    ...orderDrifts.map((d) => d.symbol),
  ])];
  const { drifts: fillDrifts, latestFillTs } = await reconcileFills(supabase, creds, conn, symbols, sinceMs);
  allDrifts.push(...fillDrifts);

  const recorded = await recordDrifts(supabase, allDrifts);

  await supabase.from("reconciliation_checkpoints").upsert({
    user_id: String(conn.user_id),
    broker_connection_id: String(conn.id),
    last_reconciled_at: new Date().toISOString(),
    last_fill_ts: new Date(latestFillTs).toISOString(),
    last_status: allDrifts.length ? "drift_detected" : "clean",
    last_error: null,
    positions_checked: checked,
    drifts_found: allDrifts.length,
  }, { onConflict: "broker_connection_id" });

  if (allDrifts.length) {
    await supabase.from("audit_logs").insert({
      user_id: String(conn.user_id),
      action: "reconciliation_drift_detected",
      resource: `broker_connection:${conn.id}`,
      severity: allDrifts.some((d) => d.severity === "critical") ? "critical" : "warning",
      details: {
        broker: creds.brokerName,
        drift_count: allDrifts.length,
        types: [...new Set(allDrifts.map((d) => d.drift_type))],
      },
    });
  }

  return { connection_id: conn.id, positions_checked: checked, drifts: allDrifts.length, recorded };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let lockToken: string | null = null;

  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));

    // Manual control surface (admin only, JWT required).
    if (body.action === "resume" || body.action === "pause" || body.action === "status") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return json({ error: "Unauthorized" }, 401);
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      if (!user) return json({ error: "Invalid token" }, 401);
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) return json({ error: "Admin role required" }, 403);

      if (body.action === "status") {
        const { data: job } = await supabase.from("worker_jobs").select("*").eq("job_name", JOB_NAME).maybeSingle();
        return json({ job });
      }
      const { data: job } = await supabase.from("worker_jobs").upsert({
        job_name: JOB_NAME,
        status: body.action === "pause" ? "paused" : "idle",
        pause_reason: body.action === "pause" ? String(body.reason ?? "Paused by admin") : null,
        consecutive_failures: 0,
        locked_until: null,
        lock_token: null,
      }, { onConflict: "job_name" }).select().single();
      return json({ job });
    }

    // 2 + 5. Single-flight lock; also refuses to run while paused.
    const { data: lockRows, error: lockError } = await supabase.rpc("acquire_worker_lock", {
      _job_name: JOB_NAME,
      _lease_seconds: LEASE_SECONDS,
    });
    if (lockError) throw lockError;
    const lock = Array.isArray(lockRows) ? lockRows[0] : lockRows;

    if (!lock?.acquired) {
      return json({
        skipped: true,
        reason: lock?.status === "paused" ? `paused: ${lock.pause_reason}` : "another run holds the lock",
        status: lock?.status ?? "unknown",
      });
    }
    lockToken = String(lock.lock_token);
    const wasPaused = lock.status === "paused";

    // 1. Bounded batch, resumed from the previous run's cursor (round-robin over connections).
    const cursor = lock.last_cursor ?? "";
    const { data: conns } = await supabase
      .from("broker_connections")
      .select("*")
      .eq("is_active", true)
      .eq("connection_status", "connected")
      .gt("id", cursor || "00000000-0000-0000-0000-000000000000")
      .order("id", { ascending: true })
      .limit(wasPaused ? 1 : CONNECTION_BATCH);

    let batch = conns ?? [];
    if (!batch.length && cursor) {
      const { data: wrapped } = await supabase
        .from("broker_connections")
        .select("*")
        .eq("is_active", true)
        .eq("connection_status", "connected")
        .order("id", { ascending: true })
        .limit(wasPaused ? 1 : CONNECTION_BATCH);
      batch = wrapped ?? [];
    }

    const results: unknown[] = [];
    const failures: string[] = [];
    for (const conn of batch) {
      try {
        results.push(await reconcileConnection(supabase, conn));
      } catch (e) {
        const message = e instanceof Error ? e.message : "reconciliation failed";
        failures.push(`${conn.id}: ${message}`);
        // 3. Failure is recorded per connection so the next run can still make progress.
        await supabase.from("reconciliation_checkpoints").upsert({
          user_id: String(conn.user_id),
          broker_connection_id: String(conn.id),
          last_reconciled_at: new Date().toISOString(),
          last_status: "error",
          last_error: message,
        }, { onConflict: "broker_connection_id" });
      }
    }

    // 4. Circuit breaker: every connection in the batch failing points at a systemic problem.
    const allFailed = batch.length > 0 && failures.length === batch.length;
    const { data: jobRow } = await supabase
      .from("worker_jobs").select("consecutive_failures").eq("job_name", JOB_NAME).maybeSingle();
    const shouldPause = allFailed && Number(jobRow?.consecutive_failures ?? 0) + 1 >= MAX_FAILURES;

    const nextCursor = batch.length ? String(batch[batch.length - 1].id) : "";
    await supabase.rpc("release_worker_lock", {
      _job_name: JOB_NAME,
      _lock_token: lockToken,
      _status: shouldPause ? "paused" : "idle",
      _cursor: nextCursor,
      _error: allFailed ? failures.join(" | ").slice(0, 500) : null,
      _stats: {
        connections_processed: batch.length,
        drifts_found: results.reduce((s, r) => s + ((r as { drifts: number }).drifts ?? 0), 0),
        failures: failures.length,
        finished_at: new Date().toISOString(),
      },
    });
    lockToken = null;

    if (shouldPause) {
      await supabase.from("worker_jobs").update({
        pause_reason: `Circuit breaker: ${MAX_FAILURES} consecutive failed runs`,
      }).eq("job_name", JOB_NAME);
    }

    return json({
      job: JOB_NAME,
      probe_run: wasPaused,
      connections_processed: batch.length,
      results,
      failures,
      paused: shouldPause,
      next_cursor: nextCursor,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Reconciliation worker error:", message);
    if (lockToken) {
      await supabase.rpc("release_worker_lock", {
        _job_name: JOB_NAME,
        _lock_token: lockToken,
        _status: "idle",
        _cursor: null,
        _error: message.slice(0, 500),
        _stats: null,
      });
    }
    return json({ error: message }, 500);
  }
});

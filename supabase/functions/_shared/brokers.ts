// Broker connectors: Binance & Bybit (spot/linear, testnet + live), MetaTrader bridge.
// All signed with HMAC-SHA256. Every adapter returns a normalised execution report.

import { hmacSha256Hex } from "./crypto.ts";

export interface BrokerCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  isTestnet: boolean;
  brokerName: string;
  metadata?: Record<string, unknown>;
}

export interface PlaceOrderParams {
  symbol: string;
  side: "buy" | "sell";
  orderType: "market" | "limit" | "stop" | "stop_limit" | "trailing_stop";
  quantity: number;
  price?: number | null;
  stopPrice?: number | null;
  trailPercent?: number | null;
  timeInForce?: string;
  clientOrderId?: string;
}

export interface ExecutionReport {
  brokerOrderId: string | null;
  status: "pending" | "submitted" | "partial_fill" | "filled" | "cancelled" | "rejected" | "expired";
  filledQuantity: number;
  avgFillPrice: number | null;
  commission: number | null;
  rejectionReason: string | null;
  raw: unknown;
  latencyMs: number;
}

const ENDPOINTS: Record<string, { live: string; testnet: string }> = {
  binance: { live: "https://api.binance.com", testnet: "https://testnet.binance.vision" },
  bybit: { live: "https://api.bybit.com", testnet: "https://api-testnet.bybit.com" },
};

function baseUrl(broker: string, isTestnet: boolean): string {
  const cfg = ENDPOINTS[broker];
  if (!cfg) throw new Error(`Unsupported broker: ${broker}`);
  return isTestnet ? cfg.testnet : cfg.live;
}

function normalizeSymbol(symbol: string): string {
  return symbol.replace(/[-/_]/g, "").toUpperCase();
}

/* ---------------------------------- Binance --------------------------------- */

async function binanceSigned(
  creds: BrokerCredentials,
  method: "GET" | "POST" | "DELETE",
  path: string,
  params: Record<string, string | number>,
): Promise<{ ok: boolean; status: number; body: Record<string, unknown> }> {
  const query = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    timestamp: String(Date.now()),
    recvWindow: "5000",
  });
  const signature = await hmacSha256Hex(creds.apiSecret, query.toString());
  query.append("signature", signature);

  const res = await fetch(`${baseUrl("binance", creds.isTestnet)}${path}?${query}`, {
    method,
    headers: { "X-MBX-APIKEY": creds.apiKey },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

function binanceOrderType(t: PlaceOrderParams["orderType"]): string {
  switch (t) {
    case "market": return "MARKET";
    case "limit": return "LIMIT";
    case "stop": return "STOP_LOSS";
    case "stop_limit": return "STOP_LOSS_LIMIT";
    case "trailing_stop": return "MARKET";
  }
}

function mapBinanceStatus(s: string): ExecutionReport["status"] {
  const map: Record<string, ExecutionReport["status"]> = {
    NEW: "submitted",
    PARTIALLY_FILLED: "partial_fill",
    FILLED: "filled",
    CANCELED: "cancelled",
    PENDING_CANCEL: "submitted",
    REJECTED: "rejected",
    EXPIRED: "expired",
  };
  return map[s] ?? "submitted";
}

async function binancePlace(creds: BrokerCredentials, p: PlaceOrderParams): Promise<ExecutionReport> {
  const started = Date.now();
  const params: Record<string, string | number> = {
    symbol: normalizeSymbol(p.symbol),
    side: p.side.toUpperCase(),
    type: binanceOrderType(p.orderType),
    quantity: p.quantity,
  };
  if (params.type !== "MARKET") {
    params.timeInForce = p.timeInForce === "IOC" || p.timeInForce === "FOK" ? p.timeInForce : "GTC";
  }
  if (p.price && params.type !== "MARKET") params.price = p.price;
  if (p.stopPrice) params.stopPrice = p.stopPrice;
  if (p.clientOrderId) params.newClientOrderId = p.clientOrderId;

  const { ok, body } = await binanceSigned(creds, "POST", "/api/v3/order", params);
  const latencyMs = Date.now() - started;

  if (!ok) {
    return {
      brokerOrderId: null, status: "rejected", filledQuantity: 0, avgFillPrice: null,
      commission: null, rejectionReason: String(body.msg ?? "Binance rejected order"),
      raw: body, latencyMs,
    };
  }

  const executedQty = Number(body.executedQty ?? 0);
  const cummulative = Number(body.cummulativeQuoteQty ?? 0);
  return {
    brokerOrderId: body.orderId != null ? String(body.orderId) : null,
    status: mapBinanceStatus(String(body.status ?? "NEW")),
    filledQuantity: executedQty,
    avgFillPrice: executedQty > 0 ? cummulative / executedQty : null,
    commission: null,
    rejectionReason: null,
    raw: body,
    latencyMs,
  };
}

async function binanceCancel(creds: BrokerCredentials, symbol: string, brokerOrderId: string) {
  return binanceSigned(creds, "DELETE", "/api/v3/order", {
    symbol: normalizeSymbol(symbol),
    orderId: brokerOrderId,
  });
}

async function binanceStatus(creds: BrokerCredentials, symbol: string, brokerOrderId: string): Promise<ExecutionReport> {
  const started = Date.now();
  const { ok, body } = await binanceSigned(creds, "GET", "/api/v3/order", {
    symbol: normalizeSymbol(symbol),
    orderId: brokerOrderId,
  });
  const executedQty = Number(body.executedQty ?? 0);
  const cummulative = Number(body.cummulativeQuoteQty ?? 0);
  return {
    brokerOrderId,
    status: ok ? mapBinanceStatus(String(body.status ?? "NEW")) : "rejected",
    filledQuantity: executedQty,
    avgFillPrice: executedQty > 0 ? cummulative / executedQty : null,
    commission: null,
    rejectionReason: ok ? null : String(body.msg ?? "status lookup failed"),
    raw: body,
    latencyMs: Date.now() - started,
  };
}

/* ----------------------------------- Bybit ---------------------------------- */

async function bybitSigned(
  creds: BrokerCredentials,
  method: "GET" | "POST",
  path: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; body: Record<string, unknown> }> {
  const timestamp = String(Date.now());
  const recvWindow = "5000";
  const isGet = method === "GET";
  const queryString = isGet
    ? new URLSearchParams(Object.entries(payload).map(([k, v]) => [k, String(v)])).toString()
    : "";
  const bodyString = isGet ? "" : JSON.stringify(payload);
  const signPayload = `${timestamp}${creds.apiKey}${recvWindow}${isGet ? queryString : bodyString}`;
  const signature = await hmacSha256Hex(creds.apiSecret, signPayload);

  const url = `${baseUrl("bybit", creds.isTestnet)}${path}${isGet && queryString ? `?${queryString}` : ""}`;
  const res = await fetch(url, {
    method,
    headers: {
      "X-BAPI-API-KEY": creds.apiKey,
      "X-BAPI-TIMESTAMP": timestamp,
      "X-BAPI-RECV-WINDOW": recvWindow,
      "X-BAPI-SIGN": signature,
      "Content-Type": "application/json",
    },
    body: isGet ? undefined : bodyString,
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok && Number(body.retCode) === 0, body };
}

function bybitCategory(creds: BrokerCredentials): string {
  return String((creds.metadata?.category as string) ?? "spot");
}

function mapBybitStatus(s: string): ExecutionReport["status"] {
  const map: Record<string, ExecutionReport["status"]> = {
    New: "submitted",
    PartiallyFilled: "partial_fill",
    Filled: "filled",
    Cancelled: "cancelled",
    Rejected: "rejected",
    Deactivated: "cancelled",
  };
  return map[s] ?? "submitted";
}

async function bybitPlace(creds: BrokerCredentials, p: PlaceOrderParams): Promise<ExecutionReport> {
  const started = Date.now();
  const payload: Record<string, unknown> = {
    category: bybitCategory(creds),
    symbol: normalizeSymbol(p.symbol),
    side: p.side === "buy" ? "Buy" : "Sell",
    orderType: p.orderType === "limit" || p.orderType === "stop_limit" ? "Limit" : "Market",
    qty: String(p.quantity),
    timeInForce: p.timeInForce === "IOC" || p.timeInForce === "FOK" ? p.timeInForce : "GTC",
  };
  if (p.price && payload.orderType === "Limit") payload.price = String(p.price);
  if (p.stopPrice) payload.triggerPrice = String(p.stopPrice);
  if (p.clientOrderId) payload.orderLinkId = p.clientOrderId;

  const { ok, body } = await bybitSigned(creds, "POST", "/v5/order/create", payload);
  const latencyMs = Date.now() - started;
  const result = (body.result ?? {}) as Record<string, unknown>;

  if (!ok) {
    return {
      brokerOrderId: null, status: "rejected", filledQuantity: 0, avgFillPrice: null,
      commission: null, rejectionReason: String(body.retMsg ?? "Bybit rejected order"),
      raw: body, latencyMs,
    };
  }
  return {
    brokerOrderId: result.orderId ? String(result.orderId) : null,
    status: "submitted",
    filledQuantity: 0,
    avgFillPrice: null,
    commission: null,
    rejectionReason: null,
    raw: body,
    latencyMs,
  };
}

async function bybitCancel(creds: BrokerCredentials, symbol: string, brokerOrderId: string) {
  return bybitSigned(creds, "POST", "/v5/order/cancel", {
    category: bybitCategory(creds),
    symbol: normalizeSymbol(symbol),
    orderId: brokerOrderId,
  });
}

async function bybitStatus(creds: BrokerCredentials, symbol: string, brokerOrderId: string): Promise<ExecutionReport> {
  const started = Date.now();
  const { ok, body } = await bybitSigned(creds, "GET", "/v5/order/realtime", {
    category: bybitCategory(creds),
    symbol: normalizeSymbol(symbol),
    orderId: brokerOrderId,
  });
  const list = ((body.result as Record<string, unknown>)?.list ?? []) as Record<string, unknown>[];
  const o = list[0] ?? {};
  const filled = Number(o.cumExecQty ?? 0);
  return {
    brokerOrderId,
    status: ok ? mapBybitStatus(String(o.orderStatus ?? "New")) : "rejected",
    filledQuantity: filled,
    avgFillPrice: filled > 0 ? Number(o.avgPrice ?? 0) || null : null,
    commission: o.cumExecFee != null ? Number(o.cumExecFee) : null,
    rejectionReason: ok ? null : String(body.retMsg ?? "status lookup failed"),
    raw: body,
    latencyMs: Date.now() - started,
  };
}

/* ---------------------------- MetaTrader bridge ----------------------------- */
// Routes through a user-hosted MT4/MT5 REST bridge; URL stored on the connection metadata.

async function metatraderPlace(creds: BrokerCredentials, p: PlaceOrderParams): Promise<ExecutionReport> {
  const started = Date.now();
  const bridgeUrl = String(creds.metadata?.bridge_url ?? "");
  if (!bridgeUrl) {
    return {
      brokerOrderId: null, status: "rejected", filledQuantity: 0, avgFillPrice: null,
      commission: null, rejectionReason: "MetaTrader bridge_url not configured on connection",
      raw: null, latencyMs: Date.now() - started,
    };
  }
  const payload = {
    symbol: p.symbol, side: p.side, type: p.orderType, volume: p.quantity,
    price: p.price ?? null, sl: p.stopPrice ?? null, comment: p.clientOrderId ?? "",
  };
  const signature = await hmacSha256Hex(creds.apiSecret, JSON.stringify(payload));
  const res = await fetch(`${bridgeUrl.replace(/\/$/, "")}/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": creds.apiKey, "X-SIGNATURE": signature },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  const latencyMs = Date.now() - started;
  if (!res.ok) {
    return {
      brokerOrderId: null, status: "rejected", filledQuantity: 0, avgFillPrice: null,
      commission: null, rejectionReason: String(body.error ?? "MT bridge rejected order"),
      raw: body, latencyMs,
    };
  }
  return {
    brokerOrderId: body.ticket != null ? String(body.ticket) : null,
    status: body.filled ? "filled" : "submitted",
    filledQuantity: Number(body.filled_volume ?? 0),
    avgFillPrice: body.fill_price != null ? Number(body.fill_price) : null,
    commission: body.commission != null ? Number(body.commission) : null,
    rejectionReason: null,
    raw: body,
    latencyMs,
  };
}

/* --------------------------------- Dispatch --------------------------------- */

export function supportedBroker(name: string): boolean {
  return ["binance", "bybit", "metatrader", "mt4", "mt5"].includes(name.toLowerCase());
}

export async function placeOrder(creds: BrokerCredentials, p: PlaceOrderParams): Promise<ExecutionReport> {
  const broker = creds.brokerName.toLowerCase();
  if (broker === "binance") return binancePlace(creds, p);
  if (broker === "bybit") return bybitPlace(creds, p);
  if (["metatrader", "mt4", "mt5"].includes(broker)) return metatraderPlace(creds, p);
  throw new Error(`Unsupported broker: ${creds.brokerName}`);
}

export async function cancelOrder(
  creds: BrokerCredentials,
  symbol: string,
  brokerOrderId: string,
): Promise<{ ok: boolean; body: unknown }> {
  const broker = creds.brokerName.toLowerCase();
  if (broker === "binance") return binanceCancel(creds, symbol, brokerOrderId);
  if (broker === "bybit") return bybitCancel(creds, symbol, brokerOrderId);
  throw new Error(`Cancel not supported for broker: ${creds.brokerName}`);
}

export async function fetchOrderStatus(
  creds: BrokerCredentials,
  symbol: string,
  brokerOrderId: string,
): Promise<ExecutionReport> {
  const broker = creds.brokerName.toLowerCase();
  if (broker === "binance") return binanceStatus(creds, symbol, brokerOrderId);
  if (broker === "bybit") return bybitStatus(creds, symbol, brokerOrderId);
  throw new Error(`Status polling not supported for broker: ${creds.brokerName}`);
}

/* ------------------------- Position & fill snapshots ------------------------- */
// Used by the reconciliation worker to compare venue truth against the internal book.

export interface BrokerPosition {
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  avgEntryPrice: number | null;
  markPrice: number | null;
  unrealizedPnl: number | null;
  raw: unknown;
}

export interface BrokerFill {
  brokerOrderId: string;
  tradeId: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  commission: number | null;
  executedAt: string;
}

async function binancePositions(creds: BrokerCredentials): Promise<BrokerPosition[]> {
  // Spot venues expose balances, not positions — a non-zero free+locked balance
  // is the spot equivalent of a long position.
  const { ok, body } = await binanceSigned(creds, "GET", "/api/v3/account", {});
  if (!ok) throw new Error(String((body as Record<string, unknown>).msg ?? "Binance account fetch failed"));
  const balances = ((body as Record<string, unknown>).balances ?? []) as Record<string, unknown>[];
  return balances
    .map((b) => ({ asset: String(b.asset), qty: Number(b.free ?? 0) + Number(b.locked ?? 0), raw: b }))
    .filter((b) => b.qty > 0 && b.asset !== "USDT" && b.asset !== "USD" && b.asset !== "BUSD")
    .map((b) => ({
      symbol: `${b.asset}USDT`,
      side: "buy" as const,
      quantity: b.qty,
      avgEntryPrice: null,
      markPrice: null,
      unrealizedPnl: null,
      raw: b.raw,
    }));
}

async function bybitPositions(creds: BrokerCredentials): Promise<BrokerPosition[]> {
  const category = bybitCategory(creds);
  if (category === "spot") {
    const { ok, body } = await bybitSigned(creds, "GET", "/v5/account/wallet-balance", { accountType: "UNIFIED" });
    if (!ok) throw new Error(String(body.retMsg ?? "Bybit balance fetch failed"));
    const list = ((body.result as Record<string, unknown>)?.list ?? []) as Record<string, unknown>[];
    const coins = (list[0]?.coin ?? []) as Record<string, unknown>[];
    return coins
      .map((c) => ({ asset: String(c.coin), qty: Number(c.walletBalance ?? 0), raw: c }))
      .filter((c) => c.qty > 0 && c.asset !== "USDT" && c.asset !== "USDC")
      .map((c) => ({
        symbol: `${c.asset}USDT`,
        side: "buy" as const,
        quantity: c.qty,
        avgEntryPrice: null,
        markPrice: null,
        unrealizedPnl: null,
        raw: c.raw,
      }));
  }

  const { ok, body } = await bybitSigned(creds, "GET", "/v5/position/list", { category, settleCoin: "USDT" });
  if (!ok) throw new Error(String(body.retMsg ?? "Bybit position fetch failed"));
  const list = ((body.result as Record<string, unknown>)?.list ?? []) as Record<string, unknown>[];
  return list
    .filter((p) => Number(p.size ?? 0) > 0)
    .map((p) => ({
      symbol: String(p.symbol),
      side: String(p.side).toLowerCase() === "sell" ? ("sell" as const) : ("buy" as const),
      quantity: Number(p.size ?? 0),
      avgEntryPrice: p.avgPrice != null ? Number(p.avgPrice) : null,
      markPrice: p.markPrice != null ? Number(p.markPrice) : null,
      unrealizedPnl: p.unrealisedPnl != null ? Number(p.unrealisedPnl) : null,
      raw: p,
    }));
}

async function metatraderPositions(creds: BrokerCredentials): Promise<BrokerPosition[]> {
  const bridgeUrl = String(creds.metadata?.bridge_url ?? "");
  if (!bridgeUrl) throw new Error("MetaTrader bridge_url not configured on connection");
  const timestamp = String(Date.now());
  const signature = await hmacSha256Hex(creds.apiSecret, `positions${timestamp}`);
  const res = await fetch(`${bridgeUrl.replace(/\/$/, "")}/positions`, {
    headers: { "X-API-KEY": creds.apiKey, "X-TIMESTAMP": timestamp, "X-SIGNATURE": signature },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(String(body.error ?? "MT bridge position fetch failed"));
  const list = (body.positions ?? []) as Record<string, unknown>[];
  return list.map((p) => ({
    symbol: String(p.symbol),
    side: String(p.type ?? p.side).toLowerCase().includes("sell") ? ("sell" as const) : ("buy" as const),
    quantity: Number(p.volume ?? 0),
    avgEntryPrice: p.open_price != null ? Number(p.open_price) : null,
    markPrice: p.current_price != null ? Number(p.current_price) : null,
    unrealizedPnl: p.profit != null ? Number(p.profit) : null,
    raw: p,
  }));
}

export async function fetchBrokerPositions(creds: BrokerCredentials): Promise<BrokerPosition[]> {
  const broker = creds.brokerName.toLowerCase();
  if (broker === "binance") return binancePositions(creds);
  if (broker === "bybit") return bybitPositions(creds);
  if (["metatrader", "mt4", "mt5"].includes(broker)) return metatraderPositions(creds);
  throw new Error(`Position sync not supported for broker: ${creds.brokerName}`);
}

export async function fetchBrokerFills(
  creds: BrokerCredentials,
  symbol: string,
  sinceMs?: number,
): Promise<BrokerFill[]> {
  const broker = creds.brokerName.toLowerCase();
  const sym = normalizeSymbol(symbol);

  if (broker === "binance") {
    const params: Record<string, string | number> = { symbol: sym, limit: 100 };
    if (sinceMs) params.startTime = sinceMs;
    const { ok, body } = await binanceSigned(creds, "GET", "/api/v3/myTrades", params);
    if (!ok) throw new Error(String((body as Record<string, unknown>).msg ?? "Binance fills fetch failed"));
    return (body as unknown as Record<string, unknown>[]).map((t) => ({
      brokerOrderId: String(t.orderId),
      tradeId: String(t.id),
      symbol: sym,
      side: t.isBuyer ? "buy" : "sell",
      quantity: Number(t.qty ?? 0),
      price: Number(t.price ?? 0),
      commission: t.commission != null ? Number(t.commission) : null,
      executedAt: new Date(Number(t.time ?? Date.now())).toISOString(),
    }));
  }

  if (broker === "bybit") {
    const params: Record<string, string | number> = { category: bybitCategory(creds), symbol: sym, limit: 100 };
    if (sinceMs) params.startTime = sinceMs;
    const { ok, body } = await bybitSigned(creds, "GET", "/v5/execution/list", params);
    if (!ok) throw new Error(String(body.retMsg ?? "Bybit fills fetch failed"));
    const list = ((body.result as Record<string, unknown>)?.list ?? []) as Record<string, unknown>[];
    return list.map((t) => ({
      brokerOrderId: String(t.orderId),
      tradeId: String(t.execId),
      symbol: sym,
      side: String(t.side).toLowerCase() === "sell" ? "sell" : "buy",
      quantity: Number(t.execQty ?? 0),
      price: Number(t.execPrice ?? 0),
      commission: t.execFee != null ? Number(t.execFee) : null,
      executedAt: new Date(Number(t.execTime ?? Date.now())).toISOString(),
    }));
  }

  throw new Error(`Fill history not supported for broker: ${creds.brokerName}`);
}

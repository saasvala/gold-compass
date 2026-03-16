import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface MarketTick {
  symbol: string;
  bid: number;
  ask: number;
  close: number;
  spread: number;
  volume: number;
  timestamp: string;
}

export interface Candle {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeframe: string;
  timestamp: string;
}

export const useMarketData = (symbol?: string) => {
  const { session } = useAuth();
  const [latestPrice, setLatestPrice] = useState<MarketTick | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);

  const invokeMarketData = useCallback(async (body: Record<string, unknown>) => {
    if (!session?.access_token) throw new Error("Not authenticated");
    const { data, error } = await supabase.functions.invoke("market-data", {
      body,
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) throw error;
    return data;
  }, [session]);

  const fetchPrice = useCallback(async (sym: string) => {
    try {
      const data = await invokeMarketData({ action: "get_price", symbol: sym });
      if (data?.price) setLatestPrice(data.price as MarketTick);
    } catch (e) {
      console.error("Failed to fetch price:", e);
    } finally {
      setLoading(false);
    }
  }, [invokeMarketData]);

  const fetchCandles = useCallback(async (sym: string, timeframe = "1m", limit = 100) => {
    try {
      const data = await invokeMarketData({ action: "get_candles", symbol: sym, timeframe, limit });
      setCandles((data?.candles || []) as Candle[]);
    } catch (e) {
      console.error("Failed to fetch candles:", e);
    }
  }, [invokeMarketData]);

  useEffect(() => {
    if (session && symbol) {
      fetchPrice(symbol);
      fetchCandles(symbol);
    }
  }, [session, symbol, fetchPrice, fetchCandles]);

  // Realtime subscription for market data
  useEffect(() => {
    if (!symbol) return;
    const channel = supabase
      .channel(`market-data-${symbol}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "market_data",
        filter: `symbol=eq.${symbol.toUpperCase()}`,
      }, (payload) => {
        const row = payload.new as Record<string, unknown>;
        if (row.data_type === "tick") {
          setLatestPrice(row as unknown as MarketTick);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [symbol]);

  return { latestPrice, candles, loading, fetchPrice, fetchCandles, invokeMarketData };
};

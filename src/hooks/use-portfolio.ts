import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface Position {
  id: string;
  user_id: string;
  bot_id: string | null;
  broker_connection_id: string | null;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  avg_entry_price: number;
  current_price: number | null;
  unrealized_pnl: number;
  realized_pnl: number;
  stop_loss: number | null;
  take_profit: number | null;
  liquidation_price: number | null;
  leverage: number;
  margin_used: number;
  is_open: boolean;
  opened_at: string;
  closed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PortfolioSummary {
  total_equity: number;
  total_balance: number;
  unrealized_pnl: number;
  realized_pnl: number;
  total_margin_used: number;
  drawdown_percent: number;
  max_drawdown_percent: number;
  open_positions_count: number;
  exposure_by_asset: Record<string, number>;
  positions: Position[];
}

export const usePortfolio = () => {
  const { session } = useAuth();
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  const invokePortfolio = useCallback(async (body: Record<string, unknown>) => {
    if (!session?.access_token) throw new Error("Not authenticated");
    const { data, error } = await supabase.functions.invoke("portfolio-engine", {
      body,
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) throw error;
    return data;
  }, [session]);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await invokePortfolio({ action: "summary" });
      setSummary(data);
      setPositions(data.positions || []);
    } catch (e) {
      console.error("Failed to fetch portfolio:", e);
    } finally {
      setLoading(false);
    }
  }, [invokePortfolio]);

  useEffect(() => {
    if (session) fetchSummary();
  }, [session, fetchSummary]);

  // Realtime for positions
  useEffect(() => {
    if (!session?.user?.id) return;
    const channel = supabase
      .channel("positions-realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "positions",
        filter: `user_id=eq.${session.user.id}`,
      }, () => {
        fetchSummary();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id, fetchSummary]);

  const openPosition = async (params: {
    symbol: string;
    side: "buy" | "sell";
    quantity: number;
    avg_entry_price: number;
    stop_loss?: number;
    take_profit?: number;
    leverage?: number;
    bot_id?: string;
    broker_connection_id?: string;
  }) => {
    return invokePortfolio({ action: "position_open", ...params });
  };

  const closePosition = async (positionId: string, closePrice: number, realizedPnl: number) => {
    return invokePortfolio({
      action: "position_close",
      position_id: positionId,
      close_price: closePrice,
      realized_pnl: realizedPnl,
    });
  };

  const takeSnapshot = async () => {
    return invokePortfolio({ action: "snapshot" });
  };

  const getHistory = async (days = 30) => {
    return invokePortfolio({ action: "history", days });
  };

  return { summary, positions, loading, openPosition, closePosition, takeSnapshot, getHistory, refetch: fetchSummary };
};

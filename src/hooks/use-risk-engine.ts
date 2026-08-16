import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface RiskLimits {
  id: string;
  user_id: string;
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

export interface RiskViolation {
  code: string;
  severity: "warning" | "critical";
  message: string;
  trigger_value?: number;
  threshold_value?: number;
}

export interface RiskEvaluation {
  passed: boolean;
  violations: RiskViolation[];
  limits: RiskLimits;
  metrics: Record<string, number>;
}

export const useRiskEngine = () => {
  const { session } = useAuth();
  const [limits, setLimits] = useState<RiskLimits | null>(null);
  const [loading, setLoading] = useState(true);

  const invokeRisk = useCallback(async (body: Record<string, unknown>) => {
    if (!session?.access_token) throw new Error("Not authenticated");
    const { data, error } = await supabase.functions.invoke("risk-engine", {
      body,
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) throw error;
    return data;
  }, [session]);

  const fetchLimits = useCallback(async () => {
    try {
      const data = await invokeRisk({ action: "get_limits" });
      setLimits(data?.limits ?? null);
    } catch (e) {
      console.error("Failed to fetch risk limits:", e);
    } finally {
      setLoading(false);
    }
  }, [invokeRisk]);

  useEffect(() => {
    if (session) fetchLimits();
  }, [session, fetchLimits]);

  const updateLimits = async (patch: Partial<RiskLimits>) => {
    const data = await invokeRisk({ action: "update_limits", limits: patch });
    setLimits(data?.limits ?? null);
    return data;
  };

  const evaluate = async (params: {
    symbol?: string;
    side?: "buy" | "sell";
    quantity?: number;
    price?: number;
    stop_loss?: number;
    leverage?: number;
    bot_id?: string;
  }): Promise<RiskEvaluation> => invokeRisk({ action: "evaluate", ...params });

  const positionSize = async (params: { price: number; stop_loss: number }) =>
    invokeRisk({ action: "position_size", ...params });

  const exposure = async () => invokeRisk({ action: "exposure" });

  const killSwitch = async (reason?: string) => {
    const data = await invokeRisk({ action: "kill_switch", reason });
    setLimits(data?.limits ?? null);
    return data;
  };

  const resumeTrading = async () => {
    const data = await invokeRisk({ action: "resume" });
    setLimits(data?.limits ?? null);
    return data;
  };

  return { limits, loading, updateLimits, evaluate, positionSize, exposure, killSwitch, resumeTrading, refetch: fetchLimits };
};

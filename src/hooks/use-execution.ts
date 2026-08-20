import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface ExecutionRoute {
  id: string;
  broker_name: string;
  broker_type: string;
  is_testnet: boolean;
  connection_status: string;
  last_connected_at: string | null;
}

export interface ExecutionResult {
  order?: Record<string, unknown>;
  execution?: {
    brokerOrderId: string | null;
    status: string;
    filledQuantity: number;
    avgFillPrice: number | null;
    rejectionReason: string | null;
    latencyMs: number;
  };
  routed_to?: string;
  error?: string;
  risk_blocked?: boolean;
  violations?: { code: string; severity: string; message: string }[];
}

export const useExecution = () => {
  const { session } = useAuth();
  const [executing, setExecuting] = useState(false);

  const invoke = useCallback(async (body: Record<string, unknown>) => {
    if (!session?.access_token) throw new Error("Not authenticated");
    const { data, error } = await supabase.functions.invoke("trade-execution", {
      body,
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) throw error;
    return data;
  }, [session]);

  const execute = async (params: {
    symbol: string;
    side: "buy" | "sell";
    order_type?: "market" | "limit" | "stop" | "stop_limit" | "trailing_stop";
    quantity: number;
    price?: number;
    stop_price?: number;
    trail_percent?: number;
    time_in_force?: string;
    bot_id?: string;
    strategy_id?: string;
    broker_connection_id?: string;
  }): Promise<ExecutionResult> => {
    setExecuting(true);
    try {
      return await invoke({ action: "execute", ...params });
    } finally {
      setExecuting(false);
    }
  };

  const cancel = (orderId: string) => invoke({ action: "cancel", order_id: orderId });

  const modify = (orderId: string, changes: {
    quantity?: number;
    price?: number;
    stop_price?: number;
    trail_percent?: number;
    order_type?: string;
    time_in_force?: string;
  }) => invoke({ action: "modify", order_id: orderId, ...changes });

  const syncOrder = (orderId: string) => invoke({ action: "sync", order_id: orderId });

  const syncAll = () => invoke({ action: "sync_all" });

  const routes = async (): Promise<ExecutionRoute[]> => {
    const data = await invoke({ action: "routes" });
    return data?.routes ?? [];
  };

  return { execute, cancel, modify, syncOrder, syncAll, routes, executing };
};

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface Order {
  id: string;
  user_id: string;
  bot_id: string | null;
  broker_connection_id: string | null;
  strategy_id: string | null;
  symbol: string;
  side: "buy" | "sell";
  order_type: "market" | "limit" | "stop" | "stop_limit" | "trailing_stop";
  status: "pending" | "submitted" | "partial_fill" | "filled" | "cancelled" | "rejected" | "expired";
  quantity: number;
  price: number | null;
  stop_price: number | null;
  trail_percent: number | null;
  filled_quantity: number;
  avg_fill_price: number | null;
  commission: number | null;
  broker_order_id: string | null;
  time_in_force: string;
  submitted_at: string | null;
  filled_at: string | null;
  cancelled_at: string | null;
  rejection_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const useOrders = () => {
  const { session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const invokeOMS = useCallback(async (body: Record<string, unknown>) => {
    if (!session?.access_token) throw new Error("Not authenticated");
    const { data, error } = await supabase.functions.invoke("order-management", {
      body,
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) throw error;
    return data;
  }, [session]);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await invokeOMS({ action: "list" });
      setOrders(data.orders || []);
    } catch (e) {
      console.error("Failed to fetch orders:", e);
    } finally {
      setLoading(false);
    }
  }, [invokeOMS]);

  useEffect(() => {
    if (session) fetchOrders();
  }, [session, fetchOrders]);

  // Realtime subscription for orders
  useEffect(() => {
    if (!session?.user?.id) return;
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `user_id=eq.${session.user.id}`,
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id, fetchOrders]);

  const createOrder = async (params: {
    symbol: string;
    side: "buy" | "sell";
    order_type?: string;
    quantity: number;
    price?: number;
    stop_price?: number;
    trail_percent?: number;
    bot_id?: string;
    broker_connection_id?: string;
    strategy_id?: string;
  }) => {
    return invokeOMS({ action: "create", ...params });
  };

  const cancelOrder = async (orderId: string) => {
    return invokeOMS({ action: "cancel", order_id: orderId });
  };

  return { orders, loading, createOrder, cancelOrder, refetch: fetchOrders };
};

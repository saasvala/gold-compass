import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface BrokerConnection {
  id: string;
  broker_name: string;
  broker_type: string;
  is_testnet: boolean;
  is_active: boolean;
  permissions: string[];
  connection_status: string;
  last_connected_at: string | null;
  created_at: string;
}

export const useBrokerConnections = () => {
  const { session } = useAuth();
  const [connections, setConnections] = useState<BrokerConnection[]>([]);
  const [loading, setLoading] = useState(true);

  const invokeBroker = useCallback(async (body: Record<string, unknown>) => {
    if (!session?.access_token) throw new Error("Not authenticated");
    const { data, error } = await supabase.functions.invoke("broker-management", {
      body,
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) throw error;
    return data;
  }, [session]);

  const fetchConnections = useCallback(async () => {
    try {
      const data = await invokeBroker({ action: "list" });
      setConnections(data.connections || []);
    } catch (e) {
      console.error("Failed to fetch broker connections:", e);
    } finally {
      setLoading(false);
    }
  }, [invokeBroker]);

  useEffect(() => {
    if (session) fetchConnections();
  }, [session, fetchConnections]);

  const connectBroker = async (params: {
    broker_name: string;
    broker_type?: string;
    api_key: string;
    api_secret: string;
    passphrase?: string;
    is_testnet?: boolean;
    permissions?: string[];
  }) => {
    const result = await invokeBroker({ action: "connect", ...params });
    await fetchConnections();
    return result;
  };

  const disconnectBroker = async (connectionId: string) => {
    const result = await invokeBroker({ action: "disconnect", connection_id: connectionId });
    await fetchConnections();
    return result;
  };

  const testConnection = async (connectionId: string) => {
    return invokeBroker({ action: "test", connection_id: connectionId });
  };

  const updateConnection = async (connectionId: string, params: Record<string, unknown>) => {
    const result = await invokeBroker({ action: "update", connection_id: connectionId, ...params });
    await fetchConnections();
    return result;
  };

  return { connections, loading, connectBroker, disconnectBroker, testConnection, updateConnection, refetch: fetchConnections };
};

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface PositionDrift {
  id: string;
  symbol: string;
  drift_type: string;
  severity: string;
  internal_quantity: number | null;
  broker_quantity: number | null;
  quantity_diff: number | null;
  internal_avg_price: number | null;
  broker_avg_price: number | null;
  resolved: boolean;
  details: Record<string, unknown>;
  created_at: string;
}

export interface ReconciliationCheckpoint {
  broker_connection_id: string;
  last_reconciled_at: string | null;
  last_status: string;
  last_error: string | null;
  positions_checked: number;
  drifts_found: number;
}

export const useReconciliation = () => {
  const { session } = useAuth();
  const [drifts, setDrifts] = useState<PositionDrift[]>([]);
  const [checkpoints, setCheckpoints] = useState<ReconciliationCheckpoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!session?.user?.id) return;
    const [driftRes, cpRes] = await Promise.all([
      supabase
        .from("position_drifts")
        .select("*")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("reconciliation_checkpoints")
        .select("broker_connection_id, last_reconciled_at, last_status, last_error, positions_checked, drifts_found"),
    ]);
    if (driftRes.data) setDrifts(driftRes.data as unknown as PositionDrift[]);
    if (cpRes.data) setCheckpoints(cpRes.data as unknown as ReconciliationCheckpoint[]);
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    if (session) fetchAll();
  }, [session, fetchAll]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const channel = supabase
      .channel("position-drifts")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "position_drifts",
        filter: `user_id=eq.${session.user.id}`,
      }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id, fetchAll]);

  const resolveDrift = async (id: string) => {
    await supabase
      .from("position_drifts")
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq("id", id);
    await fetchAll();
  };

  const criticalCount = drifts.filter((d) => d.severity === "critical").length;

  return { drifts, checkpoints, loading, criticalCount, resolveDrift, refetch: fetchAll };
};

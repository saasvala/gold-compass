import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface RiskEvent {
  id: string;
  user_id: string;
  bot_id: string | null;
  event_type: string;
  severity: string;
  description: string;
  trigger_value: number | null;
  threshold_value: number | null;
  action_taken: string | null;
  resolved: boolean;
  resolved_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const useRiskEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("risk_events")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setEvents(data as unknown as RiskEvent[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("risk-events-realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "risk_events",
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchEvents]);

  return { events, loading, refetch: fetchEvents };
};

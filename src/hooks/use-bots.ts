import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Tables } from "@/integrations/supabase/types";

type BotConfig = Tables<"bot_configs">;

export const useBots = () => {
  const { user } = useAuth();
  const [bots, setBots] = useState<BotConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBots = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("bot_configs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setBots(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("bot-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bot_configs",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setBots((prev) => [payload.new as BotConfig, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setBots((prev) =>
              prev.map((b) => (b.id === (payload.new as BotConfig).id ? (payload.new as BotConfig) : b))
            );
          } else if (payload.eventType === "DELETE") {
            setBots((prev) => prev.filter((b) => b.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const activateBot = async (botType: string, botCategory: string, name: string) => {
    if (!user) return;
    const { error } = await supabase.from("bot_configs").insert({
      user_id: user.id,
      bot_type: botType,
      bot_category: botCategory,
      name,
      status: "active",
      is_demo: true,
    });
    if (!error) await fetchBots();
    return error;
  };

  const toggleBotStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    await supabase.from("bot_configs").update({ status: newStatus }).eq("id", id);
  };

  const deleteBot = async (id: string) => {
    await supabase.from("bot_configs").delete().eq("id", id);
  };

  const updateBotDemo = async (id: string, isDemo: boolean) => {
    await supabase.from("bot_configs").update({ is_demo: isDemo }).eq("id", id);
  };

  return { bots, loading, activateBot, toggleBotStatus, deleteBot, updateBotDemo, refetch: fetchBots };
};

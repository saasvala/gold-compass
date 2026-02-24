import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Tables, Enums } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

interface AdminUser {
  profile: Profile;
  role: Enums<"app_role">;
  botCount: number;
  subscription?: Tables<"subscriptions">;
}

export const useAdmin = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeBots: 0,
    totalTrades: 0,
    totalVolume: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;

    // Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch roles
    const { data: roles } = await supabase.from("user_roles").select("*");

    // Fetch bot counts
    const { data: bots } = await supabase.from("bot_configs").select("user_id, status");

    // Fetch subscriptions
    const { data: subs } = await supabase.from("subscriptions").select("*");

    // Fetch trades count
    const { data: trades } = await supabase.from("trade_history").select("id");

    if (profiles) {
      const adminUsers: AdminUser[] = profiles.map((p) => {
        const role = roles?.find((r) => r.user_id === p.user_id);
        const userBots = bots?.filter((b) => b.user_id === p.user_id) || [];
        const sub = subs?.find((s) => s.user_id === p.user_id);
        return {
          profile: p,
          role: (role?.role || "trader") as Enums<"app_role">,
          botCount: userBots.length,
          subscription: sub,
        };
      });
      setUsers(adminUsers);
    }

    const activeBotCount = bots?.filter((b) => b.status === "active").length || 0;

    setStats({
      totalUsers: profiles?.length || 0,
      activeBots: activeBotCount,
      totalTrades: trades?.length || 0,
      totalVolume: (trades?.length || 0) * 1250, // mock avg
    });

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateUserRole = async (userId: string, newRole: Enums<"app_role">) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", userId);
    if (!error) await fetchData();
    return error;
  };

  return { users, stats, loading, updateUserRole, refetch: fetchData };
};

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type AppRole = "admin" | "trader" | "investor" | "reseller";

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>("trader");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole("trader");
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (data) {
        setRole(data.role as AppRole);
      }
      setLoading(false);
    };

    fetchRole();
  }, [user]);

  const isAdmin = role === "admin";
  const isTrader = role === "trader";
  const isInvestor = role === "investor";
  const isReseller = role === "reseller";

  return { role, loading, isAdmin, isTrader, isInvestor, isReseller };
};

import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Simulates real-time P/L updates for demo-mode bots every 5 seconds.
 * Only updates bots that are active AND in demo mode.
 */
export const useBotSimulation = () => {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;

    const simulate = async () => {
      // Fetch active demo bots
      const { data: bots } = await supabase
        .from("bot_configs")
        .select("id, pnl_total, win_rate, total_trades")
        .eq("user_id", user.id)
        .eq("status", "active")
        .eq("is_demo", true);

      if (!bots || bots.length === 0) return;

      // Update each bot with a small random trade result
      for (const bot of bots) {
        const isWin = Math.random() > 0.38; // ~62% win rate drift
        const tradeProfit = isWin
          ? +(Math.random() * 80 + 10).toFixed(2)
          : +(-Math.random() * 50 - 5).toFixed(2);

        const newPnl = +((bot.pnl_total || 0) + tradeProfit).toFixed(2);
        const newTrades = (bot.total_trades || 0) + 1;
        const currentWins = Math.round(((bot.win_rate || 50) / 100) * (bot.total_trades || 0));
        const newWins = currentWins + (isWin ? 1 : 0);
        const newWinRate = +(newWins / newTrades * 100).toFixed(1);

        const { error } = await supabase
          .from("bot_configs")
          .update({
            pnl_total: newPnl,
            total_trades: newTrades,
            win_rate: newWinRate,
            updated_at: new Date().toISOString(),
          })
          .eq("id", bot.id);
        if (error) console.error("Simulation update error:", error);
      }
    };

    // Run immediately once, then every 5 seconds
    simulate();
    intervalRef.current = setInterval(simulate, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user]);
};

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Target, ArrowUpDown, Medal, Users, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SortKey = "sharpe_ratio" | "avg_win_rate" | "total_pnl";

interface LeaderboardEntry {
  bot_type: string;
  bot_category: string;
  total_users: number;
  avg_pnl: number;
  avg_win_rate: number;
  total_pnl: number;
  best_pnl: number;
  avg_trades: number;
  sharpe_ratio: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  forex: "bg-blue-500/20 text-blue-400",
  crypto: "bg-orange-500/20 text-orange-400",
  stocks: "bg-green-500/20 text-green-400",
  commodities: "bg-amber-500/20 text-amber-400",
  indices: "bg-purple-500/20 text-purple-400",
  options: "bg-pink-500/20 text-pink-400",
  ai: "bg-cyan-500/20 text-cyan-400",
  social: "bg-rose-500/20 text-rose-400",
  portfolio: "bg-emerald-500/20 text-emerald-400",
  special: "bg-violet-500/20 text-violet-400",
  enterprise: "bg-yellow-500/20 text-yellow-400",
};

const MEDAL_COLORS = ["text-yellow-400", "text-gray-300", "text-amber-600"];

const LeaderboardTab = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("sharpe_ratio");

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.rpc("get_bot_leaderboard");
      if (data) setEntries(data as LeaderboardEntry[]);
      if (error) console.error("Leaderboard fetch error:", error);
      setLoading(false);
    };
    fetch();
  }, []);

  const sorted = [...entries].sort((a, b) => {
    if (sortBy === "avg_win_rate") return b.avg_win_rate - a.avg_win_rate;
    if (sortBy === "total_pnl") return b.total_pnl - a.total_pnl;
    return b.sharpe_ratio - a.sharpe_ratio;
  });

  const formatName = (botType: string) =>
    botType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Bot Leaderboard</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Aggregated performance across all traders. Ranked by risk-adjusted returns.
      </p>

      <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="sharpe_ratio" className="text-xs gap-1">
            <ArrowUpDown className="w-3 h-3" /> Sharpe
          </TabsTrigger>
          <TabsTrigger value="avg_win_rate" className="text-xs gap-1">
            <Target className="w-3 h-3" /> Win Rate
          </TabsTrigger>
          <TabsTrigger value="total_pnl" className="text-xs gap-1">
            <TrendingUp className="w-3 h-3" /> Total P/L
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <BarChart3 className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No bot data yet. Activate bots to populate the leaderboard.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((entry, i) => (
            <motion.div
              key={entry.bot_type}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                      {i < 3 ? (
                        <Medal className={`w-4 h-4 ${MEDAL_COLORS[i]}`} />
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {formatName(entry.bot_type)}
                        </span>
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${CATEGORY_COLORS[entry.bot_category] || "bg-muted text-muted-foreground"}`}>
                          {entry.bot_category}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div>
                          <span className="text-muted-foreground">Sharpe</span>
                          <p className={`font-bold ${entry.sharpe_ratio > 0 ? "text-green-400" : "text-red-400"}`}>
                            {entry.sharpe_ratio.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Win Rate</span>
                          <p className="font-bold text-foreground">{entry.avg_win_rate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total P/L</span>
                          <p className={`font-bold ${entry.total_pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                            ${entry.total_pnl.toFixed(0)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-[9px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Users className="w-2.5 h-2.5" /> {entry.total_users} traders
                        </span>
                        <span>{entry.avg_trades} avg trades</span>
                        <span>Best: ${entry.best_pnl.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaderboardTab;

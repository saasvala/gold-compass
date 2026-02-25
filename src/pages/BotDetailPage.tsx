import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Bot, Power, PowerOff, TrendingUp, TrendingDown,
  Activity, Shield, Settings, Calendar, Zap, Target,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import { BOT_TYPES, getRiskColor } from "@/lib/bot-types";
import type { Tables } from "@/integrations/supabase/types";

type BotConfig = Tables<"bot_configs">;

interface BotDetailPageProps {
  bot: BotConfig;
  onBack: () => void;
  onToggle: (id: string, status: string) => void;
}

const generatePnlHistory = (days: number) => {
  const data = [];
  const now = new Date();
  let cumulative = 0;
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const daily = (Math.random() - 0.42) * 120;
    cumulative += daily;
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      pnl: +cumulative.toFixed(2),
      daily: +daily.toFixed(2),
    });
  }
  return data;
};

const generateTrades = () =>
  Array.from({ length: 15 }, (_, i) => ({
    id: i,
    direction: Math.random() > 0.5 ? "BUY" : "SELL",
    entry: (1800 + Math.random() * 200).toFixed(2),
    exit: (1800 + Math.random() * 200).toFixed(2),
    profit: +((Math.random() - 0.4) * 150).toFixed(2),
    rr: +(1 + Math.random() * 3).toFixed(1),
    date: new Date(Date.now() - i * 86400000 * Math.random() * 3).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
  }));

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card gold-border rounded-lg px-3 py-2 text-xs">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-mono font-bold gold-text">${payload[0].value.toFixed(2)}</p>
    </div>
  );
};

const BotDetailPage = ({ bot, onBack, onToggle }: BotDetailPageProps) => {
  const [period, setPeriod] = useState("30");
  const botType = BOT_TYPES.find((b) => b.id === bot.bot_type);
  const Icon = botType?.icon || Bot;
  const isActive = bot.status === "active";
  const pnl = bot.pnl_total || 0;
  const winRate = bot.win_rate || 0;
  const totalTrades = bot.total_trades || 0;

  const pnlData = useMemo(() => generatePnlHistory(parseInt(period)), [period]);
  const trades = useMemo(() => generateTrades(), []);

  const settings = (bot.settings || {}) as Record<string, any>;
  const strategy = (bot.strategy || {}) as Record<string, any>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack}
          className="w-9 h-9 rounded-lg bg-secondary/50 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </motion.button>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isActive ? "gold-gradient gold-glow" : "bg-secondary"}`}>
          <Icon className={`w-5 h-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className={`text-sm font-bold ${isActive ? "gold-text" : "text-foreground"}`}>{bot.name}</h2>
            {isActive && <span className="w-2 h-2 rounded-full bg-success animate-pulse" />}
          </div>
          <p className="text-[9px] text-muted-foreground">
            {bot.bot_category} · {botType?.risk && <span className={getRiskColor(botType.risk)}>{botType.risk} risk</span>}
            {" · "}{bot.is_demo ? "DEMO" : "LIVE"}
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => onToggle(bot.id, bot.status)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? "bg-destructive/20" : "bg-success/20"}`}>
          {isActive ? <PowerOff className="w-5 h-5 text-destructive" /> : <Power className="w-5 h-5 text-success" />}
        </motion.button>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: TrendingUp, label: "P/L", value: `$${pnl.toFixed(0)}`, color: pnl >= 0 ? "text-success" : "text-destructive" },
          { icon: Target, label: "Win Rate", value: `${winRate.toFixed(0)}%`, color: winRate > 50 ? "text-success" : "text-warning" },
          { icon: Activity, label: "Trades", value: totalTrades.toString(), color: "text-primary" },
          { icon: Shield, label: "RR Avg", value: "1.8", color: "text-primary" },
        ].map((m) => (
          <motion.div key={m.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card gold-border rounded-xl p-2 text-center">
            <m.icon className={`w-4 h-4 mx-auto mb-0.5 ${m.color}`} />
            <p className={`text-sm font-bold font-mono ${m.color}`}>{m.value}</p>
            <p className="text-[7px] text-muted-foreground uppercase">{m.label}</p>
          </motion.div>
        ))}
      </div>

      {/* P/L Chart */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card gold-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">P/L Curve</p>
          </div>
          <div className="flex gap-1">
            {[{ k: "7", l: "1W" }, { k: "30", l: "1M" }, { k: "90", l: "3M" }].map((p) => (
              <button key={p.k} onClick={() => setPeriod(p.k)}
                className={`text-[10px] font-bold px-2 py-1 rounded-md ${period === p.k ? "gold-gradient text-primary-foreground" : "text-muted-foreground bg-secondary/50"}`}>
                {p.l}
              </button>
            ))}
          </div>
        </div>
        <div className="h-36 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pnlData}>
              <defs>
                <linearGradient id="botPnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={pnl >= 0 ? "hsl(142,71%,45%)" : "hsl(0,72%,51%)"} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={pnl >= 0 ? "hsl(142,71%,45%)" : "hsl(0,72%,51%)"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(220,10%,50%)" }} axisLine={false} tickLine={false} interval={Math.floor(pnlData.length / 5)} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="pnl" stroke={pnl >= 0 ? "hsl(142,71%,45%)" : "hsl(0,72%,51%)"} strokeWidth={2} fill="url(#botPnlGrad)" animationDuration={800} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Daily P/L Bars */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-card gold-border rounded-xl p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Daily P/L</p>
        <div className="h-24 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pnlData.slice(-14)}>
              <XAxis dataKey="date" tick={{ fontSize: 8, fill: "hsl(220,10%,50%)" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Bar dataKey="daily" radius={[2, 2, 0, 0]}>
                {pnlData.slice(-14).map((entry, i) => (
                  <motion.rect key={i} fill={entry.daily >= 0 ? "hsl(142,71%,45%)" : "hsl(0,72%,51%)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Strategy Config */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card gold-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-4 h-4 text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Strategy Config</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Type", value: bot.bot_type },
            { label: "Category", value: bot.bot_category },
            { label: "Strategies", value: botType?.strategies.join(", ") || "—" },
            { label: "Markets", value: botType?.markets.join(", ") || "—" },
            { label: "Mode", value: bot.is_demo ? "Demo" : "Live" },
            { label: "Risk Level", value: botType?.risk || "—" },
          ].map((item) => (
            <div key={item.label} className="p-2 rounded-lg bg-secondary/30">
              <p className="text-[8px] text-muted-foreground uppercase">{item.label}</p>
              <p className="text-[10px] font-mono font-semibold text-foreground truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Trade History */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glass-card gold-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Recent Trades</p>
          </div>
          <span className="text-[9px] text-muted-foreground">{trades.length} trades</span>
        </div>
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
          {trades.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  t.direction === "BUY" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                }`}>{t.direction}</span>
                <div>
                  <p className="text-[10px] font-mono text-foreground">{t.entry} → {t.exit}</p>
                  <p className="text-[8px] text-muted-foreground">{t.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-[10px] font-mono font-bold ${t.profit >= 0 ? "text-success" : "text-destructive"}`}>
                  {t.profit >= 0 ? "+" : ""}${t.profit.toFixed(2)}
                </p>
                <p className="text-[8px] text-muted-foreground">RR: {t.rr}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default BotDetailPage;

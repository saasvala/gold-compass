import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  PieChart, TrendingUp, DollarSign, BarChart3, Eye, Shield,
  Activity, Calendar, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell,
} from "recharts";
import { useBots } from "@/hooks/use-bots";

const COLORS = [
  "hsl(43,96%,56%)", "hsl(142,71%,45%)", "hsl(220,70%,55%)",
  "hsl(0,72%,51%)", "hsl(38,92%,50%)", "hsl(280,60%,55%)",
];

const generateEquity = (days: number) => {
  const data = [];
  let val = 100000;
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    val += (Math.random() - 0.4) * 800;
    val = Math.max(85000, val);
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      equity: +val.toFixed(2),
    });
  }
  return data;
};

const generateDrawdown = (days: number) => {
  const data = [];
  const now = new Date();
  let peak = 100000;
  let val = 100000;
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    val += (Math.random() - 0.4) * 800;
    peak = Math.max(peak, val);
    const dd = ((peak - val) / peak) * 100;
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      drawdown: +dd.toFixed(2),
    });
  }
  return data;
};

const periods = [
  { key: "1w", label: "1W", days: 7 },
  { key: "1m", label: "1M", days: 30 },
  { key: "3m", label: "3M", days: 90 },
] as const;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card gold-border rounded-lg px-3 py-2 text-xs">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-mono font-bold gold-text">{payload[0].name === "drawdown" ? `-${payload[0].value}%` : `$${payload[0].value.toLocaleString()}`}</p>
    </div>
  );
};

const InvestorDashboard = () => {
  const { bots } = useBots();
  const [period, setPeriod] = useState("1m");
  const selected = periods.find((p) => p.key === period)!;

  const equityData = useMemo(() => generateEquity(selected.days), [selected.days]);
  const drawdownData = useMemo(() => generateDrawdown(selected.days), [selected.days]);

  const totalPnl = bots.reduce((s, b) => s + (b.pnl_total || 0), 0);
  const activeBotCount = bots.filter((b) => b.status === "active").length;
  const avgWin = bots.length ? bots.reduce((s, b) => s + (b.win_rate || 0), 0) / bots.length : 0;

  // Mock portfolio allocation from active bots
  const allocation = bots.length > 0
    ? bots.slice(0, 6).map((b, i) => ({
        name: b.name,
        value: Math.max(10, 100 - i * 15),
        color: COLORS[i % COLORS.length],
      }))
    : [
        { name: "Gold Bot (SMC)", value: 35, color: COLORS[0] },
        { name: "Forex Majors", value: 25, color: COLORS[1] },
        { name: "Crypto BTC", value: 20, color: COLORS[2] },
        { name: "AI Trend", value: 15, color: COLORS[3] },
        { name: "Cash Reserve", value: 5, color: COLORS[4] },
      ];

  const portfolioValue = 124800 + totalPnl;
  const endEquity = equityData[equityData.length - 1]?.equity || 0;
  const startEquity = equityData[0]?.equity || 0;
  const equityGain = endEquity - startEquity;
  const maxDD = Math.max(...drawdownData.map((d) => d.drawdown));

  // Mock analytics
  const sharpeRatio = (1.2 + Math.random() * 0.8).toFixed(2);
  const sortinoRatio = (1.6 + Math.random() * 0.9).toFixed(2);
  const calmarRatio = (2.1 + Math.random() * 1.2).toFixed(2);
  const monthlyROI = ((equityGain / startEquity) * 100).toFixed(1);

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-2">
        <Eye className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-bold gold-text uppercase tracking-wider">Investor Portfolio</h2>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: DollarSign, label: "Portfolio Value", value: `$${(portfolioValue / 1000).toFixed(1)}K`, sub: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(0)} P/L`, up: totalPnl >= 0 },
          { icon: TrendingUp, label: "Monthly ROI", value: `${monthlyROI}%`, sub: `Sharpe: ${sharpeRatio}`, up: true },
          { icon: Activity, label: "Active Bots", value: activeBotCount.toString(), sub: `WR: ${avgWin.toFixed(0)}%`, up: true },
          { icon: Shield, label: "Max Drawdown", value: `${maxDD.toFixed(1)}%`, sub: "Limit: 10%", up: maxDD < 10 },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card gold-border rounded-xl p-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg gold-gradient flex items-center justify-center">
                <s.icon className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </div>
            <p className="text-lg font-bold font-mono text-foreground">{s.value}</p>
            <p className={`text-[10px] flex items-center gap-0.5 ${s.up ? "text-success" : "text-destructive"}`}>
              {s.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {s.sub}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Performance Ratios */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-card gold-border rounded-xl p-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Performance Analytics</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Sharpe", value: sharpeRatio, good: parseFloat(sharpeRatio) > 1 },
            { label: "Sortino", value: sortinoRatio, good: parseFloat(sortinoRatio) > 1.5 },
            { label: "Calmar", value: calmarRatio, good: parseFloat(calmarRatio) > 2 },
          ].map((r) => (
            <div key={r.label} className="text-center p-2 rounded-lg bg-secondary/30">
              <p className={`text-sm font-bold font-mono ${r.good ? "text-success" : "text-warning"}`}>{r.value}</p>
              <p className="text-[8px] text-muted-foreground uppercase">{r.label} Ratio</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Equity Curve */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card gold-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Equity Curve</p>
          </div>
          <div className="flex gap-1">
            {periods.map((p) => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all ${
                  period === p.key ? "gold-gradient text-primary-foreground" : "text-muted-foreground bg-secondary/50"
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-lg font-bold font-mono gold-text">${endEquity.toLocaleString()}</span>
          <span className={`text-xs font-mono ${equityGain >= 0 ? "text-success" : "text-destructive"}`}>
            {equityGain >= 0 ? "+" : ""}{equityGain.toFixed(0)} ({((equityGain / startEquity) * 100).toFixed(1)}%)
          </span>
        </div>
        <div className="h-36 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityData}>
              <defs>
                <linearGradient id="investorEquityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={equityGain >= 0 ? "hsl(142,71%,45%)" : "hsl(0,72%,51%)"} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={equityGain >= 0 ? "hsl(142,71%,45%)" : "hsl(0,72%,51%)"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(220,10%,50%)" }} axisLine={false} tickLine={false} interval={Math.floor(equityData.length / 5)} />
              <YAxis hide domain={["dataMin - 500", "dataMax + 500"]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="equity" stroke={equityGain >= 0 ? "hsl(142,71%,45%)" : "hsl(0,72%,51%)"} strokeWidth={2} fill="url(#investorEquityGrad)" animationDuration={800} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Drawdown Chart */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glass-card gold-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-destructive" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Drawdown</p>
          </div>
          <span className="text-xs font-mono text-destructive">Max: {maxDD.toFixed(1)}%</span>
        </div>
        <div className="h-28 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={drawdownData}>
              <defs>
                <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(0,72%,51%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(0,72%,51%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(220,10%,50%)" }} axisLine={false} tickLine={false} interval={Math.floor(drawdownData.length / 4)} />
              <YAxis hide domain={[0, "dataMax + 2"]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="drawdown" stroke="hsl(0,72%,51%)" strokeWidth={1.5} fill="url(#ddGrad)" animationDuration={800} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Allocation Pie */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-card gold-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <PieChart className="w-4 h-4 text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Allocation</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-28 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <RPieChart>
                <Pie data={allocation} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2} strokeWidth={0}>
                  {allocation.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </RPieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1.5">
            {allocation.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                <span className="text-[10px] text-foreground truncate flex-1">{a.name}</span>
                <span className="text-[10px] font-mono text-muted-foreground">{((a.value / allocation.reduce((s, x) => s + x.value, 0)) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Bot Performance Table */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="glass-card gold-border rounded-xl p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Bot Performance</p>
        <div className="space-y-2">
          {(bots.length > 0 ? bots : [
            { name: "Gold Bot", pnl_total: 4200, win_rate: 68, total_trades: 142, status: "active" },
            { name: "Forex Majors", pnl_total: 1890, win_rate: 62, total_trades: 98, status: "active" },
            { name: "Crypto BTC", pnl_total: 980, win_rate: 55, total_trades: 67, status: "active" },
          ] as any[]).slice(0, 8).map((b: any, i: number) => {
            const pnl = b.pnl_total || 0;
            return (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-8 rounded-full ${b.status === "active" ? "gold-gradient" : "bg-muted"}`} />
                  <div>
                    <p className="text-xs font-semibold text-foreground">{b.name}</p>
                    <p className="text-[9px] text-muted-foreground">
                      WR: {(b.win_rate || 0).toFixed(0)}% · {b.total_trades || 0} trades
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-mono ${pnl >= 0 ? "text-success" : "text-destructive"}`}>
                  {pnl >= 0 ? "+" : ""}${Math.abs(pnl).toFixed(0)}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default InvestorDashboard;

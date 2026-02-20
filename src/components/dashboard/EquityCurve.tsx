import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar } from "lucide-react";

const generateData = (days: number, startVal: number) => {
  const data = [];
  let val = startVal;
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    val += (Math.random() - 0.42) * 120;
    val = Math.max(startVal * 0.85, val);
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      equity: +val.toFixed(2),
    });
  }
  return data;
};

const periods = [
  { key: "daily", label: "1W", days: 7 },
  { key: "weekly", label: "1M", days: 30 },
  { key: "monthly", label: "3M", days: 90 },
] as const;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card gold-border rounded-lg px-3 py-2 text-xs">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-mono font-bold gold-text">${payload[0].value.toLocaleString()}</p>
    </div>
  );
};

const EquityCurve = () => {
  const [period, setPeriod] = useState<string>("daily");
  const selected = periods.find((p) => p.key === period)!;

  const data = useMemo(() => generateData(selected.days, 10000), [selected.days]);
  const startVal = data[0].equity;
  const endVal = data[data.length - 1].equity;
  const gain = endVal - startVal;
  const isUp = gain >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card gold-border rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Equity Curve</p>
        </div>
        <div className="flex gap-1">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all ${
                period === p.key
                  ? "gold-gradient text-primary-foreground"
                  : "text-muted-foreground bg-secondary/50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-lg font-bold font-mono gold-text">${endVal.toLocaleString()}</span>
        <span className={`text-xs font-mono ${isUp ? "text-success" : "text-destructive"}`}>
          {isUp ? "+" : ""}{gain.toFixed(2)} ({((gain / startVal) * 100).toFixed(1)}%)
        </span>
      </div>
      <div className="h-40 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isUp ? "hsl(142,71%,45%)" : "hsl(0,72%,51%)"} stopOpacity={0.3} />
                <stop offset="100%" stopColor={isUp ? "hsl(142,71%,45%)" : "hsl(0,72%,51%)"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: "hsl(220,10%,50%)" }}
              axisLine={false}
              tickLine={false}
              interval={Math.floor(data.length / 5)}
            />
            <YAxis hide domain={["dataMin - 200", "dataMax + 200"]} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="equity"
              stroke={isUp ? "hsl(142,71%,45%)" : "hsl(0,72%,51%)"}
              strokeWidth={2}
              fill="url(#equityGrad)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default EquityCurve;

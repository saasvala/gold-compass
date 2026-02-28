import { motion } from "framer-motion";
import { Shield, AlertTriangle, TrendingDown, Pause, Activity, Ban, Clock, Zap } from "lucide-react";

interface RiskState {
  level: "green" | "yellow" | "red";
  label: string;
  message: string;
}

const RiskMeter = () => {
  // Simulated dynamic risk state
  const currentDD = 4.2;
  const maxDD = 10;
  const dailyLoss = 2.8;
  const maxDailyLoss = 5;
  const consecLosses = 1;
  const maxConsecLosses = 3;
  const portfolioExposure = 3.2;
  const maxExposure = 5;

  const getRiskState = (): RiskState => {
    const ddRatio = currentDD / maxDD;
    const dailyRatio = dailyLoss / maxDailyLoss;
    if (ddRatio > 0.8 || dailyRatio > 0.8 || consecLosses >= maxConsecLosses) {
      return { level: "red", label: "CRITICAL", message: "Risk limits approaching — reduce exposure immediately" };
    }
    if (ddRatio > 0.5 || dailyRatio > 0.5 || consecLosses >= 2) {
      return { level: "yellow", label: "CAUTION", message: "Elevated risk — position sizing auto-reduced" };
    }
    return { level: "green", label: "SAFE", message: "All risk parameters within optimal range" };
  };

  const risk = getRiskState();

  const levelColors = {
    green: { bg: "bg-success/10", text: "text-success", border: "border-success/30", glow: "shadow-[0_0_20px_hsl(142_71%_45%/0.2)]" },
    yellow: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/30", glow: "shadow-[0_0_20px_hsl(38_92%_50%/0.2)]" },
    red: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/30", glow: "shadow-[0_0_20px_hsl(0_72%_51%/0.2)]" },
  };

  const c = levelColors[risk.level];

  const metrics = [
    { icon: TrendingDown, label: "Drawdown", value: `${currentDD}%`, max: `${maxDD}%`, pct: (currentDD / maxDD) * 100 },
    { icon: AlertTriangle, label: "Daily Loss", value: `${dailyLoss}%`, max: `${maxDailyLoss}%`, pct: (dailyLoss / maxDailyLoss) * 100 },
    { icon: Ban, label: "Consec. Losses", value: `${consecLosses}`, max: `${maxConsecLosses}`, pct: (consecLosses / maxConsecLosses) * 100 },
    { icon: Activity, label: "Portfolio Exposure", value: `${portfolioExposure}%`, max: `${maxExposure}%`, pct: (portfolioExposure / maxExposure) * 100 },
  ];

  const protections = [
    { icon: Shield, label: "Dynamic Position Sizing", status: "Active", active: true },
    { icon: Zap, label: "Kelly Criterion Adjust", status: "Enabled", active: true },
    { icon: Pause, label: "Auto Pause (3 losses)", status: `${consecLosses}/${maxConsecLosses}`, active: consecLosses < maxConsecLosses },
    { icon: Clock, label: "News Event Pause", status: "Armed", active: true },
    { icon: TrendingDown, label: "Circuit Breaker", status: `${currentDD}%/${maxDD}%`, active: currentDD < maxDD * 0.8 },
    { icon: AlertTriangle, label: "Equity-Based Scaling", status: "Active", active: true },
  ];

  const getBarColor = (pct: number) => {
    if (pct >= 80) return "bg-destructive";
    if (pct >= 50) return "bg-warning";
    return "bg-success";
  };

  return (
    <div className="space-y-4">
      {/* Live Risk Meter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-card rounded-xl p-4 border ${c.border} ${c.glow}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}>
              <Shield className={`w-5 h-5 ${c.text}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Live Risk Meter</p>
              <p className={`text-lg font-bold ${c.text}`}>{risk.label}</p>
            </div>
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`w-4 h-4 rounded-full ${risk.level === "green" ? "bg-success" : risk.level === "yellow" ? "bg-warning" : "bg-destructive"}`}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mb-3">{risk.message}</p>

        {/* Risk gauge bars */}
        <div className="space-y-2">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <m.icon className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{m.label}</span>
                </div>
                <span className="text-[10px] font-mono text-foreground">{m.value} / {m.max}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(m.pct, 100)}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className={`h-full rounded-full ${getBarColor(m.pct)}`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Protection Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card gold-border rounded-xl p-4"
      >
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Risk Protections</p>
        <div className="space-y-2">
          {protections.map((p, i) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30"
            >
              <div className="flex items-center gap-2">
                <p.icon className={`w-3.5 h-3.5 ${p.active ? "text-success" : "text-destructive"}`} />
                <span className="text-xs text-foreground">{p.label}</span>
              </div>
              <span className={`text-[10px] font-mono ${p.active ? "text-success" : "text-destructive"}`}>{p.status}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default RiskMeter;

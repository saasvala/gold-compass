import { motion } from "framer-motion";
import { Target, TrendingUp, TrendingDown, Layers, BarChart, Crosshair, ArrowRightLeft, Zap } from "lucide-react";

const strategies = [
  { icon: TrendingUp, name: "Break of Structure", desc: "BOS detection on H1/H4", active: true },
  { icon: ArrowRightLeft, name: "Change of Character", desc: "CHoCH confirmation", active: true },
  { icon: Target, name: "Liquidity Sweeps", desc: "Equal highs/lows scan", active: true },
  { icon: Layers, name: "Order Blocks", desc: "Last opposite candle", active: true },
  { icon: BarChart, name: "Fair Value Gaps", desc: "FVG zone detection", active: false },
  { icon: Crosshair, name: "Premium/Discount", desc: "50% equilibrium zone", active: true },
];

const timeframes = [
  { tf: "H4", role: "Structure", active: true },
  { tf: "H1", role: "Confirm", active: true },
  { tf: "M15", role: "Setup", active: true },
  { tf: "M5", role: "Entry", active: true },
];

const StrategyTab = () => (
  <div className="space-y-4">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card gold-border rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Multi-Timeframe Analysis</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {timeframes.map((t) => (
          <div key={t.tf} className={`text-center p-3 rounded-xl ${
            t.active ? "gold-border gold-glow bg-primary/5" : "bg-secondary/30"
          }`}>
            <p className={`text-lg font-bold font-mono ${t.active ? "gold-text" : "text-muted-foreground"}`}>{t.tf}</p>
            <p className="text-[9px] text-muted-foreground uppercase">{t.role}</p>
          </div>
        ))}
      </div>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card gold-border rounded-xl p-4"
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Smart Money Modules</p>
      <div className="space-y-2">
        {strategies.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between p-3 rounded-xl bg-secondary/30"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                s.active ? "gold-gradient" : "bg-muted"
              }`}>
                <s.icon className={`w-4 h-4 ${s.active ? "text-primary-foreground" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{s.name}</p>
                <p className="text-[10px] text-muted-foreground">{s.desc}</p>
              </div>
            </div>
            <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
              s.active ? "gold-gradient" : "bg-muted"
            }`}>
              <div className={`w-4 h-4 rounded-full bg-background transition-transform ${
                s.active ? "translate-x-5" : "translate-x-0"
              }`} />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  </div>
);

export default StrategyTab;

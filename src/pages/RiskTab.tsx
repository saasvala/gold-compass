import { motion } from "framer-motion";
import { Shield, AlertTriangle, Lock, Gauge, Ban, Clock } from "lucide-react";

const riskParams = [
  { icon: Shield, label: "Risk Per Trade", value: "1.0%", max: "2%" },
  { icon: AlertTriangle, label: "Max Daily Loss", value: "2.8%", max: "5%" },
  { icon: Gauge, label: "Max Drawdown", value: "4.2%", max: "10%" },
  { icon: Lock, label: "Daily Trades", value: "3/5", max: "5" },
  { icon: Ban, label: "Consecutive Losses", value: "1/3", max: "3" },
  { icon: Clock, label: "Weekly Loss", value: "3.1%", max: "8%" },
];

const RiskTab = () => (
  <div className="space-y-4">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card gold-border rounded-xl p-4 gold-glow"
    >
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Risk Engine Status</p>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold gold-text">SAFE</span>
        <span className="text-xs font-mono text-success bg-success/10 px-3 py-1 rounded-full">All Systems OK</span>
      </div>
      <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "42%" }}
          transition={{ duration: 1, delay: 0.3 }}
          className="h-full rounded-full gold-gradient"
        />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">Drawdown: 4.2% / 10% max</p>
    </motion.div>

    <div className="space-y-2">
      {riskParams.map((param, i) => (
        <motion.div
          key={param.label}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass-card gold-border rounded-xl p-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <param.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">{param.label}</p>
              <p className="text-[10px] text-muted-foreground">Max: {param.max}</p>
            </div>
          </div>
          <span className="text-sm font-bold font-mono gold-text">{param.value}</span>
        </motion.div>
      ))}
    </div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card rounded-xl p-4 border border-destructive/30"
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <p className="text-xs font-semibold text-destructive">Emergency Kill Switch</p>
      </div>
      <p className="text-[10px] text-muted-foreground mb-3">Instantly close all positions and halt trading</p>
      <motion.button
        whileTap={{ scale: 0.95 }}
        className="w-full py-2.5 rounded-xl bg-destructive/20 border border-destructive/40 text-destructive text-xs font-bold uppercase tracking-wider"
      >
        Activate Kill Switch
      </motion.button>
    </motion.div>
  </div>
);

export default RiskTab;

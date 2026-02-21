import { motion } from "framer-motion";
import { TradingMode } from "@/lib/modes";
import { Crosshair, Clock, ShieldAlert, Target } from "lucide-react";

interface ModeStatsProps {
  mode: TradingMode;
}

const ModeStats = ({ mode }: ModeStatsProps) => {
  const stats = [
    { icon: Crosshair, label: "Risk/Trade", value: mode.risk },
    { icon: Target, label: "Target RR", value: mode.rr },
    { icon: Clock, label: "Max Trades", value: mode.maxTrades },
    { icon: ShieldAlert, label: "Max DD", value: mode.maxDD },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-4 gap-2"
    >
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="glass-card gold-border rounded-xl p-2.5 text-center"
        >
          <s.icon className="w-3 h-3 text-primary mx-auto mb-1" />
          <p className="text-[8px] text-muted-foreground uppercase">{s.label}</p>
          <p className="text-[11px] font-bold font-mono gold-text">{s.value}</p>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ModeStats;

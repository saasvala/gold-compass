import { motion } from "framer-motion";
import { useMemo } from "react";

const MiniChart = () => {
  const bars = useMemo(() => 
    Array.from({ length: 30 }, (_, i) => ({
      height: 20 + Math.random() * 60,
      up: Math.random() > 0.45,
    })), []
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="glass-card gold-border rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">XAUUSD Performance</p>
          <p className="text-lg font-bold font-mono gold-text">$2,647.35</p>
        </div>
        <span className="text-xs font-mono text-success">+1.24%</span>
      </div>
      <div className="flex items-end gap-[2px] h-16">
        {bars.map((bar, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: bar.height + "%" }}
            transition={{ duration: 0.5, delay: i * 0.02 }}
            className={`flex-1 rounded-sm ${bar.up ? "bg-success/70" : "bg-destructive/70"}`}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default MiniChart;

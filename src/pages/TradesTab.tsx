import { motion } from "framer-motion";
import TradeCard from "@/components/dashboard/TradeCard";
import { Filter } from "lucide-react";

const trades = [
  { type: "BUY" as const, entry: "2641.50", sl: "2635.20", tp: "2654.10", profit: "+$128.40", time: "14:32" },
  { type: "SELL" as const, entry: "2658.80", sl: "2665.40", tp: "2645.60", profit: "+$92.10", time: "11:05" },
  { type: "BUY" as const, entry: "2632.10", sl: "2626.80", tp: "2643.50", profit: "-$34.20", time: "09:18" },
  { type: "SELL" as const, entry: "2670.30", sl: "2676.90", tp: "2657.10", profit: "+$156.00", time: "Yesterday" },
  { type: "BUY" as const, entry: "2615.40", sl: "2609.10", tp: "2628.00", profit: "+$78.50", time: "Yesterday" },
];

const TradesTab = () => (
  <div className="space-y-4">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-between"
    >
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Recent Trades</p>
        <p className="text-lg font-bold gold-text">5 Trades Today</p>
      </div>
      <button className="glass-card gold-border rounded-lg p-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
      </button>
    </motion.div>

    <div className="grid grid-cols-3 gap-2">
      {[
        { label: "Win Rate", value: "68%", color: "text-success" },
        { label: "Avg RR", value: "1:2.4", color: "gold-text" },
        { label: "Net P/L", value: "+$420", color: "text-success" },
      ].map((stat) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card gold-border rounded-xl p-3 text-center"
        >
          <p className="text-[9px] text-muted-foreground uppercase">{stat.label}</p>
          <p className={`text-sm font-bold font-mono ${stat.color}`}>{stat.value}</p>
        </motion.div>
      ))}
    </div>

    <div className="space-y-3">
      {trades.map((trade, i) => (
        <TradeCard key={i} {...trade} delay={i * 0.08} />
      ))}
    </div>
  </div>
);

export default TradesTab;

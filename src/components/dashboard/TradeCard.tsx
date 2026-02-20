import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface TradeCardProps {
  type: "BUY" | "SELL";
  entry: string;
  sl: string;
  tp: string;
  profit: string;
  time: string;
  delay?: number;
}

const TradeCard = ({ type, entry, sl, tp, profit, time, delay = 0 }: TradeCardProps) => {
  const isBuy = type === "BUY";
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card gold-border rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isBuy ? "bg-success/20" : "bg-destructive/20"
          }`}>
            {isBuy ? (
              <ArrowUpRight className="w-4 h-4 text-success" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-destructive" />
            )}
          </div>
          <div>
            <span className={`text-xs font-bold ${isBuy ? "text-success" : "text-destructive"}`}>{type}</span>
            <p className="text-[10px] text-muted-foreground">XAUUSD</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold font-mono ${
            profit.startsWith("+") ? "text-success" : "text-destructive"
          }`}>{profit}</p>
          <p className="text-[10px] text-muted-foreground">{time}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Entry", val: entry },
          { label: "SL", val: sl },
          { label: "TP", val: tp },
        ].map((item) => (
          <div key={item.label} className="bg-secondary/50 rounded-lg py-1.5">
            <p className="text-[9px] text-muted-foreground uppercase">{item.label}</p>
            <p className="text-[11px] font-mono text-foreground">{item.val}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default TradeCard;

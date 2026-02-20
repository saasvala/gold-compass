import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  delay?: number;
}

const MetricCard = ({ icon: Icon, label, value, subValue, trend, delay = 0 }: MetricCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card gold-border rounded-xl p-4 relative overflow-hidden"
    >
      <div className="absolute inset-0 shimmer pointer-events-none" />
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg gold-gradient flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold font-mono gold-text">{value}</p>
      {subValue && (
        <p className={`text-xs font-mono mt-1 ${
          trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"
        }`}>
          {trend === "up" ? "▲" : trend === "down" ? "▼" : ""} {subValue}
        </p>
      )}
    </motion.div>
  );
};

export default MetricCard;

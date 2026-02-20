import { motion } from "framer-motion";
import { Brain, TrendingUp, BarChart3, Zap, Shield } from "lucide-react";

const AIMarketMode = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.4 }}
    className="glass-card gold-border rounded-xl p-4 relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
        <Brain className="w-4 h-4 text-primary-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">AI Classifier</p>
        <p className="text-sm font-bold gold-text">Trending Market</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      {[
        { icon: TrendingUp, label: "ADX", value: "38.5", status: "Strong" },
        { icon: BarChart3, label: "ATR", value: "12.4", status: "Normal" },
        { icon: Zap, label: "Volatility", value: "Medium", status: "" },
        { icon: Shield, label: "Spread", value: "2.1", status: "OK" },
      ].map((item) => (
        <div key={item.label} className="bg-secondary/30 rounded-lg p-2 flex items-center gap-2">
          <item.icon className="w-3 h-3 text-primary" />
          <div>
            <p className="text-[9px] text-muted-foreground">{item.label}</p>
            <p className="text-[11px] font-mono text-foreground">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  </motion.div>
);

export default AIMarketMode;

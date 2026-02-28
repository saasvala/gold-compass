import { motion } from "framer-motion";
import { Brain, Target, Clock, TrendingUp, Activity, Gauge, BarChart3, Zap, AlertTriangle } from "lucide-react";

const IntelligenceDashboard = () => {
  const botMetrics = [
    { name: "Gold Bot", confidence: 82, accuracy: 68, avgRR: 2.1, latency: 12, slippage: 0.3 },
    { name: "Forex Majors", confidence: 75, accuracy: 62, avgRR: 1.8, latency: 18, slippage: 0.5 },
    { name: "Crypto Trend", confidence: 71, accuracy: 59, avgRR: 2.4, latency: 45, slippage: 1.2 },
    { name: "NASDAQ Bot", confidence: 88, accuracy: 72, avgRR: 1.6, latency: 8, slippage: 0.2 },
  ];

  const executionStats = {
    avgLatency: 21,
    avgSlippage: 0.55,
    fillRate: 97.2,
    requoteRate: 1.8,
    partialFills: 3,
  };

  const volatilityIndex = 42;
  const volLevel = volatilityIndex > 70 ? "HIGH" : volatilityIndex > 40 ? "MEDIUM" : "LOW";
  const volColor = volatilityIndex > 70 ? "text-destructive" : volatilityIndex > 40 ? "text-warning" : "text-success";

  const getConfColor = (v: number) => v >= 80 ? "text-success" : v >= 60 ? "text-warning" : "text-destructive";
  const getBarColor = (v: number) => v >= 80 ? "bg-success" : v >= 60 ? "bg-warning" : "bg-destructive";

  return (
    <div className="space-y-4">
      {/* Volatility Index */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card gold-border rounded-xl p-4 gold-glow"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Real-Time Volatility Index</p>
              <p className={`text-sm font-bold ${volColor}`}>{volLevel} VOLATILITY</p>
            </div>
          </div>
          <p className={`text-2xl font-bold font-mono ${volColor}`}>{volatilityIndex}</p>
        </div>
        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${volatilityIndex}%` }}
            transition={{ duration: 1 }}
            className={`h-full rounded-full ${getBarColor(volatilityIndex)}`}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[8px] text-success">LOW</span>
          <span className="text-[8px] text-warning">MEDIUM</span>
          <span className="text-[8px] text-destructive">HIGH</span>
        </div>
      </motion.div>

      {/* Bot AI Confidence */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card gold-border rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">AI Confidence Per Bot</p>
        </div>
        <div className="space-y-3">
          {botMetrics.map((bot, i) => (
            <motion.div
              key={bot.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg bg-secondary/30 p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-foreground">{bot.name}</span>
                <span className={`text-xs font-bold font-mono ${getConfColor(bot.confidence)}`}>{bot.confidence}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${bot.confidence}%` }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className={`h-full rounded-full ${getBarColor(bot.confidence)}`}
                />
              </div>
              <div className="grid grid-cols-4 gap-1">
                <div className="text-center">
                  <p className="text-[8px] text-muted-foreground">Accuracy</p>
                  <p className="text-[10px] font-mono text-foreground">{bot.accuracy}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] text-muted-foreground">Avg RR</p>
                  <p className="text-[10px] font-mono gold-text">1:{bot.avgRR}</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] text-muted-foreground">Latency</p>
                  <p className="text-[10px] font-mono text-foreground">{bot.latency}ms</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] text-muted-foreground">Slippage</p>
                  <p className="text-[10px] font-mono text-foreground">{bot.slippage}p</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Execution Quality */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card gold-border rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Gauge className="w-4 h-4 text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Execution Quality</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Clock, label: "Avg Latency", value: `${executionStats.avgLatency}ms`, good: executionStats.avgLatency < 50 },
            { icon: TrendingUp, label: "Fill Rate", value: `${executionStats.fillRate}%`, good: executionStats.fillRate > 95 },
            { icon: Zap, label: "Avg Slippage", value: `${executionStats.avgSlippage}p`, good: executionStats.avgSlippage < 1 },
            { icon: AlertTriangle, label: "Requote Rate", value: `${executionStats.requoteRate}%`, good: executionStats.requoteRate < 3 },
          ].map(stat => (
            <div key={stat.label} className="bg-secondary/30 rounded-lg p-3 flex items-center gap-2">
              <stat.icon className={`w-3.5 h-3.5 ${stat.good ? "text-success" : "text-warning"}`} />
              <div>
                <p className="text-[9px] text-muted-foreground">{stat.label}</p>
                <p className={`text-xs font-mono font-semibold ${stat.good ? "text-success" : "text-warning"}`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Risk Exposure Graph */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card gold-border rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Risk Exposure by Asset</p>
        </div>
        <div className="space-y-2">
          {[
            { asset: "XAUUSD", exposure: 35 },
            { asset: "EUR/USD", exposure: 20 },
            { asset: "BTC/USDT", exposure: 15 },
            { asset: "NQ", exposure: 18 },
            { asset: "Other", exposure: 12 },
          ].map((item, i) => (
            <div key={item.asset}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-foreground">{item.asset}</span>
                <span className="text-[10px] font-mono text-muted-foreground">{item.exposure}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.exposure}%` }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className="h-full rounded-full gold-gradient"
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default IntelligenceDashboard;

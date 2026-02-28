import { motion } from "framer-motion";
import { Brain, TrendingUp, Activity, BarChart3, Zap, Target, CheckCircle2, XCircle } from "lucide-react";

interface SignalLayer {
  name: string;
  icon: any;
  score: number;
  status: "pass" | "fail" | "weak";
  detail: string;
}

const SignalConfidence = () => {
  // Simulated multi-layer confirmation data
  const layers: SignalLayer[] = [
    { name: "Trend Detection", icon: TrendingUp, score: 88, status: "pass", detail: "EMA 50/200 bullish cross · HH/HL confirmed" },
    { name: "Momentum", icon: Activity, score: 72, status: "pass", detail: "RSI bullish divergence · MACD slope positive" },
    { name: "Volatility Filter", icon: BarChart3, score: 65, status: "weak", detail: "ATR normal · No low-liquidity zone" },
    { name: "Volume Confirm", icon: Zap, score: 81, status: "pass", detail: "Volume spike +42% · Order flow imbalance detected" },
    { name: "AI Probability", icon: Brain, score: 78, status: "pass", detail: "LSTM forecast: bullish · Confidence 78%" },
  ];

  const overallConfidence = Math.round(layers.reduce((sum, l) => sum + l.score, 0) / layers.length);
  const threshold = 65;
  const signalApproved = overallConfidence >= threshold;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-warning";
    return "bg-destructive";
  };

  const getStatusIcon = (status: string) => {
    if (status === "pass") return <CheckCircle2 className="w-3 h-3 text-success" />;
    if (status === "weak") return <Target className="w-3 h-3 text-warning" />;
    return <XCircle className="w-3 h-3 text-destructive" />;
  };

  return (
    <div className="space-y-4">
      {/* Overall Confidence Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card gold-border rounded-xl p-4 gold-glow"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Smart Accuracy Engine</p>
              <p className="text-[10px] text-muted-foreground">5-Layer Signal Confirmation</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold font-mono ${getScoreColor(overallConfidence)}`}>{overallConfidence}%</p>
            <p className="text-[9px] text-muted-foreground">Confidence</p>
          </div>
        </div>

        {/* Confidence ring */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallConfidence}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className={`h-full rounded-full ${getBarColor(overallConfidence)}`}
            />
          </div>
          <span className="text-[9px] font-mono text-muted-foreground">Threshold: {threshold}%</span>
        </div>

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${signalApproved ? "bg-success/10" : "bg-destructive/10"}`}>
          {signalApproved ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-destructive" />
          )}
          <span className={`text-[10px] font-semibold ${signalApproved ? "text-success" : "text-destructive"}`}>
            {signalApproved ? "Signal Approved — Execute Trade" : "Signal Rejected — Below Threshold"}
          </span>
        </div>
      </motion.div>

      {/* Individual Layers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card gold-border rounded-xl p-4"
      >
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Confirmation Layers</p>
        <div className="space-y-2.5">
          {layers.map((layer, i) => (
            <motion.div
              key={layer.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-lg bg-secondary/30 p-3"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center">
                    <layer.icon className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{layer.name}</span>
                  {getStatusIcon(layer.status)}
                </div>
                <span className={`text-xs font-bold font-mono ${getScoreColor(layer.score)}`}>{layer.score}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden mb-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${layer.score}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className={`h-full rounded-full ${getBarColor(layer.score)}`}
                />
              </div>
              <p className="text-[9px] text-muted-foreground">{layer.detail}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Trade Entry Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card gold-border rounded-xl p-4"
      >
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Latest Signal Log</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Direction", value: "LONG", color: "text-success" },
            { label: "Entry Reason", value: "BOS + OB Retest", color: "text-foreground" },
            { label: "R:R Ratio", value: "1:2.8", color: "gold-text" },
            { label: "Expected Value", value: "+$168", color: "text-success" },
            { label: "Risk USD", value: "$60", color: "text-warning" },
            { label: "Spread", value: "2.1 pips", color: "text-foreground" },
          ].map(item => (
            <div key={item.label} className="bg-secondary/30 rounded-lg p-2">
              <p className="text-[9px] text-muted-foreground">{item.label}</p>
              <p className={`text-xs font-mono font-semibold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default SignalConfidence;

import { motion } from "framer-motion";
import { Target, TrendingUp, TrendingDown, Layers, BarChart, Crosshair, ArrowRightLeft, Zap, Activity, Gauge } from "lucide-react";
import { TradingMode } from "@/lib/modes";
import SignalConfidence from "@/components/dashboard/SignalConfidence";

const modeStrategies: Record<string, { name: string; desc: string; icon: any; active: boolean }[]> = {
  aggressive: [
    { icon: TrendingUp, name: "EMA 20/50 Crossover", desc: "Fast momentum entry", active: true },
    { icon: Activity, name: "RSI Momentum", desc: "Overbought/oversold filter", active: true },
    { icon: Gauge, name: "ATR Volatility", desc: "Threshold-based filter", active: true },
    { icon: Zap, name: "Spread Cap", desc: "Max spread limit", active: true },
  ],
  propfirm: [
    { icon: TrendingUp, name: "Break of Structure", desc: "BOS H1 detection", active: true },
    { icon: ArrowRightLeft, name: "Liquidity Sweep", desc: "Equal highs/lows", active: true },
    { icon: Layers, name: "Order Block Retest", desc: "Confirmation entry", active: true },
    { icon: Target, name: "News Filter", desc: "CPI/NFP/FOMC pause", active: true },
  ],
  adaptive: [
    { icon: TrendingUp, name: "BOS + Sweep", desc: "Structure + liquidity", active: true },
    { icon: Layers, name: "Order Block Retest", desc: "Entry confirmation", active: true },
    { icon: Activity, name: "ADX Classifier", desc: "Trend vs range detect", active: true },
    { icon: Gauge, name: "ATR Expansion", desc: "Volatility detection", active: true },
    { icon: Zap, name: "Auto RR Adjust", desc: "1:1.5 range, 1:3 trend", active: true },
  ],
  hedgefund: [
    { icon: TrendingUp, name: "Multi-TF Bias", desc: "H4 directional bias", active: true },
    { icon: ArrowRightLeft, name: "Structure Confirm", desc: "H1 BOS/CHoCH", active: true },
    { icon: Layers, name: "M15 Confirmation", desc: "Setup validation", active: true },
    { icon: Target, name: "M5 Trigger", desc: "Precise entry", active: true },
    { icon: Gauge, name: "Equity Curve Prot.", desc: "Auto lot reduction", active: true },
    { icon: BarChart, name: "Risk Scaling", desc: "Profit streak sizing", active: true },
  ],
  institutional: [
    { icon: TrendingUp, name: "Break of Structure", desc: "BOS detection on H1/H4", active: true },
    { icon: ArrowRightLeft, name: "Change of Character", desc: "CHoCH confirmation", active: true },
    { icon: Target, name: "Liquidity Sweeps", desc: "Equal highs/lows scan", active: true },
    { icon: Layers, name: "Order Blocks", desc: "Last opposite candle", active: true },
    { icon: BarChart, name: "Fair Value Gaps", desc: "FVG zone detection", active: false },
    { icon: Crosshair, name: "Premium/Discount", desc: "50% equilibrium zone", active: true },
  ],
};

const StrategyTab = ({ mode }: { mode: TradingMode }) => {
  const strategies = modeStrategies[mode.id] || modeStrategies.institutional;

  return (
    <div className="space-y-4">
      <SignalConfidence />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card gold-border rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Timeframes · {mode.shortName}</p>
        </div>
        <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${mode.timeframes.length}, 1fr)` }}>
          {mode.timeframes.map((tf, i) => {
            const roles = ["Structure", "Confirm", "Setup", "Entry"];
            return (
              <div key={tf} className="text-center p-3 rounded-xl gold-border gold-glow bg-primary/5">
                <p className="text-lg font-bold font-mono gold-text">{tf}</p>
                <p className="text-[9px] text-muted-foreground uppercase">{roles[i] || "Filter"}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card gold-border rounded-xl p-4"
      >
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
          {mode.name} Modules
        </p>
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
};

export default StrategyTab;

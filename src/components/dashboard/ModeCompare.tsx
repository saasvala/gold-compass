import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TRADING_MODES, TradingMode } from "@/lib/modes";
import { Layers, X, Shield, Target, Clock, AlertTriangle, Crosshair, Check } from "lucide-react";

interface ModeCompareProps {
  open: boolean;
  onClose: () => void;
  activeMode: TradingMode;
  onSelect: (mode: TradingMode) => void;
}

const metrics = [
  { key: "risk", label: "Risk/Trade", icon: Crosshair },
  { key: "rr", label: "Target RR", icon: Target },
  { key: "maxTrades", label: "Max Trades", icon: Clock },
  { key: "dailyLoss", label: "Daily Loss", icon: AlertTriangle },
  { key: "maxDD", label: "Max DD", icon: Shield },
] as const;

const ModeCompare = ({ open, onClose, activeMode, onSelect }: ModeCompareProps) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-end justify-center"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/70 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="relative w-full max-w-md glass-card border-t border-border rounded-t-2xl max-h-[92vh] overflow-hidden flex flex-col"
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mt-3 mb-2 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                  <Layers className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Mode Comparison</p>
                  <p className="text-[10px] text-muted-foreground">Compare all 5 trading modes</p>
                </div>
              </div>
              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.9, rotate: 90 }}
                className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto px-5 pb-8 flex-1">
              {/* Mode Cards - Horizontal scroll */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1 scrollbar-none">
                {TRADING_MODES.map((mode, i) => {
                  const MIcon = mode.icon;
                  const isActive = mode.id === activeMode.id;
                  const isSelected = selectedIdx === i;
                  return (
                    <motion.button
                      key={mode.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, type: "spring", stiffness: 300 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedIdx(isSelected ? null : i)}
                      className={`shrink-0 w-[72px] flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all border ${
                        isSelected
                          ? "gold-border gold-glow bg-primary/10"
                          : isActive
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-secondary/30"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        isSelected ? "gold-gradient gold-glow-strong" : isActive ? "gold-gradient" : "bg-secondary"
                      }`}>
                        <MIcon className={`w-5 h-5 ${isSelected || isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      </div>
                      <p className={`text-[9px] font-bold text-center leading-tight ${
                        isSelected ? "gold-text" : isActive ? "text-primary" : "text-muted-foreground"
                      }`}>
                        {mode.shortName}
                      </p>
                      {isActive && (
                        <span className="text-[7px] font-bold uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Comparison Table */}
              <div className="space-y-2">
                {metrics.map((metric, mi) => (
                  <motion.div
                    key={metric.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + mi * 0.05 }}
                    className="glass-card gold-border rounded-xl p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <metric.icon className="w-3 h-3 text-primary" />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{metric.label}</p>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {TRADING_MODES.map((mode, i) => {
                        const isActive = mode.id === activeMode.id;
                        const isSelected = selectedIdx === i;
                        const val = mode[metric.key];
                        return (
                          <motion.div
                            key={mode.id}
                            whileHover={{ scale: 1.05 }}
                            className={`text-center py-2 px-1 rounded-lg transition-all ${
                              isSelected
                                ? "gold-border bg-primary/10 gold-glow"
                                : isActive
                                ? "bg-primary/5 border border-primary/20"
                                : "bg-secondary/40"
                            }`}
                          >
                            <p className={`text-[10px] font-bold font-mono ${
                              isSelected ? "gold-text" : isActive ? "text-primary" : "text-foreground"
                            }`}>
                              {val}
                            </p>
                            <p className="text-[7px] text-muted-foreground mt-0.5">{mode.shortName}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Timeframes comparison */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card gold-border rounded-xl p-3 mt-2"
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Timeframes</p>
                <div className="space-y-2">
                  {TRADING_MODES.map((mode, i) => {
                    const MIcon = mode.icon;
                    const isActive = mode.id === activeMode.id;
                    const isSelected = selectedIdx === i;
                    return (
                      <div
                        key={mode.id}
                        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg transition-all ${
                          isSelected ? "bg-primary/10 gold-border" : isActive ? "bg-primary/5" : ""
                        }`}
                      >
                        <MIcon className={`w-3 h-3 ${isSelected || isActive ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-[10px] font-bold text-foreground w-12">{mode.shortName}</span>
                        <div className="flex gap-1 flex-1">
                          {mode.timeframes.map((tf) => (
                            <span
                              key={tf}
                              className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                isSelected
                                  ? "gold-gradient text-primary-foreground"
                                  : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              {tf}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Select button */}
              {selectedIdx !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      onSelect(TRADING_MODES[selectedIdx]);
                      onClose();
                    }}
                    className="w-full py-3.5 rounded-xl gold-gradient text-primary-foreground font-bold text-sm uppercase tracking-wider gold-glow-strong flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Switch to {TRADING_MODES[selectedIdx].name}
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModeCompare;

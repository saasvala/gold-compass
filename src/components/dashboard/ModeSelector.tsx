import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Zap } from "lucide-react";
import { TRADING_MODES, TradingMode } from "@/lib/modes";

interface ModeSelectorProps {
  activeMode: TradingMode;
  onModeChange: (mode: TradingMode) => void;
}

const ModeSelector = ({ activeMode, onModeChange }: ModeSelectorProps) => {
  const [open, setOpen] = useState(false);
  const Icon = activeMode.icon;

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(!open)}
        className="w-full glass-card gold-border rounded-xl p-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gold-gradient gold-glow flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="text-left">
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Active Mode</p>
            <p className="text-sm font-bold gold-text">{activeMode.name}</p>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-2 glass-card gold-border rounded-xl overflow-hidden shadow-2xl"
            style={{ transformOrigin: "top" }}
          >
            {TRADING_MODES.map((mode, i) => {
              const MIcon = mode.icon;
              const isActive = mode.id === activeMode.id;
              return (
                <motion.button
                  key={mode.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => { onModeChange(mode); setOpen(false); }}
                  className={`w-full flex items-center gap-3 p-3 transition-all ${
                    isActive ? "bg-primary/10" : "hover:bg-secondary/50"
                  } ${i < TRADING_MODES.length - 1 ? "border-b border-border/30" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive ? "gold-gradient" : "bg-secondary"
                  }`}>
                    <MIcon className={`w-4 h-4 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-xs font-bold ${isActive ? "gold-text" : "text-foreground"}`}>{mode.name}</p>
                    <p className="text-[9px] text-muted-foreground">{mode.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-muted-foreground">{mode.rr}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModeSelector;

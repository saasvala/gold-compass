import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, TrendingUp, TrendingDown, Target, ShieldAlert, X, ChevronDown } from "lucide-react";

interface TradeFormProps {
  open: boolean;
  onClose: () => void;
}

const TradeEntryForm = ({ open, onClose }: TradeFormProps) => {
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [entry, setEntry] = useState("2647.00");
  const [sl, setSl] = useState("2640.00");
  const [tp, setTp] = useState("2661.00");
  const [lotSize, setLotSize] = useState("0.10");
  const [riskPercent, setRiskPercent] = useState("1.0");

  const isBuy = direction === "BUY";

  const calc = useMemo(() => {
    const e = parseFloat(entry) || 0;
    const s = parseFloat(sl) || 0;
    const t = parseFloat(tp) || 0;
    const lot = parseFloat(lotSize) || 0;

    const slDist = Math.abs(e - s);
    const tpDist = Math.abs(t - e);
    const rr = slDist > 0 ? (tpDist / slDist) : 0;

    // Gold: 1 lot = 100 oz, pip = $0.01, so $1 move = $100/lot
    const riskUsd = slDist * 100 * lot;
    const rewardUsd = tpDist * 100 * lot;

    const valid = isBuy ? (s < e && t > e) : (s > e && t < e);

    return {
      rr: rr.toFixed(2),
      slPips: slDist.toFixed(2),
      tpPips: tpDist.toFixed(2),
      riskUsd: riskUsd.toFixed(2),
      rewardUsd: rewardUsd.toFixed(2),
      valid,
    };
  }, [entry, sl, tp, lotSize, isBuy]);

  const rrNum = parseFloat(calc.rr);
  const rrColor = rrNum >= 2 ? "text-success" : rrNum >= 1 ? "text-warning" : "text-destructive";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center"
        >
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="relative w-full max-w-md glass-card border-t border-border rounded-t-2xl p-5 pb-8 max-h-[90vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">New Trade</p>
                  <p className="text-[10px] text-muted-foreground">XAUUSD</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Direction Toggle */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {(["BUY", "SELL"] as const).map((dir) => {
                const active = direction === dir;
                const isDirBuy = dir === "BUY";
                return (
                  <motion.button
                    key={dir}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setDirection(dir)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                      active
                        ? isDirBuy
                          ? "bg-success/20 border border-success/50 text-success"
                          : "bg-destructive/20 border border-destructive/50 text-destructive"
                        : "bg-secondary/50 border border-border text-muted-foreground"
                    }`}
                  >
                    {isDirBuy ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {dir}
                  </motion.button>
                );
              })}
            </div>

            {/* Input Fields */}
            <div className="space-y-3 mb-5">
              <InputField label="Entry Price" value={entry} onChange={setEntry} icon={<ChevronDown className="w-3 h-3" />} />
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Stop Loss" value={sl} onChange={setSl} icon={<ShieldAlert className="w-3 h-3 text-destructive" />} />
                <InputField label="Take Profit" value={tp} onChange={setTp} icon={<Target className="w-3 h-3 text-success" />} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Lot Size" value={lotSize} onChange={setLotSize} step="0.01" />
                <InputField label="Risk %" value={riskPercent} onChange={setRiskPercent} step="0.1" suffix="%" />
              </div>
            </div>

            {/* Live RR Card */}
            <motion.div
              layout
              className="glass-card gold-border rounded-xl p-4 mb-5"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Risk / Reward</p>
                <span className={`text-xl font-bold font-mono ${rrColor}`}>
                  1 : {calc.rr}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-destructive/10 rounded-lg p-2.5 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase">Risk</p>
                  <p className="text-sm font-bold font-mono text-destructive">${calc.riskUsd}</p>
                  <p className="text-[9px] font-mono text-muted-foreground">{calc.slPips} pts</p>
                </div>
                <div className="bg-success/10 rounded-lg p-2.5 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase">Reward</p>
                  <p className="text-sm font-bold font-mono text-success">${calc.rewardUsd}</p>
                  <p className="text-[9px] font-mono text-muted-foreground">{calc.tpPips} pts</p>
                </div>
              </div>
              {/* RR Bar */}
              <div className="mt-3 flex h-2 rounded-full overflow-hidden bg-secondary">
                <div className="bg-destructive/70 rounded-l-full" style={{ width: `${Math.min(100 / (1 + rrNum), 100)}%` }} />
                <div className="bg-success/70 rounded-r-full" style={{ width: `${Math.min((rrNum * 100) / (1 + rrNum), 100)}%` }} />
              </div>
              {!calc.valid && (
                <p className="text-[10px] text-destructive mt-2 text-center">
                  ⚠ Invalid levels for {direction} direction
                </p>
              )}
            </motion.div>

            {/* Submit */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={!calc.valid}
              className={`w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
                calc.valid
                  ? isBuy
                    ? "bg-success/20 border border-success/50 text-success gold-glow"
                    : "bg-destructive/20 border border-destructive/50 text-destructive gold-glow"
                  : "bg-secondary text-muted-foreground opacity-50 cursor-not-allowed"
              }`}
            >
              Place {direction} Order
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const InputField = ({
  label, value, onChange, icon, step, suffix,
}: {
  label: string; value: string; onChange: (v: string) => void;
  icon?: React.ReactNode; step?: string; suffix?: string;
}) => (
  <div>
    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">{label}</label>
    <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-xl px-3 py-2.5 focus-within:border-primary/50 transition-colors">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <input
        type="number"
        step={step || "0.01"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm font-mono text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
    </div>
  </div>
);

export default TradeEntryForm;

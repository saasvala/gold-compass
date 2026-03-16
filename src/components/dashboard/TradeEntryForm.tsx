import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, TrendingUp, TrendingDown, Target, ShieldAlert, X, ChevronDown, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useOrders } from "@/hooks/use-orders";

interface TradeFormProps {
  open: boolean;
  onClose: () => void;
}

type ConfirmState = "idle" | "confirming" | "processing" | "success" | "error";

const TradeEntryForm = ({ open, onClose }: TradeFormProps) => {
  const { createOrder } = useOrders();
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [entry, setEntry] = useState("2647.00");
  const [sl, setSl] = useState("2640.00");
  const [tp, setTp] = useState("2661.00");
  const [lotSize, setLotSize] = useState("0.10");
  const [riskPercent, setRiskPercent] = useState("1.0");
  const [confirmState, setConfirmState] = useState<ConfirmState>("idle");

  const isBuy = direction === "BUY";

  const calc = useMemo(() => {
    const e = parseFloat(entry) || 0;
    const s = parseFloat(sl) || 0;
    const t = parseFloat(tp) || 0;
    const lot = parseFloat(lotSize) || 0;
    const slDist = Math.abs(e - s);
    const tpDist = Math.abs(t - e);
    const rr = slDist > 0 ? (tpDist / slDist) : 0;
    const riskUsd = slDist * 100 * lot;
    const rewardUsd = tpDist * 100 * lot;
    const valid = isBuy ? (s < e && t > e) : (s > e && t < e);
    return { rr: rr.toFixed(2), slPips: slDist.toFixed(2), tpPips: tpDist.toFixed(2), riskUsd: riskUsd.toFixed(2), rewardUsd: rewardUsd.toFixed(2), valid };
  }, [entry, sl, tp, lotSize, isBuy]);

  const rrNum = parseFloat(calc.rr);
  const rrColor = rrNum >= 2 ? "text-success" : rrNum >= 1 ? "text-warning" : "text-destructive";

  const playSound = useCallback((type: "success" | "error") => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === "success") {
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } else {
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        osc.frequency.setValueAtTime(220, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {}
  }, []);

  const handleSubmit = useCallback(() => {
    if (!calc.valid) return;
    setConfirmState("confirming");
  }, [calc.valid]);

  const [orderId, setOrderId] = useState<string | null>(null);

  const handleConfirm = useCallback(async () => {
    setConfirmState("processing");
    try {
      const result = await createOrder({
        symbol: "XAUUSD",
        side: direction.toLowerCase() as "buy" | "sell",
        order_type: "market",
        quantity: parseFloat(lotSize) || 0.1,
        price: parseFloat(entry) || undefined,
      });
      setOrderId(result?.order?.id || null);
      setConfirmState("success");
      playSound("success");
    } catch (err) {
      console.error("Order failed:", err);
      setConfirmState("error");
      playSound("error");
    }
  }, [createOrder, direction, lotSize, entry, playSound]);

  const handleReset = useCallback(() => {
    setConfirmState("idle");
  }, []);

  const handleDone = useCallback(() => {
    setConfirmState("idle");
    onClose();
  }, [onClose]);

  // Reset state when form opens
  useEffect(() => {
    if (open) setConfirmState("idle");
  }, [open]);

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
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={confirmState === "idle" ? onClose : undefined}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 400 }}
            className="relative w-full max-w-md glass-card border-t border-border rounded-t-2xl p-5 pb-8 max-h-[90vh] overflow-y-auto"
          >
            {/* Handle */}
            <motion.div
              className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4"
              whileHover={{ scaleX: 1.5 }}
            />

            {/* Confirmation Overlay */}
            <AnimatePresence mode="wait">
              {confirmState !== "idle" && (
                <motion.div
                  key={confirmState}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-t-2xl glass-card p-6"
                >
                  {confirmState === "confirming" && (
                    <ConfirmView
                      direction={direction}
                      entry={entry}
                      sl={sl}
                      tp={tp}
                      lotSize={lotSize}
                      rr={calc.rr}
                      riskUsd={calc.riskUsd}
                      rewardUsd={calc.rewardUsd}
                      onConfirm={handleConfirm}
                      onCancel={handleReset}
                    />
                  )}
                  {confirmState === "processing" && <ProcessingView direction={direction} />}
                  {confirmState === "success" && (
                    <ResultView
                      type="success"
                      direction={direction}
                      entry={entry}
                      lotSize={lotSize}
                      onDone={handleDone}
                      onAnother={handleReset}
                    />
                  )}
                  {confirmState === "error" && (
                    <ResultView
                      type="error"
                      direction={direction}
                      entry={entry}
                      lotSize={lotSize}
                      onDone={handleDone}
                      onAnother={handleReset}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center"
                  whileHover={{ rotate: 15 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Calculator className="w-4 h-4 text-primary-foreground" />
                </motion.div>
                <div>
                  <p className="text-sm font-bold text-foreground">New Trade</p>
                  <p className="text-[10px] text-muted-foreground">XAUUSD</p>
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

            {/* Direction Toggle */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {(["BUY", "SELL"] as const).map((dir) => {
                const active = direction === dir;
                const isDirBuy = dir === "BUY";
                return (
                  <motion.button
                    key={dir}
                    whileTap={{ scale: 0.95 }}
                    animate={active ? { scale: [1, 1.03, 1] } : {}}
                    transition={{ duration: 0.3 }}
                    onClick={() => setDirection(dir)}
                    className={`relative flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all overflow-hidden ${
                      active
                        ? isDirBuy
                          ? "bg-success/20 border border-success/50 text-success"
                          : "bg-destructive/20 border border-destructive/50 text-destructive"
                        : "bg-secondary/50 border border-border text-muted-foreground"
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="directionIndicator"
                        className={`absolute inset-0 ${isDirBuy ? "bg-success/5" : "bg-destructive/5"}`}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
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
            <motion.div layout className="glass-card gold-border rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Risk / Reward</p>
                <motion.span
                  key={calc.rr}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`text-xl font-bold font-mono ${rrColor}`}
                >
                  1 : {calc.rr}
                </motion.span>
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
              <div className="mt-3 flex h-2 rounded-full overflow-hidden bg-secondary">
                <motion.div
                  className="bg-destructive/70 rounded-l-full"
                  animate={{ width: `${Math.min(100 / (1 + rrNum), 100)}%` }}
                  transition={{ type: "spring", stiffness: 200 }}
                />
                <motion.div
                  className="bg-success/70 rounded-r-full"
                  animate={{ width: `${Math.min((rrNum * 100) / (1 + rrNum), 100)}%` }}
                  transition={{ type: "spring", stiffness: 200 }}
                />
              </div>
              {!calc.valid && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] text-destructive mt-2 text-center"
                >
                  ⚠ Invalid levels for {direction} direction
                </motion.p>
              )}
            </motion.div>

            {/* Submit */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={calc.valid ? { scale: 1.02 } : {}}
              onClick={handleSubmit}
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

/* ── Confirm View ── */
const ConfirmView = ({
  direction, entry, sl, tp, lotSize, rr, riskUsd, rewardUsd, onConfirm, onCancel,
}: {
  direction: string; entry: string; sl: string; tp: string; lotSize: string;
  rr: string; riskUsd: string; rewardUsd: string; onConfirm: () => void; onCancel: () => void;
}) => {
  const isBuy = direction === "BUY";
  return (
    <div className="w-full space-y-5">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 15, stiffness: 200 }}
        className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
          isBuy ? "bg-success/20 border border-success/40" : "bg-destructive/20 border border-destructive/40"
        }`}
      >
        {isBuy ? <TrendingUp className="w-8 h-8 text-success" /> : <TrendingDown className="w-8 h-8 text-destructive" />}
      </motion.div>

      <div className="text-center">
        <p className="text-lg font-bold text-foreground">Confirm {direction} Order</p>
        <p className="text-xs text-muted-foreground mt-1">XAUUSD · {lotSize} lots</p>
      </div>

      <div className="glass-card gold-border rounded-xl p-4 space-y-2">
        {[
          { label: "Entry", value: entry },
          { label: "Stop Loss", value: sl },
          { label: "Take Profit", value: tp },
          { label: "Risk / Reward", value: `1:${rr}` },
          { label: "Risk", value: `$${riskUsd}` },
          { label: "Potential", value: `$${rewardUsd}` },
        ].map((row, i) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i, type: "spring", stiffness: 300 }}
            className="flex items-center justify-between py-1"
          >
            <span className="text-xs text-muted-foreground">{row.label}</span>
            <span className="text-xs font-mono font-bold text-foreground">{row.value}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onCancel}
          className="py-3 rounded-xl bg-secondary border border-border text-muted-foreground text-sm font-bold"
        >
          Cancel
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={onConfirm}
          className={`py-3 rounded-xl font-bold text-sm uppercase gold-glow ${
            isBuy
              ? "bg-success/20 border border-success/50 text-success"
              : "bg-destructive/20 border border-destructive/50 text-destructive"
          }`}
        >
          Confirm
        </motion.button>
      </div>
    </div>
  );
};

/* ── Processing View ── */
const ProcessingView = ({ direction }: { direction: string }) => (
  <div className="flex flex-col items-center gap-6 py-12">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
      className="w-16 h-16 rounded-2xl gold-gradient gold-glow-strong flex items-center justify-center"
    >
      <Loader2 className="w-8 h-8 text-primary-foreground" />
    </motion.div>
    <div className="text-center">
      <p className="text-lg font-bold text-foreground">Processing Order</p>
      <p className="text-xs text-muted-foreground mt-1">Executing {direction} on XAUUSD...</p>
    </div>
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
          className="w-2 h-2 rounded-full gold-gradient"
        />
      ))}
    </div>
  </div>
);

/* ── Result View (Success/Error) ── */
const ResultView = ({
  type, direction, entry, lotSize, onDone, onAnother,
}: {
  type: "success" | "error"; direction: string; entry: string; lotSize: string;
  onDone: () => void; onAnother: () => void;
}) => {
  const isSuccess = type === "success";

  return (
    <div className="w-full flex flex-col items-center gap-5 py-6">
      {/* Animated icon with rings */}
      <div className="relative">
        {isSuccess && (
          <>
            <motion.div
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border-2 border-success/40"
            />
            <motion.div
              initial={{ scale: 0, opacity: 0.4 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.15 }}
              className="absolute inset-0 rounded-full border border-success/30"
            />
          </>
        )}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
          className={`w-20 h-20 rounded-full flex items-center justify-center ${
            isSuccess
              ? "bg-success/20 border-2 border-success/50"
              : "bg-destructive/20 border-2 border-destructive/50"
          }`}
        >
          {isSuccess ? (
            <motion.div
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
            >
              <CheckCircle2 className="w-10 h-10 text-success" />
            </motion.div>
          ) : (
            <XCircle className="w-10 h-10 text-destructive" />
          )}
        </motion.div>
      </div>

      {/* Particle burst for success */}
      {isSuccess && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * 360;
            const rad = (angle * Math.PI) / 180;
            return (
              <motion.div
                key={i}
                initial={{ x: "50%", y: "40%", opacity: 1, scale: 1 }}
                animate={{
                  x: `${50 + Math.cos(rad) * 40}%`,
                  y: `${40 + Math.sin(rad) * 35}%`,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.03, ease: "easeOut" }}
                className="absolute w-1.5 h-1.5 rounded-full gold-gradient"
              />
            );
          })}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <p className={`text-xl font-bold ${isSuccess ? "text-success" : "text-destructive"}`}>
          {isSuccess ? "Order Executed!" : "Order Failed"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {isSuccess
            ? `${direction} ${lotSize} lots @ ${entry}`
            : "Connection timeout. Please try again."
          }
        </p>
      </motion.div>

      {isSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-card gold-border rounded-xl p-3 w-full"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-muted-foreground uppercase">Order ID</p>
              <p className="text-xs font-mono text-foreground">#{(window as any).__lastOrderId || "------"}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground uppercase">Status</p>
              <p className="text-xs font-mono text-success">Filled</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-3 w-full mt-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onAnother}
          className="py-3 rounded-xl bg-secondary border border-border text-foreground text-sm font-bold"
        >
          {isSuccess ? "New Trade" : "Try Again"}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onDone}
          className="py-3 rounded-xl gold-gradient text-primary-foreground text-sm font-bold gold-glow"
        >
          Done
        </motion.button>
      </div>
    </div>
  );
};

/* ── Input Field ── */
const InputField = ({
  label, value, onChange, icon, step, suffix,
}: {
  label: string; value: string; onChange: (v: string) => void;
  icon?: React.ReactNode; step?: string; suffix?: string;
}) => (
  <div>
    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">{label}</label>
    <motion.div
      whileFocus={{ borderColor: "hsl(43 96% 56%)" }}
      className="flex items-center gap-2 bg-secondary/50 border border-border rounded-xl px-3 py-2.5 focus-within:border-primary/50 transition-all duration-200"
    >
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <input
        type="number"
        step={step || "0.01"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm font-mono text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
    </motion.div>
  </div>
);

export default TradeEntryForm;

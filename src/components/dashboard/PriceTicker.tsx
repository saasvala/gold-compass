import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

const PriceTicker = () => {
  const [price, setPrice] = useState(2647.35);
  const [prevPrice, setPrevPrice] = useState(2647.35);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrevPrice(price);
      const change = (Math.random() - 0.48) * 2.5;
      setPrice((p) => {
        const next = +(p + change).toFixed(2);
        setFlash(change >= 0 ? "up" : "down");
        setTimeout(() => setFlash(null), 600);
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [price]);

  const diff = +(price - 2641.0).toFixed(2);
  const pct = +((diff / 2641.0) * 100).toFixed(3);
  const isUp = diff >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="flex items-center justify-between px-4 py-2 border-b border-border/30 max-w-md mx-auto"
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">XAUUSD</span>
        <span className={`w-1.5 h-1.5 rounded-full ${isUp ? "bg-success" : "bg-destructive"} pulse-gold`} />
      </div>
      <div className="flex items-center gap-3">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={price}
            initial={{ y: isUp ? 8 : -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: isUp ? -8 : 8, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`text-sm font-bold font-mono transition-colors duration-300 ${
              flash === "up" ? "text-success" : flash === "down" ? "text-destructive" : "gold-text"
            }`}
          >
            {price.toFixed(2)}
          </motion.span>
        </AnimatePresence>
        <div className={`flex items-center gap-0.5 text-[10px] font-mono ${isUp ? "text-success" : "text-destructive"}`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{isUp ? "+" : ""}{diff.toFixed(2)} ({pct}%)</span>
        </div>
      </div>
    </motion.div>
  );
};

export default PriceTicker;

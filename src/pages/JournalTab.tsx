import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Plus, Star, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Heart, Brain, AlertTriangle, Flame, Shield, Zap, X, Check, ChevronDown,
} from "lucide-react";
import { TradingMode } from "@/lib/modes";

interface JournalEntry {
  id: string;
  direction: "BUY" | "SELL";
  entry: string;
  sl: string;
  tp: string;
  result: "win" | "loss" | "breakeven" | "open";
  profit: string;
  emotion: string;
  setup: string;
  notes: string;
  rating: number;
  date: string;
  mode: string;
}

const emotions = [
  { id: "confident", label: "Confident", icon: Shield, color: "text-success" },
  { id: "disciplined", label: "Disciplined", icon: Check, color: "text-primary" },
  { id: "neutral", label: "Neutral", icon: Brain, color: "text-muted-foreground" },
  { id: "fearful", label: "Fearful", icon: AlertTriangle, color: "text-warning" },
  { id: "greedy", label: "Greedy", icon: Flame, color: "text-destructive" },
  { id: "revenge", label: "Revenge", icon: Zap, color: "text-destructive" },
];

const mockEntries: JournalEntry[] = [
  {
    id: "1", direction: "BUY", entry: "2641.50", sl: "2635.20", tp: "2654.10",
    result: "win", profit: "+$128.40", emotion: "confident", setup: "BOS + OB Retest",
    notes: "Clean H1 BOS with M15 OB confirmation. Entry on M5 engulfing candle.",
    rating: 5, date: "Today 14:32", mode: "SMC",
  },
  {
    id: "2", direction: "SELL", entry: "2658.80", sl: "2665.40", tp: "2645.60",
    result: "win", profit: "+$92.10", emotion: "disciplined", setup: "Liquidity Sweep",
    notes: "Swept equal highs at 2660 resistance. CHoCH on M15 confirmed sell.",
    rating: 4, date: "Today 11:05", mode: "SMC",
  },
  {
    id: "3", direction: "BUY", entry: "2632.10", sl: "2626.80", tp: "2643.50",
    result: "loss", profit: "-$34.20", emotion: "fearful", setup: "FVG Entry",
    notes: "Entered FVG too early without H1 confirmation. Should have waited for sweep.",
    rating: 2, date: "Today 09:18", mode: "AI",
  },
  {
    id: "4", direction: "SELL", entry: "2670.30", sl: "2676.90", tp: "2657.10",
    result: "win", profit: "+$156.00", emotion: "confident", setup: "Premium Zone",
    notes: "Perfect premium zone rejection with M5 bearish engulfing. Held to TP.",
    rating: 5, date: "Yesterday", mode: "HEDGE",
  },
];

const JournalTab = ({ mode }: { mode: TradingMode }) => {
  const [entries] = useState<JournalEntry[]>(mockEntries);
  const [formOpen, setFormOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const stats = {
    total: entries.length,
    wins: entries.filter((e) => e.result === "win").length,
    losses: entries.filter((e) => e.result === "loss").length,
    avgRating: (entries.reduce((s, e) => s + e.rating, 0) / entries.length).toFixed(1),
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card gold-border rounded-xl p-4 gold-glow"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Trade Journal</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg gold-gradient text-primary-foreground text-[10px] font-bold uppercase"
          >
            <Plus className="w-3 h-3" /> Add Entry
          </motion.button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Total", value: stats.total.toString(), color: "gold-text" },
            { label: "Wins", value: stats.wins.toString(), color: "text-success" },
            { label: "Losses", value: stats.losses.toString(), color: "text-destructive" },
            { label: "Avg Rating", value: stats.avgRating, color: "gold-text" },
          ].map((s) => (
            <div key={s.label} className="text-center p-2 rounded-lg bg-secondary/30">
              <p className="text-[8px] text-muted-foreground uppercase">{s.label}</p>
              <p className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Entries */}
      <div className="space-y-3">
        {entries.map((entry, i) => {
          const isBuy = entry.direction === "BUY";
          const isExpanded = expandedId === entry.id;
          const emotionData = emotions.find((e) => e.id === entry.emotion);
          const EmotionIcon = emotionData?.icon || Brain;

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              className={`glass-card rounded-xl overflow-hidden cursor-pointer transition-all ${
                isExpanded ? "gold-border gold-glow" : "border border-border/30"
              }`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isBuy ? "bg-success/20" : "bg-destructive/20"
                    }`}>
                      {isBuy ? <ArrowUpRight className="w-4 h-4 text-success" /> : <ArrowDownRight className="w-4 h-4 text-destructive" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${isBuy ? "text-success" : "text-destructive"}`}>{entry.direction}</span>
                        <span className="text-[9px] text-muted-foreground">@ {entry.entry}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{entry.setup}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold font-mono ${
                      entry.result === "win" ? "text-success" : entry.result === "loss" ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      {entry.profit}
                    </p>
                    <p className="text-[9px] text-muted-foreground">{entry.date}</p>
                  </div>
                </div>

                {/* Rating + Emotion row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star
                        key={si}
                        className={`w-3 h-3 ${si < entry.rating ? "text-primary fill-primary" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] ${emotionData?.color || "text-muted-foreground"}`}>
                    <EmotionIcon className="w-3 h-3" />
                    <span className="font-medium">{emotionData?.label}</span>
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
                    {entry.mode}
                  </span>
                </div>
              </div>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { label: "Entry", val: entry.entry },
                          { label: "SL", val: entry.sl },
                          { label: "TP", val: entry.tp },
                        ].map((item) => (
                          <div key={item.label} className="bg-secondary/50 rounded-lg py-1.5">
                            <p className="text-[9px] text-muted-foreground uppercase">{item.label}</p>
                            <p className="text-[11px] font-mono text-foreground">{item.val}</p>
                          </div>
                        ))}
                      </div>

                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Trade Notes</p>
                        <p className="text-[11px] text-foreground leading-relaxed bg-secondary/30 rounded-lg p-2.5">
                          {entry.notes}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Journal Entry Form Modal */}
      <JournalEntryForm open={formOpen} onClose={() => setFormOpen(false)} mode={mode} />
    </div>
  );
};

/* ── Journal Entry Form ── */
const JournalEntryForm = ({ open, onClose, mode }: { open: boolean; onClose: () => void; mode: TradingMode }) => {
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [entry, setEntry] = useState("");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [result, setResult] = useState<string>("win");
  const [profit, setProfit] = useState("");
  const [emotion, setEmotion] = useState("neutral");
  const [setup, setSetup] = useState("");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(3);

  const isBuy = direction === "BUY";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
            className="relative w-full max-w-md glass-card border-t border-border rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mt-3 mb-2 shrink-0" />

            <div className="flex items-center justify-between px-5 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">New Journal Entry</p>
                  <p className="text-[10px] text-muted-foreground">{mode.shortName} Mode</p>
                </div>
              </div>
              <motion.button onClick={onClose} whileTap={{ scale: 0.9, rotate: 90 }} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            </div>

            <div className="overflow-y-auto px-5 pb-8 flex-1 space-y-4">
              {/* Direction */}
              <div className="grid grid-cols-2 gap-2">
                {(["BUY", "SELL"] as const).map((dir) => (
                  <motion.button
                    key={dir}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDirection(dir)}
                    className={`py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all ${
                      direction === dir
                        ? dir === "BUY" ? "bg-success/20 border-success/50 text-success" : "bg-destructive/20 border-destructive/50 text-destructive"
                        : "bg-secondary/50 border-border text-muted-foreground"
                    }`}
                  >
                    {dir === "BUY" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {dir}
                  </motion.button>
                ))}
              </div>

              {/* Prices */}
              <div className="grid grid-cols-3 gap-2">
                <JInput label="Entry" value={entry} onChange={setEntry} />
                <JInput label="Stop Loss" value={sl} onChange={setSl} />
                <JInput label="Take Profit" value={tp} onChange={setTp} />
              </div>

              {/* Result + Profit */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Result</label>
                  <select
                    value={result}
                    onChange={(e) => setResult(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
                  >
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                    <option value="breakeven">Breakeven</option>
                    <option value="open">Open</option>
                  </select>
                </div>
                <JInput label="P/L ($)" value={profit} onChange={setProfit} />
              </div>

              {/* Setup Type */}
              <JInput label="Setup Type" value={setup} onChange={setSetup} type="text" placeholder="e.g. BOS + OB Retest" />

              {/* Emotion */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Emotion State</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {emotions.map((em) => (
                    <motion.button
                      key={em.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEmotion(em.id)}
                      className={`flex items-center gap-1.5 p-2 rounded-lg text-[10px] font-medium transition-all border ${
                        emotion === em.id
                          ? "gold-border bg-primary/10 text-foreground"
                          : "border-border/30 bg-secondary/30 text-muted-foreground"
                      }`}
                    >
                      <em.icon className={`w-3 h-3 ${em.color}`} />
                      {em.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Trade Rating</label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <motion.button
                      key={s}
                      whileTap={{ scale: 0.8 }}
                      whileHover={{ scale: 1.2 }}
                      onClick={() => setRating(s)}
                    >
                      <Star className={`w-7 h-7 transition-colors ${s <= rating ? "text-primary fill-primary" : "text-muted-foreground/30"}`} />
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Notes & Analysis</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="What happened? What was the setup? What would you do differently?"
                  className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none resize-none placeholder:text-muted-foreground/50 focus:border-primary/50 transition-all"
                />
              </div>

              {/* Save */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="w-full py-3.5 rounded-xl gold-gradient gold-glow-strong text-primary-foreground font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Save Journal Entry
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const JInput = ({ label, value, onChange, type = "number", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) => (
  <div>
    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">{label}</label>
    <input
      type={type}
      step="0.01"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-sm font-mono text-foreground outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
    />
  </div>
);

export default JournalTab;

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Plus, Power, PowerOff, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { BOT_CATEGORIES, BOT_TYPES, getRiskColor, type BotType } from "@/lib/bot-types";

interface BotCatalogProps {
  onActivateBot?: (bot: BotType) => void;
}

const BotCatalog = ({ onActivateBot }: BotCatalogProps) => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [activeBots, setActiveBots] = useState<Set<string>>(new Set(["gold", "forex-major", "crypto-btc"]));

  const filtered = BOT_TYPES.filter((b) => {
    const matchCat = activeCategory === "all" || b.category === activeCategory;
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const toggleBot = (id: string) => {
    setActiveBots((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search 56+ bot types..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-card gold-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 bg-transparent"
        />
      </div>

      {/* Category pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveCategory("all")}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
            activeCategory === "all" ? "gold-gradient text-primary-foreground" : "bg-secondary text-muted-foreground"
          }`}
        >
          All ({BOT_TYPES.length})
        </motion.button>
        {BOT_CATEGORIES.map((cat) => {
          const count = BOT_TYPES.filter((b) => b.category === cat.id).length;
          return (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                activeCategory === cat.id ? "gold-gradient text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              <cat.icon className="w-3 h-3" />
              {cat.name} ({count})
            </motion.button>
          );
        })}
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] text-muted-foreground">
          {filtered.length} bots · <span className="text-success">{activeBots.size} active</span>
        </p>
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
          <Filter className="w-3 h-3" />
          {activeCategory === "all" ? "All Categories" : BOT_CATEGORIES.find((c) => c.id === activeCategory)?.name}
        </div>
      </div>

      {/* Bot cards */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((bot, i) => {
            const isActive = activeBots.has(bot.id);
            const Icon = bot.icon;
            const mockPnl = isActive ? (Math.random() > 0.4 ? Math.random() * 500 : -Math.random() * 200) : 0;
            const mockWinRate = isActive ? 45 + Math.random() * 30 : 0;

            return (
              <motion.div
                key={bot.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.02, type: "spring", stiffness: 300 }}
                className={`glass-card rounded-xl p-3 flex items-center gap-3 transition-all ${
                  isActive ? "gold-border gold-glow" : "border border-border/30"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isActive ? "gold-gradient" : "bg-secondary"
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-xs font-bold truncate ${isActive ? "gold-text" : "text-foreground"}`}>{bot.name}</p>
                    <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${getRiskColor(bot.risk)} bg-secondary/50`}>
                      {bot.risk}
                    </span>
                  </div>
                  <p className="text-[9px] text-muted-foreground truncate">{bot.description}</p>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex items-center gap-2 mt-1"
                    >
                      <span className={`text-[10px] font-mono flex items-center gap-0.5 ${mockPnl >= 0 ? "text-success" : "text-destructive"}`}>
                        {mockPnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        ${Math.abs(mockPnl).toFixed(0)}
                      </span>
                      <span className="text-[9px] text-muted-foreground">WR: {mockWinRate.toFixed(0)}%</span>
                    </motion.div>
                  )}
                </div>

                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => toggleBot(bot.id)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? "bg-destructive/20" : "bg-success/20"
                  }`}
                >
                  {isActive ? (
                    <PowerOff className="w-4 h-4 text-destructive" />
                  ) : (
                    <Power className="w-4 h-4 text-success" />
                  )}
                </motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BotCatalog;

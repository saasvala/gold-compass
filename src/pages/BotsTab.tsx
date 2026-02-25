import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, ToggleLeft, ToggleRight, Power, PowerOff, TrendingUp, TrendingDown, Search, Filter, Plus, Trash2, Activity, Zap, Eye } from "lucide-react";
import { BOT_CATEGORIES, BOT_TYPES, getRiskColor, type BotType } from "@/lib/bot-types";
import { useBots } from "@/hooks/use-bots";
import { toast } from "sonner";
import BotDetailPage from "@/pages/BotDetailPage";
import type { Tables } from "@/integrations/supabase/types";

type BotConfig = Tables<"bot_configs">;

const BotsTab = () => {
  const [isDemo, setIsDemo] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"my" | "catalog">("my");
  const [selectedBot, setSelectedBot] = useState<BotConfig | null>(null);
  const { bots, loading, activateBot, toggleBotStatus, deleteBot, updateBotDemo } = useBots();

  const filteredCatalog = BOT_TYPES.filter((b) => {
    const matchCat = activeCategory === "all" || b.category === activeCategory;
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const activeBots = bots.filter((b) => b.status === "active");

  const handleActivateBot = async (bot: BotType) => {
    const err = await activateBot(bot.id, bot.category, bot.name);
    if (err) toast.error("Failed to activate bot");
    else toast.success(`${bot.name} activated!`);
  };

  const handleToggle = async (id: string, status: string) => {
    await toggleBotStatus(id, status);
    toast.success(status === "active" ? "Bot paused" : "Bot resumed");
  };

  const handleDelete = async (id: string, name: string) => {
    await deleteBot(id);
    toast.success(`${name} removed`);
  };

  // Bot detail view
  if (selectedBot) {
    return (
      <BotDetailPage
        bot={selectedBot}
        onBack={() => setSelectedBot(null)}
        onToggle={handleToggle}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold gold-text uppercase tracking-wider">Trading Bots</h2>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsDemo(!isDemo)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-card gold-border"
        >
          {isDemo ? <ToggleLeft className="w-4 h-4 text-warning" /> : <ToggleRight className="w-4 h-4 text-success" />}
          <span className={`text-[10px] font-bold uppercase ${isDemo ? "text-warning" : "text-success"}`}>
            {isDemo ? "Demo" : "Live"}
          </span>
        </motion.button>
      </motion.div>

      {/* Live Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Active", value: activeBots.length.toString(), icon: Zap, color: "text-success" },
          { label: "Total P/L", value: `$${bots.reduce((s, b) => s + (b.pnl_total || 0), 0).toFixed(0)}`, icon: TrendingUp, color: "text-primary" },
          { label: "Win Rate", value: bots.length ? `${(bots.reduce((s, b) => s + (b.win_rate || 0), 0) / Math.max(bots.length, 1)).toFixed(0)}%` : "—", icon: Activity, color: "text-warning" },
        ].map((s) => (
          <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card gold-border rounded-xl p-2.5 text-center">
            <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
            <p className="text-sm font-bold font-mono text-foreground">{s.value}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 p-1 rounded-lg bg-secondary/50">
        {(["my", "catalog"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              view === v ? "gold-gradient text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {v === "my" ? `My Bots (${bots.length})` : `Catalog (${BOT_TYPES.length})`}
          </button>
        ))}
      </div>

      {view === "my" ? (
        /* My Active Bots */
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-xs">Loading bots...</div>
          ) : bots.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8 glass-card rounded-xl">
              <Bot className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">No bots yet. Browse the catalog to activate one!</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setView("catalog")}
                className="mt-3 px-4 py-2 rounded-lg gold-gradient text-primary-foreground text-[10px] font-bold uppercase"
              >
                Browse Catalog
              </motion.button>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {bots.map((bot) => {
                const isActive = bot.status === "active";
                const pnl = bot.pnl_total || 0;
                return (
                  <motion.div
                    key={bot.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`glass-card rounded-xl p-3 ${isActive ? "gold-border gold-glow" : "border border-border/30"}`}
                  >
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedBot(bot)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? "gold-gradient" : "bg-secondary"}`}
                      >
                        <Bot className={`w-5 h-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedBot(bot)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="flex items-center gap-1.5">
                          <p className={`text-xs font-bold truncate ${isActive ? "gold-text" : "text-foreground"}`}>{bot.name}</p>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />}
                        </div>
                        <p className="text-[9px] text-muted-foreground">{bot.bot_category} · {bot.bot_type}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-[10px] font-mono flex items-center gap-0.5 ${pnl >= 0 ? "text-success" : "text-destructive"}`}>
                            {pnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            ${Math.abs(pnl).toFixed(2)}
                          </span>
                          <span className="text-[9px] text-muted-foreground">WR: {(bot.win_rate || 0).toFixed(0)}%</span>
                          <span className="text-[9px] text-muted-foreground">{bot.total_trades || 0} trades</span>
                          <span className={`text-[8px] px-1 py-0.5 rounded ${bot.is_demo ? "bg-warning/20 text-warning" : "bg-success/20 text-success"}`}>
                            {bot.is_demo ? "DEMO" : "LIVE"}
                          </span>
                        </div>
                      </motion.button>
                      <div className="flex flex-col gap-1">
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => handleToggle(bot.id, bot.status)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? "bg-destructive/20" : "bg-success/20"}`}
                        >
                          {isActive ? <PowerOff className="w-3.5 h-3.5 text-destructive" /> : <Power className="w-3.5 h-3.5 text-success" />}
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => handleDelete(bot.id, bot.name)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-secondary/50"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      ) : (
        /* Catalog */
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${BOT_TYPES.length}+ bot types...`}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-card gold-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 bg-transparent"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setActiveCategory("all")}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${activeCategory === "all" ? "gold-gradient text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
              All ({BOT_TYPES.length})
            </motion.button>
            {BOT_CATEGORIES.map((cat) => {
              const count = BOT_TYPES.filter((b) => b.category === cat.id).length;
              return (
                <motion.button key={cat.id} whileTap={{ scale: 0.95 }} onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${activeCategory === cat.id ? "gold-gradient text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  <cat.icon className="w-3 h-3" />
                  {cat.name} ({count})
                </motion.button>
              );
            })}
          </div>

          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] text-muted-foreground">{filteredCatalog.length} bots available</p>
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Filter className="w-3 h-3" />
              {activeCategory === "all" ? "All" : BOT_CATEGORIES.find((c) => c.id === activeCategory)?.name}
            </div>
          </div>

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredCatalog.map((bot, i) => {
                const Icon = bot.icon;
                const alreadyAdded = bots.some((b) => b.bot_type === bot.id);
                return (
                  <motion.div key={bot.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.015 }}
                    className="glass-card rounded-xl p-3 flex items-center gap-3 border border-border/30">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-secondary">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold truncate text-foreground">{bot.name}</p>
                        <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${getRiskColor(bot.risk)} bg-secondary/50`}>{bot.risk}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground truncate">{bot.description}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {bot.strategies.map((s) => (
                          <span key={s} className="text-[8px] px-1.5 py-0.5 rounded bg-secondary/70 text-muted-foreground">{s}</span>
                        ))}
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => !alreadyAdded && handleActivateBot(bot)}
                      disabled={alreadyAdded}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${alreadyAdded ? "bg-secondary/30" : "bg-success/20"}`}
                    >
                      {alreadyAdded ? (
                        <Bot className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Plus className="w-4 h-4 text-success" />
                      )}
                    </motion.button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotsTab;

import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, ToggleLeft, ToggleRight } from "lucide-react";
import BotCatalog from "@/components/dashboard/BotCatalog";

const BotsTab = () => {
  const [isDemo, setIsDemo] = useState(true);

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold gold-text uppercase tracking-wider">Bot Catalog</h2>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsDemo(!isDemo)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-card gold-border"
        >
          {isDemo ? (
            <ToggleLeft className="w-4 h-4 text-warning" />
          ) : (
            <ToggleRight className="w-4 h-4 text-success" />
          )}
          <span className={`text-[10px] font-bold uppercase ${isDemo ? "text-warning" : "text-success"}`}>
            {isDemo ? "Demo" : "Live"}
          </span>
        </motion.button>
      </motion.div>

      <BotCatalog />
    </div>
  );
};

export default BotsTab;

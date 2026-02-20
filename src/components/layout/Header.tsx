import { motion } from "framer-motion";
import { Gem, Bell, Wifi } from "lucide-react";

const Header = () => (
  <motion.header
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="sticky top-0 z-40 glass-card border-b border-border/50 px-4 py-3"
  >
    <div className="flex items-center justify-between max-w-md mx-auto">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg gold-gradient gold-glow flex items-center justify-center">
          <Gem className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold gold-text">XAUUSD EA</h1>
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Institutional Grade</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Wifi className="w-3.5 h-3.5 text-success" />
          <span className="text-[9px] font-mono text-success">MT5</span>
        </div>
        <button className="relative">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary pulse-gold" />
        </button>
      </div>
    </div>
  </motion.header>
);

export default Header;

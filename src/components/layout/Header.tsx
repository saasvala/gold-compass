import { motion } from "framer-motion";
import { Bell, Wifi, LogOut } from "lucide-react";
import { TradingMode } from "@/lib/modes";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  mode: TradingMode;
  unreadCount?: number;
  onNotificationsClick?: () => void;
}

const Header = ({ mode, unreadCount = 0, onNotificationsClick }: HeaderProps) => {
  const ModeIcon = mode.icon;
  const { user, signOut } = useAuth();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-40 glass-card border-b border-border/50 px-4 py-3"
    >
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gold-gradient gold-glow flex items-center justify-center">
            <ModeIcon className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold gold-text">XAUUSD Hybrid AI</h1>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{mode.shortName} · {mode.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5 text-success" />
            <span className="text-[9px] font-mono text-success">MT5</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onNotificationsClick}
            className="relative"
          >
            <Bell className="w-4 h-4 text-muted-foreground" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-primary flex items-center justify-center"
              >
                <span className="text-[8px] font-bold text-primary-foreground px-1">{unreadCount > 9 ? "9+" : unreadCount}</span>
              </motion.span>
            )}
          </motion.button>
          {user && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={signOut}
              className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;

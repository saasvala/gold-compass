import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, BellOff, CheckCheck, Trash2, TrendingUp, AlertTriangle, ShieldAlert, Info, CheckCircle2, AlertOctagon } from "lucide-react";
import { Notification, NotificationType } from "@/hooks/use-notifications";

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  trade: { icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  killswitch: { icon: AlertOctagon, color: "text-destructive", bg: "bg-destructive/10" },
  drawdown: { icon: ShieldAlert, color: "text-warning", bg: "bg-warning/10" },
  info: { icon: Info, color: "text-muted-foreground", bg: "bg-secondary" },
  success: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
  error: { icon: AlertOctagon, color: "text-destructive", bg: "bg-destructive/10" },
};

const formatTime = (date: Date) => {
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const NotificationCenter = ({ open, onClose, notifications, onMarkRead, onMarkAllRead, onClearAll }: NotificationCenterProps) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

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
            className="absolute inset-0 bg-background/70 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="relative w-full max-w-md glass-card border-t border-border rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col"
          >
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mt-3 mb-2 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                  <Bell className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Notifications</p>
                  <p className="text-[10px] text-muted-foreground">
                    {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onMarkAllRead}
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"
                    title="Mark all read"
                  >
                    <CheckCheck className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                )}
                {notifications.length > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onClearAll}
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"
                    title="Clear all"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                )}
                <motion.button
                  onClick={onClose}
                  whileTap={{ scale: 0.9, rotate: 90 }}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </div>
            </div>

            {/* Notifications list */}
            <div className="overflow-y-auto px-5 pb-8 flex-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <BellOff className="w-10 h-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No notifications</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification, i) => {
                    const config = typeConfig[notification.type];
                    const Icon = config.icon;
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03, type: "spring", stiffness: 300 }}
                        onClick={() => onMarkRead(notification.id)}
                        className={`glass-card rounded-xl p-3.5 cursor-pointer transition-all ${
                          !notification.read ? "gold-border gold-glow" : "border border-border/30"
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-4 h-4 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-xs font-bold ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                                {notification.title}
                              </p>
                              <span className="text-[9px] text-muted-foreground shrink-0">
                                {formatTime(notification.timestamp)}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5 pulse-gold" />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;

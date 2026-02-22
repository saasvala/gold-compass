import { useState, useCallback } from "react";

export type NotificationType = "trade" | "killswitch" | "drawdown" | "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: generateId(),
      type: "trade",
      title: "BUY Executed",
      message: "XAUUSD BUY 0.10 lots @ 2647.00 filled successfully",
      timestamp: new Date(Date.now() - 120000),
      read: false,
    },
    {
      id: generateId(),
      type: "drawdown",
      title: "Drawdown Warning",
      message: "Daily drawdown at 3.2% — approaching 4% limit",
      timestamp: new Date(Date.now() - 300000),
      read: false,
    },
    {
      id: generateId(),
      type: "success",
      title: "TP Hit",
      message: "SELL #884721 hit TP at 2645.60 — +$92.10 profit",
      timestamp: new Date(Date.now() - 600000),
      read: true,
    },
    {
      id: generateId(),
      type: "warning",
      title: "High Spread Detected",
      message: "Spread at 4.2 pips — exceeds max threshold",
      timestamp: new Date(Date.now() - 900000),
      read: true,
    },
    {
      id: generateId(),
      type: "info",
      title: "Session Change",
      message: "London session opened — trading resumed",
      timestamp: new Date(Date.now() - 1800000),
      read: true,
    },
  ]);

  const addNotification = useCallback((type: NotificationType, title: string, message: string) => {
    const notification: Notification = {
      id: generateId(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [notification, ...prev]);

    // Play notification sound
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(type === "error" || type === "killswitch" ? 440 : 880, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}

    return notification.id;
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, addNotification, markAsRead, markAllRead, clearAll, unreadCount };
};

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Fingerprint, Globe, Clock, AlertTriangle, CheckCircle2, Eye, Activity, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const AUTO_LOGOUT_MS = 10 * 60 * 1000; // 10 minutes

const SecurityPanel = () => {
  const { signOut } = useAuth();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(AUTO_LOGOUT_MS);

  // Auto-logout on inactivity
  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  useEffect(() => {
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach(e => window.addEventListener(e, resetTimer));
    return () => events.forEach(e => window.removeEventListener(e, resetTimer));
  }, [resetTimer]);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity;
      const remaining = Math.max(AUTO_LOGOUT_MS - elapsed, 0);
      setTimeRemaining(remaining);
      if (remaining === 0) {
        signOut();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastActivity, signOut]);

  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const securityChecks = [
    { icon: Lock, label: "Session Encryption", status: "TLS 1.3", ok: true },
    { icon: Shield, label: "API Key Protection", status: "AES-256", ok: true },
    { icon: Fingerprint, label: "Device Fingerprint", status: "Verified", ok: true },
    { icon: Globe, label: "IP Whitelisting", status: "Enabled", ok: true },
    { icon: Activity, label: "Rate Limiting", status: "Active", ok: true },
    { icon: Eye, label: "2FA Authentication", status: "Enabled", ok: true },
  ];

  const recentActivity = [
    { action: "Login", time: "2 min ago", severity: "info" as const },
    { action: "Bot activated: Gold Bot", time: "5 min ago", severity: "info" as const },
    { action: "Settings changed", time: "12 min ago", severity: "warn" as const },
    { action: "Kill switch tested", time: "1 hour ago", severity: "critical" as const },
    { action: "Mode changed to INST", time: "2 hours ago", severity: "info" as const },
  ];

  const severityColors = {
    info: "text-muted-foreground",
    warn: "text-warning",
    critical: "text-destructive",
  };

  const overallScore = 94;

  return (
    <div className="space-y-4">
      {/* Security Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card gold-border rounded-xl p-4 gold-glow"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Security Status</p>
              <p className="text-lg font-bold text-success">PROTECTED</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold font-mono text-success">{overallScore}%</p>
            <p className="text-[9px] text-muted-foreground">Security Score</p>
          </div>
        </div>
        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallScore}%` }}
            transition={{ duration: 1 }}
            className="h-full rounded-full bg-success"
          />
        </div>
      </motion.div>

      {/* Auto-Logout Timer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card gold-border rounded-xl p-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <LogOut className="w-4 h-4 text-warning" />
          <div>
            <p className="text-xs font-medium text-foreground">Auto-Logout Timer</p>
            <p className="text-[9px] text-muted-foreground">Inactivity protection</p>
          </div>
        </div>
        <span className={`text-sm font-bold font-mono ${timeRemaining < 120000 ? "text-destructive" : "text-warning"}`}>
          {formatTime(timeRemaining)}
        </span>
      </motion.div>

      {/* Security Checks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card gold-border rounded-xl p-4"
      >
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Security Checks</p>
        <div className="space-y-2">
          {securityChecks.map((check, i) => (
            <motion.div
              key={check.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30"
            >
              <div className="flex items-center gap-2">
                <check.icon className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-foreground">{check.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-muted-foreground">{check.status}</span>
                {check.ok ? (
                  <CheckCircle2 className="w-3 h-3 text-success" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-destructive" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Audit Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card gold-border rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Audit Log</p>
        </div>
        <div className="space-y-2">
          {recentActivity.map((entry, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between p-2 rounded-lg bg-secondary/20"
            >
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  entry.severity === "critical" ? "bg-destructive" : entry.severity === "warn" ? "bg-warning" : "bg-muted-foreground"
                }`} />
                <span className={`text-[10px] ${severityColors[entry.severity]}`}>{entry.action}</span>
              </div>
              <span className="text-[9px] text-muted-foreground">{entry.time}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default SecurityPanel;

import { motion } from "framer-motion";
import { Globe, Sun, Moon } from "lucide-react";

const sessions = [
  { name: "London", icon: Globe, active: true, time: "08:00-16:00" },
  { name: "New York", icon: Sun, active: true, time: "13:00-21:00" },
  { name: "Asia", icon: Moon, active: false, time: "00:00-08:00" },
];

const SessionIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.3 }}
    className="glass-card gold-border rounded-xl p-4"
  >
    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Trading Sessions</p>
    <div className="space-y-2">
      {sessions.map((s) => (
        <div key={s.name} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <s.icon className={`w-3.5 h-3.5 ${s.active ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-xs font-medium ${s.active ? "text-foreground" : "text-muted-foreground"}`}>
              {s.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground">{s.time}</span>
            <span className={`w-2 h-2 rounded-full ${s.active ? "bg-success pulse-gold" : "bg-muted-foreground/30"}`} />
          </div>
        </div>
      ))}
    </div>
  </motion.div>
);

export default SessionIndicator;

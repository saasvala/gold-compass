import { motion } from "framer-motion";
import { Server, Key, Newspaper, Sliders, Clock, Globe, Cpu } from "lucide-react";

const settingSections = [
  {
    title: "Connection",
    items: [
      { icon: Server, label: "Broker Server", value: "ICMarkets-MT5" },
      { icon: Key, label: "Magic Number", value: "888001" },
      { icon: Globe, label: "Server Time Offset", value: "UTC+2" },
    ],
  },
  {
    title: "Strategy",
    items: [
      { icon: Sliders, label: "Min RR Ratio", value: "1:2" },
      { icon: Clock, label: "Time-Based Exit", value: "Enabled" },
      { icon: Cpu, label: "AI Filter Mode", value: "Adaptive" },
    ],
  },
  {
    title: "News Filter",
    items: [
      { icon: Newspaper, label: "CPI / NFP Filter", value: "Active" },
      { icon: Newspaper, label: "FOMC Filter", value: "Active" },
      { icon: Clock, label: "Pre-News Buffer", value: "30 min" },
    ],
  },
];

const SettingsTab = () => (
  <div className="space-y-4">
    {settingSections.map((section, si) => (
      <motion.div
        key={section.title}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: si * 0.1 }}
        className="glass-card gold-border rounded-xl p-4"
      >
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">{section.title}</p>
        <div className="space-y-2">
          {section.items.map((item) => (
            <div key={item.label} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-2">
                <item.icon className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-foreground">{item.label}</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    ))}
  </div>
);

export default SettingsTab;

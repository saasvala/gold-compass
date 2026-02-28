import { motion } from "framer-motion";
import { Server, Key, Newspaper, Sliders, Clock, Globe, Cpu, Zap, Shield, Target } from "lucide-react";
import { TradingMode } from "@/lib/modes";
import SecurityPanel from "@/components/dashboard/SecurityPanel";

const baseSettings = [
  {
    title: "Connection",
    items: [
      { icon: Server, label: "Broker Server", value: "ICMarkets-MT5" },
      { icon: Key, label: "Magic Number", value: "888001" },
      { icon: Globe, label: "Server Time Offset", value: "UTC+2" },
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

const modeSettings: Record<string, { icon: any; label: string; value: string }[]> = {
  aggressive: [
    { icon: Zap, label: "EMA Fast Period", value: "20" },
    { icon: Zap, label: "EMA Slow Period", value: "50" },
    { icon: Sliders, label: "RSI Period", value: "14" },
    { icon: Target, label: "Break-Even", value: "0.8R" },
    { icon: Shield, label: "Trailing Stop", value: "Tight" },
    { icon: Clock, label: "Max Trades/Session", value: "10" },
  ],
  propfirm: [
    { icon: Sliders, label: "Min RR Ratio", value: "1:2" },
    { icon: Target, label: "Partial Close", value: "1R" },
    { icon: Shield, label: "Break-Even", value: "1R" },
    { icon: Clock, label: "Max Trades/Day", value: "3" },
    { icon: Cpu, label: "Daily Loss Cap", value: "4%" },
    { icon: Newspaper, label: "News Filter", value: "Required" },
  ],
  adaptive: [
    { icon: Cpu, label: "AI Filter Mode", value: "Adaptive" },
    { icon: Sliders, label: "Trending RR", value: "1:3" },
    { icon: Sliders, label: "Ranging RR", value: "1:1.5" },
    { icon: Shield, label: "ADX Threshold", value: "25" },
    { icon: Zap, label: "ATR Multiplier", value: "1.5" },
    { icon: Clock, label: "Trade Reduction", value: "Auto" },
  ],
  hedgefund: [
    { icon: Sliders, label: "Min RR Ratio", value: "1:2" },
    { icon: Shield, label: "Equity Curve Prot.", value: "Enabled" },
    { icon: Zap, label: "Risk Scaling", value: "Active" },
    { icon: Target, label: "Scale Out", value: "Partial" },
    { icon: Clock, label: "Max Trades/Week", value: "8" },
    { icon: Cpu, label: "Auto Lot Reduce", value: "After 2 L" },
  ],
  institutional: [
    { icon: Sliders, label: "Min RR Ratio", value: "1:2" },
    { icon: Clock, label: "Time-Based Exit", value: "Enabled" },
    { icon: Cpu, label: "AI Filter Mode", value: "Adaptive" },
    { icon: Target, label: "Session Filter", value: "LDN + NY" },
    { icon: Shield, label: "BOS Confirm TF", value: "H1/H4" },
    { icon: Zap, label: "FVG Detection", value: "Active" },
  ],
};

const SettingsTab = ({ mode }: { mode: TradingMode }) => {
  const modeCfg = modeSettings[mode.id] || modeSettings.institutional;

  const sections = [
    ...baseSettings,
    { title: `${mode.shortName} Strategy`, items: modeCfg },
  ];

  return (
    <div className="space-y-4">
      <SecurityPanel />

      {sections.map((section, si) => (
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
};

export default SettingsTab;

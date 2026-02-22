import { motion } from "framer-motion";
import { LayoutDashboard, BarChart3, Settings, Shield, Activity, BookOpen } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "strategy", icon: BarChart3, label: "Strategy" },
  { id: "trades", icon: Activity, label: "Trades" },
  { id: "journal", icon: BookOpen, label: "Journal" },
  { id: "risk", icon: Shield, label: "Risk" },
  { id: "settings", icon: Settings, label: "Settings" },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => (
  <div className="fixed bottom-0 left-0 right-0 z-50">
    <div className="glass-card border-t border-border/50 px-1 py-2 flex items-center justify-around max-w-md mx-auto">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="relative flex flex-col items-center gap-1 py-1 px-2"
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute -top-2 w-6 h-1 rounded-full gold-gradient"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <tab.icon className={`w-4.5 h-4.5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-[8px] font-semibold uppercase tracking-wider ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

export default BottomNav;

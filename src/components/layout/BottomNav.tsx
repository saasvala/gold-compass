import { motion } from "framer-motion";
import { LayoutDashboard, BarChart3, Settings, Shield, Activity, BookOpen, Bot, Crown, Users, Eye } from "lucide-react";
import { AppRole } from "@/hooks/use-user-role";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  role?: AppRole;
}

const getTabsForRole = (role: AppRole) => {
  const common = [
    { id: "dashboard", icon: LayoutDashboard, label: "Home" },
    { id: "bots", icon: Bot, label: "Bots" },
  ];

  switch (role) {
    case "admin":
      return [
        ...common,
        { id: "trades", icon: Activity, label: "Trades" },
        { id: "admin", icon: Crown, label: "Admin" },
        { id: "settings", icon: Settings, label: "Settings" },
      ];
    case "investor":
      return [
        ...common,
        { id: "portfolio", icon: Eye, label: "Portfolio" },
        { id: "risk", icon: Shield, label: "Risk" },
        { id: "settings", icon: Settings, label: "Settings" },
      ];
    case "reseller":
      return [
        ...common,
        { id: "referrals", icon: Users, label: "Referrals" },
        { id: "settings", icon: Settings, label: "Settings" },
      ];
    default: // trader
      return [
        { id: "dashboard", icon: LayoutDashboard, label: "Home" },
        { id: "strategy", icon: BarChart3, label: "Strategy" },
        { id: "bots", icon: Bot, label: "Bots" },
        { id: "journal", icon: BookOpen, label: "Journal" },
        { id: "risk", icon: Shield, label: "Risk" },
        { id: "settings", icon: Settings, label: "Settings" },
      ];
  }
};

const BottomNav = ({ activeTab, onTabChange, role = "trader" }: BottomNavProps) => {
  const tabs = getTabsForRole(role);

  return (
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
};

export default BottomNav;

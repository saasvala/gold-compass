import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, TrendingUp, BarChart3, Percent, Play, Square, XCircle, AlertOctagon, SlidersHorizontal, Plus,
} from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MetricCard from "@/components/dashboard/MetricCard";
import ControlButton from "@/components/dashboard/ControlButton";
import MiniChart from "@/components/dashboard/MiniChart";
import SessionIndicator from "@/components/dashboard/SessionIndicator";
import AIMarketMode from "@/components/dashboard/AIMarketMode";
import StatusBadge from "@/components/dashboard/StatusBadge";
import PriceTicker from "@/components/dashboard/PriceTicker";
import EquityCurve from "@/components/dashboard/EquityCurve";
import TradeEntryForm from "@/components/dashboard/TradeEntryForm";
import ModeSelector from "@/components/dashboard/ModeSelector";
import ModeStats from "@/components/dashboard/ModeStats";
import ModeCompare from "@/components/dashboard/ModeCompare";
import NotificationCenter from "@/components/dashboard/NotificationCenter";
import StrategyTab from "@/pages/StrategyTab";
import TradesTab from "@/pages/TradesTab";
import JournalTab from "@/pages/JournalTab";
import RiskTab from "@/pages/RiskTab";
import SettingsTab from "@/pages/SettingsTab";
import BotsTab from "@/pages/BotsTab";
import AdminDashboard from "@/pages/AdminDashboard";
import InvestorDashboard from "@/pages/InvestorDashboard";
import ResellerDashboard from "@/pages/ResellerDashboard";
import LeaderboardTab from "@/pages/LeaderboardTab";
import { TRADING_MODES, TradingMode } from "@/lib/modes";
import { useNotifications } from "@/hooks/use-notifications";
import { useUserRole } from "@/hooks/use-user-role";
import { useBotSimulation } from "@/hooks/use-bot-simulation";

const DashboardTab = ({ mode, onKillSwitch }: { mode: TradingMode; onKillSwitch: () => void }) => {
  const [isTrading, setIsTrading] = useState(true);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge label="Live Trading" active={isTrading} />
        <StatusBadge label={mode.shortName + " Mode"} active={true} />
        <StatusBadge label="News: Clear" active={true} />
      </div>

      <ModeStats mode={mode} />

      <div className="grid grid-cols-2 gap-3">
        <MetricCard icon={Wallet} label="Balance" value="$12,480" subValue="+$420 today" trend="up" delay={0} />
        <MetricCard icon={TrendingUp} label="Equity" value="$12,640" subValue="+1.28%" trend="up" delay={0.05} />
        <MetricCard icon={BarChart3} label="Daily P/L" value="+$420" subValue="3 wins, 1 loss" trend="up" delay={0.1} />
        <MetricCard icon={Percent} label="Drawdown" value="4.2%" subValue={`Max: ${mode.maxDD}`} trend="neutral" delay={0.15} />
      </div>

      <MiniChart />
      <EquityCurve />

      <div className="grid grid-cols-1 gap-3">
        <AIMarketMode mode={mode} />
        <SessionIndicator />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Quick Controls</p>
        <div className="grid grid-cols-5 gap-2">
          <ControlButton
            icon={isTrading ? Square : Play}
            label={isTrading ? "Stop" : "Start"}
            variant={isTrading ? "danger" : "primary"}
            onClick={() => setIsTrading(!isTrading)}
          />
          <ControlButton icon={Play} label="Start" variant="primary" active />
          <ControlButton icon={XCircle} label="Close All" variant="secondary" />
          <ControlButton icon={AlertOctagon} label="Kill" variant="danger" onClick={onKillSwitch} />
          <ControlButton icon={SlidersHorizontal} label="Risk" variant="secondary" />
        </div>
      </motion.div>
    </div>
  );
};

const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { type: "spring" as const, damping: 30, stiffness: 300 },
};

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [tradeFormOpen, setTradeFormOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<TradingMode>(TRADING_MODES[4]);
  const { notifications, addNotification, markAsRead, markAllRead, clearAll, unreadCount } = useNotifications();
  const { role } = useUserRole();
  useBotSimulation();

  const handleKillSwitch = () => {
    addNotification("killswitch", "Kill Switch Activated", "All positions closed. Trading halted immediately.");
  };

  const handleModeChange = (mode: TradingMode) => {
    setActiveMode(mode);
    addNotification("info", "Mode Switched", `Active mode changed to ${mode.name}`);
  };

  const tabs: Record<string, React.ReactNode> = {
    dashboard: <DashboardTab mode={activeMode} onKillSwitch={handleKillSwitch} />,
    strategy: <StrategyTab mode={activeMode} />,
    trades: <TradesTab />,
    journal: <JournalTab mode={activeMode} />,
    risk: <RiskTab mode={activeMode} />,
    settings: <SettingsTab mode={activeMode} />,
    bots: <BotsTab />,
    leaderboard: <LeaderboardTab />,
    admin: <AdminDashboard />,
    portfolio: <InvestorDashboard />,
    referrals: <ResellerDashboard />,
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto">
      <Header
        mode={activeMode}
        unreadCount={unreadCount}
        onNotificationsClick={() => setNotificationsOpen(true)}
      />
      <PriceTicker />
      <main className="px-4 py-4 pb-24 space-y-4">
        <ModeSelector
          activeMode={activeMode}
          onModeChange={handleModeChange}
          onCompare={() => setCompareOpen(true)}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + activeMode.id}
            {...pageTransition}
          >
            {tabs[activeTab]}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FAB - New Trade */}
      <motion.button
        whileTap={{ scale: 0.85, rotate: 90 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => setTradeFormOpen(true)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full gold-gradient gold-glow-strong flex items-center justify-center shadow-lg"
      >
        <Plus className="w-6 h-6 text-primary-foreground" />
      </motion.button>

      <TradeEntryForm open={tradeFormOpen} onClose={() => setTradeFormOpen(false)} />
      <ModeCompare
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        activeMode={activeMode}
        onSelect={handleModeChange}
      />
      <NotificationCenter
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkRead={markAsRead}
        onMarkAllRead={markAllRead}
        onClearAll={clearAll}
      />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} role={role} />
    </div>
  );
};

export default Index;

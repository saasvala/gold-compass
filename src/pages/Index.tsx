import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, TrendingUp, BarChart3, Percent, Play, Square, XCircle, AlertOctagon, SlidersHorizontal,
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
import StrategyTab from "@/pages/StrategyTab";
import TradesTab from "@/pages/TradesTab";
import RiskTab from "@/pages/RiskTab";
import SettingsTab from "@/pages/SettingsTab";

const DashboardTab = () => {
  const [isTrading, setIsTrading] = useState(true);

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge label="Live Trading" active={isTrading} />
        <StatusBadge label="London Session" active={true} />
        <StatusBadge label="News: Clear" active={true} />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard icon={Wallet} label="Balance" value="$12,480" subValue="+$420 today" trend="up" delay={0} />
        <MetricCard icon={TrendingUp} label="Equity" value="$12,640" subValue="+1.28%" trend="up" delay={0.1} />
        <MetricCard icon={BarChart3} label="Daily P/L" value="+$420" subValue="3 wins, 1 loss" trend="up" delay={0.2} />
        <MetricCard icon={Percent} label="Drawdown" value="4.2%" subValue="Max: 10%" trend="neutral" delay={0.3} />
      </div>

      {/* Chart */}
      <MiniChart />

      {/* Equity Curve */}
      <EquityCurve />

      {/* AI + Sessions */}
      <div className="grid grid-cols-1 gap-3">
        <AIMarketMode />
        <SessionIndicator />
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
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
          <ControlButton icon={AlertOctagon} label="Kill" variant="danger" />
          <ControlButton icon={SlidersHorizontal} label="Risk" variant="secondary" />
        </div>
      </motion.div>
    </div>
  );
};

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs: Record<string, React.ReactNode> = {
    dashboard: <DashboardTab />,
    strategy: <StrategyTab />,
    trades: <TradesTab />,
    risk: <RiskTab />,
    settings: <SettingsTab />,
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto">
      <Header />
      <PriceTicker />
      <main className="px-4 py-4 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {tabs[activeTab]}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;

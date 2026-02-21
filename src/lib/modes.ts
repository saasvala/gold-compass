import { Zap, Shield, Brain, Building2, Gem, LucideIcon } from "lucide-react";

export interface TradingMode {
  id: string;
  name: string;
  shortName: string;
  icon: LucideIcon;
  description: string;
  risk: string;
  rr: string;
  timeframes: string[];
  maxTrades: string;
  color: string;
  dailyLoss: string;
  maxDD: string;
}

export const TRADING_MODES: TradingMode[] = [
  {
    id: "aggressive",
    name: "Aggressive Scalper",
    shortName: "SCALP",
    icon: Zap,
    description: "High-frequency M1/M5 scalping with EMA crossover and RSI momentum",
    risk: "1.0%",
    rr: "1:1.5",
    timeframes: ["M1", "M5"],
    maxTrades: "10/session",
    color: "destructive",
    dailyLoss: "5%",
    maxDD: "12%",
  },
  {
    id: "propfirm",
    name: "Prop Firm Safe",
    shortName: "PROP",
    icon: Shield,
    description: "Conservative structure trading with strict drawdown controls",
    risk: "0.5%",
    rr: "1:2",
    timeframes: ["H1", "M15", "M5"],
    maxTrades: "3/day",
    color: "success",
    dailyLoss: "4%",
    maxDD: "8%",
  },
  {
    id: "adaptive",
    name: "Semi-AI Adaptive",
    shortName: "AI",
    icon: Brain,
    description: "AI market classifier auto-adjusts RR and position sizing",
    risk: "0.75%",
    rr: "1:1.5–3",
    timeframes: ["H1", "M15", "M5"],
    maxTrades: "5/day",
    color: "primary",
    dailyLoss: "4%",
    maxDD: "10%",
  },
  {
    id: "hedgefund",
    name: "Capital Shield",
    shortName: "HEDGE",
    icon: Building2,
    description: "Multi-TF hedge fund approach with equity curve protection",
    risk: "0.5–1%",
    rr: "1:2+",
    timeframes: ["H4", "H1", "M15", "M5"],
    maxTrades: "8/week",
    color: "warning",
    dailyLoss: "3%",
    maxDD: "8%",
  },
  {
    id: "institutional",
    name: "Smart Money Core",
    shortName: "SMC",
    icon: Gem,
    description: "Full ICT/SMC: BOS, CHoCH, OB, FVG, premium/discount zones",
    risk: "1.0%",
    rr: "1:2",
    timeframes: ["H4", "H1", "M15", "M5"],
    maxTrades: "5/day",
    color: "primary",
    dailyLoss: "5%",
    maxDD: "10%",
  },
];

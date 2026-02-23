import {
  TrendingUp, Bitcoin, BarChart3, Gem, Fuel, Globe, Layers, Brain,
  ArrowRightLeft, Zap, Activity, Target, Shield, Gauge, Copy, Grid3X3,
  LineChart, Newspaper, BarChart, Briefcase, RefreshCw, Cpu, Users,
  type LucideIcon,
} from "lucide-react";

export interface BotType {
  id: string;
  name: string;
  category: string;
  icon: LucideIcon;
  description: string;
  markets: string[];
  strategies: string[];
  risk: "low" | "medium" | "high" | "ultra";
}

export const BOT_CATEGORIES = [
  { id: "forex", name: "Forex", icon: TrendingUp, color: "primary" },
  { id: "crypto", name: "Crypto", icon: Bitcoin, color: "warning" },
  { id: "stocks", name: "Stocks", icon: BarChart3, color: "success" },
  { id: "commodities", name: "Commodities", icon: Gem, color: "accent" },
  { id: "indices", name: "Indices", icon: Globe, color: "primary" },
  { id: "options", name: "Options", icon: Layers, color: "destructive" },
  { id: "futures", name: "Futures", icon: Fuel, color: "warning" },
  { id: "ai", name: "AI Powered", icon: Brain, color: "primary" },
  { id: "special", name: "Specialty", icon: Zap, color: "accent" },
] as const;

export const BOT_TYPES: BotType[] = [
  { id: "forex-major", name: "Forex Majors", category: "forex", icon: TrendingUp, description: "EUR/USD, GBP/USD, USD/JPY", markets: ["EUR/USD", "GBP/USD", "USD/JPY"], strategies: ["Trend", "Scalp"], risk: "medium" },
  { id: "forex-minor", name: "Forex Minors", category: "forex", icon: TrendingUp, description: "EUR/GBP, AUD/NZD, GBP/JPY", markets: ["EUR/GBP", "AUD/NZD"], strategies: ["Swing", "Range"], risk: "medium" },
  { id: "forex-exotic", name: "Forex Exotic", category: "forex", icon: TrendingUp, description: "USD/TRY, USD/ZAR, EUR/TRY", markets: ["USD/TRY", "USD/ZAR"], strategies: ["Carry", "Trend"], risk: "high" },
  { id: "forex-scalp", name: "Forex Scalper", category: "forex", icon: Zap, description: "M1/M5 high-frequency scalping", markets: ["EUR/USD", "GBP/USD"], strategies: ["EMA Cross", "RSI"], risk: "high" },
  { id: "forex-grid", name: "Forex Grid", category: "forex", icon: Grid3X3, description: "Grid trading on major pairs", markets: ["EUR/USD", "GBP/USD"], strategies: ["Grid"], risk: "high" },
  { id: "forex-trend", name: "Forex Trend", category: "forex", icon: LineChart, description: "Multi-TF trend following", markets: ["All Majors"], strategies: ["BOS", "EMA"], risk: "medium" },
  { id: "forex-range", name: "Forex Range", category: "forex", icon: ArrowRightLeft, description: "Range-bound pair trading", markets: ["EUR/CHF", "AUD/NZD"], strategies: ["S/R", "Oscillator"], risk: "low" },
  { id: "forex-news", name: "Forex News", category: "forex", icon: Newspaper, description: "News-based NFP/CPI trading", markets: ["USD Pairs"], strategies: ["Event", "Spike"], risk: "ultra" },
  { id: "forex-arb", name: "Forex Arbitrage", category: "forex", icon: ArrowRightLeft, description: "Cross-pair arbitrage", markets: ["Triangular"], strategies: ["Stat Arb"], risk: "low" },

  { id: "crypto-btc", name: "Bitcoin Bot", category: "crypto", icon: Bitcoin, description: "BTC/USDT trend & momentum", markets: ["BTC/USDT"], strategies: ["Trend", "DCA"], risk: "high" },
  { id: "crypto-alt", name: "Altcoin Bot", category: "crypto", icon: Bitcoin, description: "Top altcoins momentum trading", markets: ["ETH", "SOL", "BNB"], strategies: ["Breakout", "Momentum"], risk: "high" },
  { id: "crypto-stable", name: "Stablecoin Arb", category: "crypto", icon: ArrowRightLeft, description: "USDT/USDC/DAI arbitrage", markets: ["Stablecoins"], strategies: ["Arb"], risk: "low" },
  { id: "crypto-grid", name: "Crypto Grid", category: "crypto", icon: Grid3X3, description: "Grid bot for volatile crypto", markets: ["BTC", "ETH"], strategies: ["Grid"], risk: "high" },
  { id: "crypto-scalp", name: "Crypto Scalper", category: "crypto", icon: Zap, description: "High-frequency crypto scalps", markets: ["BTC", "ETH"], strategies: ["Order Flow"], risk: "ultra" },
  { id: "crypto-trend", name: "Crypto Trend", category: "crypto", icon: LineChart, description: "Multi-TF crypto trend following", markets: ["BTC", "ETH", "SOL"], strategies: ["EMA", "MACD"], risk: "medium" },
  { id: "crypto-futures", name: "Crypto Futures", category: "crypto", icon: Fuel, description: "Leveraged futures trading", markets: ["BTC-PERP", "ETH-PERP"], strategies: ["Momentum", "Funding"], risk: "ultra" },
  { id: "crypto-market-make", name: "Crypto Market Maker", category: "crypto", icon: BarChart, description: "Liquidity provision on DEX/CEX", markets: ["BTC", "ETH"], strategies: ["Spread"], risk: "medium" },
  { id: "crypto-hft", name: "Crypto HFT", category: "crypto", icon: Cpu, description: "High-frequency crypto trading", markets: ["BTC", "ETH"], strategies: ["Latency Arb"], risk: "ultra" },

  { id: "stock-us", name: "US Stocks", category: "stocks", icon: BarChart3, description: "AAPL, TSLA, NVDA momentum", markets: ["NASDAQ", "NYSE"], strategies: ["Momentum", "Earnings"], risk: "medium" },
  { id: "stock-eu", name: "European Stocks", category: "stocks", icon: BarChart3, description: "DAX, FTSE constituents", markets: ["LSE", "XETRA"], strategies: ["Value", "Momentum"], risk: "medium" },
  { id: "stock-asia", name: "Asian Stocks", category: "stocks", icon: BarChart3, description: "Nikkei, HSI constituents", markets: ["TSE", "HKEX"], strategies: ["Momentum", "Sector"], risk: "medium" },
  { id: "stock-swing", name: "Stock Swing", category: "stocks", icon: Activity, description: "Multi-day swing trading", markets: ["S&P 500"], strategies: ["Swing", "Channel"], risk: "medium" },
  { id: "stock-range", name: "Stock Range", category: "stocks", icon: ArrowRightLeft, description: "Range trading blue chips", markets: ["DOW 30"], strategies: ["S/R", "Mean Rev"], risk: "low" },
  { id: "stock-vol", name: "Stock Volatility", category: "stocks", icon: Activity, description: "Volatility-based equity trading", markets: ["VIX Correlated"], strategies: ["Vol Crush", "Straddle"], risk: "high" },
  { id: "stock-market-make", name: "Stock Market Maker", category: "stocks", icon: BarChart, description: "Equity market making", markets: ["US Equities"], strategies: ["Spread", "Inventory"], risk: "medium" },

  { id: "gold", name: "Gold Bot", category: "commodities", icon: Gem, description: "XAUUSD ICT/SMC + momentum", markets: ["XAU/USD"], strategies: ["SMC", "BOS", "FVG"], risk: "medium" },
  { id: "silver", name: "Silver Bot", category: "commodities", icon: Gem, description: "XAGUSD trend following", markets: ["XAG/USD"], strategies: ["Trend", "Correlation"], risk: "medium" },
  { id: "oil", name: "Oil Bot", category: "commodities", icon: Fuel, description: "WTI/Brent crude trading", markets: ["CL", "BRN"], strategies: ["Inventory", "Spread"], risk: "high" },
  { id: "natgas", name: "Natural Gas Bot", category: "commodities", icon: Fuel, description: "NG seasonal patterns", markets: ["NG"], strategies: ["Seasonal", "Weather"], risk: "high" },
  { id: "commodity-swing", name: "Commodity Swing", category: "commodities", icon: Activity, description: "Multi-day commodity swings", markets: ["Gold", "Oil", "Silver"], strategies: ["Swing"], risk: "medium" },

  { id: "sp500", name: "S&P 500 Bot", category: "indices", icon: Globe, description: "ES/SPX index trading", markets: ["ES", "SPX"], strategies: ["Trend", "Mean Rev"], risk: "medium" },
  { id: "nasdaq", name: "NASDAQ Bot", category: "indices", icon: Globe, description: "NQ tech-heavy index", markets: ["NQ", "QQQ"], strategies: ["Momentum", "Breakout"], risk: "medium" },
  { id: "ftse", name: "FTSE 100 Bot", category: "indices", icon: Globe, description: "UK index trading", markets: ["FTSE 100"], strategies: ["Trend", "Range"], risk: "medium" },
  { id: "dax", name: "DAX Bot", category: "indices", icon: Globe, description: "German index trading", markets: ["DAX 40"], strategies: ["Breakout", "Momentum"], risk: "medium" },

  { id: "options-calls", name: "Options Calls", category: "options", icon: Layers, description: "Bullish call strategies", markets: ["SPY", "QQQ"], strategies: ["Vertical", "Calendar"], risk: "high" },
  { id: "options-puts", name: "Options Puts", category: "options", icon: Layers, description: "Bearish put strategies", markets: ["SPY", "QQQ"], strategies: ["Spread", "Protective"], risk: "high" },
  { id: "options-vol", name: "Options Volatility", category: "options", icon: Activity, description: "Volatility-based options", markets: ["VIX Options"], strategies: ["Straddle", "Iron Condor"], risk: "ultra" },

  { id: "futures-commodity", name: "Commodity Futures", category: "futures", icon: Fuel, description: "Agricultural & energy futures", markets: ["CL", "GC", "ZW"], strategies: ["Spread", "Calendar"], risk: "high" },
  { id: "futures-index", name: "Index Futures", category: "futures", icon: Globe, description: "Stock index futures", markets: ["ES", "NQ", "YM"], strategies: ["Scalp", "Swing"], risk: "high" },

  { id: "ai-trend", name: "AI Trend Predictor", category: "ai", icon: Brain, description: "ML-powered trend detection", markets: ["Multi-Asset"], strategies: ["LSTM", "Transformer"], risk: "medium" },
  { id: "ai-mean-rev", name: "AI Mean Reversion", category: "ai", icon: Brain, description: "Statistical mean reversion", markets: ["Pairs"], strategies: ["Z-Score", "Cointegration"], risk: "medium" },
  { id: "ai-sentiment", name: "AI Sentiment", category: "ai", icon: Brain, description: "News & social sentiment", markets: ["All"], strategies: ["NLP", "Scoring"], risk: "medium" },
  { id: "ai-rl", name: "AI Reinforcement", category: "ai", icon: Cpu, description: "Self-optimizing RL agent", markets: ["Multi-Asset"], strategies: ["PPO", "DQN"], risk: "high" },
  { id: "ai-adaptive", name: "AI Adaptive", category: "ai", icon: Brain, description: "Auto-adjusting parameters", markets: ["Multi-Asset"], strategies: ["Ensemble"], risk: "medium" },

  { id: "copy-trade", name: "Copy Trading", category: "special", icon: Copy, description: "Mirror top traders", markets: ["Multi-Asset"], strategies: ["Mirror", "Scale"], risk: "medium" },
  { id: "portfolio-rebal", name: "Portfolio Rebalancer", category: "special", icon: RefreshCw, description: "Auto-rebalance allocations", markets: ["Multi-Asset"], strategies: ["Target Weight"], risk: "low" },
  { id: "risk-mgmt", name: "Risk Manager", category: "special", icon: Shield, description: "Position sizing & hedging", markets: ["All"], strategies: ["Kelly", "VaR"], risk: "low" },
  { id: "backtest", name: "Backtesting Engine", category: "special", icon: Gauge, description: "Strategy simulation", markets: ["Historical"], strategies: ["Monte Carlo", "Walk-Forward"], risk: "low" },
  { id: "signal-sub", name: "Signal Subscription", category: "special", icon: Target, description: "Paid signal service", markets: ["Multi-Asset"], strategies: ["Curated"], risk: "medium" },
  { id: "social-sentiment", name: "Social Sentiment", category: "special", icon: Users, description: "Twitter & Reddit analysis", markets: ["Crypto", "Stocks"], strategies: ["Sentiment Score"], risk: "medium" },
  { id: "seasonal", name: "Seasonal Patterns", category: "special", icon: RefreshCw, description: "Seasonal commodity/stock", markets: ["Commodities", "Stocks"], strategies: ["Calendar Effect"], risk: "low" },
  { id: "stat-arb", name: "Statistical Arbitrage", category: "special", icon: ArrowRightLeft, description: "Pairs & basket trading", markets: ["Equities", "Forex"], strategies: ["Pairs", "Basket"], risk: "medium" },
  { id: "hybrid", name: "Hybrid Multi-Strategy", category: "special", icon: Zap, description: "Grid + trend + swing combined", markets: ["Multi-Asset"], strategies: ["Ensemble", "Adaptive"], risk: "high" },
];

export const getRiskColor = (risk: BotType["risk"]) => {
  switch (risk) {
    case "low": return "text-success";
    case "medium": return "text-warning";
    case "high": return "text-destructive";
    case "ultra": return "text-destructive font-bold";
  }
};

import {
  TrendingUp, Bitcoin, BarChart3, Gem, Fuel, Globe, Layers, Brain,
  ArrowRightLeft, Zap, Activity, Target, Shield, Gauge, Copy, Grid3X3,
  LineChart, Newspaper, BarChart, Briefcase, RefreshCw, Cpu, Users,
  GitBranch, Crosshair, ScanLine, Boxes, DollarSign, PieChart, Calendar,
  Radio, Waypoints, Lock, Umbrella, Blend, Eye, Server, Building2, Cog,
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
  { id: "synthetic", name: "Synthetic", icon: Radio, color: "accent" },
  { id: "ai", name: "AI Powered", icon: Brain, color: "primary" },
  { id: "special", name: "Specialty", icon: Zap, color: "accent" },
  { id: "enterprise", name: "Enterprise", icon: Building2, color: "primary" },
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
  { id: "futures-hedge", name: "Futures Hedging", category: "futures", icon: Umbrella, description: "Portfolio hedge optimization", markets: ["ES", "NQ", "GC"], strategies: ["Delta Neutral", "Hedge Ratio"], risk: "medium" },

  { id: "synthetic-indices", name: "Synthetic Indices", category: "synthetic", icon: Radio, description: "Pattern recognition + volatility spike", markets: ["V75", "V100", "Crash/Boom"], strategies: ["Pattern", "Circuit Break"], risk: "ultra" },
  { id: "synthetic-vol", name: "Volatility Breakout", category: "synthetic", icon: Activity, description: "ATR expansion entry signals", markets: ["Multi-Asset"], strategies: ["ATR Expand", "Vol Squeeze"], risk: "high" },

  { id: "ai-trend", name: "AI Trend Predictor", category: "ai", icon: Brain, description: "ML-powered trend detection", markets: ["Multi-Asset"], strategies: ["LSTM", "Transformer"], risk: "medium" },
  { id: "ai-mean-rev", name: "AI Mean Reversion", category: "ai", icon: Brain, description: "Statistical mean reversion", markets: ["Pairs"], strategies: ["Z-Score", "Cointegration"], risk: "medium" },
  { id: "ai-sentiment", name: "AI Sentiment", category: "ai", icon: Brain, description: "News & social sentiment", markets: ["All"], strategies: ["NLP", "Scoring"], risk: "medium" },
  { id: "ai-rl", name: "AI Reinforcement", category: "ai", icon: Cpu, description: "Self-optimizing RL agent", markets: ["Multi-Asset"], strategies: ["PPO", "DQN"], risk: "high" },
  { id: "ai-adaptive", name: "AI Adaptive", category: "ai", icon: Brain, description: "Auto-adjusting parameters", markets: ["Multi-Asset"], strategies: ["Ensemble"], risk: "medium" },
  { id: "ai-lstm", name: "AI Predictive LSTM", category: "ai", icon: Brain, description: "Deep learning price forecasting", markets: ["Multi-Asset"], strategies: ["LSTM", "Seq2Seq"], risk: "high" },
  { id: "ai-transformer", name: "Transformer Forecast", category: "ai", icon: Cpu, description: "Multi-timeframe attention model", markets: ["Multi-Asset"], strategies: ["Attention", "Positional"], risk: "high" },

  { id: "copy-trade", name: "Copy Trading", category: "special", icon: Copy, description: "Mirror top traders", markets: ["Multi-Asset"], strategies: ["Mirror", "Scale"], risk: "medium" },
  { id: "portfolio-rebal", name: "Portfolio Rebalancer", category: "special", icon: RefreshCw, description: "Auto-rebalance allocations", markets: ["Multi-Asset"], strategies: ["Target Weight"], risk: "low" },
  { id: "risk-mgmt", name: "Risk Manager", category: "special", icon: Shield, description: "Position sizing & hedging", markets: ["All"], strategies: ["Kelly", "VaR"], risk: "low" },
  { id: "backtest", name: "Backtesting Engine", category: "special", icon: Gauge, description: "Strategy simulation", markets: ["Historical"], strategies: ["Monte Carlo", "Walk-Forward"], risk: "low" },
  { id: "signal-sub", name: "Signal Subscription", category: "special", icon: Target, description: "Paid signal service", markets: ["Multi-Asset"], strategies: ["Curated"], risk: "medium" },
  { id: "social-sentiment", name: "Social Sentiment", category: "special", icon: Users, description: "Twitter & Reddit analysis", markets: ["Crypto", "Stocks"], strategies: ["Sentiment Score"], risk: "medium" },
  { id: "seasonal", name: "Seasonal Patterns", category: "special", icon: Calendar, description: "Historical seasonal trends", markets: ["Commodities", "Stocks"], strategies: ["Calendar Effect"], risk: "low" },
  { id: "stat-arb", name: "Statistical Arbitrage", category: "special", icon: ArrowRightLeft, description: "Pairs & basket trading", markets: ["Equities", "Forex"], strategies: ["Pairs", "Basket"], risk: "medium" },
  { id: "hybrid", name: "Hybrid Multi-Strategy", category: "special", icon: Zap, description: "Grid + trend + swing combined", markets: ["Multi-Asset"], strategies: ["Ensemble", "Adaptive"], risk: "high" },
  { id: "divergence", name: "Divergence Scanner", category: "special", icon: GitBranch, description: "RSI/MACD divergence detection", markets: ["Multi-Asset"], strategies: ["Regular Div", "Hidden Div"], risk: "medium" },
  { id: "liquidity-hunt", name: "Liquidity Hunt", category: "special", icon: Crosshair, description: "Detect stop-loss clusters & sweeps", markets: ["Forex", "Crypto"], strategies: ["Stop Hunt", "Liquidity Grab"], risk: "high" },
  { id: "smc", name: "Smart Money Concept", category: "special", icon: Eye, description: "Order blocks + liquidity zones", markets: ["Forex", "Indices"], strategies: ["OB", "FVG", "BOS"], risk: "medium" },
  { id: "harmonic", name: "Harmonic Pattern", category: "special", icon: Waypoints, description: "Auto-detect Gartley, Bat, Butterfly", markets: ["Multi-Asset"], strategies: ["Harmonic Scan", "Ratio"], risk: "medium" },
  { id: "fibonacci", name: "Fibonacci Retracement", category: "special", icon: ScanLine, description: "AI retracement probability scoring", markets: ["Multi-Asset"], strategies: ["Fib Level", "Extension"], risk: "medium" },
  { id: "dca", name: "DCA Bot", category: "special", icon: DollarSign, description: "Dollar-cost averaging engine", markets: ["Crypto", "Stocks"], strategies: ["Fixed DCA", "Smart DCA"], risk: "low" },
  { id: "breakout", name: "Breakout Bot", category: "special", icon: Zap, description: "Volume + price expansion detection", markets: ["Multi-Asset"], strategies: ["Vol Breakout", "Range Break"], risk: "high" },
  { id: "volume-profile", name: "Volume Profile", category: "special", icon: BarChart, description: "High-volume node entries", markets: ["Futures", "Stocks"], strategies: ["POC", "Value Area"], risk: "medium" },
  { id: "order-flow", name: "Order Flow", category: "special", icon: Activity, description: "Level 2 data analysis", markets: ["Futures", "Crypto"], strategies: ["Delta", "Footprint"], risk: "high" },
  { id: "market-structure", name: "Market Structure", category: "special", icon: TrendingUp, description: "HH/HL LH/LL detection", markets: ["Multi-Asset"], strategies: ["BOS", "CHoCH"], risk: "medium" },
  { id: "contrarian", name: "Sentiment Contrarian", category: "special", icon: ArrowRightLeft, description: "Trade opposite crowd extremes", markets: ["Multi-Asset"], strategies: ["Extreme Fear", "Extreme Greed"], risk: "high" },
  { id: "correlation", name: "Correlation Bot", category: "special", icon: Blend, description: "Multi-asset correlation matrix", markets: ["Multi-Asset"], strategies: ["Corr Shift", "Decoupling"], risk: "medium" },
  { id: "drawdown-protect", name: "Drawdown Protection", category: "special", icon: Shield, description: "Auto trade pause on drawdown", markets: ["All"], strategies: ["Max DD", "Trailing DD"], risk: "low" },
  { id: "capital-preserve", name: "Capital Preservation", category: "special", icon: Lock, description: "Low-risk yield optimization", markets: ["Bonds", "Stables"], strategies: ["Yield Farm", "T-Bill"], risk: "low" },
  { id: "swing-news", name: "Swing + News Hybrid", category: "special", icon: Newspaper, description: "Multi-condition engine", markets: ["Stocks", "Forex"], strategies: ["Swing", "Event"], risk: "medium" },
  { id: "auto-hedge", name: "Auto Hedge", category: "special", icon: Umbrella, description: "Portfolio delta neutralization", markets: ["Options", "Futures"], strategies: ["Delta Hedge", "Gamma Scalp"], risk: "medium" },
  { id: "cross-market", name: "Cross-Market", category: "special", icon: Globe, description: "Forex + Crypto correlation trading", markets: ["Forex", "Crypto"], strategies: ["Lead-Lag", "Spread"], risk: "high" },

  { id: "etf-rotation", name: "ETF Rotation", category: "enterprise", icon: PieChart, description: "Sector rotation AI model", markets: ["ETFs"], strategies: ["Momentum Rotate", "Risk Parity"], risk: "medium" },
  { id: "global-macro", name: "Global Macro", category: "enterprise", icon: Globe, description: "Macro indicator driven trades", markets: ["Multi-Asset"], strategies: ["GDP", "Rate Diff"], risk: "high" },
  { id: "event-driven", name: "Event-Driven", category: "enterprise", icon: Calendar, description: "Auto trade earnings, FOMC, CPI", markets: ["Stocks", "Forex"], strategies: ["Event", "Vol Crush"], risk: "high" },
  { id: "multi-broker", name: "Multi-Broker Execution", category: "enterprise", icon: Server, description: "Smart order routing across brokers", markets: ["Multi-Asset"], strategies: ["Best Exec", "SOR"], risk: "medium" },
  { id: "cloud-strategy", name: "Cloud Strategy Manager", category: "enterprise", icon: Cog, description: "Remote strategy control panel", markets: ["All"], strategies: ["Remote Deploy", "Version Control"], risk: "low" },
  { id: "white-label", name: "White-Label Reseller", category: "enterprise", icon: Building2, description: "Multi-client management dashboard", markets: ["All"], strategies: ["Multi-Tenant", "Branded"], risk: "low" },
  { id: "enterprise-erp", name: "Enterprise Trading ERP", category: "enterprise", icon: Boxes, description: "CRM + payments + reports + investor panel", markets: ["All"], strategies: ["Full Suite"], risk: "low" },
];

export const getRiskColor = (risk: BotType["risk"]) => {
  switch (risk) {
    case "low": return "text-success";
    case "medium": return "text-warning";
    case "high": return "text-destructive";
    case "ultra": return "text-destructive font-bold";
  }
};

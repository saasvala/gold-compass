import { motion } from "framer-motion";
import { PieChart, TrendingUp, DollarSign, BarChart3, Eye, Shield } from "lucide-react";

const portfolio = [
  { name: "Gold Bot (SMC)", allocation: "35%", pnl: "+$4,200", status: "active" },
  { name: "Forex Majors", allocation: "25%", pnl: "+$1,890", status: "active" },
  { name: "Crypto BTC", allocation: "20%", pnl: "+$980", status: "active" },
  { name: "AI Trend", allocation: "15%", pnl: "+$650", status: "active" },
  { name: "Cash Reserve", allocation: "5%", pnl: "$0", status: "idle" },
];

const InvestorDashboard = () => (
  <div className="space-y-4">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-2">
      <Eye className="w-5 h-5 text-primary" />
      <h2 className="text-sm font-bold gold-text uppercase tracking-wider">Investor Portfolio</h2>
    </motion.div>

    <div className="grid grid-cols-2 gap-3">
      {[
        { icon: DollarSign, label: "Portfolio Value", value: "$124,800", sub: "+12.4% MTD" },
        { icon: TrendingUp, label: "Total P/L", value: "+$7,720", sub: "Since inception" },
        { icon: BarChart3, label: "Monthly ROI", value: "+6.2%", sub: "Avg 5.8%" },
        { icon: Shield, label: "Max Drawdown", value: "4.1%", sub: "Limit: 10%" },
      ].map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass-card gold-border rounded-xl p-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg gold-gradient flex items-center justify-center">
              <s.icon className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
          <p className="text-lg font-bold font-mono text-foreground">{s.value}</p>
          <p className="text-[10px] text-success">{s.sub}</p>
        </motion.div>
      ))}
    </div>

    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card gold-border rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <PieChart className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Allocation</p>
      </div>
      <div className="space-y-2">
        {portfolio.map((p, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-8 rounded-full ${p.status === "active" ? "gold-gradient" : "bg-muted"}`} />
              <div>
                <p className="text-xs font-semibold text-foreground">{p.name}</p>
                <p className="text-[9px] text-muted-foreground">{p.allocation}</p>
              </div>
            </div>
            <span className={`text-xs font-mono ${p.pnl.startsWith("+") ? "text-success" : "text-muted-foreground"}`}>
              {p.pnl}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  </div>
);

export default InvestorDashboard;

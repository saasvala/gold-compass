import { motion } from "framer-motion";
import { Users, Bot, DollarSign, TrendingUp, Shield, Activity, Globe, Settings } from "lucide-react";

const stats = [
  { icon: Users, label: "Total Users", value: "1,247", change: "+23 today", trend: "up" },
  { icon: Bot, label: "Active Bots", value: "3,891", change: "89% uptime", trend: "up" },
  { icon: DollarSign, label: "Revenue (MTD)", value: "$48,290", change: "+18.4%", trend: "up" },
  { icon: TrendingUp, label: "Total Volume", value: "$2.4M", change: "+$180K today", trend: "up" },
];

const recentUsers = [
  { name: "Alex M.", role: "Trader", bots: 5, pnl: "+$1,240" },
  { name: "Sarah K.", role: "Investor", bots: 2, pnl: "+$890" },
  { name: "Mike R.", role: "Reseller", bots: 0, pnl: "N/A" },
  { name: "Lisa T.", role: "Trader", bots: 8, pnl: "-$120" },
];

const AdminDashboard = () => (
  <div className="space-y-4">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-2">
      <Shield className="w-5 h-5 text-primary" />
      <h2 className="text-sm font-bold gold-text uppercase tracking-wider">Admin Control Center</h2>
    </motion.div>

    <div className="grid grid-cols-2 gap-3">
      {stats.map((s, i) => (
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
          <p className="text-[10px] text-success">{s.change}</p>
        </motion.div>
      ))}
    </div>

    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card gold-border rounded-xl p-4"
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Recent Users</p>
      <div className="space-y-2">
        {recentUsers.map((u, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                {u.name[0]}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{u.name}</p>
                <p className="text-[9px] text-muted-foreground">{u.role} · {u.bots} bots</p>
              </div>
            </div>
            <span className={`text-xs font-mono ${u.pnl.startsWith("+") ? "text-success" : u.pnl.startsWith("-") ? "text-destructive" : "text-muted-foreground"}`}>
              {u.pnl}
            </span>
          </div>
        ))}
      </div>
    </motion.div>

    <div className="grid grid-cols-2 gap-2">
      {[
        { icon: Globe, label: "System Status", desc: "All systems operational" },
        { icon: Activity, label: "API Health", desc: "99.9% uptime" },
        { icon: Settings, label: "Config", desc: "12 active rules" },
        { icon: Shield, label: "Security", desc: "0 alerts" },
      ].map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + i * 0.05 }}
          className="glass-card rounded-xl p-3 flex items-center gap-2"
        >
          <item.icon className="w-4 h-4 text-primary shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-foreground">{item.label}</p>
            <p className="text-[9px] text-muted-foreground">{item.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export default AdminDashboard;

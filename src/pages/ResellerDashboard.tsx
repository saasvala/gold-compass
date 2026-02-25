import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, DollarSign, Share2, TrendingUp, Link, Copy, Gift,
  ChevronDown, ChevronUp, BarChart3, Palette, Globe, Shield,
  ArrowUpRight, Settings, Eye,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import { toast } from "sonner";

const generateRevenue = (days: number) => {
  const data = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: +(20 + Math.random() * 80).toFixed(0),
      signups: Math.floor(Math.random() * 5),
    });
  }
  return data;
};

const clients = [
  { name: "John D.", plan: "Pro", commission: "$49", status: "active", date: "Feb 22", mrr: 49, bots: 3 },
  { name: "Emma S.", plan: "Elite", commission: "$99", status: "active", date: "Feb 21", mrr: 99, bots: 7 },
  { name: "Chris W.", plan: "Pro", commission: "$49", status: "active", date: "Feb 20", mrr: 49, bots: 2 },
  { name: "Kate L.", plan: "Starter", commission: "$19", status: "active", date: "Feb 19", mrr: 19, bots: 1 },
  { name: "Marco P.", plan: "Elite", commission: "$99", status: "churned", date: "Feb 15", mrr: 0, bots: 0 },
  { name: "Lisa T.", plan: "Pro", commission: "$49", status: "active", date: "Feb 12", mrr: 49, bots: 4 },
  { name: "Alex K.", plan: "Starter", commission: "$19", status: "trial", date: "Feb 24", mrr: 0, bots: 1 },
];

const tiers = [
  { name: "Bronze", min: 0, rate: "20%", active: false },
  { name: "Silver", min: 10, rate: "25%", active: false },
  { name: "Gold", min: 25, rate: "30%", active: true },
  { name: "Platinum", min: 50, rate: "40%", active: false },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card gold-border rounded-lg px-3 py-2 text-xs">
      <p className="text-muted-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-mono font-bold gold-text">
          {p.name === "revenue" ? `$${p.value}` : `${p.value} signups`}
        </p>
      ))}
    </div>
  );
};

const ResellerDashboard = () => {
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState("all");
  const revenueData = useMemo(() => generateRevenue(30), []);

  const activeClients = clients.filter((c) => c.status === "active").length;
  const totalMrr = clients.reduce((s, c) => s + c.mrr, 0);
  const churnRate = ((clients.filter((c) => c.status === "churned").length / clients.length) * 100).toFixed(0);

  const filteredClients = clients.filter((c) =>
    clientFilter === "all" || c.status === clientFilter
  );

  const copyLink = () => {
    navigator.clipboard.writeText("https://tradingbot.app/ref/YOUR_CODE");
    toast.success("Referral link copied!");
  };

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-2">
        <Share2 className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-bold gold-text uppercase tracking-wider">White-Label Reseller Hub</h2>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Users, label: "Active Clients", value: activeClients.toString(), sub: `${clients.length} total`, up: true },
          { icon: DollarSign, label: "Monthly MRR", value: `$${totalMrr}`, sub: "+$168 growth", up: true },
          { icon: TrendingUp, label: "Conv. Rate", value: "12.4%", sub: "Industry avg: 8%", up: true },
          { icon: Gift, label: "Tier", value: "Gold", sub: "30% commission", up: true },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card gold-border rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg gold-gradient flex items-center justify-center">
                <s.icon className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </div>
            <p className="text-lg font-bold font-mono text-foreground">{s.value}</p>
            <p className={`text-[10px] flex items-center gap-0.5 ${s.up ? "text-success" : "text-destructive"}`}>
              <ArrowUpRight className="w-3 h-3" />{s.sub}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-card gold-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Revenue (30d)</p>
          <span className="ml-auto text-xs font-mono text-success">+$2,180</span>
        </div>
        <div className="h-32 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData}>
              <XAxis dataKey="date" tick={{ fontSize: 8, fill: "hsl(220,10%,50%)" }} axisLine={false} tickLine={false} interval={6} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="hsl(43,96%,56%)" radius={[2, 2, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Referral Link */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card gold-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Link className="w-4 h-4 text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Your Referral Link</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 p-2 rounded-lg bg-secondary/50 text-[10px] font-mono text-muted-foreground truncate">
            https://tradingbot.app/ref/YOUR_CODE
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={copyLink}
            className="w-9 h-9 rounded-lg gold-gradient flex items-center justify-center shrink-0">
            <Copy className="w-4 h-4 text-primary-foreground" />
          </motion.button>
        </div>
      </motion.div>

      {/* Commission Tiers */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
        className="glass-card gold-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-4 h-4 text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Commission Tiers</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {tiers.map((t) => (
            <div key={t.name} className={`text-center p-2 rounded-lg ${t.active ? "gold-gradient" : "bg-secondary/30"}`}>
              <p className={`text-[10px] font-bold ${t.active ? "text-primary-foreground" : "text-foreground"}`}>{t.name}</p>
              <p className={`text-sm font-mono font-bold ${t.active ? "text-primary-foreground" : "text-muted-foreground"}`}>{t.rate}</p>
              <p className={`text-[8px] ${t.active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{t.min}+ clients</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* White-Label Branding */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glass-card gold-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Branding Controls</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Globe, label: "Custom Domain", desc: "yourbot.com", active: true },
            { icon: Palette, label: "Brand Colors", desc: "Gold theme", active: true },
            { icon: Eye, label: "Logo Upload", desc: "Uploaded", active: true },
            { icon: Settings, label: "Email Templates", desc: "3 active", active: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
              <item.icon className={`w-4 h-4 shrink-0 ${item.active ? "text-success" : "text-muted-foreground"}`} />
              <div>
                <p className="text-[10px] font-bold text-foreground">{item.label}</p>
                <p className="text-[9px] text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Client Management */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-card gold-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Client Management</p>
          </div>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-2 py-1 rounded-lg bg-secondary/50 text-[10px] text-foreground focus:outline-none"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="churned">Churned</option>
          </select>
        </div>

        <div className="flex items-center justify-between px-1 mb-2">
          <p className="text-[9px] text-muted-foreground">{filteredClients.length} clients</p>
          <p className="text-[9px] text-muted-foreground">Churn: <span className="text-destructive">{churnRate}%</span></p>
        </div>

        <div className="space-y-2 max-h-[350px] overflow-y-auto">
          {filteredClients.map((c, i) => {
            const isExpanded = expandedClient === c.name;
            return (
              <motion.div key={c.name} layout className="rounded-lg bg-secondary/30 overflow-hidden">
                <button onClick={() => setExpandedClient(isExpanded ? null : c.name)} className="w-full flex items-center justify-between p-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                      {c.name[0]}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-foreground">{c.name}</p>
                      <p className="text-[9px] text-muted-foreground">{c.plan} · {c.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                      c.status === "active" ? "bg-success/20 text-success" :
                      c.status === "trial" ? "bg-warning/20 text-warning" :
                      "bg-destructive/20 text-destructive"
                    }`}>{c.status}</span>
                    <span className="text-xs font-mono text-success">{c.commission}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="px-2.5 pb-2.5">
                      <div className="pt-2 border-t border-border/30 grid grid-cols-3 gap-2 text-center">
                        <div className="p-1.5 rounded bg-secondary/50">
                          <p className="text-[10px] font-mono font-bold text-foreground">{c.bots}</p>
                          <p className="text-[8px] text-muted-foreground">Bots</p>
                        </div>
                        <div className="p-1.5 rounded bg-secondary/50">
                          <p className="text-[10px] font-mono font-bold text-foreground">${c.mrr}</p>
                          <p className="text-[8px] text-muted-foreground">MRR</p>
                        </div>
                        <div className="p-1.5 rounded bg-secondary/50">
                          <p className="text-[10px] font-mono font-bold text-foreground">{c.plan}</p>
                          <p className="text-[8px] text-muted-foreground">Plan</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default ResellerDashboard;

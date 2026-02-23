import { motion } from "framer-motion";
import { Users, DollarSign, Share2, TrendingUp, Link, Copy, Gift } from "lucide-react";
import { toast } from "sonner";

const referrals = [
  { name: "John D.", plan: "Pro", commission: "$49", date: "Feb 22" },
  { name: "Emma S.", plan: "Elite", commission: "$99", date: "Feb 21" },
  { name: "Chris W.", plan: "Pro", commission: "$49", date: "Feb 20" },
  { name: "Kate L.", plan: "Starter", commission: "$19", date: "Feb 19" },
];

const ResellerDashboard = () => {
  const copyLink = () => {
    navigator.clipboard.writeText("https://tradingbot.app/ref/YOUR_CODE");
    toast.success("Referral link copied!");
  };

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-2">
        <Share2 className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-bold gold-text uppercase tracking-wider">Reseller Hub</h2>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Users, label: "Referrals", value: "47", sub: "+8 this month" },
          { icon: DollarSign, label: "Commissions", value: "$2,180", sub: "+$420 MTD" },
          { icon: TrendingUp, label: "Conv. Rate", value: "12.4%", sub: "Industry avg: 8%" },
          { icon: Gift, label: "Tier", value: "Gold", sub: "30% commission" },
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

      {/* Referral Link */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card gold-border rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <Link className="w-4 h-4 text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Your Referral Link</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 p-2 rounded-lg bg-secondary/50 text-[10px] font-mono text-muted-foreground truncate">
            https://tradingbot.app/ref/YOUR_CODE
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={copyLink}
            className="w-9 h-9 rounded-lg gold-gradient flex items-center justify-center shrink-0"
          >
            <Copy className="w-4 h-4 text-primary-foreground" />
          </motion.button>
        </div>
      </motion.div>

      {/* Recent referrals */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card gold-border rounded-xl p-4"
      >
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Recent Referrals</p>
        <div className="space-y-2">
          {referrals.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                  {r.name[0]}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{r.name}</p>
                  <p className="text-[9px] text-muted-foreground">{r.plan} · {r.date}</p>
                </div>
              </div>
              <span className="text-xs font-mono text-success">{r.commission}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ResellerDashboard;

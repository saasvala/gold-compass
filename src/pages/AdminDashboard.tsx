import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Bot, DollarSign, TrendingUp, Shield, Activity, Globe, Settings, Crown, UserCog, Search, ChevronDown, ChevronUp } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { useUserRole, type AppRole } from "@/hooks/use-user-role";
import { toast } from "sonner";

const ROLE_OPTIONS: { value: AppRole; label: string; color: string }[] = [
  { value: "admin", label: "Admin", color: "text-destructive" },
  { value: "trader", label: "Trader", color: "text-primary" },
  { value: "investor", label: "Investor", color: "text-success" },
  { value: "reseller", label: "Reseller", color: "text-warning" },
];

const AdminDashboard = () => {
  const { users, stats, loading, updateUserRole } = useAdmin();
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const filteredUsers = users.filter((u) => {
    const matchSearch = !search || 
      u.profile.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.profile.user_id.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    const err = await updateUserRole(userId, newRole);
    if (err) toast.error("Failed to update role");
    else toast.success(`Role updated to ${newRole}`);
  };

  const statCards = [
    { icon: Users, label: "Total Users", value: stats.totalUsers.toString(), sub: "registered", color: "text-primary" },
    { icon: Bot, label: "Active Bots", value: stats.activeBots.toString(), sub: "running now", color: "text-success" },
    { icon: Activity, label: "Total Trades", value: stats.totalTrades.toString(), sub: "executed", color: "text-warning" },
    { icon: DollarSign, label: "Volume", value: `$${(stats.totalVolume / 1000).toFixed(0)}K`, sub: "estimated", color: "text-primary" },
  ];

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-2">
        <Shield className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-bold gold-text uppercase tracking-wider">Admin Control Center</h2>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card gold-border rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg gold-gradient flex items-center justify-center">
                <s.icon className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </div>
            <p className="text-lg font-bold font-mono text-foreground">{s.value}</p>
            <p className={`text-[10px] ${s.color}`}>{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* System Status */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: Globe, label: "System", desc: "Operational", ok: true },
          { icon: Activity, label: "API", desc: "99.9% uptime", ok: true },
          { icon: Settings, label: "Config", desc: `${users.length} users`, ok: true },
          { icon: Shield, label: "Security", desc: "0 alerts", ok: true },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.05 }}
            className="glass-card rounded-xl p-3 flex items-center gap-2">
            <item.icon className={`w-4 h-4 shrink-0 ${item.ok ? "text-success" : "text-destructive"}`} />
            <div>
              <p className="text-[10px] font-bold text-foreground">{item.label}</p>
              <p className="text-[9px] text-muted-foreground">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* User Management */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glass-card gold-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <UserCog className="w-4 h-4 text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">User Management</p>
          <span className="ml-auto text-[10px] font-mono text-muted-foreground">{filteredUsers.length} users</span>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-secondary/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2 py-2 rounded-lg bg-secondary/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="all">All Roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* User List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="text-center py-4 text-xs text-muted-foreground">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">No users found</div>
          ) : (
            <AnimatePresence>
              {filteredUsers.map((u) => {
                const isExpanded = expandedUser === u.profile.user_id;
                const roleInfo = ROLE_OPTIONS.find((r) => r.value === u.role);
                return (
                  <motion.div key={u.profile.user_id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="rounded-lg bg-secondary/30 overflow-hidden">
                    <button
                      onClick={() => setExpandedUser(isExpanded ? null : u.profile.user_id)}
                      className="w-full flex items-center justify-between p-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                          {(u.profile.display_name || "U")[0].toUpperCase()}
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold text-foreground">{u.profile.display_name || "Unknown"}</p>
                          <p className="text-[9px] text-muted-foreground">
                            <span className={roleInfo?.color}>{u.role}</span> · {u.botCount} bots
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                          u.subscription?.status === "active" ? "bg-success/20 text-success" : "bg-secondary text-muted-foreground"
                        }`}>
                          {u.subscription?.plan || "free"}
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-2.5 pb-2.5"
                        >
                          <div className="pt-2 border-t border-border/30 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] text-muted-foreground">Change Role</p>
                              <div className="flex gap-1">
                                {ROLE_OPTIONS.map((r) => (
                                  <motion.button
                                    key={r.value}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleRoleChange(u.profile.user_id, r.value)}
                                    className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${
                                      u.role === r.value
                                        ? "gold-gradient text-primary-foreground"
                                        : "bg-secondary/50 text-muted-foreground"
                                    }`}
                                  >
                                    {r.label}
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="p-1.5 rounded bg-secondary/50">
                                <p className="text-[10px] font-mono font-bold text-foreground">{u.botCount}</p>
                                <p className="text-[8px] text-muted-foreground">Bots</p>
                              </div>
                              <div className="p-1.5 rounded bg-secondary/50">
                                <p className="text-[10px] font-mono font-bold text-foreground">{u.subscription?.plan || "free"}</p>
                                <p className="text-[8px] text-muted-foreground">Plan</p>
                              </div>
                              <div className="p-1.5 rounded bg-secondary/50">
                                <p className="text-[10px] font-mono font-bold text-foreground">
                                  {new Date(u.profile.created_at).toLocaleDateString("en", { month: "short", day: "numeric" })}
                                </p>
                                <p className="text-[8px] text-muted-foreground">Joined</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;

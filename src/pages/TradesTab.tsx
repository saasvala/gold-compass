import { motion } from "framer-motion";
import TradeCard from "@/components/dashboard/TradeCard";
import { Filter, Loader2 } from "lucide-react";
import { useOrders } from "@/hooks/use-orders";

const TradesTab = () => {
  const { orders, loading } = useOrders();

  const stats = (() => {
    const filled = orders.filter(o => o.status === "filled");
    const wins = filled.filter(o => (o.avg_fill_price ?? 0) > 0);
    const winRate = filled.length > 0 ? Math.round((wins.length / filled.length) * 100) : 0;
    return {
      total: orders.length,
      winRate: `${winRate}%`,
      netPnl: "$0.00",
    };
  })();

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Recent Orders</p>
          <p className="text-lg font-bold gold-text">{orders.length} Orders</p>
        </div>
        <button className="glass-card gold-border rounded-lg p-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
        </button>
      </motion.div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Win Rate", value: stats.winRate, color: "text-success" },
          { label: "Total", value: `${stats.total}`, color: "gold-text" },
          { label: "Net P/L", value: stats.netPnl, color: "text-success" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card gold-border rounded-xl p-3 text-center"
          >
            <p className="text-[9px] text-muted-foreground uppercase">{stat.label}</p>
            <p className={`text-sm font-bold font-mono ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card gold-border rounded-xl p-6 text-center"
        >
          <p className="text-sm text-muted-foreground">No orders yet. Place your first trade!</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {orders.slice(0, 20).map((order, i) => (
            <TradeCard
              key={order.id}
              type={order.side.toUpperCase() as "BUY" | "SELL"}
              entry={order.price?.toString() || "Market"}
              sl={order.stop_price?.toString() || "—"}
              tp="—"
              profit={order.status === "filled" ? `Filled @ ${order.avg_fill_price || "—"}` : order.status}
              time={new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              delay={i * 0.08}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TradesTab;

import { motion } from "framer-motion";

interface StatusBadgeProps {
  label: string;
  active: boolean;
  icon?: React.ReactNode;
}

const StatusBadge = ({ label, active, icon }: StatusBadgeProps) => (
  <motion.div
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
      active
        ? "gold-border gold-glow bg-primary/10 text-primary"
        : "border border-border bg-secondary text-muted-foreground"
    }`}
  >
    {icon}
    <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-primary pulse-gold" : "bg-muted-foreground"}`} />
    {label}
  </motion.div>
);

export default StatusBadge;

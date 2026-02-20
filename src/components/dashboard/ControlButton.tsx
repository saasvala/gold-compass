import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface ControlButtonProps {
  icon: LucideIcon;
  label: string;
  variant?: "primary" | "danger" | "secondary";
  active?: boolean;
  onClick?: () => void;
}

const ControlButton = ({ icon: Icon, label, variant = "secondary", active, onClick }: ControlButtonProps) => {
  const styles = {
    primary: "gold-gradient gold-glow-strong text-primary-foreground",
    danger: "bg-destructive/20 border border-destructive/40 text-destructive",
    secondary: "glass-card gold-border text-foreground",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${styles[variant]} ${
        active ? "gold-glow" : ""
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
    </motion.button>
  );
};

export default ControlButton;

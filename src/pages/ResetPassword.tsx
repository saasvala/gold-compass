import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Loader2, Gem, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      navigate("/auth");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl gold-gradient gold-glow-strong flex items-center justify-center mb-4">
            <Gem className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold gold-text">New Password</h1>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-success" />
            <p className="text-sm text-foreground">Password updated! Redirecting...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">New Password</label>
              <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-xl px-3 py-2.5 focus-within:border-primary/50 transition-all">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            {error && <p className="text-xs text-destructive text-center">{error}</p>}

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl gold-gradient gold-glow-strong text-primary-foreground font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;

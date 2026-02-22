import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2, Gem } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
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
          <h1 className="text-xl font-bold gold-text">Reset Password</h1>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-foreground">Check your email for a reset link.</p>
            <button onClick={() => navigate("/auth")} className="text-xs text-primary hover:underline">
              Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Email</label>
              <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-xl px-3 py-2.5 focus-within:border-primary/50 transition-all">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@example.com"
                  required
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
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
            </motion.button>
          </form>
        )}

        <button
          onClick={() => navigate("/auth")}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mx-auto mt-4 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Back to login
        </button>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;

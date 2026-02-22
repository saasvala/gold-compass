import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Gem, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl gold-gradient gold-glow-strong flex items-center justify-center mb-4">
            <Gem className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold gold-text">XAUUSD Hybrid AI</h1>
          <p className="text-xs text-muted-foreground mt-1">Institutional Trading System</p>
        </motion.div>

        {/* Toggle */}
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl mb-6">
          {(["Login", "Sign Up"] as const).map((tab) => {
            const active = (tab === "Login") === isLogin;
            return (
              <button
                key={tab}
                onClick={() => { setIsLogin(tab === "Login"); setError(""); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all relative ${
                  active ? "text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="authTab"
                    className="absolute inset-0 gold-gradient rounded-lg"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab}</span>
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Display Name</label>
                <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-xl px-3 py-2.5 focus-within:border-primary/50 transition-all">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Password</label>
            <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-xl px-3 py-2.5 focus-within:border-primary/50 transition-all">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-destructive text-center bg-destructive/10 p-2 rounded-lg"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl gold-gradient gold-glow-strong text-primary-foreground font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? "Login" : "Create Account"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {isLogin && (
          <p className="text-center mt-4">
            <button
              onClick={() => navigate("/forgot-password")}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot password?
            </button>
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default AuthPage;

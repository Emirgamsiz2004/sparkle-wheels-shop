import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.svg";

const AdminLogin = () => {
  const [email, setEmail] = useState(() => localStorage.getItem("admin_email") || "");
  const [password, setPassword] = useState(() => localStorage.getItem("admin_pw") || "");
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("admin_remember") === "true");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error("Ongeldige inloggegevens");
    } else {
      if (rememberMe) {
        localStorage.setItem("admin_email", email);
        localStorage.setItem("admin_pw", password);
        localStorage.setItem("admin_remember", "true");
      } else {
        localStorage.removeItem("admin_email");
        localStorage.removeItem("admin_pw");
        localStorage.removeItem("admin_remember");
      }
      navigate("/admin/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="admin-theme min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <div className="flex justify-center mb-10">
          <img src={logo} alt="PLA Auto's" className="h-10 w-auto brightness-0 invert opacity-80" />
        </div>

        <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3 text-center">
          Admin
        </p>
        <h1 className="text-2xl font-display font-bold text-foreground tracking-tight mb-10 text-center">
          Inloggen
        </h1>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-body font-medium tracking-[0.2em] uppercase text-muted-foreground">
              E-mailadres
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              placeholder="admin@plaautos.nl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-body font-medium tracking-[0.2em] uppercase text-muted-foreground">
              Wachtwoord
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-3.5 text-xs font-semibold tracking-[0.15em] uppercase hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 mt-8"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Inloggen"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;

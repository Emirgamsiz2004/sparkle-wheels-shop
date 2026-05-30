import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

function initialsFromEmail(email?: string | null): string {
  if (!email) return "?";
  const name = email.split("@")[0] || "";
  const parts = name.split(/[._-]+/).filter(Boolean);
  const letters = parts.length >= 2
    ? parts[0][0] + parts[1][0]
    : (name.slice(0, 2) || "?");
  return letters.toUpperCase();
}

function nameFromEmail(email?: string | null): string {
  if (!email) return "Gebruiker";
  const local = email.split("@")[0] || "";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ") || email;
}

export default function HeaderProfile() {
  const { user, signOut, role } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;
  const displayName = nameFromEmail(user.email);
  const initials = initialsFromEmail(user.email);
  const roleLabel = role === "admin" ? "Admin" : role === "medewerker" ? "Medewerker" : "Gebruiker";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-accent/50 transition-colors"
      >
        <span className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[10px] font-semibold text-emerald-400 tracking-wide">
          {initials}
        </span>
        <span className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-[12px] font-medium text-foreground">{displayName}</span>
          <span className="text-[10px] text-muted-foreground">{roleLabel}</span>
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-md shadow-lg overflow-hidden z-50"
          >
            <div className="px-3 py-2.5 border-b border-border">
              <p className="text-[12px] font-medium text-foreground truncate">{displayName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
            <Link
              to="/admin/instellingen"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-[12px] text-foreground hover:bg-accent/50 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 opacity-70" />
              Instellingen
            </Link>
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-foreground hover:bg-accent/50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 opacity-70" />
              Uitloggen
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Car, ShoppingCart, Wallet, Settings, LogOut,
  Users, Clock, CalendarDays, BadgeDollarSign, Inbox, ClipboardCheck, X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface NavItem { label: string; icon: typeof LayoutDashboard; path: string; medewerker?: boolean; }

const NAV: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard", medewerker: true },
  { label: "Voertuigen", icon: Car, path: "/admin/voertuigen" },
  { label: "Inkoop", icon: ShoppingCart, path: "/admin/inkoop", medewerker: true },
  { label: "Verkoop", icon: BadgeDollarSign, path: "/admin/verkopen" },
  { label: "Klanten", icon: Users, path: "/admin/klanten" },
  { label: "Proefritten", icon: ClipboardCheck, path: "/admin/proefriten", medewerker: true },
  { label: "Planning", icon: CalendarDays, path: "/admin/planning", medewerker: true },
  { label: "Financiën", icon: Wallet, path: "/admin/financieel" },
  { label: "Uren", icon: Clock, path: "/admin/uren", medewerker: true },
  { label: "Aanmeldingen", icon: Inbox, path: "/admin/aanmeldingen" },
  { label: "Instellingen", icon: Settings, path: "/admin/instellingen", medewerker: true },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ open, onClose }: Props) {
  const location = useLocation();
  const { isAdmin, signOut, user } = useAuth();
  const items = isAdmin ? NAV : NAV.filter((i) => i.medewerker);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  // Close on route change
  const lastPath = useRef(location.pathname);
  useEffect(() => {
    if (lastPath.current !== location.pathname) {
      lastPath.current = location.pathname;
      if (open) onClose();
    }
  }, [location.pathname, open, onClose]);

  // Block body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Swipe-left to close
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (dx < -50 && dy < 60) onClose();
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div className={`lg:hidden fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!open}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 transition-opacity duration-[250ms] ease-out ${open ? "opacity-100" : "opacity-0"}`}
      />
      {/* Sidebar */}
      <aside
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className={`absolute inset-y-0 left-0 w-[80%] max-w-[300px] bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] flex flex-col shadow-xl transition-transform duration-[250ms] ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="h-14 px-4 flex items-center justify-between border-b border-[hsl(var(--sidebar-border))]">
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">Menu</span>
          <button
            onClick={onClose}
            aria-label="Sluiten"
            className="text-muted-foreground hover:text-foreground p-2 -mr-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <div className="space-y-px">
            {items.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                    active
                      ? "bg-emerald-500/10 text-emerald-500 font-medium"
                      : "text-[hsl(var(--sidebar-foreground))] hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0 opacity-80" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-3 border-t border-[hsl(var(--sidebar-border))]">
          <p className="text-sm font-medium text-foreground px-1">Platin Automotive</p>
          <p className="text-[11px] text-muted-foreground truncate px-1 mb-2">{user?.email}</p>
          <button
            onClick={() => { onClose(); signOut(); }}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm border border-border rounded-md text-foreground hover:bg-accent transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Uitloggen
          </button>
        </div>
      </aside>
    </div>
  );
}

export function getMobilePageTitle(pathname: string): string {
  const matches = NAV.filter(
    (i) => pathname === i.path || pathname.startsWith(i.path + "/")
  ).sort((a, b) => b.path.length - a.path.length);
  return matches[0]?.label ?? "Admin";
}

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Car, BadgeDollarSign, Users, MoreHorizontal,
  ShoppingCart, ClipboardCheck, CalendarDays, Wallet, Clock, Inbox, Settings, X, LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface NavItem { label: string; icon: typeof LayoutDashboard; path: string; medewerker?: boolean; }

const PRIMARY: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard", medewerker: true },
  { label: "Voertuigen", icon: Car, path: "/admin/voertuigen" },
  { label: "Verkopen", icon: BadgeDollarSign, path: "/admin/verkopen" },
  { label: "Klanten", icon: Users, path: "/admin/klanten" },
];

const MORE: NavItem[] = [
  { label: "Inkoop", icon: ShoppingCart, path: "/admin/inkoop", medewerker: true },
  { label: "Proefritten", icon: ClipboardCheck, path: "/admin/proefriten", medewerker: true },
  { label: "Planning", icon: CalendarDays, path: "/admin/planning", medewerker: true },
  { label: "Financiën", icon: Wallet, path: "/admin/financieel" },
  { label: "Uren", icon: Clock, path: "/admin/uren", medewerker: true },
  { label: "Aanmeldingen", icon: Inbox, path: "/admin/aanmeldingen" },
  { label: "Instellingen", icon: Settings, path: "/admin/instellingen", medewerker: true },
];

export default function MobileBottomBar() {
  const location = useLocation();
  const { isAdmin, signOut, user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const filterByRole = (items: NavItem[]) =>
    isAdmin ? items : items.filter((i) => i.medewerker);

  const primary = filterByRole(PRIMARY);
  const more = filterByRole(MORE);
  const moreActive = more.some((i) => isActive(i.path));

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[hsl(var(--sidebar-background))] border-t border-[hsl(var(--sidebar-border))]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-5 h-14">
          {primary.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? "text-emerald-500" : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
              moreActive ? "text-emerald-500" : "text-muted-foreground"
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">Meer</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-background flex flex-col"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="h-14 px-4 flex items-center justify-between border-b border-border">
            <span className="text-base font-medium text-foreground">Meer</span>
            <button
              onClick={() => setMoreOpen(false)}
              className="text-muted-foreground hover:text-foreground p-2 -mr-2"
              aria-label="Sluiten"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-3 gap-3">
              {more.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMoreOpen(false)}
                    className={`flex flex-col items-center justify-center gap-2 aspect-square rounded-lg border transition-colors ${
                      active
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                        : "border-border bg-card text-foreground"
                    }`}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="p-4 border-t border-border">
            <p className="text-[11px] text-muted-foreground truncate mb-2">{user?.email}</p>
            <button
              onClick={() => { setMoreOpen(false); signOut(); }}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm border border-border rounded-md text-foreground hover:bg-accent transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Uitloggen
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function getMobilePageTitle(pathname: string): string {
  const ALL = [...PRIMARY, ...MORE];
  // Prefer the longest matching path
  const matches = ALL.filter(
    (i) => pathname === i.path || pathname.startsWith(i.path + "/")
  ).sort((a, b) => b.path.length - a.path.length);
  return matches[0]?.label ?? "Admin";
}

import { useEffect, useState, useCallback } from "react";
import { useNavigate, Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Car, ShoppingCart, Wallet, BarChart3,
  Megaphone, Newspaper, FileText, Settings, LogOut, Menu, X, Receipt, Link2, ClipboardCheck, Archive, Users, Target, Clock, CalendarDays, BadgeDollarSign,
} from "lucide-react";
import logo from "@/assets/logo.png";
import NotificationBell from "@/components/admin/NotificationBell";
import GlobalActiveBar from "@/components/admin/GlobalActiveBar";
import GlobalSearch from "@/components/admin/GlobalSearch";

interface NavItem { label: string; icon: typeof LayoutDashboard; path: string; }
interface NavGroup { label: string; items: NavItem[]; }

const navGroups: NavGroup[] = [
  {
    label: "",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
      { label: "Voertuigen", icon: Car, path: "/admin/voertuigen" },
      { label: "Inkoop", icon: ShoppingCart, path: "/admin/inkoop" },
      { label: "Proefriten", icon: ClipboardCheck, path: "/admin/proefriten" },
      { label: "Verkopen", icon: BadgeDollarSign, path: "/admin/verkopen" },
      { label: "Klanten", icon: Users, path: "/admin/klanten" },
      { label: "Planning", icon: CalendarDays, path: "/admin/planning" },
    ],
  },
  {
    label: "Financiën",
    items: [
      { label: "Financiën", icon: Wallet, path: "/admin/financieel" },
      { label: "Uren", icon: Clock, path: "/admin/uren" },
    ],
  },
];

const AdminLayout = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [overdueLeads, setOverdueLeads] = useState(0);

  // Fetch overdue leads count
  useEffect(() => {
    if (!user) return;
    const fetchOverdue = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .not("status", "in", '("gewonnen","verloren")')
        .lt("volgende_actie_datum", today);
      setOverdueLeads(count || 0);
    };
    fetchOverdue();
    const interval = setInterval(fetchOverdue, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Fetch upcoming appointment badge (within 30 min)
  const [upcomingAppts, setUpcomingAppts] = useState(0);
  useEffect(() => {
    if (!user) return;
    const fetchUpcoming = async () => {
      const now = new Date();
      const soon = new Date(now.getTime() + 30 * 60 * 1000);
      const { count } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("status", "gepland")
        .gte("datum_tijd", now.toISOString())
        .lte("datum_tijd", soon.toISOString());
      setUpcomingAppts(count || 0);
    };
    fetchUpcoming();
    const interval = setInterval(fetchUpcoming, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) navigate("/admin/login");
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="admin-theme min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground/30" />
      </div>
    );
  }

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="admin-theme min-h-screen flex bg-background overflow-x-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[240px] bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] flex flex-col transition-transform duration-200 ease-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-14 px-4 flex items-center justify-between border-b border-[hsl(var(--sidebar-border))]">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5">
            <img src={logo} alt="Platin" className="h-7 w-auto object-contain" loading="eager" decoding="sync" />
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">Admin</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="px-3 mb-1.5 text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground/40">
                  {group.label}
                </p>
              )}
              <div className="space-y-px">
                {group.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] transition-colors ${
                      isActive(item.path)
                        ? "bg-accent text-foreground font-medium"
                        : "text-[hsl(var(--sidebar-foreground))] hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0 opacity-70" />
                    <span className="flex-1">{item.label}</span>
                    {item.path === "/admin/leads" && overdueLeads > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground">
                        {overdueLeads}
                      </span>
                    )}
                    {item.path === "/admin/planning" && upcomingAppts > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-accent text-accent-foreground">
                        {upcomingAppts}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-2 border-t border-[hsl(var(--sidebar-border))]">
          <Link
            to="/admin/instellingen"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] transition-colors ${
              isActive("/admin/instellingen")
                ? "bg-accent text-foreground font-medium"
                : "text-[hsl(var(--sidebar-foreground))] hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <Settings className="w-4 h-4 opacity-70" />
            Instellingen
          </Link>
          <div className="mt-1.5 pt-1.5 border-t border-[hsl(var(--sidebar-border))]">
            <p className="text-[11px] text-muted-foreground truncate mb-1 px-3">{user.email}</p>
            <button
              onClick={signOut}
              className="flex items-center gap-2.5 px-3 py-[7px] text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors w-full"
            >
              <LogOut className="w-4 h-4 opacity-70" />
              Uitloggen
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between h-12 px-4 bg-background border-b border-border gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground p-1 flex-shrink-0">
            <Menu className="w-5 h-5" />
          </button>
          <img src={logo} alt="Platin" className="h-6 w-auto object-contain lg:hidden flex-shrink-0" loading="eager" decoding="sync" />
          <div className="hidden lg:block flex-shrink-0" />
          <div className="flex-1 flex justify-center">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <NotificationBell />
          </div>
        </header>

        <GlobalActiveBar />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

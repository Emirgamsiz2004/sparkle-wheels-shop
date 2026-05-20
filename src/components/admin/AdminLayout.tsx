import { useEffect, useState } from "react";
import { useNavigate, Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Car, ShoppingCart, Wallet,
  Settings, LogOut, Users, Clock, CalendarDays, BadgeDollarSign, Inbox, ClipboardCheck, Menu,
} from "lucide-react";
import logo from "@/assets/logo.png";
import NotificationBell from "@/components/admin/NotificationBell";
import GlobalActiveBar from "@/components/admin/GlobalActiveBar";
import GlobalSearch from "@/components/admin/GlobalSearch";
import MobileSidebar, { getMobilePageTitle } from "@/components/admin/MobileSidebar";
import SidebarQuickActions from "@/components/admin/SidebarQuickActions";
import ProefritExpiryWatcher from "@/components/admin/proefrit/ProefritExpiryWatcher";
import { useTestDrives } from "@/hooks/useTestDrives";
import { pickPrimaryActive, useProefritTimer } from "@/hooks/useProefritTimer";

interface NavItem { label: string; icon: typeof LayoutDashboard; path: string; medewerker?: boolean; }

const navItems: NavItem[] = [
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
];

const ALLOWED_MEDEWERKER_PREFIXES = ["/admin/dashboard", "/admin/inkoop", "/admin/proefriten", "/admin/planning", "/admin/uren"];

const AdminLayout = () => {
  const { user, loading, signOut, isAdmin, isMedewerker, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [overdueLeads, setOverdueLeads] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  // Block medewerker from non-allowed routes
  useEffect(() => {
    if (!loading && user && role === "medewerker") {
      const allowed = ALLOWED_MEDEWERKER_PREFIXES.some(
        (p) => location.pathname === p || location.pathname.startsWith(p + "/")
      );
      if (!allowed && !location.pathname.startsWith("/admin/instellingen")) {
        navigate("/admin/planning", { replace: true });
      }
    }
  }, [user, loading, role, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="admin-theme min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground/30" />
      </div>
    );
  }

  if (!user) return null;

  const visibleNavItems = isAdmin ? navItems : navItems.filter((i) => i.medewerker);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  const pageTitle = getMobilePageTitle(location.pathname);
  const isDashboard = location.pathname === "/admin/dashboard";

  return <AdminLayoutInner
    user={user}
    signOut={signOut}
    visibleNavItems={visibleNavItems}
    isActive={isActive}
    pageTitle={pageTitle}
    isDashboard={isDashboard}
    overdueLeads={overdueLeads}
    upcomingAppts={upcomingAppts}
    mobileNavOpen={mobileNavOpen}
    setMobileNavOpen={setMobileNavOpen}
  />;
};

interface InnerProps {
  user: any;
  signOut: () => void;
  visibleNavItems: NavItem[];
  isActive: (path: string) => boolean;
  pageTitle: string;
  isDashboard: boolean;
  overdueLeads: number;
  upcomingAppts: number;
  mobileNavOpen: boolean;
  setMobileNavOpen: (v: boolean) => void;
}

const AdminLayoutInner = ({
  user, signOut, visibleNavItems, isActive, pageTitle, isDashboard,
  overdueLeads, upcomingAppts, mobileNavOpen, setMobileNavOpen,
}: InnerProps) => {
  const { testDrives } = useTestDrives();
  const activeProefrit = pickPrimaryActive(testDrives);
  const proefritTimer = useProefritTimer(activeProefrit);


  return (
    <div className="admin-theme min-h-screen bg-background overflow-x-hidden">
      {/* Sidebar — desktop-only. Verborgen op mobiel; bottombar vervangt navigatie. */}
      <aside
        className="group/sidebar hidden lg:flex fixed inset-y-0 left-0 z-50 bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] flex-col transition-[width] duration-200 ease-out overflow-hidden w-[56px] hover:w-[220px]"
      >
        <div className="h-14 px-3 flex items-center justify-between border-b border-[hsl(var(--sidebar-border))]">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5 min-w-0">
            <img src={logo} alt="Platin" className="h-7 w-auto object-contain flex-shrink-0" loading="eager" decoding="sync" />
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground whitespace-nowrap transition-opacity duration-200 opacity-0 group-hover/sidebar:opacity-100">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden">
          <div className="space-y-px">
            {visibleNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                className={`relative flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] transition-colors whitespace-nowrap ${
                  isActive(item.path)
                    ? "bg-accent text-foreground font-medium"
                    : "text-[hsl(var(--sidebar-foreground))] hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0 opacity-70" />
                <span className="flex-1 transition-opacity duration-200 opacity-0 group-hover/sidebar:opacity-100">{item.label}</span>
                {item.path === "/admin/leads" && overdueLeads > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground transition-opacity duration-200 opacity-0 group-hover/sidebar:opacity-100">
                    {overdueLeads}
                  </span>
                )}
                {item.path === "/admin/planning" && upcomingAppts > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-accent text-accent-foreground transition-opacity duration-200 opacity-0 group-hover/sidebar:opacity-100">
                    {upcomingAppts}
                  </span>
                )}
                {item.path === "/admin/proefriten" && proefritTimer.active && (
                  <span
                    className={`inline-flex items-center justify-center px-1.5 h-[18px] text-[10px] font-mono font-semibold rounded-full border ${
                      proefritTimer.tone === "expired" ? "bg-red-500/20 text-red-300 border-red-500/50 animate-pulse"
                      : proefritTimer.tone === "red" ? "bg-red-500/15 text-red-400 border-red-500/30"
                      : proefritTimer.tone === "amber" ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    } transition-opacity duration-200 opacity-100`}
                    title="Actieve proefrit — resterende tijd"
                  >
                    {proefritTimer.mmss}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </nav>

        <div className="p-2 border-t border-[hsl(var(--sidebar-border))] space-y-1.5">
          <div className="px-1">
            <SidebarQuickActions variant="rail" />
          </div>
          <Link
            to="/admin/instellingen"
            title="Instellingen"
            className={`flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] transition-colors whitespace-nowrap ${
              isActive("/admin/instellingen")
                ? "bg-accent text-foreground font-medium"
                : "text-[hsl(var(--sidebar-foreground))] hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <Settings className="w-4 h-4 flex-shrink-0 opacity-70" />
            <span className="transition-opacity duration-200 opacity-0 group-hover/sidebar:opacity-100">Instellingen</span>
          </Link>
          <div className="mt-1.5 pt-1.5 border-t border-[hsl(var(--sidebar-border))]">
            <p className="text-[11px] text-muted-foreground truncate mb-1 px-3 whitespace-nowrap transition-opacity duration-200 opacity-0 group-hover/sidebar:opacity-100">{user.email}</p>
            <button
              onClick={signOut}
              title="Uitloggen"
              className="flex items-center gap-2.5 px-3 py-[7px] text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors w-full whitespace-nowrap"
            >
              <LogOut className="w-4 h-4 flex-shrink-0 opacity-70" />
              <span className="transition-opacity duration-200 opacity-0 group-hover/sidebar:opacity-100">Uitloggen</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content — geen left margin op mobiel */}
      <div className="flex flex-col min-h-screen min-w-0 lg:ml-[56px]">
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 lg:h-12 px-4 bg-background border-b border-border gap-3">
          {/* Mobiel: hamburger + titel/logo */}
          <div className="flex items-center gap-2 lg:hidden min-w-0 flex-1">
            <button
              onClick={() => setMobileNavOpen(true)}
              aria-label="Menu openen"
              className="text-foreground p-2 -ml-2 hover:bg-accent rounded-md transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            {isDashboard ? (
              <img src={logo} alt="Platin" className="h-6 w-auto object-contain flex-shrink-0" loading="eager" decoding="sync" />
            ) : (
              <h1 className="text-base font-medium text-foreground truncate">{pageTitle}</h1>
            )}
          </div>
          {/* Desktop: zoekbalk in midden */}
          <div className="hidden lg:block flex-shrink-0" />
          <div className="flex-1 hidden lg:flex justify-center">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
            <div className="lg:hidden">
              <GlobalSearch />
            </div>
            <NotificationBell />
          </div>
        </header>

        <GlobalActiveBar />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden pb-8">
          <Outlet />
        </main>
      </div>

      <MobileSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <ProefritExpiryWatcher />
    </div>
  );
};

export default AdminLayout;

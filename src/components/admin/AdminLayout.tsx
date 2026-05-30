import { useEffect, useState } from "react";
import { useNavigate, Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Car, ShoppingCart, Wallet,
  Settings, LogOut, Users, Clock, CalendarDays, BadgeDollarSign, Inbox, ClipboardCheck, Menu, Plus,
} from "lucide-react";
import logo from "@/assets/logo.png";
import NotificationBell from "@/components/admin/NotificationBell";
import HeaderProfile from "@/components/admin/HeaderProfile";
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
  { label: "Afspraken", icon: CalendarDays, path: "/admin/planning", medewerker: true },
  { label: "Financiën", icon: Wallet, path: "/admin/financieel" },
];

const ALLOWED_MEDEWERKER_PREFIXES = ["/admin/dashboard", "/admin/inkoop", "/admin/proefriten", "/admin/planning"];

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
      {/* Floating rail sidebar — desktop only */}
      <aside className="hidden lg:flex fixed left-3 top-1/2 -translate-y-1/2 z-50 flex-col items-center gap-2 px-2 py-3 rounded-full bg-[hsl(var(--sidebar-background))]/95 backdrop-blur border border-border/60 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]">
        {/* Top: quick action (yellow plus) */}
        <Link
          to="/admin/dashboard"
          title="Platin"
          className="w-10 h-10 rounded-full bg-lime-400 hover:bg-lime-300 text-black flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(163,230,53,0.4)] transition-colors mb-1"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
        </Link>

        {/* Nav icons as circles */}
        <nav className="flex flex-col items-center gap-1.5">
          {visibleNavItems.map((item) => {
            const active = isActive(item.path);
            const hasBadge =
              (item.path === "/admin/planning" && upcomingAppts > 0) ||
              (item.path === "/admin/leads" && overdueLeads > 0) ||
              (item.path === "/admin/proefriten" && proefritTimer.active);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                aria-label={item.label}
                className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  active
                    ? "bg-white text-black shadow-[0_4px_12px_-2px_rgba(255,255,255,0.25)]"
                    : "bg-card/60 text-muted-foreground hover:text-foreground hover:bg-card"
                }`}
              >
                <item.icon className="w-[18px] h-[18px]" strokeWidth={active ? 2 : 1.75} />
                {hasBadge && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[hsl(var(--sidebar-background))]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1 min-h-6" />

        {/* Bottom: utility icons */}
        <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-border/60 w-full">
          <Link
            to="/admin/instellingen"
            title="Instellingen"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isActive("/admin/instellingen")
                ? "bg-white text-black"
                : "bg-card/60 text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
          >
            <Settings className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </Link>
          <button
            onClick={signOut}
            title="Uitloggen"
            aria-label="Uitloggen"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-card/60 text-muted-foreground hover:text-foreground hover:bg-card transition-all"
          >
            <LogOut className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </button>
        </div>
      </aside>


      {/* Main content — geen left margin op mobiel */}
      <div className="flex flex-col min-h-screen min-w-0 lg:ml-16">
        <header className="admin-header sticky top-0 z-30 flex items-center justify-between h-14 lg:h-12 px-4 border-b gap-3">
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
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            <div className="lg:hidden">
              <GlobalSearch />
            </div>
            <NotificationBell />
            <div className="hidden lg:block w-px h-6 bg-border/60 mx-1" />
            <HeaderProfile />
          </div>
        </header>

        <GlobalActiveBar />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden pb-8">
          <Outlet />
        </main>
      </div>

      <MobileSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <ProefritExpiryWatcher />

      {/* Floating snelstart-knop — altijd bereikbaar, duim-vriendelijk rechtsonder */}
      <div className="fixed z-40 right-4 bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] lg:hidden">
        <SidebarQuickActions variant="fab" />
      </div>
    </div>
  );
};

export default AdminLayout;

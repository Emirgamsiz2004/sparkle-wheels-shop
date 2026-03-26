import { useEffect } from "react";
import { useNavigate, Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Car, ShoppingCart, Wallet, BarChart3,
  Megaphone, Newspaper, FileText, Settings, LogOut, Menu, X, Receipt, Link2,
} from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";

interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
      { label: "Voertuigen", icon: Car, path: "/admin/voertuigen" },
      { label: "Inkoop", icon: ShoppingCart, path: "/admin/inkoop" },
      { label: "Deal Analyzer", icon: BarChart3, path: "/admin/deals" },
    ],
  },
  {
    label: "Financien",
    items: [
      { label: "Overzicht", icon: Wallet, path: "/admin/financieel" },
      { label: "BTW Aangifte", icon: Receipt, path: "/admin/btw" },
      { label: "Moneybird", icon: Link2, path: "/admin/moneybird" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { label: "Social Media", icon: Megaphone, path: "/admin/social-media" },
      { label: "Advertenties", icon: Newspaper, path: "/admin/advertenties" },
      { label: "Blog", icon: FileText, path: "/admin/blog" },
    ],
  },
];

const AdminLayout = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="admin-theme min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="admin-theme min-h-screen flex bg-background overflow-x-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] text-foreground flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-[hsl(var(--sidebar-border))]">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <img src={logo} alt="Platin" className="h-5 w-auto object-contain" loading="eager" decoding="sync" />
            <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-muted-foreground">Admin</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="px-3 mb-2 text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground/50">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                      isActive(item.path)
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--sidebar-accent))]"
                    }`}
                  >
                    <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive(item.path) ? "text-foreground" : ""}`} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-[hsl(var(--sidebar-border))]">
          <Link
            to="/admin/instellingen"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
              isActive("/admin/instellingen")
                ? "bg-primary/10 text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--sidebar-accent))]"
            }`}
          >
            <Settings className={`w-[18px] h-[18px] flex-shrink-0 ${isActive("/admin/instellingen") ? "text-foreground" : ""}`} />
            Instellingen
          </Link>
          <div className="mt-2 pt-2 border-t border-[hsl(var(--sidebar-border))]">
            <p className="text-[11px] text-muted-foreground truncate mb-1.5 px-3">{user.email}</p>
            <button
              onClick={signOut}
              className="flex items-center gap-3 px-3 py-2.5 text-[13px] text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--sidebar-accent))] rounded-lg transition-all duration-200 w-full"
            >
              <LogOut className="w-[18px] h-[18px]" />
              Uitloggen
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-[hsl(var(--sidebar-background))] border-b border-border">
          <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <Menu className="w-5 h-5" />
          </button>
          <img src={logo} alt="Platin" className="h-5 w-auto object-contain" loading="eager" decoding="sync" />
          <div className="w-7" />
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

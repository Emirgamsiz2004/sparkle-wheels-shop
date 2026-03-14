import { useEffect } from "react";
import { useNavigate, Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Car, Wallet, Receipt, LogOut, BarChart3, Menu, X, BookOpen, Settings, ShoppingCart, Megaphone } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.svg";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Voertuigen", icon: Car, path: "/admin/voertuigen" },
  { label: "Inkoop", icon: ShoppingCart, path: "/admin/inkoop" },
  { label: "Financieel", icon: Wallet, path: "/admin/financieel" },
  { label: "BTW Overzicht", icon: Receipt, path: "/admin/btw" },
  { label: "Moneybird", icon: BookOpen, path: "/admin/moneybird" },
  { label: "Deal Analyzer", icon: BarChart3, path: "/admin/deals" },
  { label: "Instellingen", icon: Settings, path: "/admin/instellingen" },
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
    <div className="admin-theme min-h-screen flex bg-background">
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
        <div className="p-5 flex items-center justify-between">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <img src={logo} alt="Platin" className="h-6 w-auto brightness-0 invert opacity-80" />
            <span className="text-[9px] font-semibold tracking-[0.3em] uppercase text-muted-foreground">Admin</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                isActive(item.path)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive(item.path) ? 'text-primary' : ''}`} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[hsl(var(--sidebar-border))]">
          <p className="text-[11px] text-muted-foreground truncate mb-2.5 px-1">{user.email}</p>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-all duration-200 w-full"
          >
            <LogOut className="w-4 h-4" />
            Uitloggen
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <img src={logo} alt="Platin" className="h-5 brightness-0 invert opacity-80" />
          <div className="w-5" />
        </header>

        <main className="flex-1 p-5 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Voorraad from "./pages/Voorraad";
import Consignatie from "./pages/Consignatie";
import Contact from "./pages/Contact";
import OverOns from "./pages/OverOns";
import InEnVerkoop from "./pages/InEnVerkoop";
import OnderhoudReparatie from "./pages/OnderhoudReparatie";
import AutoDetailing from "./pages/AutoDetailing";
import AutoZoeken from "./pages/AutoZoeken";
import AutoCustomizing from "./pages/AutoCustomizing";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminVoertuigenPage from "./pages/admin/AdminVoertuigenPage";
import AdminVoertuigNieuwPage from "./pages/admin/AdminVoertuigNieuwPage";
import AdminVoertuigDetailPage from "./pages/admin/AdminVoertuigDetailPage";
import AdminFinancieelPage from "./pages/admin/AdminFinancieelPage";
import AdminBTWPage from "./pages/admin/AdminBTWPage";
import DealAnalyzer from "./pages/DealAnalyzer";
import AdminMoneybirdPage from "./pages/admin/AdminMoneybirdPage";
import AdminInkoopPage from "./pages/admin/AdminInkoopPage";
import AdminInstellingenPage from "./pages/admin/AdminInstellingenPage";
import AdminSocialMediaPage from "./pages/admin/AdminSocialMediaPage";
import NotFound from "./pages/NotFound";
import UnderConstruction from "./pages/UnderConstruction";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

// ⬇️ Zet op false om de volledige site te tonen
const UNDER_CONSTRUCTION = false;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          {UNDER_CONSTRUCTION ? (
            <Routes>
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="voertuigen" element={<AdminVoertuigenPage />} />
                <Route path="inkoop" element={<AdminInkoopPage />} />
                <Route path="voertuigen/nieuw" element={<AdminVoertuigNieuwPage />} />
                <Route path="voertuigen/:id" element={<AdminVoertuigDetailPage />} />
                <Route path="financieel" element={<AdminFinancieelPage />} />
                <Route path="btw" element={<AdminBTWPage />} />
                <Route path="moneybird" element={<AdminMoneybirdPage />} />
                <Route path="instellingen" element={<AdminInstellingenPage />} />
                <Route path="social-media" element={<AdminSocialMediaPage />} />
                <Route path="deals" element={<DealAnalyzer />} />
              </Route>
              <Route path="*" element={<UnderConstruction />} />
            </Routes>
          ) : (
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/voorraad" element={<Voorraad />} />
              <Route path="/consignatie" element={<Consignatie />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/over-ons" element={<OverOns />} />
              <Route path="/diensten/in-en-verkoop" element={<InEnVerkoop />} />
              <Route path="/diensten/onderhoud-reparatie" element={<OnderhoudReparatie />} />
              <Route path="/diensten/auto-detailing" element={<AutoDetailing />} />
              <Route path="/diensten/auto-zoeken" element={<AutoZoeken />} />
              <Route path="/diensten/auto-customizing" element={<AutoCustomizing />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="voertuigen" element={<AdminVoertuigenPage />} />
                <Route path="inkoop" element={<AdminInkoopPage />} />
                <Route path="voertuigen/nieuw" element={<AdminVoertuigNieuwPage />} />
                <Route path="voertuigen/:id" element={<AdminVoertuigDetailPage />} />
                <Route path="financieel" element={<AdminFinancieelPage />} />
              <Route path="btw" element={<AdminBTWPage />} />
                <Route path="moneybird" element={<AdminMoneybirdPage />} />
                <Route path="instellingen" element={<AdminInstellingenPage />} />
                <Route path="social-media" element={<AdminSocialMediaPage />} />
                <Route path="deals" element={<DealAnalyzer />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

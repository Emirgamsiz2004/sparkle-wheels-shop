import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import WhatsAppButton from "@/components/WhatsAppButton";
import Index from "./pages/Index";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Voorraad from "./pages/Voorraad";
import VoertuigDetail from "./pages/VoertuigDetail";
import VoorraadDetailPage from "./pages/VoorraadDetailPage";
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
import AdminAdvertentiesPage from "./pages/admin/AdminAdvertentiesPage";
import AdminBlogPage from "./pages/admin/AdminBlogPage";
import AdminProefrittenPage from "./pages/admin/AdminProefrittenPage";
import ProefritFormulier from "./pages/ProefritFormulier";
import OvereenkomstViewer from "./pages/OvereenkomstViewer";
import ReviewsPage from "./pages/ReviewsPage";
import NotFound from "./pages/NotFound";
import Unsubscribe from "./pages/Unsubscribe";
import UnderConstruction from "./pages/UnderConstruction";
import ScrollToTop from "./components/ScrollToTop";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import AlgemeneVoorwaarden from "./pages/AlgemeneVoorwaarden";
import CookieBanner from "./components/CookieBanner";
import AnnouncementBar from "./components/AnnouncementBar";

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
          <AnnouncementBar />
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
                <Route path="advertenties" element={<AdminAdvertentiesPage />} />
                <Route path="blog" element={<AdminBlogPage />} />
                <Route path="deals" element={<DealAnalyzer />} />
                <Route path="proefriten" element={<AdminProefrittenPage />} />
              </Route>
              <Route path="*" element={<UnderConstruction />} />
            </Routes>
          ) : (
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/voorraad" element={<Voorraad />} />
              <Route path="/voorraad/:id" element={<VoorraadDetailPage />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/consignatie" element={<Consignatie />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/over-ons" element={<OverOns />} />
              <Route path="/diensten/in-en-verkoop" element={<InEnVerkoop />} />
              <Route path="/diensten/onderhoud-reparatie" element={<OnderhoudReparatie />} />
              <Route path="/diensten/auto-detailing" element={<AutoDetailing />} />
              <Route path="/diensten/auto-zoeken" element={<AutoZoeken />} />
              <Route path="/diensten/auto-customizing" element={<AutoCustomizing />} />
              <Route path="/privacybeleid" element={<PrivacyPolicy />} />
              <Route path="/cookiebeleid" element={<CookiePolicy />} />
              <Route path="/algemene-voorwaarden" element={<AlgemeneVoorwaarden />} />
              <Route path="/proefrit/:token" element={<ProefritFormulier />} />
              <Route path="/overeenkomst/:id" element={<OvereenkomstViewer />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
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
                <Route path="advertenties" element={<AdminAdvertentiesPage />} />
                <Route path="blog" element={<AdminBlogPage />} />
                <Route path="deals" element={<DealAnalyzer />} />
                <Route path="proefriten" element={<AdminProefrittenPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          )}
          <WhatsAppButton />
          <CookieBanner />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

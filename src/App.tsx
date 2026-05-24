import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import WhatsAppButton from "@/components/WhatsAppButton";

import Afspraak from "./pages/Afspraak";
import Index from "./pages/Index";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Voorraad from "./pages/Voorraad";
import VoertuigDetail from "./pages/VoertuigDetail";
import VoorraadDetailPage from "./pages/VoorraadDetailPage";
import Consignatie from "./pages/Consignatie";
import ConsignatieVoorwaarden from "./pages/ConsignatieVoorwaarden";
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
import AdminVerkopenPage from "./pages/admin/AdminVerkopenPage";
import AdminVerkoopWizardPage from "./pages/admin/AdminVerkoopWizardPage";
import AdminVerkoopDetailPage from "./pages/admin/AdminVerkoopDetailPage";
import AdminArchiefPage from "./pages/admin/AdminArchiefPage";
import AdminKlantenPage from "./pages/admin/AdminKlantenPage";
import AdminKlantDetailPage from "./pages/admin/AdminKlantDetailPage";
import AdminLeadsPage from "./pages/admin/AdminLeadsPage";
import AdminLeadDetailPage from "./pages/admin/AdminLeadDetailPage";
import ProefritFormulier from "./pages/ProefritFormulier";
import AdminPlanningPage from "./pages/admin/AdminPlanningPage";
import OccasionsAlphen from "./pages/OccasionsAlphen";
import OccasionsLeiden from "./pages/OccasionsLeiden";
import OccasionsZoetermeer from "./pages/OccasionsZoetermeer";
import OccasionsDenHaag from "./pages/OccasionsDenHaag";
import Garantie from "./pages/Garantie";
import Financiering from "./pages/Financiering";

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
                <Route path="btw" element={<AdminFinancieelPage />} />
                <Route path="moneybird" element={<AdminFinancieelPage />} />
                <Route path="instellingen" element={<AdminInstellingenPage />} />
                <Route path="social-media" element={<AdminSocialMediaPage />} />
                <Route path="advertenties" element={<AdminAdvertentiesPage />} />
                <Route path="blog" element={<AdminBlogPage />} />
                <Route path="deals" element={<DealAnalyzer />} />
                <Route path="proefriten" element={<AdminProefrittenPage />} />
                <Route path="verkopen" element={<AdminVerkopenPage />} />
                <Route path="verkopen/:id" element={<AdminVerkoopDetailPage />} />
                <Route path="archief" element={<AdminArchiefPage />} />
                <Route path="klanten" element={<AdminKlantenPage />} />
                <Route path="klanten/:id" element={<AdminKlantDetailPage />} />
                <Route path="leads" element={<AdminLeadsPage />} />
                <Route path="leads/:id" element={<AdminLeadDetailPage />} />
                <Route path="planning" element={<AdminPlanningPage />} />
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
              <Route path="/consignatie-voorwaarden" element={<ConsignatieVoorwaarden />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/afspraak" element={<Afspraak />} />
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
              
              <Route path="/occasions-alphen-aan-den-rijn" element={<OccasionsAlphen />} />
              <Route path="/occasions-leiden" element={<OccasionsLeiden />} />
              <Route path="/occasions-zoetermeer" element={<OccasionsZoetermeer />} />
              <Route path="/occasions-den-haag" element={<OccasionsDenHaag />} />
              <Route path="/garantie" element={<Garantie />} />
              <Route path="/financiering" element={<Financiering />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/verkopen/nieuw/:vehicleId" element={<AdminVerkoopWizardPage />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="voertuigen" element={<AdminVoertuigenPage />} />
                <Route path="inkoop" element={<AdminInkoopPage />} />
                <Route path="voertuigen/nieuw" element={<AdminVoertuigNieuwPage />} />
                <Route path="voertuigen/:id" element={<AdminVoertuigDetailPage />} />
                <Route path="financieel" element={<AdminFinancieelPage />} />
              <Route path="btw" element={<AdminFinancieelPage />} />
              <Route path="moneybird" element={<AdminFinancieelPage />} />
                <Route path="instellingen" element={<AdminInstellingenPage />} />
                <Route path="social-media" element={<AdminSocialMediaPage />} />
                <Route path="advertenties" element={<AdminAdvertentiesPage />} />
                <Route path="blog" element={<AdminBlogPage />} />
                <Route path="deals" element={<DealAnalyzer />} />
                <Route path="proefriten" element={<AdminProefrittenPage />} />
                <Route path="verkopen" element={<AdminVerkopenPage />} />
                <Route path="verkopen/:id" element={<AdminVerkoopDetailPage />} />
                
                <Route path="archief" element={<AdminArchiefPage />} />
                <Route path="klanten" element={<AdminKlantenPage />} />
                <Route path="klanten/:id" element={<AdminKlantDetailPage />} />
                <Route path="leads" element={<AdminLeadsPage />} />
                <Route path="leads/:id" element={<AdminLeadDetailPage />} />
                <Route path="uren" element={<AdminUrenPage />} />
                <Route path="planning" element={<AdminPlanningPage />} />
                <Route path="aanmeldingen" element={<AdminAanmeldingenPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          )}
          
          {/* <WhatsAppButton /> tijdelijk uitgezet */}
          
          <CookieBanner />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

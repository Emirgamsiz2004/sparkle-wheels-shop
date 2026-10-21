import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

import Index from "./pages/Index";
import ScrollToTop from "./components/ScrollToTop";
import CookieBanner from "./components/CookieBanner";
import AnnouncementBar from "./components/AnnouncementBar";
import AppointmentOnlyNotice from "./components/AppointmentOnlyNotice";

const Afspraak = lazy(() => import("./pages/Afspraak"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Voorraad = lazy(() => import("./pages/Voorraad"));
const VoorraadDetailPage = lazy(() => import("./pages/VoorraadDetailPage"));
const Consignatie = lazy(() => import("./pages/Consignatie"));
const ConsignatieVoorwaarden = lazy(() => import("./pages/ConsignatieVoorwaarden"));
const Contact = lazy(() => import("./pages/Contact"));
const OverOns = lazy(() => import("./pages/OverOns"));
const InEnVerkoop = lazy(() => import("./pages/InEnVerkoop"));
const OnderhoudReparatie = lazy(() => import("./pages/OnderhoudReparatie"));
const AutoDetailing = lazy(() => import("./pages/AutoDetailing"));
const AutoZoeken = lazy(() => import("./pages/AutoZoeken"));
const AutoCustomizing = lazy(() => import("./pages/AutoCustomizing"));
const Diensten = lazy(() => import("./pages/Diensten"));
const ProefritFormulier = lazy(() => import("./pages/ProefritFormulier"));
const OccasionsAlphen = lazy(() => import("./pages/OccasionsAlphen"));
const OccasionsLeiden = lazy(() => import("./pages/OccasionsLeiden"));
const OccasionsZoetermeer = lazy(() => import("./pages/OccasionsZoetermeer"));
const OccasionsDenHaag = lazy(() => import("./pages/OccasionsDenHaag"));
const Garantie = lazy(() => import("./pages/Garantie"));
const Financiering = lazy(() => import("./pages/Financiering"));
const ReviewsPage = lazy(() => import("./pages/ReviewsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const AlgemeneVoorwaarden = lazy(() => import("./pages/AlgemeneVoorwaarden"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60_000, refetchOnWindowFocus: false } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AnnouncementBar />
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
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
              <Route path="/diensten" element={<Diensten />} />
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
              <Route path="/admin/*" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <AppointmentOnlyNotice />
          <CookieBanner />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

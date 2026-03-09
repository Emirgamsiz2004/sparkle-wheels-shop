import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import AdminDashboard from "./pages/AdminDashboard";
import DealAnalyzer from "./pages/DealAnalyzer";
import NotFound from "./pages/NotFound";
import UnderConstruction from "./pages/UnderConstruction";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

// ⬇️ Zet op false om de volledige site te tonen
const UNDER_CONSTRUCTION = true;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        {UNDER_CONSTRUCTION ? (
          <Routes>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
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
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        )}
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

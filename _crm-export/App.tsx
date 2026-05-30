import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminVoertuigenPage from "./pages/admin/AdminVoertuigenPage";
import AdminVoertuigNieuwPage from "./pages/admin/AdminVoertuigNieuwPage";
import AdminVoertuigDetailPage from "./pages/admin/AdminVoertuigDetailPage";
import AdminFinancieelPage from "./pages/admin/AdminFinancieelPage";
import DealAnalyzer from "./pages/DealAnalyzer";
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
import AdminPlanningPage from "./pages/admin/AdminPlanningPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/**
 * Platin CRM — standalone admin app.
 * Alle routes draaien op root (geen /admin/* prefix meer).
 * Database wordt gedeeld met Platin Automotive via dezelfde Supabase.
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/verkopen/nieuw/:vehicleId" element={<AdminVerkoopWizardPage />} />
            <Route path="/" element={<AdminLayout />}>
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
            {/* Backwards compat: oude /admin/* links blijven werken */}
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
            <Route path="/admin/*" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

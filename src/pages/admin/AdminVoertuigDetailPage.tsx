import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useVehicles } from "@/hooks/useVehicles";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Trash2, Loader2, ShoppingCart, FileText } from "lucide-react";
import { toast } from "sonner";
import { statusLabels, statusColors } from "@/types/vehicle";
import VehicleInfoTab from "@/components/admin/VehicleInfoTab";
import VehicleKostenTab from "@/components/admin/VehicleKostenTab";
import VehicleDocumentenTab from "@/components/admin/VehicleDocumentenTab";
import VehicleFotosTab from "@/components/admin/VehicleFotosTab";
import VehicleFinancieelTab from "@/components/admin/VehicleFinancieelTab";
import VerkoopDialog from "@/components/admin/VerkoopDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const tabItems = [
  { key: "info", label: "Info", emoji: "📋" },
  { key: "kosten", label: "Kosten", emoji: "💸" },
  { key: "documenten", label: "Dossier", emoji: "📂" },
  { key: "fotos", label: "Foto's", emoji: "📸" },
  { key: "financieel", label: "Financieel", emoji: "💰" },
];

const AdminVoertuigDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicles, loading, deleteVehicle, updateVehicle, addCost, removeCost, refetch } = useVehicles();
  const [activeTab, setActiveTab] = useState("info");
  const [verkoopOpen, setVerkoopOpen] = useState(false);
  const [blogGenerating, setBlogGenerating] = useState(false);

  const vehicle = vehicles.find((v) => v.id === id);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!vehicle) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">Voertuig niet gevonden</p>
        <button onClick={() => navigate("/admin/voertuigen")} className="text-primary hover:underline text-sm">Terug naar overzicht</button>
      </div>
    );
  }

  const handleDelete = async () => {
    await deleteVehicle(vehicle.id);
    navigate("/admin/voertuigen");
  };

  const handleVerkoopComplete = () => {
    refetch();
  };

  const handleGenerateBlog = async () => {
    setBlogGenerating(true);
    toast.info("Blogpost wordt aangemaakt...");
    try {
      const { error } = await supabase.functions.invoke("generate-blog-post", {
        body: {
          merk: vehicle.merk,
          model: vehicle.model,
          jaar: vehicle.bouwjaar,
          km: vehicle.kilometerstand,
          kleur: vehicle.kleur,
          prijs: vehicle.verkoopprijs,
          car_id: vehicle.id,
        },
      });
      if (error) throw error;
      toast.success("✓ Blogpost succesvol aangemaakt");
    } catch (err) {
      console.error("Blog generation error:", err);
      toast.error("Blogpost genereren mislukt");
    }
    setBlogGenerating(false);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <button onClick={() => navigate("/admin/voertuigen")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Terug
      </button>

      {/* Header — stacked on mobile */}
      <div className="space-y-3">
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-foreground leading-tight">
            {vehicle.merk} {vehicle.model} {vehicle.bouwjaar}
          </h1>
          <span className="text-sm text-muted-foreground">{vehicle.kleur || "Onbekend"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex px-2.5 py-1 text-[11px] font-medium rounded-md border ${statusColors[vehicle.status]}`}>
            {statusLabels[vehicle.status]}
          </span>
          {vehicle.kenteken && (
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider bg-accent/50 px-2 py-0.5 rounded">{vehicle.kenteken}</span>
          )}
        </div>

        {/* Google Drive status */}
        <div>
          {vehicle.googleDriveFolderUrl ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md border" style={{ backgroundColor: "rgba(25, 103, 210, 0.1)", color: "#5b9bef", borderColor: "rgba(25, 103, 210, 0.2)" }}>
                ✅ Google Drive
              </span>
              <a href={vehicle.googleDriveFolderUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-opacity" style={{ color: "#5b9bef" }}>
                Open map →
              </a>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md border bg-accent/30 text-muted-foreground border-border">
              📁 Drive: Niet gekoppeld
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateBlog}
            disabled={blogGenerating}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-accent text-foreground hover:bg-accent/80 rounded-lg transition-colors disabled:opacity-50"
          >
            {blogGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            Genereer blogpost
          </button>
          {vehicle.status === "te_koop" && (
            <button
              onClick={() => setVerkoopOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" /> Verkopen
            </button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Verwijderen
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border rounded-xl max-w-[calc(100vw-2rem)]">
              <AlertDialogHeader>
                <AlertDialogTitle>Voertuig verwijderen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Dit verwijdert {vehicle.merk} {vehicle.model} en alle bijbehorende data. Dit kan niet ongedaan worden gemaakt.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-lg">Annuleren</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 rounded-lg">Verwijderen</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
        <div className="flex gap-1 bg-card border border-border rounded-lg p-1 min-w-max">
          {tabItems.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                activeTab === t.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <span className="md:hidden">{t.emoji}</span>
              <span className="hidden md:inline">{t.emoji} {t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "info" && <VehicleInfoTab vehicle={vehicle} onSave={updateVehicle} />}
        {activeTab === "kosten" && <VehicleKostenTab vehicle={vehicle} onAddCost={addCost} onRemoveCost={removeCost} />}
        {activeTab === "documenten" && <VehicleDocumentenTab vehicleId={vehicle.id} />}
        {activeTab === "fotos" && <VehicleFotosTab vehicleId={vehicle.id} />}
        {activeTab === "financieel" && <VehicleFinancieelTab vehicle={vehicle} />}
      </div>

      <VerkoopDialog
        vehicle={vehicle}
        open={verkoopOpen}
        onOpenChange={setVerkoopOpen}
        onComplete={handleVerkoopComplete}
      />
    </div>
  );
};

export default AdminVoertuigDetailPage;

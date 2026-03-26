import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useVehicles } from "@/hooks/useVehicles";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Trash2, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { statusLabels, statusColors, formatEuroDecimal, calcKostprijs, calcWinst, calcNettoMarge, calcMarge } from "@/types/vehicle";
import VehicleInfoTab from "@/components/admin/VehicleInfoTab";
import VehicleKostenTab from "@/components/admin/VehicleKostenTab";
import VehicleDocumentenTab from "@/components/admin/VehicleDocumentenTab";
import VehicleFotosTab from "@/components/admin/VehicleFotosTab";
import { Info } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const tabItems = [
  { key: "overzicht", label: "Overzicht" },
  { key: "kosten", label: "Kosten" },
  { key: "dossier", label: "Dossier" },
];

const AdminVoertuigDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicles, loading, deleteVehicle, updateVehicle, addCost, removeCost, refetch } = useVehicles();
  const [activeTab, setActiveTab] = useState("overzicht");
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

  const handleGenerateBlog = async () => {
    setBlogGenerating(true);
    toast.info("Blogpost wordt aangemaakt...");
    try {
      const { error } = await supabase.functions.invoke("generate-blog-post", {
        body: { merk: vehicle.merk, model: vehicle.model, jaar: vehicle.bouwjaar, km: vehicle.kilometerstand, kleur: vehicle.kleur, prijs: vehicle.verkoopprijs, car_id: vehicle.id },
      });
      if (error) throw error;
      toast.success("Blogpost succesvol aangemaakt");
    } catch (err) {
      console.error("Blog generation error:", err);
      toast.error("Blogpost genereren mislukt");
    }
    setBlogGenerating(false);
  };

  const kostprijs = calcKostprijs(vehicle);
  const nettoMarge = calcNettoMarge(vehicle);
  const margePerc = calcMarge(vehicle);

  return (
    <div className="space-y-4 md:space-y-6">
      <button onClick={() => navigate("/admin/voertuigen")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Terug
      </button>

      {/* Header */}
      <div className="space-y-3">
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-foreground leading-tight">
            {vehicle.merk} {vehicle.model} {vehicle.bouwjaar}
          </h1>
          {vehicle.kenteken && (
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{vehicle.kenteken}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex px-2.5 py-1 text-[11px] font-medium rounded-md border ${statusColors[vehicle.status]}`}>
            {statusLabels[vehicle.status]}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={handleGenerateBlog} disabled={blogGenerating} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-accent text-foreground hover:bg-accent/80 rounded-lg transition-colors disabled:opacity-50">
            {blogGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            Genereer blogpost
          </button>
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
                  Dit verwijdert {vehicle.merk} {vehicle.model} en alle bijbehorende data.
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

      {/* Tabs */}
      <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
        <div className="flex gap-1 bg-card border border-border rounded-xl p-1 min-w-max">
          {tabItems.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === t.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overzicht" && (
          <div className="space-y-6">
            {/* Financial summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-card border border-border rounded-xl p-3.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Kostprijs</p>
                <p className="text-lg font-bold text-foreground">{formatEuroDecimal(kostprijs)}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-3.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Verkoopprijs</p>
                <p className="text-lg font-bold text-foreground">{vehicle.verkoopprijs > 0 ? formatEuroDecimal(vehicle.verkoopprijs) : "—"}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-3.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Nettomarge</p>
                <p className={`text-lg font-bold ${nettoMarge >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {vehicle.verkoopprijs > 0 ? formatEuroDecimal(nettoMarge) : "—"}
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-3.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Marge %</p>
                <p className={`text-lg font-bold ${nettoMarge >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {vehicle.verkoopprijs > 0 ? `${margePerc.toFixed(1)}%` : "—"}
                </p>
              </div>
            </div>

            <VehicleInfoTab vehicle={vehicle} onSave={updateVehicle} />

            <div className="flex items-start gap-2 px-4 py-3 bg-secondary rounded-lg border border-border">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">BTW Margeregeling:</strong> bij inkoop van particulieren betaal je BTW alleen over de winst (marge × 21/121).
              </p>
            </div>
          </div>
        )}

        {activeTab === "kosten" && (
          <VehicleKostenTab vehicle={vehicle} onAddCost={addCost} onRemoveCost={removeCost} />
        )}

        {activeTab === "dossier" && (
          <div className="space-y-8">
            <div>
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-3">Foto's</h3>
              <VehicleFotosTab vehicleId={vehicle.id} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-3">Documenten</h3>
              <VehicleDocumentenTab vehicleId={vehicle.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVoertuigDetailPage;

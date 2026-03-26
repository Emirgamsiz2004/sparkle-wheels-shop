import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StartProefritDialog from "@/components/admin/proefrit/StartProefritDialog";
import { useVehicles } from "@/hooks/useVehicles";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Trash2, Loader2, FileText, Info, ClipboardCheck, Link2 } from "lucide-react";
import { toast } from "sonner";
import { statusLabels, statusColors, formatEuroDecimal, calcKostprijs, calcWinst, calcNettoMarge, calcMarge } from "@/types/vehicle";
import VehicleInfoTab from "@/components/admin/VehicleInfoTab";
import VehicleKostenTab from "@/components/admin/VehicleKostenTab";
import VehicleDocumentenTab from "@/components/admin/VehicleDocumentenTab";
import VehicleFotosTab from "@/components/admin/VehicleFotosTab";
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
  const [proefritOpen, setProefritOpen] = useState(false);

  const vehicle = vehicles.find((v) => v.id === id);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  if (!vehicle) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4 text-sm">Voertuig niet gevonden</p>
        <button onClick={() => navigate("/admin/voertuigen")} className="text-foreground hover:underline text-sm">Terug</button>
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
      toast.success("Blogpost aangemaakt");
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
    <div className="space-y-5">
      <button onClick={() => navigate("/admin/voertuigen")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Terug
      </button>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-lg font-medium text-foreground">
            {vehicle.merk} {vehicle.model} {vehicle.bouwjaar}
          </h1>
          <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded border whitespace-nowrap ${statusColors[vehicle.status]}`}>
            {statusLabels[vehicle.status]}
          </span>
        </div>
        {vehicle.kenteken && (
          <span className="text-xs font-mono text-muted-foreground uppercase">{vehicle.kenteken}</span>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setProefritOpen(true)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors">
            <ClipboardCheck className="w-3.5 h-3.5" /> Proefrit starten
          </button>
          <button onClick={handleGenerateBlog} disabled={blogGenerating} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50">
            {blogGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            Genereer blogpost
          </button>
          {vehicle.marktplaatsUrl && (
            <a
              href={vehicle.marktplaatsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors"
            >
              <Link2 className="w-3.5 h-3.5" /> Marktplaats
            </a>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-500/10 rounded-md transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Verwijderen
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border rounded-lg max-w-[calc(100vw-2rem)]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base font-medium">Voertuig verwijderen?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  Dit verwijdert {vehicle.merk} {vehicle.model} en alle bijbehorende data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-md text-sm">Annuleren</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 rounded-md text-sm">Verwijderen</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-0.5 bg-secondary/50 border border-border rounded-md p-0.5 min-w-max">
          {tabItems.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                activeTab === t.key
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
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
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Kostprijs</p>
                <p className="text-base font-semibold tabular-nums">{formatEuroDecimal(kostprijs)}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Verkoopprijs</p>
                <p className="text-base font-semibold tabular-nums">{vehicle.verkoopprijs > 0 ? formatEuroDecimal(vehicle.verkoopprijs) : "—"}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Nettomarge</p>
                <p className={`text-base font-semibold tabular-nums ${nettoMarge >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {vehicle.verkoopprijs > 0 ? formatEuroDecimal(nettoMarge) : "—"}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Marge %</p>
                <p className={`text-base font-semibold tabular-nums ${nettoMarge >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {vehicle.verkoopprijs > 0 ? `${margePerc.toFixed(1)}%` : "—"}
                </p>
              </div>
            </div>

            <VehicleInfoTab vehicle={vehicle} onSave={updateVehicle} />

            <div className="flex items-start gap-2 px-3 py-2.5 bg-secondary/50 rounded-md border border-border">
              <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground font-medium">BTW Margeregeling:</strong> bij inkoop van particulieren betaal je BTW alleen over de winst (marge x 21/121).
              </p>
            </div>
          </div>
        )}

        {activeTab === "kosten" && (
          <VehicleKostenTab vehicle={vehicle} onAddCost={addCost} onRemoveCost={removeCost} />
        )}

        {activeTab === "dossier" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Foto's</h3>
              <VehicleFotosTab vehicleId={vehicle.id} />
            </div>
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Documenten</h3>
              <VehicleDocumentenTab vehicleId={vehicle.id} />
            </div>
          </div>
        )}
      </div>

      <StartProefritDialog
        open={proefritOpen}
        onClose={() => setProefritOpen(false)}
        vehicle={{
          id: vehicle.id,
          merk: vehicle.merk,
          model: vehicle.model,
          kenteken: vehicle.kenteken,
          bouwjaar: vehicle.bouwjaar,
          kilometerstand: vehicle.kilometerstand,
        }}
      />
    </div>
  );
};

export default AdminVoertuigDetailPage;

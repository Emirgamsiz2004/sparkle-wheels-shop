import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useVehicles } from "@/hooks/useVehicles";
import { ArrowLeft, Trash2, Loader2, ExternalLink } from "lucide-react";
import { statusLabels, statusColors } from "@/types/vehicle";
import GoogleDriveIcon from "@/components/admin/GoogleDriveIcon";
import VehicleInfoTab from "@/components/admin/VehicleInfoTab";
import VehicleKostenTab from "@/components/admin/VehicleKostenTab";
import VehicleDocumentenTab from "@/components/admin/VehicleDocumentenTab";
import VehicleFotosTab from "@/components/admin/VehicleFotosTab";
import VehicleFinancieelTab from "@/components/admin/VehicleFinancieelTab";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const tabItems = [
  { key: "info", label: "📋 Info" },
  { key: "kosten", label: "💸 Kosten" },
  { key: "documenten", label: "📄 Documenten" },
  { key: "fotos", label: "📸 Foto's" },
  { key: "financieel", label: "💰 Financieel" },
];

const AdminVoertuigDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicles, loading, deleteVehicle, updateVehicle, addCost, removeCost } = useVehicles();
  const [activeTab, setActiveTab] = useState("info");

  const vehicle = vehicles.find((v) => v.id === id);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!vehicle) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">Voertuig niet gevonden</p>
        <button onClick={() => navigate("/admin/voertuigen")} className="text-foreground hover:underline text-sm">Terug naar overzicht</button>
      </div>
    );
  }

  const handleDelete = async () => {
    await deleteVehicle(vehicle.id);
    navigate("/admin/voertuigen");
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/admin/voertuigen")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Terug naar voertuigen
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {vehicle.merk} {vehicle.model} {vehicle.bouwjaar} <span className="text-muted-foreground font-normal">— {vehicle.kleur || "Onbekend"}</span>
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded border ${statusColors[vehicle.status]}`}>
              {statusLabels[vehicle.status]}
            </span>
            {vehicle.kenteken && (
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{vehicle.kenteken}</span>
            )}
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Verwijderen
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Voertuig verwijderen?</AlertDialogTitle>
              <AlertDialogDescription>
                Dit verwijdert {vehicle.merk} {vehicle.model} en alle bijbehorende kosten, documenten en foto's. Dit kan niet ongedaan worden gemaakt.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuleren</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Verwijderen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabItems.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === t.key
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "info" && <VehicleInfoTab vehicle={vehicle} onSave={updateVehicle} />}
        {activeTab === "kosten" && <VehicleKostenTab vehicle={vehicle} onAddCost={addCost} onRemoveCost={removeCost} />}
        {activeTab === "documenten" && <VehicleDocumentenTab vehicleId={vehicle.id} />}
        {activeTab === "fotos" && <VehicleFotosTab vehicleId={vehicle.id} />}
        {activeTab === "financieel" && <VehicleFinancieelTab vehicle={vehicle} />}
      </div>
    </div>
  );
};

export default AdminVoertuigDetailPage;

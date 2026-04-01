import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useVehicles } from "@/hooks/useVehicles";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Vehicle, statusLabels } from "@/types/vehicle";
import StartProefritDialog from "@/components/admin/proefrit/StartProefritDialog";
import ConsignatieOvereenkomstDialog from "@/components/admin/ConsignatieOvereenkomstDialog";
import AanbetalingDialog from "@/components/admin/AanbetalingDialog";
import VehicleDetailHeader from "@/components/admin/detail/VehicleDetailHeader";
import VehicleOverzichtTab from "@/components/admin/detail/VehicleOverzichtTab";
import VehicleFinancieelEditTab from "@/components/admin/detail/VehicleFinancieelEditTab";
import VehicleDossierTab from "@/components/admin/detail/VehicleDossierTab";
import VehicleTakenTab from "@/components/admin/detail/VehicleTakenTab";
import AddCostDialog from "@/components/admin/detail/AddCostDialog";

const tabItems = [
  { key: "overzicht", label: "Overzicht" },
  { key: "financieel", label: "Financieel" },
  { key: "dossier", label: "Dossier" },
  { key: "taken", label: "Taken & activiteit" },
];

const AdminVoertuigDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicles, loading, deleteVehicle, updateVehicle, addCost, removeCost, refetch } = useVehicles();
  const [activeTab, setActiveTab] = useState("overzicht");
  const [proefritOpen, setProefritOpen] = useState(false);
  const [consignatieOpen, setConsignatieOpen] = useState(false);
  const [aanbetalingOpen, setAanbetalingOpen] = useState(false);
  const [kostenOpen, setKostenOpen] = useState(false);
  const [taakDialogOpen, setTaakDialogOpen] = useState(false);

  const vehicle = vehicles.find((v) => v.id === id);

  const logActivity = useCallback(async (type: string, beschrijving: string) => {
    if (!id) return;
    await supabase.from("vehicle_activity_log").insert({
      vehicle_id: id,
      actie_type: type,
      beschrijving,
    } as any);
  }, [id]);

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

  const handleStatusChange = async (status: Vehicle["status"]) => {
    const updates: any = { ...vehicle, status };
    if (status === "verkocht" && !vehicle.verkoopDatum) {
      updates.verkoopDatum = new Date().toISOString().split("T")[0];
    }
    if (status === "consignatie") {
      updates.verkoopType = "consignatie";
    }
    await updateVehicle(updates);
    await logActivity("status_gewijzigd", `Status gewijzigd naar ${statusLabels[status]}`);
    toast.success(`Status gewijzigd naar ${statusLabels[status]}`);
  };

  const handleAddCostWithLog = async (vehicleId: string, cost: any) => {
    await addCost(vehicleId, cost);
    await logActivity("kosten_toegevoegd", `Kosten: ${cost.description} — € ${cost.amount}`);
  };

  return (
    <div className="space-y-5">
      <VehicleDetailHeader
        vehicle={vehicle}
        onStatusChange={handleStatusChange}
        onOpenProefrit={() => setProefritOpen(true)}
        onOpenAanbetaling={() => setAanbetalingOpen(true)}
        onOpenKosten={() => setKostenOpen(true)}
        onOpenTaak={() => setTaakDialogOpen(true)}
        onDelete={handleDelete}
      />

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

      {/* Tab content */}
      <div>
        {activeTab === "overzicht" && (
          <VehicleOverzichtTab vehicle={vehicle} onSave={updateVehicle} onLogActivity={logActivity} />
        )}
        {activeTab === "financieel" && (
          <VehicleFinancieelEditTab vehicle={vehicle} onSave={updateVehicle} onAddCost={handleAddCostWithLog} onRemoveCost={removeCost} onLogActivity={logActivity} />
        )}
        {activeTab === "dossier" && (
          <VehicleDossierTab vehicleId={vehicle.id} />
        )}
        {activeTab === "taken" && (
          <VehicleTakenTab vehicleId={vehicle.id} />
        )}
      </div>

      {/* Dialogs */}
      <StartProefritDialog
        open={proefritOpen}
        onClose={() => setProefritOpen(false)}
        vehicle={{ id: vehicle.id, merk: vehicle.merk, model: vehicle.model, kenteken: vehicle.kenteken, bouwjaar: vehicle.bouwjaar, kilometerstand: vehicle.kilometerstand }}
      />
      <ConsignatieOvereenkomstDialog open={consignatieOpen} onClose={() => setConsignatieOpen(false)} vehicle={vehicle} />
      <AanbetalingDialog open={aanbetalingOpen} onClose={() => setAanbetalingOpen(false)} vehicle={vehicle} onStatusChange={refetch} />
      <AddCostDialog open={kostenOpen} onClose={() => setKostenOpen(false)} vehicleId={vehicle.id} onAddCost={handleAddCostWithLog} />
      
      {/* Taak dialog - triggered from header, opened in TakenTab */}
      {taakDialogOpen && (
        (() => {
          // Switch to taken tab and close this trigger
          setActiveTab("taken");
          setTaakDialogOpen(false);
          return null;
        })()
      )}
    </div>
  );
};

export default AdminVoertuigDetailPage;

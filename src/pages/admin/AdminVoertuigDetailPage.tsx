import { useState, useCallback, useEffect, useRef } from "react";
import { recheckApk, formatApkNl } from "@/lib/apkRecheck";
import SlidingTabs from "@/components/admin/SlidingTabs";
import { useParams, useNavigate } from "react-router-dom";
import { useVehicles } from "@/hooks/useVehicles";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Vehicle, statusLabels } from "@/types/vehicle";
import StartProefritDialog from "@/components/admin/proefrit/StartProefritDialog";
import VehicleDetailHeader from "@/components/admin/detail/VehicleDetailHeader";
import VehicleOverzichtTab from "@/components/admin/detail/VehicleOverzichtTab";
import VehicleTakenTab from "@/components/admin/detail/VehicleTakenTab";
import VehicleAfleveringTab from "@/components/admin/detail/VehicleAfleveringTab";
import AddCostDialog from "@/components/admin/detail/AddCostDialog";
import AppointmentFormDialog from "@/components/admin/planning/AppointmentFormDialog";
import { useCustomers } from "@/hooks/useCustomers";
import { useAppointments } from "@/hooks/useAppointments";

const baseTabs = [
  { key: "overzicht", label: "Overzicht" },
  { key: "taken", label: "Activiteit" },
];

const AdminVoertuigDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicles, loading, deleteVehicle, updateVehicle, addCost, removeCost, refetch } = useVehicles();
  const { customers } = useCustomers();
  const { addAppointment } = useAppointments();
  const [activeTab, setActiveTab] = useState("overzicht");
  const [proefritOpen, setProefritOpen] = useState(false);
  const [kostenOpen, setKostenOpen] = useState(false);
  const [afspraakOpen, setAfspraakOpen] = useState(false);
  const [afspraakType, setAfspraakType] = useState<string | undefined>();
  const [inruilBron, setInruilBron] = useState<{ vehicleId: string; merk: string; model: string; kenteken: string | null } | null>(null);

  const vehicle = vehicles.find((v) => v.id === id);

  // Inruil-herkomst: zoek de oorspronkelijke verkoop + bijbehorend voertuig
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!vehicle || vehicle.herkomst !== "inruil" || !vehicle.inruilVanVerkoopId) {
        setInruilBron(null);
        return;
      }
      const { data: vr } = await supabase
        .from("verkopen" as any)
        .select("vehicle_id")
        .eq("id", vehicle.inruilVanVerkoopId)
        .maybeSingle();
      const verkoopVehicleId = (vr as any)?.vehicle_id;
      if (!verkoopVehicleId) { if (!cancelled) setInruilBron(null); return; }
      const { data: vh } = await supabase
        .from("vehicles")
        .select("id, merk, model, kenteken")
        .eq("id", verkoopVehicleId)
        .maybeSingle();
      if (cancelled || !vh) return;
      setInruilBron({ vehicleId: (vh as any).id, merk: (vh as any).merk, model: (vh as any).model, kenteken: (vh as any).kenteken });
    };
    load();
    return () => { cancelled = true; };
  }, [vehicle?.id, vehicle?.herkomst, vehicle?.inruilVanVerkoopId]);


  // Verkochte voertuigen horen niet thuis op de voertuigpagina — stuur door naar verkoop-detail
  useEffect(() => {
    if (vehicle && vehicle.status === "verkocht") {
      navigate(`/admin/verkopen/${vehicle.id}`, { replace: true });
    }
  }, [vehicle?.id, vehicle?.status, navigate]);

  // Automatische APK-hercheck bij openen detailpagina
  const apkCheckedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!vehicle?.id || !vehicle.kenteken) return;
    if (apkCheckedRef.current === vehicle.id) return;
    apkCheckedRef.current = vehicle.id;
    (async () => {
      const updated = await recheckApk(vehicle.id, vehicle.kenteken, vehicle.apkVervaldatum);
      if (updated) {
        toast.success(`APK datum bijgewerkt naar ${formatApkNl(updated)}`);
        refetch();
      }
    })();
  }, [vehicle?.id, vehicle?.kenteken, vehicle?.apkVervaldatum, refetch]);

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
        onOpenKosten={() => setKostenOpen(true)}
        onOpenAfspraak={(type?: string) => { setAfspraakType(type); setAfspraakOpen(true); }}
        onOpenVerkoop={() => navigate(`/admin/verkopen/nieuw/${vehicle.id}`)}
      />
      {/* Tabs */}
      {(() => {
        const tabItems = [
          ...baseTabs,
          ...(vehicle.status === "gereserveerd" ? [{ key: "aflevering", label: "Aflevering" }] : []),
        ];
        return (
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <SlidingTabs
              tabs={tabItems.map(t => ({ label: t.label, value: t.key }))}
              value={activeTab}
              onChange={setActiveTab}
              className="min-w-max"
            />
          </div>
        );
      })()}

      {/* Tab content */}
      <div>
        {activeTab === "overzicht" && (
          <VehicleOverzichtTab vehicle={vehicle} onSave={updateVehicle} onLogActivity={logActivity} />
        )}
        {activeTab === "taken" && (
          <VehicleTakenTab vehicleId={vehicle.id} />
        )}
        {activeTab === "aflevering" && (
          <VehicleAfleveringTab vehicle={vehicle} onVehicleUpdate={refetch} />
        )}
      </div>

      {/* Dialogs */}
      <StartProefritDialog
        open={proefritOpen}
        onClose={() => setProefritOpen(false)}
        vehicle={{ id: vehicle.id, merk: vehicle.merk, model: vehicle.model, kenteken: vehicle.kenteken, bouwjaar: vehicle.bouwjaar, kilometerstand: vehicle.kilometerstand }}
      />
      <AddCostDialog open={kostenOpen} onClose={() => setKostenOpen(false)} vehicleId={vehicle.id} onAddCost={handleAddCostWithLog} />
      <AppointmentFormDialog
        open={afspraakOpen}
        onOpenChange={(v) => { setAfspraakOpen(v); if (!v) setAfspraakType(undefined); }}
        customers={customers.map(c => ({ id: c.id, voornaam: c.voornaam, achternaam: c.achternaam }))}
        vehicles={[{ id: vehicle.id, merk: vehicle.merk, model: vehicle.model, kenteken: vehicle.kenteken }]}
        defaultType={afspraakType}
        defaultVehicleId={vehicle.id}
        onSubmit={async (data) => {
          await addAppointment({ ...data, vehicle_id: vehicle.id });
          toast.success("Afspraak ingepland");
        }}
      />
    </div>
  );
};

export default AdminVoertuigDetailPage;

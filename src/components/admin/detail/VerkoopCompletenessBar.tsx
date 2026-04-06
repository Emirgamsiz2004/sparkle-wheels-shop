import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  vehicleId: string;
  vehicleStatus: string;
  koperNaam?: string | null;
}

const VERKOOP_TAKEN = [
  "Kopersgegevens invullen",
  "Koopovereenkomst genereren en uploaden",
  "Factuur aanmaken",
  "Vrijwaringsbewijs uploaden",
  "Betaling controleren",
];

const VerkoopCompletenessBar = ({ vehicleId, vehicleStatus, koperNaam }: Props) => {
  const [tasks, setTasks] = useState<{ omschrijving: string; voltooid: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vehicleStatus !== "verkocht") { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from("vehicle_tasks")
        .select("omschrijving, voltooid")
        .eq("vehicle_id", vehicleId)
        .in("omschrijving", VERKOOP_TAKEN);
      setTasks((data as any[]) || []);
      setLoading(false);
    };
    fetch();
  }, [vehicleId, vehicleStatus]);

  if (vehicleStatus !== "verkocht" || loading) return null;

  // If no verkoop tasks exist yet, don't show bar
  if (tasks.length === 0) return null;

  const done = tasks.filter(t => t.voltooid).length;
  const total = tasks.length;
  const allDone = done === total;
  const pct = Math.round((done / total) * 100);

  return (
    <div className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md border text-xs ${
      allDone
        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
        : "bg-amber-500/10 border-amber-500/30 text-amber-400"
    }`}>
      {allDone ? (
        <CheckCircle2 className="w-4 h-4 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <span className="font-medium">
          {allDone ? "Verkoopgegevens compleet" : `Verkoopgegevens onvolledig — ${done}/${total} taken afgerond`}
        </span>
        {!koperNaam && !allDone && (
          <span className="ml-2 text-muted-foreground">• Kopersgegevens ontbreken</span>
        )}
      </div>
      {!allDone && (
        <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden shrink-0">
          <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
};

export default VerkoopCompletenessBar;

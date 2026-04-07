import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  vehicleId: string;
  vehicleStatus: string;
  koperNaam?: string | null;
  koperEmail?: string | null;
  koperTelefoon?: string | null;
  verkoopDatum?: string | null;
  verkoopprijs?: number | null;
  onGoToDossier?: () => void;
}

const REQUIRED_DOCS = [
  "Koopovereenkomst",
  "Verkoopfactuur",
  "Vrijwaringsbewijs",
];

const REQUIRED_DATA = [
  { key: "koperNaam", label: "Koper naam" },
  { key: "koperEmail", label: "Koper e-mail" },
  { key: "koperTelefoon", label: "Koper telefoon" },
  { key: "verkoopDatum", label: "Verkoopdatum" },
  { key: "verkoopprijs", label: "Verkoopprijs" },
];

const VerkoopCompletenessBar = ({ vehicleId, vehicleStatus, koperNaam, koperEmail, koperTelefoon, verkoopDatum, verkoopprijs, onGoToDossier }: Props) => {
  const [uploadedTypes, setUploadedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vehicleStatus !== "verkocht") { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from("vehicle_documents")
        .select("type")
        .eq("vehicle_id", vehicleId)
        .in("type", REQUIRED_DOCS);
      setUploadedTypes((data as any[])?.map(d => d.type) || []);
      setLoading(false);
    };
    fetch();
  }, [vehicleId, vehicleStatus]);

  if (vehicleStatus !== "verkocht" || loading) return null;

  const vehicleData: Record<string, any> = { koperNaam, koperEmail, koperTelefoon, verkoopDatum, verkoopprijs };
  const hasData = (key: string) => {
    const val = vehicleData[key];
    if (val === null || val === undefined || val === "") return false;
    if (typeof val === "number" && val === 0) return false;
    return true;
  };

  const docsPresent = REQUIRED_DOCS.filter(t => uploadedTypes.includes(t)).length;
  const dataPresent = REQUIRED_DATA.filter(d => hasData(d.key)).length;
  const done = docsPresent + dataPresent;
  const total = REQUIRED_DOCS.length + REQUIRED_DATA.length;
  const allDone = done === total;
  const pct = Math.round((done / total) * 100);

  // Missing items for tooltip
  const missingDocs = REQUIRED_DOCS.filter(t => !uploadedTypes.includes(t));
  const missingData = REQUIRED_DATA.filter(d => !hasData(d.key));

  return (
    <button
      onClick={onGoToDossier}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md border text-xs text-left transition-colors ${
        allDone
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15"
          : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/15"
      }`}
    >
      {allDone ? (
        <CheckCircle2 className="w-4 h-4 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <span className="font-medium">
          {allDone ? "Verkoopdossier compleet" : `Verkoopdossier onvolledig — ${done}/${total} afgerond`}
        </span>
        {!allDone && (missingDocs.length > 0 || missingData.length > 0) && (
          <span className="ml-2 text-muted-foreground">
            {missingData.length > 0 && `• ${missingData.length} gegeven(s) `}
            {missingDocs.length > 0 && `• ${missingDocs.length} document(en)`}
          </span>
        )}
      </div>
      {!allDone && (
        <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden shrink-0">
          <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
    </button>
  );
};

export default VerkoopCompletenessBar;

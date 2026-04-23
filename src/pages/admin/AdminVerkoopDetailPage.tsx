import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useVehicles } from "@/hooks/useVehicles";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Phone, Mail, Download, ExternalLink, FileText, CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { formatEuroDecimal, calcWinst, isConsignatie } from "@/types/vehicle";
import VerkoopWizard from "@/components/admin/verkoop/VerkoopWizard";

const WIZARD_STEPS = [
  { num: 1, label: "Klant" },
  { num: 2, label: "Details" },
  { num: 3, label: "Overeenkomst" },
  { num: 4, label: "Factuur" },
  { num: 5, label: "Afronden" },
];

const AdminVerkoopDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicles, loading, refetch } = useVehicles();
  const [sale, setSale] = useState<any>(null);
  const [docs, setDocs] = useState<{ id: string; type: string; naam: string; file_path: string }[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);

  const vehicle = vehicles.find(v => v.id === id);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const [docRes, saleRes] = await Promise.all([
        supabase.from("vehicle_documents").select("id, type, naam, file_path").eq("vehicle_id", id),
        supabase.from("vehicle_sales").select("*").eq("vehicle_id", id).order("created_at", { ascending: false }).limit(1),
      ]);
      setDocs((docRes.data as any[]) || []);
      setSale(saleRes.data?.[0] || null);
      setLoadingData(false);
    };
    fetchData();
  }, [id]);

  const handleOpenDocument = async (filePath: string) => {
    const { data, error } = await supabase.storage.from("vehicle-documents").createSignedUrl(filePath, 300);
    if (error || !data?.signedUrl) { toast.error("Openen mislukt"); return; }
    window.open(data.signedUrl, "_blank");
  };

  if (loading || loadingData) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  if (!vehicle) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4 text-sm">Verkoop niet gevonden</p>
        <button onClick={() => navigate("/admin/verkopen")} className="text-foreground hover:underline text-sm">Terug</button>
      </div>
    );
  }

  const winst = calcWinst(vehicle);
  const isAfgerond = sale?.status === "voltooid" || vehicle.status === "verkocht";
  const huidigeStap = sale?.wizard_stap || 1;
  const betaalwijze = sale?.betaalwijze || vehicle.betaalmethode || "—";
  const garantieType = sale?.garantie_type || "geen";
  const garantieMaanden = sale?.garantie_maanden || 0;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate("/admin/verkopen")} className="mt-1 p-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-medium text-foreground">
            {vehicle.merk} {vehicle.model} {vehicle.bouwjaar}
            {vehicle.kenteken && <span className="text-muted-foreground font-mono text-sm ml-2 uppercase">{vehicle.kenteken}</span>}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {isAfgerond ? (
              <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Afgerond</span>
            ) : (
              <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded border bg-amber-500/15 text-amber-400 border-amber-500/30">In behandeling</span>
            )}
          </div>
        </div>
        <Link to={`/admin/voertuigen/${vehicle.id}`} className="text-xs text-muted-foreground hover:text-foreground border border-border px-2.5 py-1.5 rounded-md">
          Voertuigdetails
        </Link>
      </div>

      {/* Resume wizard if not finished */}
      {!isAfgerond && (
        <button
          onClick={() => setWizardOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors"
        >
          <PlayCircle className="w-4 h-4" /> Wizard hervatten (stap {huidigeStap} van 5)
        </button>
      )}

      {/* Samenvatting */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Samenvatting</h3>
        <table className="w-full text-sm">
          <tbody>
            <SumRow label="Voertuig" value={`${vehicle.merk} ${vehicle.model} (${vehicle.bouwjaar})`} />
            <SumRow label="Kenteken" value={vehicle.kenteken?.toUpperCase() || "—"} />
            <SumRow label="Klant" value={vehicle.koperNaam || "—"} />
            {vehicle.koperTelefoon && (
              <tr className="border-b border-border/50">
                <td className="py-2.5 pr-4 text-xs text-muted-foreground">Telefoon</td>
                <td className="py-2.5 text-sm text-right">
                  <a href={`tel:${vehicle.koperTelefoon}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                    <Phone className="w-3 h-3" /> {vehicle.koperTelefoon}
                  </a>
                </td>
              </tr>
            )}
            {vehicle.koperEmail && (
              <tr className="border-b border-border/50">
                <td className="py-2.5 pr-4 text-xs text-muted-foreground">E-mail</td>
                <td className="py-2.5 text-sm text-right">
                  <a href={`mailto:${vehicle.koperEmail}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                    <Mail className="w-3 h-3" /> {vehicle.koperEmail}
                  </a>
                </td>
              </tr>
            )}
            <SumRow label="Verkoopprijs" value={formatEuroDecimal(vehicle.verkoopprijs)} />
            <SumRow label="Verkoopdatum" value={vehicle.verkoopDatum ? new Date(vehicle.verkoopDatum).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }) : "—"} />
            <SumRow label="Betaalwijze" value={betaalwijze.charAt(0).toUpperCase() + betaalwijze.slice(1)} />
            <SumRow label="Garantie" value={garantieType === "geen" ? "Geen garantie" : `${garantieType === "autotrust" ? "AutoTrust" : "Eigen"}${garantieMaanden ? ` — ${garantieMaanden} mnd` : ""}`} />
            <SumRow label="Marge" value={isConsignatie(vehicle) ? `${vehicle.consignatieCommissiePerc || 10}% commissie` : formatEuroDecimal(winst)} valueColor={winst >= 0 ? "text-emerald-500" : "text-red-500"} isLast />
          </tbody>
        </table>
      </div>

      {/* Wizard voortgang */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Wizard voortgang</h3>
        <div className="space-y-2">
          {WIZARD_STEPS.map(s => {
            const done = isAfgerond || s.num < huidigeStap;
            const current = !isAfgerond && s.num === huidigeStap;
            return (
              <div key={s.num} className="flex items-center gap-2.5">
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : current ? (
                  <div className="w-4 h-4 rounded-full border-2 border-amber-400 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                )}
                <span className={`text-sm ${done ? "text-foreground" : current ? "text-amber-400 font-medium" : "text-muted-foreground"}`}>
                  Stap {s.num}: {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Documenten */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Gegenereerde documenten</h3>
        {docs.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nog geen documenten gegenereerd.</p>
        ) : (
          <div className="divide-y divide-border">
            {docs.map(d => (
              <div key={d.id} className="flex items-center gap-2.5 py-2.5">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">{d.naam}</p>
                  <p className="text-[10px] text-muted-foreground">{d.type}</p>
                </div>
                <button
                  onClick={() => handleOpenDocument(d.file_path)}
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline shrink-0"
                >
                  <ExternalLink className="w-3 h-3" /> Openen
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <VerkoopWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        vehicle={vehicle}
        initialStep={huidigeStap}
        onComplete={() => { setWizardOpen(false); refetch(); }}
      />
    </div>
  );
};

const SumRow = ({ label, value, valueColor, isLast }: { label: string; value: string; valueColor?: string; isLast?: boolean }) => (
  <tr className={!isLast ? "border-b border-border/50" : ""}>
    <td className="py-2.5 pr-4 text-xs text-muted-foreground whitespace-nowrap">{label}</td>
    <td className={`py-2.5 text-sm font-medium tabular-nums text-right ${valueColor || "text-foreground"}`}>{value}</td>
  </tr>
);

export default AdminVerkoopDetailPage;

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Pencil, Check, X, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useVehicles } from "@/hooks/useVehicles";
import { Vehicle, formatEuroDecimal, calcKostprijs, calcWinst, calcMarge, brandstofLabels } from "@/types/vehicle";
import KoppelKlantBlock from "@/components/admin/detail/KoppelKlantBlock";
import { toast } from "sonner";

const STAP_NAMEN: Record<number, string> = {
  1: "Voertuig", 2: "Aflevering & aanbetaling", 3: "Klantgegevens", 4: "Garantie",
  5: "Koopovereenkomst", 6: "Inruil document", 7: "Factuur", 8: "Betaling",
  9: "Inruil op naam", 10: "Vrijwaring & overschrijving", 11: "Uitlevering", 12: "Afsluiting",
};

const inputCls = "w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all";

const InfoRow = ({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) => (
  <tr className={isLast ? "" : "border-b border-border/50"}>
    <td className="py-2 pr-4 text-xs text-muted-foreground whitespace-nowrap">{label}</td>
    <td className="py-2 text-sm text-foreground tabular-nums">{value}</td>
  </tr>
);

const KpiCard = ({ label, value, color, editable, rawValue, onSave }: {
  label: string; value: string; color?: string; editable?: boolean;
  rawValue?: number; onSave?: (val: number) => Promise<void>;
}) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);
  const start = () => { setVal(rawValue && rawValue > 0 ? String(rawValue) : ""); setEditing(true); };
  const cancel = () => { setEditing(false); setVal(""); };
  const commit = async () => {
    if (!onSave) return cancel();
    const n = Number(val.trim().replace(",", "."));
    if (!val.trim() || isNaN(n) || n < 0) { toast.error("Ongeldig bedrag"); return; }
    setSaving(true);
    try { await onSave(n); setEditing(false); } finally { setSaving(false); }
  };
  return (
    <div className="bg-card border border-border rounded-lg p-3 group">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted-foreground">€</span>
          <input
            autoFocus type="text" inputMode="decimal" value={val} disabled={saving}
            onChange={(e) => setVal(e.target.value.replace(/[^0-9.,]/g, ""))}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } if (e.key === "Escape") { e.preventDefault(); cancel(); } }}
            className="flex-1 min-w-0 px-2 py-1 text-base font-semibold tabular-nums bg-secondary/50 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button onClick={commit} disabled={saving} className="p-1 text-emerald-500 hover:text-emerald-400 disabled:opacity-50"><Check className="w-4 h-4" /></button>
          <button onClick={cancel} disabled={saving} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <p className={`text-base font-semibold tabular-nums ${color || ""}`}>{value}</p>
          {editable && (
            <button onClick={start} className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-foreground transition-opacity">
              <Pencil className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const AdminVerkoopDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicles, loading: vehiclesLoading, updateVehicle } = useVehicles();

  // id kan een vehicle id zijn (verkocht voertuig) — dat is ons stabiele anker tussen verkopen en voertuigen.
  const vehicle = useMemo(() => vehicles.find((v) => v.id === id), [vehicles, id]);

  const [verkoopRow, setVerkoopRow] = useState<any | null>(null);
  const [verkoopLoading, setVerkoopLoading] = useState(true);

  // Koper edit state (lokaal, opgeslagen op vehicle record net als wizard doet)
  const [koperNaam, setKoperNaam] = useState("");
  const [koperTelefoon, setKoperTelefoon] = useState("");
  const [koperEmail, setKoperEmail] = useState("");
  const [verkoopDatum, setVerkoopDatum] = useState("");
  const [verkoopprijsStr, setVerkoopprijsStr] = useState("");
  const [savingKoper, setSavingKoper] = useState(false);

  useEffect(() => {
    if (!vehicle) return;
    setKoperNaam(vehicle.koperNaam || "");
    setKoperTelefoon(vehicle.koperTelefoon || "");
    setKoperEmail(vehicle.koperEmail || "");
    setVerkoopDatum(vehicle.verkoopDatum || "");
    setVerkoopprijsStr(vehicle.verkoopprijs ? String(vehicle.verkoopprijs) : "");
  }, [vehicle?.id, vehicle?.koperNaam, vehicle?.koperTelefoon, vehicle?.koperEmail, vehicle?.verkoopDatum, vehicle?.verkoopprijs]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setVerkoopLoading(true);
      const { data } = await supabase
        .from("verkopen" as any)
        .select("id, wizard_stap, wizard_status, customer_id, vehicle_id, updated_at, created_at")
        .eq("vehicle_id", id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        setVerkoopRow(data || null);
        setVerkoopLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (vehiclesLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  if (!vehicle) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4 text-sm">Verkoop niet gevonden</p>
        <button onClick={() => navigate("/admin/verkopen")} className="text-foreground hover:underline text-sm">Terug naar verkopen</button>
      </div>
    );
  }

  const winst = calcWinst(vehicle);
  const margePerc = calcMarge(vehicle);
  const kostprijs = calcKostprijs(vehicle);

  const handleSaveInkoop = async (val: number) => {
    await updateVehicle({ ...vehicle, inkoopprijs: val });
    toast.success("Inkoopprijs bijgewerkt");
  };
  const handleSaveVerkoop = async (val: number) => {
    await updateVehicle({ ...vehicle, verkoopprijs: val });
    toast.success("Verkoopprijs bijgewerkt");
  };

  const handleSaveKoper = async () => {
    setSavingKoper(true);
    try {
      const prijs = verkoopprijsStr.trim() === "" ? 0 : Number(verkoopprijsStr.replace(",", "."));
      await updateVehicle({
        ...vehicle,
        koperNaam: koperNaam || undefined,
        koperTelefoon: koperTelefoon || undefined,
        koperEmail: koperEmail || undefined,
        verkoopDatum: verkoopDatum || undefined,
        verkoopprijs: isNaN(prijs) ? vehicle.verkoopprijs : prijs,
      });
      toast.success("Kopergegevens opgeslagen");
    } catch {
      toast.error("Opslaan mislukt");
    } finally {
      setSavingKoper(false);
    }
  };

  const stap = verkoopRow?.wizard_stap || 0;
  const stapNaam = stap > 0 ? STAP_NAMEN[stap] : null;
  const wizardAfgerond = verkoopRow?.wizard_status === "afgerond" || stap >= 12;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-3">
        <button
          onClick={() => navigate("/admin/verkopen")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Terug naar verkopen
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-base font-medium text-foreground leading-tight">
            {vehicle.merk} {vehicle.model} {vehicle.bouwjaar}
          </h1>
          {vehicle.kenteken && (
            <span className="text-[11px] font-mono text-muted-foreground uppercase">{vehicle.kenteken}</span>
          )}
          <span className="inline-flex items-center justify-center min-w-[80px] h-5 px-1.5 text-[10px] font-medium rounded border border-purple-500/30 bg-purple-500/15 text-purple-400 whitespace-nowrap leading-none">
            Verkocht
          </span>
        </div>
      </div>

      {/* Wizard status compact */}
      <div className="bg-card border border-border rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Verkoopwizard</p>
          {verkoopLoading ? (
            <p className="text-sm text-foreground mt-0.5">Laden...</p>
          ) : !verkoopRow ? (
            <p className="text-sm text-foreground mt-0.5">Nog niet gestart</p>
          ) : wizardAfgerond ? (
            <p className="text-sm text-emerald-400 mt-0.5">Afgerond — alle 12 stappen voltooid</p>
          ) : (
            <p className="text-sm text-foreground mt-0.5">
              Stap {stap}/12{stapNaam ? ` — ${stapNaam}` : ""}
            </p>
          )}
        </div>
        <Link
          to={`/admin/verkopen/nieuw/${vehicle.id}`}
          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
        >
          {wizardAfgerond ? "Wizard openen" : "Wizard hervatten"}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Inkoop" value={formatEuroDecimal(vehicle.inkoopprijs || 0)} editable rawValue={vehicle.inkoopprijs || 0} onSave={handleSaveInkoop} />
        <KpiCard label="Verkoop" value={formatEuroDecimal(vehicle.verkoopprijs || 0)} editable rawValue={vehicle.verkoopprijs || 0} onSave={handleSaveVerkoop} />
        <KpiCard label="Winst" value={vehicle.verkoopprijs > 0 ? formatEuroDecimal(winst) : "—"} color={winst >= 0 ? "text-emerald-500" : "text-red-500"} />
        <KpiCard label="Marge" value={vehicle.verkoopprijs > 0 ? `${margePerc.toFixed(1)}%` : "—"} color={margePerc >= 0 ? "text-emerald-500" : "text-red-500"} />
      </div>
      {kostprijs > 0 && (
        <p className="text-[11px] text-muted-foreground -mt-2">
          Kostprijs (incl. kosten): {formatEuroDecimal(kostprijs)}
        </p>
      )}

      {/* Voertuiggegevens (readonly) */}
      <div className="bg-card border border-border rounded-lg p-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Voertuiggegevens</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-6">
          <table className="w-full text-sm">
            <tbody>
              <InfoRow label="Kenteken" value={vehicle.kenteken?.toUpperCase() || "—"} />
              <InfoRow label="Chassisnummer" value={vehicle.chassisNummer || "—"} />
              <InfoRow label="Merk" value={vehicle.merk} />
              <InfoRow label="Model" value={vehicle.model} />
              <InfoRow label="Bouwjaar" value={String(vehicle.bouwjaar)} isLast />
            </tbody>
          </table>
          <table className="w-full text-sm">
            <tbody>
              <InfoRow label="Kleur" value={vehicle.kleur || "—"} />
              <InfoRow label="Brandstof" value={brandstofLabels[vehicle.brandstof] || vehicle.brandstof} />
              <InfoRow label="KM-stand" value={vehicle.kilometerstand?.toLocaleString("nl-NL") || "—"} />
              <InfoRow
                label="APK tot"
                value={vehicle.apkVervaldatum ? new Date(vehicle.apkVervaldatum).toLocaleDateString("nl-NL") : "—"}
                isLast
              />
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">
          Voertuiggegevens beheer je in de voertuig-module (alleen-lezen weergave).
        </p>
      </div>

      {/* Gekoppelde klant */}
      <KoppelKlantBlock vehicleId={vehicle.id} />

      {/* Kopergegevens (bewerkbaar) */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kopergegevens</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Naam</label>
            <input value={koperNaam} onChange={(e) => setKoperNaam(e.target.value)} className={inputCls} placeholder="Naam koper" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Telefoon</label>
            <input value={koperTelefoon} onChange={(e) => setKoperTelefoon(e.target.value)} className={inputCls} placeholder="06-12345678" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">E-mail</label>
            <input value={koperEmail} onChange={(e) => setKoperEmail(e.target.value)} className={inputCls} placeholder="email@voorbeeld.nl" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Verkoopdatum</label>
            <input type="date" value={verkoopDatum} onChange={(e) => setVerkoopDatum(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Verkoopprijs</label>
            <input
              type="text"
              inputMode="decimal"
              value={verkoopprijsStr}
              onChange={(e) => setVerkoopprijsStr(e.target.value.replace(/[^0-9.,]/g, ""))}
              className={inputCls}
              placeholder="0"
            />
          </div>
        </div>
        <div>
          <button
            onClick={handleSaveKoper}
            disabled={savingKoper}
            className="px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
          >
            {savingKoper ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminVerkoopDetailPage;

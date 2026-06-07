import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Pencil, Check, X, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useVehicles } from "@/hooks/useVehicles";
import { formatEuroDecimal, brandstofLabels, isConsignatie } from "@/types/vehicle";
import KoppelKlantBlock from "@/components/admin/detail/KoppelKlantBlock";
import { toast } from "sonner";

const STAP_NAMEN: Record<number, string> = {
  1: "Voertuig", 2: "Aflevering & aanbetaling", 3: "Klantgegevens", 4: "Garantie",
  5: "Koopovereenkomst", 6: "Inruil document", 7: "Factuur", 8: "Betaling",
  9: "Inruil op naam", 10: "Vrijwaring & overschrijving", 11: "Uitlevering", 12: "Afsluiting",
};

const inputCls = "w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all";

const formatDateNl = (d?: string | null) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return "—"; }
};

const parseEuro = (s: string): number | null => {
  const cleaned = s.trim().replace(/\./g, "").replace(",", ".");
  if (cleaned === "") return 0;
  const n = Number(cleaned);
  return isNaN(n) ? null : n;
};

const InfoRow = ({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) => (
  <tr className={isLast ? "" : "border-b border-border/50"}>
    <td className="py-2 pr-4 text-xs text-muted-foreground whitespace-nowrap">{label}</td>
    <td className="py-2 text-sm text-foreground tabular-nums">{value}</td>
  </tr>
);

const KpiCard = ({ label, value, color, editable, rawValue, onSave, hint, unit = "€" }: {
  label: string; value: string; color?: string; editable?: boolean;
  rawValue?: number; onSave?: (val: number) => Promise<void>; hint?: string; unit?: string;
}) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);
  const start = () => { setVal(rawValue && rawValue > 0 ? String(rawValue) : ""); setEditing(true); };
  const cancel = () => { setEditing(false); setVal(""); };
  const commit = async () => {
    if (!onSave) return cancel();
    const n = parseEuro(val);
    if (n === null || n < 0) { toast.error("Ongeldige waarde"); return; }
    setSaving(true);
    try { await onSave(n); setEditing(false); } finally { setSaving(false); }
  };
  return (
    <div className="bg-card border border-border rounded-lg p-3 group">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted-foreground">{unit}</span>
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
            <button onClick={start} className="p-0.5 text-muted-foreground hover:text-foreground transition-colors" title="Bewerken">
              <Pencil className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
      {hint && !editing && <p className="text-[10px] text-muted-foreground/70 mt-1">{hint}</p>}
    </div>
  );
};

const ReadRow = ({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className={`text-sm tabular-nums ${valueColor || "text-foreground"}`}>{value}</span>
  </div>
);

const GARANTIE_OPTIES = [
  { value: "geen", label: "Geen garantie" },
  { value: "autotrust_12", label: "Autotrust 12 maanden" },
  { value: "autotrust_24", label: "Autotrust 24 maanden" },
  { value: "anders", label: "Anders" },
];

const BETAAL_OPTIES = [
  { value: "", label: "Nog niet betaald" },
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "combinatie", label: "Combinatie" },
];

const garantieLabel = (v?: string | null) => GARANTIE_OPTIES.find(o => o.value === v)?.label || (v ? v : "—");
const betaalLabel = (v?: string | null) => {
  if (!v) return "Nog niet betaald";
  return BETAAL_OPTIES.find(o => o.value === v)?.label || v;
};

const AdminVerkoopDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicles, loading: vehiclesLoading, updateVehicle } = useVehicles();

  const vehicle = useMemo(() => vehicles.find((v) => v.id === id), [vehicles, id]);

  const [verkoopRow, setVerkoopRow] = useState<any | null>(null);
  const [verkoopLoading, setVerkoopLoading] = useState(true);

  // Verkoopgegevens edit
  const [vgEdit, setVgEdit] = useState(false);
  const [vgSaving, setVgSaving] = useState(false);
  const [vg, setVg] = useState({
    verkoopprijs: "",
    inkoopprijs: "",
    heeftInruil: false,
    inruilKenteken: "",
    inruilMerkModel: "",
    inruilWaarde: "",
    inruilKm: "",
    betaalmethode: "",
    aanbetaling: "",
    betaaldatum: "",
    betalingNotities: "",
    garantieType: "geen",
    garantieBedrag: "",
    verkoopDatum: "",
    afleveringsdatum: "",
    verkoopNotities: "",
  });

  // Kopergegevens (afzonderlijke sectie, blijft bestaan)
  const [koperNaam, setKoperNaam] = useState("");
  const [koperTelefoon, setKoperTelefoon] = useState("");
  const [koperEmail, setKoperEmail] = useState("");
  const [savingKoper, setSavingKoper] = useState(false);

  const fetchVerkoop = useCallback(async () => {
    if (!id) return;
    setVerkoopLoading(true);
    const { data } = await supabase
      .from("verkopen" as any)
      .select("*")
      .eq("vehicle_id", id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setVerkoopRow(data || null);
    setVerkoopLoading(false);
  }, [id]);

  useEffect(() => { fetchVerkoop(); }, [fetchVerkoop]);

  // Sync state from vehicle + verkoopRow into edit form whenever data ververst
  useEffect(() => {
    if (!vehicle) return;
    const vr: any = verkoopRow || {};
    const merkModel = [vr.inruil_merk, vr.inruil_model].filter(Boolean).join(" ");
    setVg({
      verkoopprijs: (vr.verkoopprijs ?? vehicle.verkoopprijs ?? 0) ? String(vr.verkoopprijs ?? vehicle.verkoopprijs) : "",
      inkoopprijs: vehicle.inkoopprijs ? String(vehicle.inkoopprijs) : "",
      heeftInruil: !!vr.inruil,
      inruilKenteken: vr.inruil_kenteken || "",
      inruilMerkModel: merkModel,
      inruilWaarde: vr.inruil_waarde ? String(vr.inruil_waarde) : "",
      inruilKm: vr.inruil_km ? String(vr.inruil_km) : "",
      betaalmethode: vr.betaalwijze || "",
      aanbetaling: vr.aanbetaling_bedrag ? String(vr.aanbetaling_bedrag) : "",
      betaaldatum: vr.betaling_datum || "",
      betalingNotities: vr.betaling_opmerking || "",
      garantieType: vr.garantie_type || "geen",
      garantieBedrag: vr.garantie_prijs ? String(vr.garantie_prijs) : "",
      verkoopDatum: vehicle.verkoopDatum || "",
      afleveringsdatum: vr.leverdatum || "",
      verkoopNotities: vr.opmerkingen || "",
    });
    setKoperNaam(vehicle.koperNaam || "");
    setKoperTelefoon(vehicle.koperTelefoon || "");
    setKoperEmail(vehicle.koperEmail || "");
  }, [vehicle, verkoopRow]);

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

  // Berekende waarden — altijd op basis van actuele bron (verkoopRow heeft voorrang voor verkoopprijs/inruil)
  const verkoopprijsActueel = Number(verkoopRow?.verkoopprijs ?? vehicle.verkoopprijs ?? 0);
  const inkoopprijsActueel = Number(vehicle.inkoopprijs || 0);
  const heeftInruilActueel = !!verkoopRow?.inruil;
  const inruilWaardeActueel = Number(verkoopRow?.inruil_waarde || 0);
  const werkelijkBetaald = heeftInruilActueel ? Math.max(0, verkoopprijsActueel - inruilWaardeActueel) : verkoopprijsActueel;
  const aanbetalingActueel = Number(verkoopRow?.aanbetaling_bedrag || 0);
  const restbedrag = Math.max(0, werkelijkBetaald - aanbetalingActueel);
  const isConsignatieVerkoop = isConsignatie(vehicle);
  const commissiePercActueel = Number(vehicle.consignatieCommissiePerc) > 0 ? Number(vehicle.consignatieCommissiePerc) : 10;
  const brutoWinst = isConsignatieVerkoop
    ? verkoopprijsActueel * (commissiePercActueel / 100)
    : verkoopprijsActueel - inkoopprijsActueel;
  const margePct = isConsignatieVerkoop
    ? commissiePercActueel
    : (inkoopprijsActueel > 0 ? (brutoWinst / inkoopprijsActueel) * 100 : 0);

  // Helpers — KPI inline saves
  const ensureVerkoopRow = async (): Promise<string | null> => {
    if (verkoopRow?.id) return verkoopRow.id;
    const { data, error } = await supabase
      .from("verkopen" as any)
      .insert({ vehicle_id: vehicle.id })
      .select("id")
      .single();
    if (error) { toast.error("Kon verkoopregel niet aanmaken"); return null; }
    return (data as any)?.id || null;
  };

  const saveVerkoopFields = async (patch: Record<string, any>) => {
    const vid = await ensureVerkoopRow();
    if (!vid) return false;
    const { error } = await supabase.from("verkopen" as any).update(patch).eq("id", vid);
    if (error) { toast.error("Opslaan mislukt"); return false; }
    return true;
  };

  const handleSaveInkoop = async (val: number) => {
    await updateVehicle({ ...vehicle, inkoopprijs: val });
    toast.success("Inkoopprijs bijgewerkt");
  };

  const handleSaveCommissie = async (val: number) => {
    if (val < 0 || val > 100) { toast.error("Percentage moet tussen 0 en 100 liggen"); return; }
    await updateVehicle({ ...vehicle, consignatieCommissiePerc: val });
    toast.success("Commissie bijgewerkt");
  };


  const handleSaveVerkoop = async (val: number) => {
    const ok = await saveVerkoopFields({ verkoopprijs: val });
    if (ok) {
      // Spiegel ook naar vehicle (compat met overige modules die nog vehicle.verkoopprijs gebruiken)
      await updateVehicle({ ...vehicle, verkoopprijs: val });
      await fetchVerkoop();
      toast.success("Verkoopprijs bijgewerkt");
    }
  };

  const handleSaveInruilWaarde = async (val: number) => {
    const ok = await saveVerkoopFields({ inruil_waarde: val, inruil: true });
    if (ok) {
      await fetchVerkoop();
      toast.success("Inruilwaarde bijgewerkt");
    }
  };

  // Verkoopgegevens — volledige opslag
  const handleSaveVerkoopgegevens = async () => {
    setVgSaving(true);
    try {
      const vp = parseEuro(vg.verkoopprijs);
      const ip = parseEuro(vg.inkoopprijs);
      const iw = parseEuro(vg.inruilWaarde);
      const ab = parseEuro(vg.aanbetaling);
      const gb = parseEuro(vg.garantieBedrag);

      // Vehicle: inkoopprijs + verkoopdatum (en gespiegelde verkoopprijs)
      await updateVehicle({
        ...vehicle,
        inkoopprijs: ip ?? vehicle.inkoopprijs,
        verkoopprijs: vp ?? vehicle.verkoopprijs,
        verkoopDatum: vg.verkoopDatum || undefined,
      });

      // Verkopen tabel
      const merkModelSplit = vg.inruilMerkModel.trim().split(/\s+/);
      const inruilMerk = vg.heeftInruil ? (merkModelSplit[0] || null) : null;
      const inruilModel = vg.heeftInruil ? (merkModelSplit.slice(1).join(" ") || null) : null;

      const patch: Record<string, any> = {
        verkoopprijs: vp ?? 0,
        inruil: vg.heeftInruil,
        inruil_kenteken: vg.heeftInruil ? (vg.inruilKenteken || null) : null,
        inruil_merk: inruilMerk,
        inruil_model: inruilModel,
        inruil_waarde: vg.heeftInruil ? (iw ?? 0) : null,
        inruil_km: vg.heeftInruil && vg.inruilKm ? Number(vg.inruilKm) : null,
        betaalwijze: vg.betaalmethode || null,
        aanbetaling_bedrag: ab ?? 0,
        betaling_datum: vg.betaaldatum || null,
        betaling_opmerking: vg.betalingNotities || null,
        garantie_type: vg.garantieType || null,
        garantie_prijs: gb ?? 0,
        leverdatum: vg.afleveringsdatum || null,
        opmerkingen: vg.verkoopNotities || null,
      };
      const ok = await saveVerkoopFields(patch);
      if (!ok) return;
      await fetchVerkoop();
      toast.success("Verkoopgegevens opgeslagen");
      setVgEdit(false);
    } catch {
      toast.error("Opslaan mislukt");
    } finally {
      setVgSaving(false);
    }
  };

  const handleSaveKoper = async () => {
    setSavingKoper(true);
    try {
      await updateVehicle({
        ...vehicle,
        koperNaam: koperNaam || undefined,
        koperTelefoon: koperTelefoon || undefined,
        koperEmail: koperEmail || undefined,
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

      {/* KPI cards — Rij 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isConsignatieVerkoop ? (
          <KpiCard
            label="Commissie %"
            value={`${commissiePercActueel}%`}
            editable
            rawValue={commissiePercActueel}
            onSave={handleSaveCommissie}
            unit="%"
            hint="Over verkoopprijs"
          />
        ) : (
          <KpiCard
            label="Inkoopprijs"
            value={formatEuroDecimal(inkoopprijsActueel)}
            editable
            rawValue={inkoopprijsActueel}
            onSave={handleSaveInkoop}
          />
        )}
        <KpiCard
          label="Verkoopprijs"
          value={formatEuroDecimal(verkoopprijsActueel)}
          editable
          rawValue={verkoopprijsActueel}
          onSave={handleSaveVerkoop}
        />
        {heeftInruilActueel ? (
          <KpiCard
            label="Inruilwaarde"
            value={formatEuroDecimal(inruilWaardeActueel)}
            editable
            rawValue={inruilWaardeActueel}
            onSave={handleSaveInruilWaarde}
          />
        ) : (
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Inruilwaarde</p>
            <p className="text-base font-semibold text-muted-foreground/70">— Geen inruil</p>
          </div>
        )}
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Werkelijk betaald</p>
          <p className="text-base font-semibold tabular-nums text-foreground">{formatEuroDecimal(werkelijkBetaald)}</p>
          {heeftInruilActueel && (
            <p className="text-[10px] text-muted-foreground/70 mt-1">Verkoop − inruil</p>
          )}
        </div>
      </div>

      {/* KPI cards — Rij 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">{isConsignatieVerkoop ? "Mijn commissie (excl. BTW)" : "Bruto winst"}</p>
          <p className={`text-base font-semibold tabular-nums ${brutoWinst >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {verkoopprijsActueel > 0 ? formatEuroDecimal(brutoWinst) : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-1">
            {isConsignatieVerkoop ? `${commissiePercActueel}% × verkoopprijs` : "Verkoop − inkoop"}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Marge %</p>
          <p className={`text-base font-semibold tabular-nums ${brutoWinst >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {isConsignatieVerkoop
              ? `${margePct.toFixed(1)}%`
              : (inkoopprijsActueel > 0 ? `${margePct.toFixed(1)}%` : "—")}
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-1">{isConsignatieVerkoop ? "Commissiepercentage" : "Winst / inkoop"}</p>
        </div>
      </div>

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

      {/* Verkoopgegevens — read/edit */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Verkoopgegevens</h3>
          {!vgEdit && (
            <button onClick={() => setVgEdit(true)} className="p-1 text-muted-foreground hover:text-foreground transition-colors" title="Bewerken">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {!vgEdit ? (
          // LEESMODUS — twee koloms grid
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div>
              <ReadRow label="Verkoopprijs" value={formatEuroDecimal(verkoopprijsActueel)} />
              <ReadRow label="Inkoopprijs" value={formatEuroDecimal(inkoopprijsActueel)} />
              {heeftInruilActueel && (
                <>
                  <ReadRow label="Inruil kenteken" value={verkoopRow?.inruil_kenteken || "—"} />
                  <ReadRow label="Inruil voertuig" value={[verkoopRow?.inruil_merk, verkoopRow?.inruil_model].filter(Boolean).join(" ") || "—"} />
                  <ReadRow label="Inruil KM" value={verkoopRow?.inruil_km ? Number(verkoopRow.inruil_km).toLocaleString("nl-NL") : "—"} />
                  <ReadRow label="Inruilwaarde" value={formatEuroDecimal(inruilWaardeActueel)} />
                </>
              )}
              <ReadRow label="Werkelijk betaald" value={formatEuroDecimal(werkelijkBetaald)} />
              <ReadRow label="Aanbetaling" value={aanbetalingActueel > 0 ? formatEuroDecimal(aanbetalingActueel) : "—"} />
              <ReadRow label="Restbedrag" value={formatEuroDecimal(restbedrag)} />
            </div>
            <div>
              <ReadRow label="Verkoopdatum" value={formatDateNl(vehicle.verkoopDatum)} />
              <ReadRow label="Afleveringsdatum" value={formatDateNl(verkoopRow?.leverdatum)} />
              <ReadRow label="Betaalmethode" value={betaalLabel(verkoopRow?.betaalwijze)} />
              <ReadRow label="Betaaldatum" value={formatDateNl(verkoopRow?.betaling_datum)} />
              <ReadRow label="Garantie" value={garantieLabel(verkoopRow?.garantie_type)} />
              {Number(verkoopRow?.garantie_prijs || 0) > 0 && (
                <ReadRow label="Garantiebedrag" value={formatEuroDecimal(Number(verkoopRow?.garantie_prijs || 0))} />
              )}
              <ReadRow label="Notities betaling" value={verkoopRow?.betaling_opmerking || "—"} />
              <ReadRow label="Notities verkoop" value={verkoopRow?.opmerkingen || "—"} />
            </div>
          </div>
        ) : (
          // EDIT MODE
          <div className="space-y-5">
            {/* Prijzen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Verkoopprijs (€)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={vg.verkoopprijs}
                  onChange={(e) => setVg(s => ({ ...s, verkoopprijs: e.target.value.replace(/[^0-9.,]/g, "") }))}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Inkoopprijs (€)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={vg.inkoopprijs}
                  onChange={(e) => setVg(s => ({ ...s, inkoopprijs: e.target.value.replace(/[^0-9.,]/g, "") }))}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Inruil blok */}
            <div className="space-y-3 border-t border-border/50 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vg.heeftInruil}
                  onChange={(e) => setVg(s => ({ ...s, heeftInruil: e.target.checked }))}
                  className="w-4 h-4 rounded border-border accent-primary"
                />
                <span className="text-sm text-foreground">Inruil aanwezig</span>
              </label>
              {vg.heeftInruil && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Inruil kenteken</label>
                    <input
                      value={vg.inruilKenteken}
                      onChange={(e) => setVg(s => ({ ...s, inruilKenteken: e.target.value.toUpperCase() }))}
                      className={inputCls}
                      placeholder="XX-XXX-X"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Merk + model</label>
                    <input
                      value={vg.inruilMerkModel}
                      onChange={(e) => setVg(s => ({ ...s, inruilMerkModel: e.target.value }))}
                      className={inputCls}
                      placeholder="bv. Volkswagen Golf"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Inruilwaarde (€)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={vg.inruilWaarde}
                      onChange={(e) => setVg(s => ({ ...s, inruilWaarde: e.target.value.replace(/[^0-9.,]/g, "") }))}
                      className={inputCls}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Inruil KM-stand</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={vg.inruilKm}
                      onChange={(e) => setVg(s => ({ ...s, inruilKm: e.target.value.replace(/[^0-9]/g, "") }))}
                      className={inputCls}
                      placeholder="optioneel"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Betaling blok */}
            <div className="space-y-3 border-t border-border/50 pt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Betaling</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Betaalmethode</label>
                  <select
                    value={vg.betaalmethode}
                    onChange={(e) => setVg(s => ({ ...s, betaalmethode: e.target.value }))}
                    className={inputCls}
                  >
                    {BETAAL_OPTIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Aanbetaling (€)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={vg.aanbetaling}
                    onChange={(e) => setVg(s => ({ ...s, aanbetaling: e.target.value.replace(/[^0-9.,]/g, "") }))}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Restbedrag (€)</label>
                  <input
                    type="text"
                    value={formatEuroDecimal(restbedrag)}
                    readOnly
                    className={`${inputCls} opacity-70 cursor-not-allowed`}
                  />
                  <p className="text-[10px] text-muted-foreground/70 mt-1">Automatisch: werkelijk betaald − aanbetaling</p>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Betaaldatum</label>
                  <input
                    type="date"
                    value={vg.betaaldatum}
                    onChange={(e) => setVg(s => ({ ...s, betaaldatum: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Notities betaling</label>
                <textarea
                  value={vg.betalingNotities}
                  onChange={(e) => setVg(s => ({ ...s, betalingNotities: e.target.value }))}
                  className={`${inputCls} resize-none h-20`}
                  placeholder="Optionele notities..."
                />
              </div>
            </div>

            {/* Garantie blok */}
            <div className="space-y-3 border-t border-border/50 pt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Garantie</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Garantie type</label>
                  <select
                    value={vg.garantieType}
                    onChange={(e) => setVg(s => ({ ...s, garantieType: e.target.value }))}
                    className={inputCls}
                  >
                    {GARANTIE_OPTIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Garantiebedrag (€)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={vg.garantieBedrag}
                    onChange={(e) => setVg(s => ({ ...s, garantieBedrag: e.target.value.replace(/[^0-9.,]/g, "") }))}
                    className={inputCls}
                    placeholder="0 (optioneel)"
                  />
                </div>
              </div>
            </div>

            {/* Overig */}
            <div className="space-y-3 border-t border-border/50 pt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overig</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Verkoopdatum</label>
                  <input
                    type="date"
                    value={vg.verkoopDatum}
                    onChange={(e) => setVg(s => ({ ...s, verkoopDatum: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Afleveringsdatum</label>
                  <input
                    type="date"
                    value={vg.afleveringsdatum}
                    onChange={(e) => setVg(s => ({ ...s, afleveringsdatum: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Notities verkoop</label>
                <textarea
                  value={vg.verkoopNotities}
                  onChange={(e) => setVg(s => ({ ...s, verkoopNotities: e.target.value }))}
                  className={`${inputCls} resize-none h-20`}
                  placeholder="Optionele notities..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
              <button
                onClick={handleSaveVerkoopgegevens}
                disabled={vgSaving}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
              >
                {vgSaving ? "Opslaan..." : "Opslaan"}
              </button>
              <button
                onClick={() => setVgEdit(false)}
                disabled={vgSaving}
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}
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

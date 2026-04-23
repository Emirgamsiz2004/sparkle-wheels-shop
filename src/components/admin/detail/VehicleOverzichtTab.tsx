import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Vehicle, formatEuroDecimal, calcKostprijs, calcNettoMarge, calcMarge, calcTotalKosten, brandstofLabels, formatEuro } from "@/types/vehicle";
import { Pencil, Check, X, Link2 } from "lucide-react";
import KentekenInput from "@/components/admin/KentekenInput";
import { fetchRdwData } from "@/lib/rdw";
import { cn } from "@/lib/utils";
import { capitalizeMerk, capitalizeModel, capitalizeKleur } from "@/lib/capitalize";
import { toast } from "sonner";

interface Props {
  vehicle: Vehicle;
  onSave: (v: Vehicle) => Promise<void>;
  onLogActivity: (type: string, beschrijving: string) => void;
}

const VehicleOverzichtTab = ({ vehicle, onSave, onLogActivity }: Props) => {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ ...vehicle });
  const [notes, setNotes] = useState(vehicle.opmerkingen || "");
  const [marktplaatsUrl, setMarktplaatsUrl] = useState(vehicle.marktplaatsUrl || "");
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rdwLoading, setRdwLoading] = useState(false);
  const [rdwFields, setRdwFields] = useState<Set<string>>(new Set());

  const kostprijs = calcKostprijs(vehicle);
  const nettoMarge = calcNettoMarge(vehicle);
  const margePerc = calcMarge(vehicle);
  const totalKosten = calcTotalKosten(vehicle);

  // Auto-save notes
  const saveNotes = useCallback(async (val: string) => {
    await onSave({ ...vehicle, opmerkingen: val || undefined });
    onLogActivity("notitie", "Notities bijgewerkt");
  }, [vehicle, onSave, onLogActivity]);

  const handleNotesChange = (val: string) => {
    setNotes(val);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => saveNotes(val), 2000);
  };

  useEffect(() => {
    return () => { if (notesTimer.current) clearTimeout(notesTimer.current); };
  }, []);

  // Save marktplaats URL
  const handleSaveUrl = async () => {
    await onSave({ ...vehicle, marktplaatsUrl: marktplaatsUrl || undefined });
    onLogActivity("url_gewijzigd", "Marktplaats URL bijgewerkt");
    toast.success("URL opgeslagen");
  };

  const update = (key: string, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
    setRdwFields((prev) => { const next = new Set(prev); next.delete(key); return next; });
  };

  const handleRdwLookup = async (kenteken: string) => {
    setRdwLoading(true);
    const data = await fetchRdwData(kenteken);
    if (data) {
      const filled = new Set<string>();
      const updates: Record<string, any> = {};
      if (data.merk) { updates.merk = data.merk; filled.add("merk"); }
      if (data.model) { updates.model = data.model; filled.add("model"); }
      if (data.bouwjaar) { updates.bouwjaar = data.bouwjaar; filled.add("bouwjaar"); }
      if (data.kleur) { updates.kleur = data.kleur; filled.add("kleur"); }
      if (data.brandstof) {
        const bf = data.brandstof.toLowerCase() as Vehicle["brandstof"];
        if (["benzine", "diesel", "elektrisch", "hybride", "lpg"].includes(bf)) {
          updates.brandstof = bf; filled.add("brandstof");
        }
      }
      if (data.apkTot) { updates.apkVervaldatum = data.apkTot; filled.add("apkVervaldatum"); }
      setForm((f) => ({ ...f, ...updates }));
      setRdwFields(filled);
    }
    setRdwLoading(false);
  };

  const handleSaveVehicleInfo = async () => {
    await onSave({ ...form, kosten: vehicle.kosten, opmerkingen: notes || undefined, marktplaatsUrl: marktplaatsUrl || undefined });
    onLogActivity("voertuig_bewerkt", "Voertuiggegevens bijgewerkt");
    setEditMode(false);
    toast.success("Opgeslagen");
  };

  const inputCls = "w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all";

  const hasPaymentInfo = !!(vehicle.contantBedrag || vehicle.overboekingBedrag || vehicle.aanbetalingsbedrag || vehicle.financieringActief || vehicle.inruilKenteken);

  return (
    <div className="space-y-4">
      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left - Vehicle info - inline editable */}
        <div className="bg-card border border-border rounded-lg p-3 space-y-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Voertuiggegevens</h3>
            {editMode ? (
              <div className="flex gap-1">
                <button onClick={handleSaveVehicleInfo} className="p-1 text-emerald-500 hover:text-emerald-400"><Check className="w-4 h-4" /></button>
                <button onClick={() => { setEditMode(false); setForm({ ...vehicle }); }} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <button onClick={() => setEditMode(true)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {editMode ? (
            <div className="space-y-3">
              <div>
                <KentekenInput value={form.kenteken} onChange={(v) => update("kenteken", v)} onValidKenteken={handleRdwLookup} loading={rdwLoading} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <EditField label="Merk" value={form.merk} onChange={(v) => update("merk", capitalizeMerk(v))} highlight={rdwFields.has("merk")} inputCls={inputCls} />
                <EditField label="Model" value={form.model} onChange={(v) => update("model", capitalizeModel(v))} highlight={rdwFields.has("model")} inputCls={inputCls} />
                <EditField label="Bouwjaar" type="number" value={form.bouwjaar} onChange={(v) => update("bouwjaar", Number(v))} highlight={rdwFields.has("bouwjaar")} inputCls={inputCls} />
                <EditField label="Kleur" value={form.kleur} onChange={(v) => update("kleur", capitalizeKleur(v))} highlight={rdwFields.has("kleur")} inputCls={inputCls} />
                <EditField label="KM-stand" type="number" value={form.kilometerstand} onChange={(v) => update("kilometerstand", Number(v))} inputCls={inputCls} />
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Brandstof</label>
                  <select value={form.brandstof} onChange={(e) => update("brandstof", e.target.value)} className={cn(inputCls, rdwFields.has("brandstof") && "border-ring/50 bg-accent/30")}>
                    <option value="benzine">Benzine</option><option value="diesel">Diesel</option><option value="elektrisch">Elektrisch</option><option value="hybride">Hybride</option><option value="lpg">LPG</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                <InfoRow label="Kenteken" value={vehicle.kenteken?.toUpperCase() || "—"} />
                <InfoRow label="Merk" value={vehicle.merk} />
                <InfoRow label="Model" value={vehicle.model} />
                <InfoRow label="Bouwjaar" value={String(vehicle.bouwjaar)} />
                <InfoRow label="Kleur" value={vehicle.kleur || "—"} />
                <InfoRow label="Brandstof" value={brandstofLabels[vehicle.brandstof] || vehicle.brandstof} />
                <InfoRow label="KM-stand" value={vehicle.kilometerstand?.toLocaleString("nl-NL") || "—"} />
                <ApkRow apkVervaldatum={vehicle.apkVervaldatum} isLast />
              </tbody>
            </table>
          )}
        </div>

        {/* Right - Financial summary - simplified to 3 lines (Inkoop / Verkoop / Marge) */}
        {(() => {
          const eenvoudigeMarge = (vehicle.verkoopprijs || 0) - (vehicle.inkoopprijs || 0);
          return (
            <div className="bg-card border border-border rounded-lg p-3 space-y-0">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Financieel overzicht</h3>
              <table className="w-full text-sm">
                <tbody>
                  <EditableEuroRow label="Inkoopprijs" value={vehicle.inkoopprijs} onSave={async (val) => { await onSave({ ...vehicle, inkoopprijs: val }); onLogActivity("inkoopprijs_gewijzigd", `Inkoopprijs aangepast naar € ${val.toLocaleString("nl-NL")}`); }} />
                  <EditableEuroRow label="Verkoopprijs" value={vehicle.verkoopprijs} onSave={async (val) => { await onSave({ ...vehicle, verkoopprijs: val }); onLogActivity("verkoopprijs_gewijzigd", `Verkoopprijs aangepast naar € ${val.toLocaleString("nl-NL")}`); }} />
                  <InfoRow label="Marge" value={vehicle.verkoopprijs > 0 ? formatEuroDecimal(eenvoudigeMarge) : "—"} valueColor={eenvoudigeMarge >= 0 ? "text-emerald-500" : "text-red-500"} isLast />
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* Klant / koper info */}
      {(vehicle.status === "reparatie_onderhoud" || vehicle.status === "verkocht" || vehicle.status === "gereserveerd") && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {vehicle.status === "reparatie_onderhoud" ? "Gekoppelde klant" : "Kopergegevens"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Naam</label>
              <input value={form.koperNaam || ""} onChange={(e) => update("koperNaam", e.target.value)} className={inputCls} placeholder="Naam koper" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Telefoon</label>
              <input value={form.koperTelefoon || ""} onChange={(e) => update("koperTelefoon", e.target.value)} className={inputCls} placeholder="06-12345678" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">E-mail</label>
              <input value={form.koperEmail || ""} onChange={(e) => update("koperEmail", e.target.value)} className={inputCls} placeholder="email@voorbeeld.nl" />
            </div>
          </div>
          {vehicle.status === "verkocht" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Verkoopdatum</label>
                <input type="date" value={form.verkoopDatum || ""} onChange={(e) => update("verkoopDatum", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Verkoopprijs</label>
                <input type="text" inputMode="decimal" value={form.verkoopprijs || ""} onChange={(e) => update("verkoopprijs", Number(e.target.value.replace(/[^0-9.]/g, "")))} className={inputCls} placeholder="0" />
              </div>
            </div>
          )}
          <button onClick={handleSaveVehicleInfo} className="px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors">Opslaan</button>
        </div>
      )}

      {/* Betalingsoverzicht - read only samenvatting */}
      {(vehicle.status === "verkocht" || vehicle.status === "gereserveerd") && (
        hasPaymentInfo ? (
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Betalingsoverzicht</h3>
            <table className="w-full text-sm">
              <tbody>
                {!!vehicle.contantBedrag && <InfoRow label="Contant" value={formatEuroDecimal(vehicle.contantBedrag)} />}
                {!!vehicle.overboekingBedrag && <InfoRow label="Overboeking" value={formatEuroDecimal(vehicle.overboekingBedrag)} />}
                {!!vehicle.aanbetalingsbedrag && <InfoRow label="Aanbetaling" value={formatEuroDecimal(vehicle.aanbetalingsbedrag)} />}
                {vehicle.financieringActief && <InfoRow label="Financiering" value={formatEuroDecimal(vehicle.financieringBedrag || 0)} />}
                {vehicle.inruilKenteken && (
                  <InfoRow label="Inruil" value={`${vehicle.inruilKenteken}${vehicle.inruilMerk ? ` — ${vehicle.inruilMerk} ${vehicle.inruilModel || ""}` : ""} (${formatEuro(vehicle.inruilWaarde || 0)})`} isLast />
                )}
              </tbody>
            </table>
            <p className="text-[10px] text-muted-foreground">Bewerk in het Financieel tabblad</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Betalingsoverzicht</h3>
            <p className="text-xs text-muted-foreground">Nog geen betalingsdetails ingevuld — vul deze in via het Financieel tabblad.</p>
          </div>
        )
      )}

      {/* Notes - auto-save */}
      <div className="bg-card border border-border rounded-lg p-3 space-y-2">
        <label className="block text-xs text-muted-foreground uppercase tracking-wider font-medium">Notities</label>
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          className={cn(inputCls, "resize-none h-20")}
          placeholder="Notities voor jezelf... (wordt automatisch opgeslagen)"
        />
        <p className="text-[10px] text-muted-foreground">Auto-save na 2 seconden</p>
      </div>

    </div>
  );
};

const KpiCard = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <div className="bg-card border border-border rounded-lg p-3">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className={`text-base font-semibold tabular-nums ${color || ""}`}>{value}</p>
  </div>
);

const ReadField = ({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className={`text-sm font-medium tabular-nums ${valueColor || "text-foreground"}`}>{value}</span>
  </div>
);

const InfoRow = ({ label, value, valueColor, isLast }: { label: string; value: string; valueColor?: string; isLast?: boolean }) => (
  <tr className={!isLast ? "border-b border-border/50" : ""}>
    <td className="py-2.5 pr-4 text-xs text-muted-foreground whitespace-nowrap align-middle">{label}</td>
    <td className={`py-2.5 text-sm font-medium tabular-nums text-right align-middle ${valueColor || "text-foreground"}`}>{value}</td>
  </tr>
);

const EditableEuroRow = ({ label, value, onSave, hint }: { label: string; value: number; onSave: (val: number) => Promise<void>; hint?: string }) => {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(value ? String(value) : "");

  const handleSave = async () => {
    const val = editVal === "" ? 0 : Number(editVal);
    if (!isNaN(val)) {
      await onSave(val);
      toast.success(`${label} opgeslagen`);
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") { setEditVal(value ? String(value) : ""); setEditing(false); }
  };

  if (editing) {
    return (
      <tr className="border-b border-border/50">
        <td className="py-2.5 pr-4 text-xs text-muted-foreground whitespace-nowrap align-middle">{label}</td>
        <td className="py-2 text-right align-middle">
          <div className="inline-flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">€</span>
            <input
              autoFocus
              type="text"
              inputMode="decimal"
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="w-24 px-2 py-1 text-sm text-right bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring tabular-nums"
            />
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border/50 group">
      <td className="py-2.5 pr-4 align-middle">
        <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
        {hint && <p className="text-[10px] text-muted-foreground/60">{hint}</p>}
      </td>
      <td className="py-2.5 text-right align-middle">
        <div className="inline-flex items-center gap-1.5">
          <span className="text-sm font-medium tabular-nums text-foreground">{formatEuroDecimal(value)}</span>
          <button onClick={() => { setEditVal(value ? String(value) : ""); setEditing(true); }} className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-foreground transition-opacity">
            <Pencil className="w-3 h-3" />
          </button>
        </div>
      </td>
    </tr>
  );
};

const EditField = ({ label, value, onChange, type = "text", highlight = false, inputCls }: {
  label: string; value: any; onChange: (v: string) => void; type?: string; highlight?: boolean; inputCls: string;
}) => {
  const isNumber = type === "number";
  const displayVal = isNumber ? (value === 0 || value === "0" ? "" : value) : value;
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1">{label}</label>
      <input
        type={isNumber ? "text" : type}
        inputMode={isNumber ? "numeric" : undefined}
        value={displayVal}
        onChange={(e) => onChange(isNumber ? e.target.value.replace(/[^0-9]/g, "") : e.target.value)}
        placeholder={isNumber ? "0" : undefined}
        className={cn(inputCls, highlight && "border-ring/50 bg-accent/30")}
      />
    </div>
  );
};

export const getApkStatus = (apkVervaldatum?: string): { label: string; color: string; level: 'green' | 'orange' | 'red' | 'none' } => {
  if (!apkVervaldatum) return { label: "Onbekend", color: "text-muted-foreground", level: 'none' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const apk = new Date(apkVervaldatum);
  const diffMs = apk.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const formatted = apk.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });

  if (diffDays < 0) return { label: `Verlopen (${formatted})`, color: "text-red-500", level: 'red' };
  if (diffDays <= 30) return { label: formatted, color: "text-red-500", level: 'red' };
  if (diffDays <= 90) return { label: formatted, color: "text-amber-500", level: 'orange' };
  return { label: formatted, color: "text-emerald-500", level: 'green' };
};

const ApkRow = ({ apkVervaldatum, isLast }: { apkVervaldatum?: string; isLast?: boolean }) => {
  const status = getApkStatus(apkVervaldatum);
  return (
    <tr className={!isLast ? "border-b border-border/50" : ""}>
      <td className="py-2.5 pr-4 text-xs text-muted-foreground whitespace-nowrap align-middle">APK tot</td>
      <td className={`py-2.5 text-sm font-medium tabular-nums text-right align-middle ${status.color}`}>{status.label}</td>
    </tr>
  );
};

export default VehicleOverzichtTab;
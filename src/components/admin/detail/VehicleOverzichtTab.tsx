import { useState, useEffect, useRef, useCallback } from "react";
import { Vehicle, formatEuroDecimal, calcKostprijs, calcNettoMarge, calcMarge, calcTotalKosten, brandstofLabels } from "@/types/vehicle";
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

  const autoKostprijs = vehicle.inkoopprijs + vehicle.kosten.reduce((s, k) => s + k.amount, 0);
  const kostprijs = calcKostprijs(vehicle);
  const nettoMarge = calcNettoMarge(vehicle);
  const margePerc = calcMarge(vehicle);
  const totalKosten = calcTotalKosten(vehicle);
  const [kostprijsEdit, setKostprijsEdit] = useState(String(vehicle.kostprijsCalc || autoKostprijs));

  const handleSaveKostprijs = async () => {
    const val = Number(kostprijsEdit);
    await onSave({ ...vehicle, kostprijsCalc: val });
    onLogActivity("kostprijs_gewijzigd", `Kostprijs aangepast naar € ${val.toLocaleString("nl-NL")}`);
    toast.success("Kostprijs opgeslagen");
  };

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

  return (
    <div className="space-y-5">
      {/* KPI cards - read only */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Kostprijs" value={formatEuroDecimal(kostprijs)} />
        <KpiCard label="Verkoopprijs" value={vehicle.verkoopprijs > 0 ? formatEuroDecimal(vehicle.verkoopprijs) : "—"} />
        <KpiCard label="Nettomarge" value={vehicle.verkoopprijs > 0 ? formatEuroDecimal(nettoMarge) : "—"} color={nettoMarge >= 0 ? "text-emerald-500" : "text-red-500"} />
        <KpiCard label="Marge %" value={vehicle.verkoopprijs > 0 ? `${margePerc.toFixed(1)}%` : "—"} color={nettoMarge >= 0 ? "text-emerald-500" : "text-red-500"} />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left - Vehicle info */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Voertuiggegevens</h3>
            {!editMode ? (
              <button onClick={() => setEditMode(true)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex gap-1">
                <button onClick={handleSaveVehicleInfo} className="p-1 text-emerald-500 hover:text-emerald-400"><Check className="w-4 h-4" /></button>
                <button onClick={() => { setEditMode(false); setForm({ ...vehicle }); }} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
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
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <ReadField label="Kenteken" value={vehicle.kenteken?.toUpperCase() || "—"} />
              <ReadField label="Merk" value={vehicle.merk} />
              <ReadField label="Model" value={vehicle.model} />
              <ReadField label="Bouwjaar" value={String(vehicle.bouwjaar)} />
              <ReadField label="Kleur" value={vehicle.kleur || "—"} />
              <ReadField label="Brandstof" value={brandstofLabels[vehicle.brandstof] || vehicle.brandstof} />
              <ReadField label="KM-stand" value={vehicle.kilometerstand?.toLocaleString("nl-NL") || "—"} />
            </div>
          )}
        </div>

        {/* Right - Financial summary with editable kostprijs */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Financieel overzicht</h3>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <ReadField label="Inkoopprijs" value={formatEuroDecimal(vehicle.inkoopprijs)} />
            <ReadField label="Totale kosten" value={formatEuroDecimal(totalKosten)} />
            <div className="col-span-2 pt-1">
              <label className="block text-xs text-muted-foreground mb-1">Kostprijs (€)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={kostprijsEdit}
                  onChange={(e) => setKostprijsEdit(e.target.value)}
                  className={cn(inputCls, "max-w-[180px]")}
                  placeholder={String(autoKostprijs)}
                />
                {Number(kostprijsEdit) !== (vehicle.kostprijsCalc || autoKostprijs) && (
                  <button
                    onClick={handleSaveKostprijs}
                    className="px-3 py-2 text-xs font-medium bg-accent text-foreground rounded-xl hover:bg-accent/80 transition-colors"
                  >
                    Opslaan
                  </button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Berekend: € {autoKostprijs.toLocaleString("nl-NL")} · Pas aan als de werkelijke kostprijs afwijkt</p>
            </div>
            <ReadField label="Verkoopprijs" value={vehicle.verkoopprijs > 0 ? formatEuroDecimal(vehicle.verkoopprijs) : "—"} />
            <ReadField label="Nettomarge" value={vehicle.verkoopprijs > 0 ? formatEuroDecimal(nettoMarge) : "—"} valueColor={nettoMarge >= 0 ? "text-emerald-500" : "text-red-500"} />
          </div>
        </div>
      </div>

      {/* Reparatie/Onderhoud klant info */}
      {vehicle.status === "reparatie_onderhoud" && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gekoppelde klant</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Klant naam</label>
              <input value={form.koperNaam || ""} onChange={(e) => update("koperNaam", e.target.value)} className={inputCls} placeholder="Naam klant" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Telefoon</label>
              <input value={form.koperTelefoon || ""} onChange={(e) => update("koperTelefoon", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">E-mail</label>
              <input value={form.koperEmail || ""} onChange={(e) => update("koperEmail", e.target.value)} className={inputCls} />
            </div>
          </div>
          <button onClick={handleSaveVehicleInfo} className="px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors">Opslaan</button>
        </div>
      )}

      {/* Notes - auto-save */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
        <label className="block text-xs text-muted-foreground uppercase tracking-wider font-medium">Notities</label>
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          rows={3}
          className={cn(inputCls, "resize-none")}
          placeholder="Notities voor jezelf... (wordt automatisch opgeslagen)"
        />
        <p className="text-[10px] text-muted-foreground">Auto-save na 2 seconden</p>
      </div>

      {/* Marktplaats URL */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
        <label className="block text-xs text-muted-foreground">Marktplaats URL</label>
        <div className="flex gap-2">
          <input type="url" value={marktplaatsUrl} onChange={(e) => setMarktplaatsUrl(e.target.value)} placeholder="https://www.marktplaats.nl/v/auto-s/..." className={cn(inputCls, "flex-1")} />
          <button onClick={handleSaveUrl} className="px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors">Opslaan</button>
          {marktplaatsUrl && (
            <a href={marktplaatsUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-muted-foreground hover:text-foreground">
              <Link2 className="w-4 h-4" />
            </a>
          )}
        </div>
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
  <>
    <span className="text-muted-foreground">{label}</span>
    <span className={`text-foreground ${valueColor || ""}`}>{value}</span>
  </>
);

const EditField = ({ label, value, onChange, type = "text", highlight = false, inputCls }: {
  label: string; value: any; onChange: (v: string) => void; type?: string; highlight?: boolean; inputCls: string;
}) => (
  <div>
    <label className="block text-xs text-muted-foreground mb-1">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={cn(inputCls, highlight && "border-ring/50 bg-accent/30")} />
  </div>
);

export default VehicleOverzichtTab;

import { useState } from "react";
import { Vehicle } from "@/types/vehicle";
import { Loader2 } from "lucide-react";
import KentekenInput from "@/components/admin/KentekenInput";
import { fetchRdwData } from "@/lib/rdw";
import { cn } from "@/lib/utils";
import { capitalizeMerk, capitalizeModel, capitalizeKleur } from "@/lib/capitalize";
import { Switch } from "@/components/ui/switch";
import { formatEuroDecimal } from "@/types/vehicle";

interface Props {
  vehicle: Vehicle;
  onSave: (v: Vehicle) => Promise<void>;
}

const VehicleInfoTab = ({ vehicle, onSave }: Props) => {
  const [form, setForm] = useState({ ...vehicle });
  const [saving, setSaving] = useState(false);
  const [rdwLoading, setRdwLoading] = useState(false);
  const [rdwFields, setRdwFields] = useState<Set<string>>(new Set());

  const isConsignatie = form.verkoopType === "consignatie";

  const update = (key: string, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
    setRdwFields((prev) => { const next = new Set(prev); next.delete(key); return next; });
  };

  const toggleConsignatie = (checked: boolean) => {
    if (checked) {
      setForm((f) => ({ ...f, verkoopType: "consignatie", status: "consignatie" }));
    } else {
      setForm((f) => ({ ...f, verkoopType: "regulier", status: f.status === "consignatie" ? "te_koop" : f.status }));
    }
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

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...form, kosten: vehicle.kosten });
    setSaving(false);
  };

  // Consignatie marge berekening
  const commissiePerc = form.consignatieCommissiePerc ?? 10;
  const consignatieMarge = form.verkoopprijs > 0 ? form.verkoopprijs * (commissiePerc / 100) : 0;

  const inputCls = "w-full px-2.5 py-1.5 text-sm bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="space-y-4">
      {/* Voertuiggegevens */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Voertuiggegevens</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <KentekenInput value={form.kenteken} onChange={(v) => update("kenteken", v)} onValidKenteken={handleRdwLookup} loading={rdwLoading} />
          </div>
          <Field label="Merk" value={form.merk} onChange={(v) => update("merk", capitalizeMerk(v))} highlight={rdwFields.has("merk")} inputCls={inputCls} />
          <Field label="Model" value={form.model} onChange={(v) => update("model", capitalizeModel(v))} highlight={rdwFields.has("model")} inputCls={inputCls} />
          <Field label="Bouwjaar" type="number" value={form.bouwjaar} onChange={(v) => update("bouwjaar", Number(v))} highlight={rdwFields.has("bouwjaar")} inputCls={inputCls} />
          <Field label="Kleur" value={form.kleur} onChange={(v) => update("kleur", capitalizeKleur(v))} highlight={rdwFields.has("kleur")} inputCls={inputCls} />
          <Field label="KM-stand" type="number" value={form.kilometerstand} onChange={(v) => update("kilometerstand", Number(v))} inputCls={inputCls} />
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Brandstof</label>
            <select value={form.brandstof} onChange={(e) => update("brandstof", e.target.value)} className={cn(inputCls, rdwFields.has("brandstof") && "border-ring/50 bg-accent/30")}>
              <option value="benzine">Benzine</option><option value="diesel">Diesel</option><option value="elektrisch">Elektrisch</option><option value="hybride">Hybride</option><option value="lpg">LPG</option>
            </select>
          </div>
          {!isConsignatie && (
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Status</label>
              <select value={form.status} onChange={(e) => update("status", e.target.value as Vehicle["status"])} className={inputCls}>
                <option value="inkoop">Inkoop</option><option value="in_behandeling">In behandeling</option><option value="te_koop">Te koop</option><option value="verkocht">Verkocht</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Consignatie Toggle */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Consignatie</p>
            <p className="text-xs text-muted-foreground mt-0.5">Dit voertuig wordt verkocht in consignatie</p>
          </div>
          <Switch checked={isConsignatie} onCheckedChange={toggleConsignatie} />
        </div>

        {isConsignatie && (
          <div className="mt-4 pt-4 border-t border-border space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Eigenaar naam" value={form.consignatieEigenaarNaam || ""} onChange={(v) => update("consignatieEigenaarNaam", v || undefined)} inputCls={inputCls} />
              <Field label="Eigenaar telefoon" value={form.consignatieEigenaarTelefoon || ""} onChange={(v) => update("consignatieEigenaarTelefoon", v || undefined)} inputCls={inputCls} />
              <Field label="Eigenaar e-mail" value={form.consignatieEigenaarEmail || ""} onChange={(v) => update("consignatieEigenaarEmail", v || undefined)} inputCls={inputCls} />
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Commissie %</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={0.5}
                  value={commissiePerc}
                  onChange={(e) => update("consignatieCommissiePerc", Number(e.target.value))}
                  className={inputCls}
                />
              </div>
            </div>

            <Field label="Verkoopprijs" type="number" value={form.verkoopprijs} onChange={(v) => update("verkoopprijs", Number(v))} inputCls={inputCls} />

            {form.verkoopprijs > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/50 border border-border rounded-md p-3">
                  <p className="text-xs text-muted-foreground mb-1">Jouw commissie ({commissiePerc}%)</p>
                  <p className="text-base font-semibold text-emerald-500 tabular-nums">{formatEuroDecimal(consignatieMarge)}</p>
                </div>
                <div className="bg-secondary/50 border border-border rounded-md p-3">
                  <p className="text-xs text-muted-foreground mb-1">Uitbetaling eigenaar</p>
                  <p className="text-base font-semibold tabular-nums">{formatEuroDecimal(form.verkoopprijs - consignatieMarge)}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Financieel — alleen bij niet-consignatie */}
      {!isConsignatie && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Financieel</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Inkoopprijs" type="number" value={form.inkoopprijs} onChange={(v) => update("inkoopprijs", Number(v))} inputCls={inputCls} />
            <Field label="Verkoopprijs" type="number" value={form.verkoopprijs} onChange={(v) => update("verkoopprijs", Number(v))} inputCls={inputCls} />
            <Field label="Inkoopdatum" type="date" value={form.inkoopDatum} onChange={(v) => update("inkoopDatum", v)} inputCls={inputCls} />
            <Field label="Verkoopdatum" type="date" value={form.verkoopDatum || ""} onChange={(v) => update("verkoopDatum", v || undefined)} inputCls={inputCls} />
          </div>
        </div>
      )}

      {/* Marktplaats URL */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
        <label className="block text-xs text-muted-foreground">Marktplaats URL</label>
        <input type="url" value={form.marktplaatsUrl || ""} onChange={(e) => update("marktplaatsUrl", e.target.value || undefined)} placeholder="https://www.marktplaats.nl/v/auto-s/..." className={inputCls} />
        <p className="text-[11px] text-muted-foreground">Wordt getoond op de publieke voertuigpagina.</p>
      </div>

      {/* Opmerkingen */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
        <label className="block text-xs text-muted-foreground">Opmerkingen</label>
        <textarea value={form.opmerkingen || ""} onChange={(e) => update("opmerkingen", e.target.value || undefined)} rows={3} className={cn(inputCls, "resize-none")} placeholder="Notities voor jezelf..." />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-sm font-medium rounded-md hover:bg-accent transition-colors disabled:opacity-50"
      >
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        Opslaan
      </button>
    </div>
  );
};

const Field = ({ label, value, onChange, type = "text", highlight = false, inputCls }: {
  label: string; value: any; onChange: (v: string) => void; type?: string; highlight?: boolean; inputCls: string;
}) => (
  <div>
    <label className="block text-xs text-muted-foreground mb-1">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={cn(inputCls, highlight && "border-ring/50 bg-accent/30")} />
  </div>
);

export default VehicleInfoTab;
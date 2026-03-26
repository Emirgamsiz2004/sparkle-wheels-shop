import { useState } from "react";
import { Vehicle, VerkoopType, verkoopTypeLabels } from "@/types/vehicle";
import { Loader2, Users, Handshake, ArrowLeftRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import KentekenInput from "@/components/admin/KentekenInput";
import { fetchRdwData } from "@/lib/rdw";
import { cn } from "@/lib/utils";
import { capitalizeMerk, capitalizeModel, capitalizeKleur } from "@/lib/capitalize";

interface Props {
  vehicle: Vehicle;
  onSave: (v: Vehicle) => Promise<void>;
}

const verkoopTypeIcons: Record<VerkoopType, typeof Users> = {
  regulier: Users,
  consignatie: Handshake,
  inruil: ArrowLeftRight,
};

const VehicleInfoTab = ({ vehicle, onSave }: Props) => {
  const [form, setForm] = useState({
    ...vehicle,
    chassisnummer: (vehicle as any).chassisnummer || "",
    metallicLak: (vehicle as any).metallicLak || "onbekend",
    aantalEigenaren: (vehicle as any).aantalEigenaren || "",
  });
  const [saving, setSaving] = useState(false);
  const [rdwLoading, setRdwLoading] = useState(false);
  const [rdwFields, setRdwFields] = useState<Set<string>>(new Set());

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
      if (data.aantalHouders) { updates.aantalEigenaren = data.aantalHouders; filled.add("aantalEigenaren"); }
      if (data.chassisnummer) { updates.chassisnummer = data.chassisnummer; filled.add("chassisnummer"); }
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

  const isConsignatie = form.verkoopType === "consignatie";
  const isInruil = form.verkoopType === "inruil";

  return (
    <div className="space-y-5">
      {/* Verkoop type selector */}
      <Card>
        <CardContent className="p-4">
          <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-3">Type verkoop</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(verkoopTypeLabels) as VerkoopType[]).map((type) => {
              const Icon = verkoopTypeIcons[type];
              const active = form.verkoopType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => update("verkoopType", type)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border text-xs font-medium transition-all",
                    active
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{verkoopTypeLabels[type]}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Consignatie eigenaar info */}
      {isConsignatie && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Handshake className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest">Eigenaar (consignatie)</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Naam eigenaar" value={form.consignatieEigenaarNaam || ""} onChange={(v) => update("consignatieEigenaarNaam", v || undefined)} />
              <Field label="Telefoon eigenaar" value={form.consignatieEigenaarTelefoon || ""} onChange={(v) => update("consignatieEigenaarTelefoon", v || undefined)} />
              <Field label="E-mail eigenaar" value={form.consignatieEigenaarEmail || ""} onChange={(v) => update("consignatieEigenaarEmail", v || undefined)} />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Commissie %</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={3}
                  max={15}
                  step={0.5}
                  value={form.consignatieCommissiePerc || 10}
                  onChange={(e) => update("consignatieCommissiePerc", Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-sm font-bold text-foreground w-12 text-right">{form.consignatieCommissiePerc || 10}%</span>
              </div>
              {form.verkoopprijs > 0 && (
                <p className="text-xs text-amber-400 mt-1.5">
                  Commissie: € {((form.verkoopprijs * (form.consignatieCommissiePerc || 10)) / 100).toFixed(0)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicle specifications */}
      <Card>
        <CardContent className="p-4 md:p-6 space-y-5">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest">Voertuiggegevens</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <KentekenInput value={form.kenteken} onChange={(v) => update("kenteken", v)} onValidKenteken={handleRdwLookup} loading={rdwLoading} />
            </div>
            <Field label="Merk" value={form.merk} onChange={(v) => update("merk", capitalizeMerk(v))} highlight={rdwFields.has("merk")} />
            <Field label="Model" value={form.model} onChange={(v) => update("model", capitalizeModel(v))} highlight={rdwFields.has("model")} />
            <Field label="Bouwjaar" type="number" value={form.bouwjaar} onChange={(v) => update("bouwjaar", Number(v))} highlight={rdwFields.has("bouwjaar")} />
            <Field label="Kleur" value={form.kleur} onChange={(v) => update("kleur", capitalizeKleur(v))} highlight={rdwFields.has("kleur")} />
            <Field label="KM-stand" type="number" value={form.kilometerstand} onChange={(v) => update("kilometerstand", Number(v))} />
            <Field label="Aantal eigenaren" type="number" value={form.aantalEigenaren} onChange={(v) => update("aantalEigenaren", v ? Number(v) : "")} highlight={rdwFields.has("aantalEigenaren")} />
            <div className="sm:col-span-2">
              <Field label="Chassisnummer (VIN)" value={form.chassisnummer} onChange={(v) => update("chassisnummer", v.toUpperCase())} highlight={rdwFields.has("chassisnummer")} />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Metallic lak</label>
              <select value={form.metallicLak} onChange={(e) => update("metallicLak", e.target.value)} className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="onbekend">Onbekend</option><option value="ja">Ja</option><option value="nee">Nee</option>
              </select>
              <p className="text-[9px] text-muted-foreground mt-1 italic">Niet automatisch beschikbaar — controleer het kentekenbewijs</p>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Brandstof</label>
              <select value={form.brandstof} onChange={(e) => update("brandstof", e.target.value)} className={cn("w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-ring", rdwFields.has("brandstof") && "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800")}>
                <option value="benzine">Benzine</option><option value="diesel">Diesel</option><option value="elektrisch">Elektrisch</option><option value="hybride">Hybride</option><option value="lpg">LPG</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => update("status", e.target.value as Vehicle["status"])} className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="inkoop">Inkoop</option><option value="in_behandeling">In behandeling</option><option value="te_koop">Te koop</option><option value="consignatie">Consignatie</option><option value="verkocht">Verkocht</option>
              </select>
            </div>
            <Field label="Inkoopdatum" type="date" value={form.inkoopDatum} onChange={(v) => update("inkoopDatum", v)} />
          </div>
        </CardContent>
      </Card>

      {/* Financieel */}
      <Card>
        <CardContent className="p-4 md:p-6 space-y-5">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest">Financieel</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!isConsignatie && (
              <Field label="Inkoopprijs (€)" type="number" value={form.inkoopprijs} onChange={(v) => update("inkoopprijs", Number(v))} />
            )}
            <Field label="Verkoopprijs (€)" type="number" value={form.verkoopprijs} onChange={(v) => update("verkoopprijs", Number(v))} />
            <Field label="Verkoopdatum" type="date" value={form.verkoopDatum || ""} onChange={(v) => update("verkoopDatum", v || undefined)} />
          </div>
        </CardContent>
      </Card>

      {/* Kopergegevens */}
      <Card>
        <CardContent className="p-4 md:p-6 space-y-5">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest">Kopergegevens</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Naam koper" value={form.koperNaam || ""} onChange={(v) => update("koperNaam", v || undefined)} />
            <Field label="E-mail koper" value={form.koperEmail || ""} onChange={(v) => update("koperEmail", v || undefined)} />
            <Field label="Telefoon koper" value={form.koperTelefoon || ""} onChange={(v) => update("koperTelefoon", v || undefined)} />
          </div>
        </CardContent>
      </Card>

      {/* Marktplaats URL */}
      <Card>
        <CardContent className="p-4 md:p-6 space-y-3">
          <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Marktplaats URL</label>
          <input type="url" value={form.marktplaatsUrl || ""} onChange={(e) => update("marktplaatsUrl", e.target.value || undefined)} placeholder="https://www.marktplaats.nl/v/auto-s/..." className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          <p className="text-[10px] text-muted-foreground">Plak hier de directe link naar de Marktplaats-advertentie van dit voertuig.</p>
        </CardContent>
      </Card>

      {/* Opmerkingen */}
      <Card>
        <CardContent className="p-4 md:p-6 space-y-3">
          <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Opmerkingen</label>
          <textarea value={form.opmerkingen || ""} onChange={(e) => update("opmerkingen", e.target.value || undefined)} rows={3} className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
        </CardContent>
      </Card>

      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        Wijzigingen Opslaan
      </button>
    </div>
  );
};

const Field = ({ label, value, onChange, type = "text", highlight = false }: {
  label: string; value: any; onChange: (v: string) => void; type?: string; highlight?: boolean;
}) => (
  <div>
    <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={cn("w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-ring", highlight && "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800")} />
  </div>
);

export default VehicleInfoTab;

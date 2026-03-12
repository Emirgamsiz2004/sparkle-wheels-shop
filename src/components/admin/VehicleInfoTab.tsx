import { useState } from "react";
import { Vehicle } from "@/types/vehicle";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  vehicle: Vehicle;
  onSave: (v: Vehicle) => Promise<void>;
}

const VehicleInfoTab = ({ vehicle, onSave }: Props) => {
  const [form, setForm] = useState({ ...vehicle });
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...form, kosten: vehicle.kosten });
    setSaving(false);
  };

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardContent className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Merk" value={form.merk} onChange={(v) => update("merk", v)} />
          <Field label="Model" value={form.model} onChange={(v) => update("model", v)} />
          <Field label="Bouwjaar" type="number" value={form.bouwjaar} onChange={(v) => update("bouwjaar", Number(v))} />
          <Field label="Kleur" value={form.kleur} onChange={(v) => update("kleur", v)} />
          <Field label="Kenteken" value={form.kenteken} onChange={(v) => update("kenteken", v.toUpperCase())} />
          <Field label="KM-stand" type="number" value={form.kilometerstand} onChange={(v) => update("kilometerstand", Number(v))} />
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Brandstof</label>
            <select value={form.brandstof} onChange={(e) => update("brandstof", e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3864]/20">
              <option value="benzine">Benzine</option><option value="diesel">Diesel</option><option value="elektrisch">Elektrisch</option><option value="hybride">Hybride</option><option value="lpg">LPG</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
            <select value={form.status} onChange={(e) => update("status", e.target.value as Vehicle["status"])} className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3864]/20">
              <option value="inkoop">Inkoop</option><option value="in_behandeling">In behandeling</option><option value="te_koop">Te koop</option><option value="verkocht">Verkocht</option>
            </select>
          </div>
          <Field label="Inkoopdatum" type="date" value={form.inkoopDatum} onChange={(v) => update("inkoopDatum", v)} />
          <Field label="Inkoopprijs (€)" type="number" value={form.inkoopprijs} onChange={(v) => update("inkoopprijs", Number(v))} />
          <Field label="Verkoopdatum" type="date" value={form.verkoopDatum || ""} onChange={(v) => update("verkoopDatum", v || undefined)} />
          <Field label="Verkoopprijs (€)" type="number" value={form.verkoopprijs} onChange={(v) => update("verkoopprijs", Number(v))} />
        </div>

        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Kopergegevens</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Naam koper" value={form.koperNaam || ""} onChange={(v) => update("koperNaam", v || undefined)} />
            <Field label="E-mail koper" value={form.koperEmail || ""} onChange={(v) => update("koperEmail", v || undefined)} />
            <Field label="Telefoon koper" value={form.koperTelefoon || ""} onChange={(v) => update("koperTelefoon", v || undefined)} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Opmerkingen</label>
          <textarea value={form.opmerkingen || ""} onChange={(e) => update("opmerkingen", e.target.value || undefined)} rows={3} className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3864]/20 resize-none" />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1F3864] text-white text-sm font-medium rounded-lg hover:bg-[#172d52] transition-colors disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Wijzigingen Opslaan
        </button>
      </CardContent>
    </Card>
  );
};

const Field = ({ label, value, onChange, type = "text" }: {
  label: string; value: any; onChange: (v: string) => void; type?: string;
}) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3864]/20" />
  </div>
);

export default VehicleInfoTab;

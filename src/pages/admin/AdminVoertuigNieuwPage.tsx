import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVehicles } from "@/hooks/useVehicles";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Vehicle } from "@/types/vehicle";

const AdminVoertuigNieuwPage = () => {
  const navigate = useNavigate();
  const { addVehicle } = useVehicles();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    merk: "", model: "", bouwjaar: new Date().getFullYear(), kleur: "",
    kenteken: "", kilometerstand: 0, brandstof: "benzine" as Vehicle["brandstof"],
    status: "inkoop" as Vehicle["status"], inkoopDatum: new Date().toISOString().split("T")[0],
    inkoopprijs: 0, verkoopprijs: 0, opmerkingen: "",
  });

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await addVehicle({ ...form } as any);
    setSaving(false);
    navigate("/admin/voertuigen");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Terug
      </button>

      <h1 className="text-2xl font-bold text-foreground">Nieuw Voertuig</h1>

      <div className="bg-card rounded-xl border border-border p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Merk" value={form.merk} onChange={(v) => update("merk", v)} required />
            <Field label="Model" value={form.model} onChange={(v) => update("model", v)} required />
            <Field label="Bouwjaar" type="number" value={form.bouwjaar} onChange={(v) => update("bouwjaar", Number(v))} />
            <Field label="Kleur" value={form.kleur} onChange={(v) => update("kleur", v)} />
            <Field label="Kenteken" value={form.kenteken} onChange={(v) => update("kenteken", v.toUpperCase())} />
            <Field label="KM-stand" type="number" value={form.kilometerstand} onChange={(v) => update("kilometerstand", Number(v))} />
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Brandstof</label>
              <select value={form.brandstof} onChange={(e) => update("brandstof", e.target.value)} className="w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all">
                <option value="benzine">Benzine</option><option value="diesel">Diesel</option><option value="elektrisch">Elektrisch</option><option value="hybride">Hybride</option><option value="lpg">LPG</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => update("status", e.target.value)} className="w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all">
                <option value="inkoop">Inkoop</option><option value="in_behandeling">In behandeling</option><option value="te_koop">Te koop</option><option value="verkocht">Verkocht</option>
              </select>
            </div>
            <Field label="Inkoopdatum" type="date" value={form.inkoopDatum} onChange={(v) => update("inkoopDatum", v)} />
            <Field label="Inkoopprijs (€)" type="number" value={form.inkoopprijs} onChange={(v) => update("inkoopprijs", Number(v))} />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Opmerkingen</label>
            <textarea value={form.opmerkingen} onChange={(e) => update("opmerkingen", e.target.value)} rows={3} className="w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none transition-all" />
          </div>

          <button
            type="submit"
            disabled={saving || !form.merk || !form.model}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Opslaan
          </button>
        </form>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, type = "text", required = false }: {
  label: string; value: any; onChange: (v: string) => void; type?: string; required?: boolean;
}) => (
  <div>
    <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
  </div>
);

export default AdminVoertuigNieuwPage;

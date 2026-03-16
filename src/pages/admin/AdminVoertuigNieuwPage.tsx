import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVehicles } from "@/hooks/useVehicles";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Vehicle } from "@/types/vehicle";
import KentekenInput from "@/components/admin/KentekenInput";
import { fetchRdwData } from "@/lib/rdw";
import { cn } from "@/lib/utils";
import { capitalizeMerk, capitalizeModel, capitalizeKleur } from "@/lib/capitalize";

const AdminVoertuigNieuwPage = () => {
  const navigate = useNavigate();
  const { addVehicle } = useVehicles();
  const [saving, setSaving] = useState(false);
  const [rdwLoading, setRdwLoading] = useState(false);
  const [rdwFields, setRdwFields] = useState<Set<string>>(new Set());
  const [isConsignatie, setIsConsignatie] = useState(false);
  const [consignatieMarge, setConsignatieMarge] = useState(8);
  const [garantieVerantwoordelijkheid, setGarantieVerantwoordelijkheid] = useState<"platin" | "verkoper">("platin");
  const [form, setForm] = useState({
    merk: "", model: "", bouwjaar: new Date().getFullYear(), kleur: "",
    kenteken: "", kilometerstand: 0, brandstof: "benzine" as Vehicle["brandstof"],
    status: "inkoop" as Vehicle["status"], inkoopDatum: new Date().toISOString().split("T")[0],
    inkoopprijs: 0, verkoopprijs: 0, opmerkingen: "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await addVehicle({ ...form } as any);
    
    // Auto-generate blog post
    toast.info("Blogpost wordt aangemaakt...");
    try {
      const { error } = await supabase.functions.invoke("generate-blog-post", {
        body: {
          merk: form.merk,
          model: form.model,
          jaar: form.bouwjaar,
          km: form.kilometerstand,
          kleur: form.kleur,
          prijs: form.verkoopprijs,
        },
      });
      if (error) throw error;
      toast.success("✓ Auto opgeslagen en blogpost automatisch aangemaakt");
    } catch (err) {
      console.error("Blog generation error:", err);
      toast.warning("Auto opgeslagen, maar blogpost genereren is mislukt");
    }
    
    setSaving(false);
    navigate("/admin/voertuigen");
  };

  const rdwBg = (key: string) => rdwFields.has(key) ? "bg-accent/40 border-primary/30" : "";

  return (
    <div className="max-w-2xl space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Terug
      </button>

      <h1 className="text-2xl font-bold text-foreground">Nieuw Voertuig</h1>

      <div className="bg-card rounded-xl border border-border p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <KentekenInput value={form.kenteken} onChange={(v) => update("kenteken", v)} onValidKenteken={handleRdwLookup} loading={rdwLoading} />
            </div>
            <Field label="Merk" value={form.merk} onChange={(v) => update("merk", capitalizeMerk(v))} required highlight={rdwFields.has("merk")} />
            <Field label="Model" value={form.model} onChange={(v) => update("model", capitalizeModel(v))} required highlight={rdwFields.has("model")} />
            <Field label="Bouwjaar" type="number" value={form.bouwjaar} onChange={(v) => update("bouwjaar", Number(v))} highlight={rdwFields.has("bouwjaar")} />
            <Field label="Kleur" value={form.kleur} onChange={(v) => update("kleur", capitalizeKleur(v))} highlight={rdwFields.has("kleur")} />
            <Field label="KM-stand" type="number" value={form.kilometerstand} onChange={(v) => update("kilometerstand", Number(v))} />
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Brandstof</label>
              <select value={form.brandstof} onChange={(e) => update("brandstof", e.target.value)} className={cn("w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all", rdwBg("brandstof"))}>
                <option value="benzine">Benzine</option><option value="diesel">Diesel</option><option value="elektrisch">Elektrisch</option><option value="hybride">Hybride</option><option value="lpg">LPG</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => update("status", e.target.value)} className="w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all">
                <option value="inkoop">Inkoop</option><option value="consignatie">Consignatie</option><option value="in_behandeling">In behandeling</option><option value="te_koop">Te koop</option><option value="verkocht">Verkocht</option>
              </select>
            </div>

            {/* Consignatie toggle */}
            <div className="col-span-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsConsignatie(!isConsignatie);
                  if (!isConsignatie) update("inkoopprijs", 0);
                }}
                className={cn(
                  "relative w-10 h-5 rounded-full transition-colors duration-300",
                  isConsignatie ? "bg-primary" : "bg-secondary"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-foreground transition-transform duration-300",
                  isConsignatie && "translate-x-5"
                )} />
              </button>
              <span className="text-sm text-foreground">Consignatie</span>
            </div>

            {/* Consignatie options */}
            {isConsignatie && (
              <div className="col-span-2 bg-secondary/30 border border-border rounded-lg p-5 space-y-5">
                {/* Marge slider */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Consignatie marge</label>
                    <span className="text-sm font-bold text-foreground">{consignatieMarge}%</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min={3}
                      max={15}
                      step={0.5}
                      value={consignatieMarge}
                      onChange={(e) => setConsignatieMarge(Number(e.target.value))}
                      className="w-full h-1.5 bg-border rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:transition-shadow [&::-webkit-slider-thumb]:hover:shadow-lg [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-grab"
                    />
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[9px] text-muted-foreground">3%</span>
                      <span className="text-[9px] text-muted-foreground">15%</span>
                    </div>
                  </div>
                  {form.verkoopprijs > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Commissie bij verkoop: <span className="text-foreground font-medium">€ {Math.round(form.verkoopprijs * consignatieMarge / 100).toLocaleString("nl-NL")}</span>
                    </p>
                  )}
                </div>

                {/* Garantie toggle */}
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-3">Garantie verantwoordelijkheid</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGarantieVerantwoordelijkheid("platin")}
                      className={cn(
                        "flex-1 py-2.5 text-xs font-medium rounded-lg border transition-all duration-300",
                        garantieVerantwoordelijkheid === "platin"
                          ? "bg-primary/10 border-primary/40 text-foreground"
                          : "bg-transparent border-border text-muted-foreground hover:border-foreground/20"
                      )}
                    >
                      Platin Automotive
                    </button>
                    <button
                      type="button"
                      onClick={() => setGarantieVerantwoordelijkheid("verkoper")}
                      className={cn(
                        "flex-1 py-2.5 text-xs font-medium rounded-lg border transition-all duration-300",
                        garantieVerantwoordelijkheid === "verkoper"
                          ? "bg-primary/10 border-primary/40 text-foreground"
                          : "bg-transparent border-border text-muted-foreground hover:border-foreground/20"
                      )}
                    >
                      Verkoper
                    </button>
                  </div>
                </div>
              </div>
            )}

            <Field label="Inkoopdatum" type="date" value={form.inkoopDatum} onChange={(v) => update("inkoopDatum", v)} />
            {!isConsignatie && (
              <Field label="Inkoopprijs (€)" type="number" value={form.inkoopprijs} onChange={(v) => update("inkoopprijs", Number(v))} />
            )}
            <Field label="Verwachte verkoopprijs (€)" type="number" value={form.verkoopprijs} onChange={(v) => update("verkoopprijs", Number(v))} />
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

const Field = ({ label, value, onChange, type = "text", required = false, highlight = false }: {
  label: string; value: any; onChange: (v: string) => void; type?: string; required?: boolean; highlight?: boolean;
}) => (
  <div>
    <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className={cn("w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all", highlight && "bg-accent/40 border-primary/30")} />
  </div>
);

export default AdminVoertuigNieuwPage;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useVehicles } from "@/hooks/useVehicles";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Vehicle, VerkoopType, verkoopTypeLabels } from "@/types/vehicle";
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
    chassisnummer: "", metallicLak: "onbekend" as "ja" | "nee" | "onbekend",
    aantalEigenaren: "" as number | "",
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
      if (data.aantalHouders) { updates.aantalEigenaren = data.aantalHouders; filled.add("aantalEigenaren"); }
      if (data.chassisnummer) { updates.chassisnummer = data.chassisnummer; filled.add("chassisnummer"); }
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
            <Field label="Aantal eigenaren" type="number" value={form.aantalEigenaren} onChange={(v) => update("aantalEigenaren", v ? Number(v) : "")} highlight={rdwFields.has("aantalEigenaren")} />
            <div className="col-span-2">
              <Field label="Chassisnummer (VIN)" value={form.chassisnummer} onChange={(v) => update("chassisnummer", v.toUpperCase())} highlight={rdwFields.has("chassisnummer")} placeholder="Wordt automatisch opgehaald of handmatig invullen" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Metallic lak</label>
              <select value={form.metallicLak} onChange={(e) => update("metallicLak", e.target.value)} className="w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all">
                <option value="onbekend">Onbekend</option><option value="ja">Ja</option><option value="nee">Nee</option>
              </select>
              <p className="text-[9px] text-muted-foreground mt-1 italic">Niet automatisch beschikbaar — controleer het kentekenbewijs</p>
            </div>
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

            {/* Price suggestion box */}
            <PriceSuggestion merk={form.merk} model={form.model} bouwjaar={form.bouwjaar} kilometerstand={form.kilometerstand} kenteken={form.kenteken} />
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

const Field = ({ label, value, onChange, type = "text", required = false, highlight = false, placeholder }: {
  label: string; value: any; onChange: (v: string) => void; type?: string; required?: boolean; highlight?: boolean; placeholder?: string;
}) => (
  <div>
    <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} className={cn("w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all", highlight && "bg-accent/40 border-primary/30")} />
  </div>
);

const PriceSuggestion = ({ merk, model, bouwjaar, kilometerstand, kenteken }: {
  merk: string; model: string; bouwjaar: number; kilometerstand: number; kenteken: string;
}) => {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<{ inkoop_min: number; inkoop_max: number; verkoop_min: number; verkoop_max: number } | null>(null);
  const [fetched, setFetched] = useState(false);

  const canFetch = merk.length > 1 && model.length > 1 && bouwjaar > 2000;

  const fetchSuggestion = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("estimate-trade-in-value", {
        body: { merk, model, bouwjaar, kilometerstand, kenteken, staat: "goed" },
      });
      if (error) throw error;
      if (data?.min && data?.max) {
        const avg = Math.round((data.min + data.max) / 2);
        setSuggestion({
          inkoop_min: data.min,
          inkoop_max: data.max,
          verkoop_min: Math.round(avg * 1.15),
          verkoop_max: Math.round(data.max * 1.25),
        });
      }
    } catch (err) {
      console.error("Price suggestion error:", err);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  };

  if (!canFetch && !suggestion) return null;

  return (
    <div className="col-span-2 bg-secondary/30 border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Prijsindicatie</span>
        </div>
        {!loading && (
          <button
            type="button"
            onClick={fetchSuggestion}
            className="text-[10px] text-primary hover:text-foreground transition-colors duration-300 font-medium uppercase tracking-wider"
          >
            {fetched ? "Opnieuw" : "Bereken"}
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Marktdata ophalen...</span>
        </div>
      )}

      {suggestion && !loading && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background/50 rounded-md p-3">
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Advies inkoopprijs</p>
            <p className="text-sm font-bold text-foreground">
              € {suggestion.inkoop_min.toLocaleString("nl-NL")} — {suggestion.inkoop_max.toLocaleString("nl-NL")}
            </p>
          </div>
          <div className="bg-background/50 rounded-md p-3">
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Advies verkoopprijs</p>
            <p className="text-sm font-bold text-foreground">
              € {suggestion.verkoop_min.toLocaleString("nl-NL")} — {suggestion.verkoop_max.toLocaleString("nl-NL")}
            </p>
          </div>
        </div>
      )}

      {!suggestion && !loading && !fetched && (
        <p className="text-xs text-muted-foreground">Klik op "Bereken" voor een marktindicatie.</p>
      )}
    </div>
  );
};

export default AdminVoertuigNieuwPage;

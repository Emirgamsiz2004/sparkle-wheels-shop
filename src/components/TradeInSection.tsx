import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Check, Loader2, Search } from "lucide-react";
import { formatKenteken, isValidKenteken } from "@/lib/kenteken";
import { fetchRdwData, type RdwVehicleData } from "@/lib/rdw";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const staatOptions = ["Uitstekend", "Goed", "Redelijk", "Slecht"];

interface TradeInResult {
  min: number;
  max: number;
  toelichting: string;
}

const TradeInSection = () => {
  const [kenteken, setKenteken] = useState("");
  const [rdwData, setRdwData] = useState<RdwVehicleData | null>(null);
  const [rdwLoading, setRdwLoading] = useState(false);
  const [staat, setStaat] = useState("Goed");
  const [kmStand, setKmStand] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<TradeInResult | null>(null);

  const handleKentekenChange = (value: string) => {
    const formatted = formatKenteken(value);
    setKenteken(formatted);
    setRdwData(null);
    setResult(null);
  };

  const lookupKenteken = useCallback(async () => {
    if (!isValidKenteken(kenteken)) {
      toast.error("Voer een geldig kenteken in");
      return;
    }
    setRdwLoading(true);
    const data = await fetchRdwData(kenteken);
    setRdwData(data);
    setRdwLoading(false);
  }, [kenteken]);

  const handleCalculate = async () => {
    if (!rdwData) {
      toast.error("Zoek eerst je kenteken op");
      return;
    }

    setCalculating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("estimate-trade-in-value", {
        body: {
          merk: rdwData.merk,
          model: rdwData.model,
          bouwjaar: rdwData.bouwjaar,
          brandstof: rdwData.brandstof,
          kilometerstand: kmStand ? Number(kmStand) : null,
          staat,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data);
    } catch (e: any) {
      console.error("Trade-in error:", e);
      toast.error("Kon de inruilwaarde niet berekenen. Probeer het opnieuw.");
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="mt-16 border border-border bg-card">
      <div className="p-6 md:p-8">
        <h2 className="text-xl font-display font-bold text-foreground tracking-tight mb-2">
          Wat is jouw auto waard?
        </h2>
        <p className="text-sm font-body font-light text-muted-foreground mb-8 max-w-lg">
          Denk je aan inruilen? Voer je kenteken in en ontvang direct een vrijblijvende schatting van de inruilwaarde.
        </p>

        <div className="space-y-4 max-w-md">
          {/* Kenteken */}
          <div>
            <label className="block text-[10px] font-body font-medium tracking-[0.2em] uppercase text-muted-foreground mb-1.5">
              Kenteken
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={kenteken}
                onChange={(e) => handleKentekenChange(e.target.value)}
                placeholder="AB-123-C"
                className="flex-1 bg-background border border-border px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/40 uppercase tracking-widest focus:outline-none focus:border-primary transition-colors"
              />
              <button
                onClick={lookupKenteken}
                disabled={rdwLoading || !kenteken}
                className="bg-foreground text-background px-4 py-2.5 text-[10px] font-body font-semibold tracking-[0.15em] uppercase hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {rdwLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Zoek op
              </button>
            </div>
          </div>

          {/* RDW result */}
          <AnimatePresence>
            {rdwData && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-2"
              >
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-body text-foreground">
                  {rdwData.merk} {rdwData.model} uit {rdwData.bouwjaar} gevonden
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Staat dropdown */}
          <div>
            <label className="block text-[10px] font-body font-medium tracking-[0.2em] uppercase text-muted-foreground mb-1.5">
              Staat van de auto
            </label>
            <select
              value={staat}
              onChange={(e) => setStaat(e.target.value)}
              className="w-full bg-background border border-border px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
            >
              {staatOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Kilometerstand */}
          <div>
            <label className="block text-[10px] font-body font-medium tracking-[0.2em] uppercase text-muted-foreground mb-1.5">
              Kilometerstand
            </label>
            <input
              type="number"
              value={kmStand}
              onChange={(e) => setKmStand(e.target.value)}
              placeholder="bijv. 85000"
              className="w-full bg-background border border-border px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Calculate button */}
          <button
            onClick={handleCalculate}
            disabled={calculating || !rdwData}
            className="btn-public btn-primary-public w-full"
          >
            {calculating && <Loader2 className="w-4 h-4 animate-spin" />}
            {calculating ? "Waarde wordt berekend..." : "Bereken inruilwaarde"}
          </button>
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 border border-primary/30 bg-primary/5 p-6"
            >
              <p className="text-[10px] font-body font-medium tracking-[0.3em] uppercase text-muted-foreground mb-2">
                Geschatte inruilwaarde
              </p>
              <p className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
                € {result.min.toLocaleString("nl-NL")} — € {result.max.toLocaleString("nl-NL")}
              </p>
              {result.toelichting && (
                <p className="text-xs font-body text-muted-foreground mb-4">{result.toelichting}</p>
              )}
              <p className="text-[10px] font-body text-muted-foreground/70 italic mb-5">
                Dit is een indicatie op basis van marktgegevens. Kom langs voor een officiële taxatie.
              </p>
              <a
                href={`https://wa.me/31612693825?text=${encodeURIComponent(
                  `Hallo, ik wil graag een taxatie inplannen voor mijn ${rdwData?.merk} ${rdwData?.model} (${rdwData?.bouwjaar}).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[hsl(var(--whatsapp))] text-[hsl(var(--whatsapp-foreground))] px-5 py-2.5 text-[10px] font-body font-semibold tracking-[0.15em] uppercase hover:opacity-90 transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Plan een taxatie in
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TradeInSection;

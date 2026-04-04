import { useState, useCallback } from "react";
import { Vehicle, formatEuroDecimal } from "@/types/vehicle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, Check, ChevronLeft, ChevronRight, User, Banknote, Printer, CheckCircle2 } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { generateAanbetalingPDF, type AanbetalingPdfData } from "@/lib/aanbetalingPdf";

interface Props {
  vehicle: Vehicle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const inputCls = "w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-[3px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all font-['DM_Sans']";
const labelCls = "block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5 font-['Poppins']";
const btnPrimary = "px-5 py-2.5 bg-foreground text-background text-sm font-medium rounded-[3px] hover:bg-foreground/90 disabled:opacity-40 transition-all flex items-center gap-2 font-['DM_Sans']";
const btnSecondary = "px-5 py-2.5 bg-secondary text-secondary-foreground text-sm font-medium rounded-[3px] hover:bg-secondary/80 transition-all flex items-center gap-2 font-['DM_Sans']";

const steps = [
  { key: "klant", label: "Klant", icon: User },
  { key: "aanbetaling", label: "Aanbetaling", icon: Banknote },
];

const ReserveringWizard = ({ vehicle, open, onOpenChange, onComplete }: Props) => {
  const { customers } = useCustomers();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showExisting, setShowExisting] = useState(false);

  const [klant, setKlant] = useState({
    voornaam: "", achternaam: "", adres: "", postcode: "", woonplaats: "",
    telefoon: "", email: "", geboortedatum: "", customerId: "",
  });

  const [details, setDetails] = useState({
    aanbetalingsbedrag: 0,
    aanbetalingDatum: new Date().toISOString().split("T")[0],
    ophaaldatum: "",
    notities: "",
  });

  const klantValid = klant.voornaam && klant.achternaam && klant.adres && klant.postcode && klant.woonplaats && klant.telefoon && klant.geboortedatum;

  const selectExisting = (c: any) => {
    setKlant({
      voornaam: c.voornaam, achternaam: c.achternaam,
      adres: c.adres || "", postcode: c.postcode || "", woonplaats: c.plaats || "",
      telefoon: c.telefoon || "", email: c.email || "", geboortedatum: c.geboortedatum || "",
      customerId: c.id,
    });
    setShowExisting(false);
  };

  const handlePrint = () => {
    const pdfData: AanbetalingPdfData = {
      voertuig: {
        merk: vehicle.merk, model: vehicle.model, bouwjaar: vehicle.bouwjaar,
        kenteken: vehicle.kenteken, kilometerstand: vehicle.kilometerstand, vin: "",
      },
      klant: {
        voornaam: klant.voornaam, achternaam: klant.achternaam,
        adres: klant.adres, postcode: klant.postcode, woonplaats: klant.woonplaats,
        telefoon: klant.telefoon, email: klant.email,
      },
      financieel: {
        verkoopprijs: vehicle.verkoopprijs,
        aanbetalingsbedrag: details.aanbetalingsbedrag,
        restbedrag: vehicle.verkoopprijs - details.aanbetalingsbedrag,
        uiterlijkeDatum: details.ophaaldatum || details.aanbetalingDatum,
      },
      datum: details.aanbetalingDatum,
      plaats: "Roelofarendsveen",
    };
    generateAanbetalingPDF(pdfData);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let customerId = klant.customerId;
      if (!customerId) {
        const { data: nc, error } = await supabase.from("customers").insert({
          voornaam: klant.voornaam, achternaam: klant.achternaam,
          adres: klant.adres, postcode: klant.postcode, plaats: klant.woonplaats,
          telefoon: klant.telefoon, email: klant.email || `${klant.telefoon}@placeholder.nl`,
          geboortedatum: klant.geboortedatum || null, status: "prospect",
        } as any).select("id").single();
        if (error) throw error;
        customerId = nc?.id;
      }

      // Update vehicle to reserved
      await supabase.from("vehicles").update({
        status: "gereserveerd",
        koper_naam: `${klant.voornaam} ${klant.achternaam}`,
        koper_telefoon: klant.telefoon,
        koper_email: klant.email || null,
        customer_id: customerId,
      } as any).eq("id", vehicle.id);

      // Save aanbetaling record
      await supabase.from("aanbetalingen").insert({
        vehicle_id: vehicle.id,
        voertuig_merk: vehicle.merk, voertuig_model: vehicle.model,
        voertuig_bouwjaar: vehicle.bouwjaar, voertuig_kenteken: vehicle.kenteken,
        voertuig_kilometerstand: vehicle.kilometerstand,
        klant_voornaam: klant.voornaam, klant_achternaam: klant.achternaam,
        klant_adres: klant.adres, klant_postcode: klant.postcode,
        klant_woonplaats: klant.woonplaats, klant_telefoon: klant.telefoon,
        klant_email: klant.email || `${klant.telefoon}@placeholder.nl`,
        verkoopprijs: vehicle.verkoopprijs,
        aanbetalingsbedrag: details.aanbetalingsbedrag,
        restbedrag: vehicle.verkoopprijs - details.aanbetalingsbedrag,
        uiterlijke_datum: details.ophaaldatum || null,
      } as any);

      // Log activity
      await supabase.from("vehicle_activity_log").insert({
        vehicle_id: vehicle.id,
        actie_type: "gereserveerd",
        beschrijving: `Gereserveerd voor ${klant.voornaam} ${klant.achternaam} — aanbetaling ${formatEuroDecimal(details.aanbetalingsbedrag)}`,
      } as any);

      toast.success("Voertuig gereserveerd!");
      onOpenChange(false);
      onComplete();
    } catch (err: any) {
      toast.error("Fout: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden max-h-[90vh]">
        {/* Progress */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center gap-1">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const active = i + 1 === step;
              const done = i + 1 < step;
              return (
                <div key={s.key} className="flex items-center flex-1">
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-[3px] text-xs font-medium transition-colors ${active ? "bg-foreground text-background" : done ? "text-emerald-400" : "text-muted-foreground"}`}>
                    {done ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                    {s.label}
                  </div>
                  {i < steps.length - 1 && <div className={`flex-1 h-px mx-1 ${done ? "bg-emerald-500/40" : "bg-border"}`} />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold font-['Poppins'] text-foreground">Klantgegevens</h3>

                  {showExisting ? (
                    <div className="space-y-2">
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {customers.map(c => (
                          <button key={c.id} onClick={() => selectExisting(c)} className="w-full text-left px-3 py-2 text-sm bg-secondary/50 border border-border rounded-[3px] hover:bg-accent/10 transition-colors">
                            {c.voornaam} {c.achternaam} — {c.telefoon}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setShowExisting(false)} className="text-xs text-muted-foreground hover:text-foreground">Annuleren</button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelCls}>Voornaam *</label><input value={klant.voornaam} onChange={e => setKlant(k => ({ ...k, voornaam: e.target.value }))} className={inputCls} /></div>
                        <div><label className={labelCls}>Achternaam *</label><input value={klant.achternaam} onChange={e => setKlant(k => ({ ...k, achternaam: e.target.value }))} className={inputCls} /></div>
                      </div>
                      <div><label className={labelCls}>Adres *</label><input value={klant.adres} onChange={e => setKlant(k => ({ ...k, adres: e.target.value }))} className={inputCls} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelCls}>Postcode *</label><input value={klant.postcode} onChange={e => setKlant(k => ({ ...k, postcode: e.target.value }))} className={inputCls} /></div>
                        <div><label className={labelCls}>Woonplaats *</label><input value={klant.woonplaats} onChange={e => setKlant(k => ({ ...k, woonplaats: e.target.value }))} className={inputCls} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelCls}>Telefoonnummer *</label><input value={klant.telefoon} onChange={e => setKlant(k => ({ ...k, telefoon: e.target.value }))} className={inputCls} /></div>
                        <div><label className={labelCls}>Geboortedatum *</label><input type="date" value={klant.geboortedatum} onChange={e => setKlant(k => ({ ...k, geboortedatum: e.target.value }))} className={inputCls} /></div>
                      </div>
                      <div><label className={labelCls}>E-mailadres (optioneel)</label><input value={klant.email} onChange={e => setKlant(k => ({ ...k, email: e.target.value }))} className={inputCls} /></div>
                      <button onClick={() => setShowExisting(true)} className="text-xs text-muted-foreground hover:text-foreground underline transition-colors">Bestaande klant selecteren</button>
                    </>
                  )}

                  <div className="flex justify-end pt-2">
                    <button onClick={() => setStep(2)} disabled={!klantValid} className={btnPrimary}>Volgende <ChevronRight className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold font-['Poppins'] text-foreground">Aanbetaling & Reservering</h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Aanbetalingsbedrag (€) *</label><input type="number" step="0.01" value={details.aanbetalingsbedrag} onChange={e => setDetails(d => ({ ...d, aanbetalingsbedrag: Number(e.target.value) }))} className={inputCls} /></div>
                    <div><label className={labelCls}>Aanbetalingsdatum</label><input type="date" value={details.aanbetalingDatum} onChange={e => setDetails(d => ({ ...d, aanbetalingDatum: e.target.value }))} className={inputCls} /></div>
                  </div>
                  <div><label className={labelCls}>Afgesproken ophaaldatum</label><input type="date" value={details.ophaaldatum} onChange={e => setDetails(d => ({ ...d, ophaaldatum: e.target.value }))} className={inputCls} /></div>
                  <div><label className={labelCls}>Notities (optioneel)</label><textarea value={details.notities} onChange={e => setDetails(d => ({ ...d, notities: e.target.value }))} className={inputCls + " min-h-[60px] resize-none"} /></div>

                  <p className="text-xs text-muted-foreground">Restbedrag: {formatEuroDecimal(vehicle.verkoopprijs - details.aanbetalingsbedrag)}</p>

                  <button onClick={handlePrint} className="w-full py-3 bg-secondary text-foreground text-sm font-medium rounded-[3px] hover:bg-secondary/80 transition-all flex items-center justify-center gap-2 border border-border">
                    <Printer className="w-4 h-4" /> Aanbetalingsbevestiging printen
                  </button>

                  <div className="flex justify-between pt-2">
                    <button onClick={() => setStep(1)} className={btnSecondary}><ChevronLeft className="w-3.5 h-3.5" /> Terug</button>
                    <button onClick={handleSave} disabled={saving || details.aanbetalingsbedrag <= 0} className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-[3px] hover:bg-emerald-700 disabled:opacity-40 transition-all flex items-center gap-2">
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      <Check className="w-3.5 h-3.5" /> Reservering opslaan
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReserveringWizard;

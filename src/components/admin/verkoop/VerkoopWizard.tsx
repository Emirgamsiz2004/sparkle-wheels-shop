import { useState, useEffect, useCallback } from "react";
import { Vehicle, formatEuroDecimal, calcKostprijs, calcTotalKosten } from "@/types/vehicle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, Check, AlertTriangle, Printer, ChevronLeft, ChevronRight, User, CreditCard, FileText, Receipt, CheckCircle2 } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { useMoneybird } from "@/hooks/useMoneybird";
import { printKoopovereenkomst, type KoopovereenkomstData } from "@/lib/koopovereenkomstPdf";

interface Props {
  vehicle: Vehicle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  initialStep?: number;
  existingCustomer?: any;
  existingDeposit?: number;
}

const WIZARD_KEY = "verkoop_wizard_";

const steps = [
  { key: "klant", label: "Klant", icon: User },
  { key: "details", label: "Details", icon: CreditCard },
  { key: "overeenkomst", label: "Overeenkomst", icon: FileText },
  { key: "factuur", label: "Factuur", icon: Receipt },
  { key: "afronden", label: "Afronden", icon: CheckCircle2 },
];

const inputCls = "w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-[3px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all font-['DM_Sans']";
const labelCls = "block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5 font-['Poppins']";
const btnPrimary = "px-5 py-2.5 bg-foreground text-background text-sm font-medium rounded-[3px] hover:bg-foreground/90 disabled:opacity-40 transition-all flex items-center gap-2 font-['DM_Sans']";
const btnSecondary = "px-5 py-2.5 bg-secondary text-secondary-foreground text-sm font-medium rounded-[3px] hover:bg-secondary/80 transition-all flex items-center gap-2 font-['DM_Sans']";

const VerkoopWizard = ({ vehicle, open, onOpenChange, onComplete, initialStep, existingCustomer, existingDeposit }: Props) => {
  const { customers } = useCustomers();
  const { createVehicleInvoice, loading: mbLoading } = useMoneybird();

  const [step, setStep] = useState(initialStep || 1);
  const [saving, setSaving] = useState(false);
  const [showExistingSelect, setShowExistingSelect] = useState(false);
  const [duplicateFound, setDuplicateFound] = useState<any>(null);
  const [resumePrompt, setResumePrompt] = useState(false);

  const [klant, setKlant] = useState({
    voornaam: existingCustomer?.voornaam || "",
    achternaam: existingCustomer?.achternaam || "",
    adres: existingCustomer?.adres || "",
    postcode: existingCustomer?.postcode || "",
    woonplaats: existingCustomer?.plaats || "",
    telefoon: existingCustomer?.telefoon || "",
    email: existingCustomer?.email || "",
    geboortedatum: existingCustomer?.geboortedatum || "",
    customerId: existingCustomer?.id || "",
  });

  const [details, setDetails] = useState({
    verkoopprijs: vehicle.verkoopprijs || 0,
    betaalwijze: "overboeking" as string,
    contantBedrag: 0,
    overboekingBedrag: 0,
    aanbetalingActief: !!existingDeposit,
    aanbetalingsbedrag: existingDeposit || 0,
    aanbetalingDatum: "",
    afleverdatum: "",
    garantieType: "geen" as string,
    garantieMaanden: 3,
    garantieKosten: 0,
    garantieBetaler: "geen" as string,
    wwftBevestigd: false,
  });

  const [overeenkomstOndertekend, setOvereenkomstOndertekend] = useState(false);
  const [factuurAangemaakt, setFactuurAangemaakt] = useState(false);
  const [moneybirdFactuurId, setMoneybirdFactuurId] = useState("");

  const storageKey = WIZARD_KEY + vehicle.id;

  // Check for saved state on open
  useEffect(() => {
    if (!open) return;
    const saved = localStorage.getItem(storageKey);
    if (saved && !initialStep) {
      setResumePrompt(true);
    } else if (initialStep) {
      setStep(initialStep);
    }
  }, [open, storageKey, initialStep]);

  // Save state to localStorage on changes
  useEffect(() => {
    if (!open || resumePrompt) return;
    const state = { step, klant, details, overeenkomstOndertekend, factuurAangemaakt };
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [step, klant, details, overeenkomstOndertekend, factuurAangemaakt, open, resumePrompt, storageKey]);

  const restoreState = () => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        setStep(state.step || 1);
        setKlant(state.klant || klant);
        setDetails(state.details || details);
        setOvereenkomstOndertekend(state.overeenkomstOndertekend || false);
        setFactuurAangemaakt(state.factuurAangemaakt || false);
      } catch {}
    }
    setResumePrompt(false);
  };

  const startFresh = () => {
    localStorage.removeItem(storageKey);
    setStep(initialStep || 1);
    setResumePrompt(false);
  };

  const clearWizard = () => {
    localStorage.removeItem(storageKey);
  };

  // Check for duplicate customer
  const checkDuplicate = useCallback(() => {
    const found = customers.find(c => {
      if (klant.telefoon && c.telefoon === klant.telefoon) return true;
      if (klant.email && c.email === klant.email) return true;
      return false;
    });
    if (found && !klant.customerId) {
      setDuplicateFound(found);
    } else {
      setDuplicateFound(null);
      setStep(2);
    }
  }, [customers, klant]);

  const useDuplicate = () => {
    if (duplicateFound) {
      setKlant({
        voornaam: duplicateFound.voornaam,
        achternaam: duplicateFound.achternaam,
        adres: duplicateFound.adres || "",
        postcode: duplicateFound.postcode || "",
        woonplaats: duplicateFound.plaats || "",
        telefoon: duplicateFound.telefoon || "",
        email: duplicateFound.email || "",
        geboortedatum: duplicateFound.geboortedatum || "",
        customerId: duplicateFound.id,
      });
    }
    setDuplicateFound(null);
    setStep(2);
  };

  const selectExisting = (c: any) => {
    setKlant({
      voornaam: c.voornaam,
      achternaam: c.achternaam,
      adres: c.adres || "",
      postcode: c.postcode || "",
      woonplaats: c.plaats || "",
      telefoon: c.telefoon || "",
      email: c.email || "",
      geboortedatum: c.geboortedatum || "",
      customerId: c.id,
    });
    setShowExistingSelect(false);
  };

  // Computed
  const restbedrag = details.aanbetalingActief
    ? details.verkoopprijs - details.aanbetalingsbedrag
    : details.verkoopprijs;

  const combinatieTotaal = details.contantBedrag + details.overboekingBedrag;
  const combinatieKlopt = details.betaalwijze !== "combinatie" || Math.abs(combinatieTotaal - details.verkoopprijs) < 0.01;

  const contantBedragCheck = details.betaalwijze === "contant"
    ? details.verkoopprijs
    : details.betaalwijze === "combinatie"
      ? details.contantBedrag
      : 0;

  const wwftNodig = contantBedragCheck > 3000;

  const klantValid = klant.voornaam && klant.achternaam && klant.adres && klant.postcode && klant.woonplaats && klant.telefoon && klant.geboortedatum;
  const detailsValid = details.verkoopprijs > 0 && combinatieKlopt && (!wwftNodig || details.wwftBevestigd);

  const handlePrint = () => {
    const pdfData: KoopovereenkomstData = {
      voertuig: {
        merk: vehicle.merk,
        model: vehicle.model,
        bouwjaar: vehicle.bouwjaar,
        kenteken: vehicle.kenteken,
        kilometerstand: vehicle.kilometerstand,
      },
      klant: {
        voornaam: klant.voornaam,
        achternaam: klant.achternaam,
        adres: klant.adres,
        postcode: klant.postcode,
        woonplaats: klant.woonplaats,
        telefoon: klant.telefoon,
        email: klant.email,
        geboortedatum: klant.geboortedatum,
      },
      financieel: {
        verkoopprijs: details.verkoopprijs,
        betaalwijze: details.betaalwijze,
        contantBedrag: details.contantBedrag,
        overboekingBedrag: details.overboekingBedrag,
        aanbetalingActief: details.aanbetalingActief,
        aanbetalingsbedrag: details.aanbetalingsbedrag,
        restbedrag,
      },
      garantie: {
        type: details.garantieType,
        maanden: details.garantieMaanden,
      },
      wwftBevestigd: details.wwftBevestigd,
      datum: new Date().toISOString().split("T")[0],
      plaats: "Roelofarendsveen",
    };
    printKoopovereenkomst(pdfData);
  };

  const handleCreateInvoice = async () => {
    try {
      const result = await createVehicleInvoice(
        { ...vehicle, verkoopprijs: details.verkoopprijs },
        `${klant.voornaam} ${klant.achternaam}`,
        klant.email || undefined,
        klant.telefoon || undefined
      );
      setMoneybirdFactuurId(result?.id || "created");
      setFactuurAangemaakt(true);
      toast.success("Factuur aangemaakt in Moneybird");
    } catch {
      toast.error("Fout bij aanmaken factuur");
    }
  };

  const handleFinalize = async () => {
    setSaving(true);
    try {
      // Create or use existing customer
      let customerId = klant.customerId;
      if (!customerId) {
        const { data: newCustomer, error: custErr } = await supabase
          .from("customers")
          .insert({
            voornaam: klant.voornaam,
            achternaam: klant.achternaam,
            adres: klant.adres,
            postcode: klant.postcode,
            plaats: klant.woonplaats,
            telefoon: klant.telefoon,
            email: klant.email || `${klant.telefoon}@placeholder.nl`,
            geboortedatum: klant.geboortedatum || null,
            status: "klant",
          } as any)
          .select("id")
          .single();
        if (custErr) throw custErr;
        customerId = newCustomer?.id;
      } else {
        // Update existing customer status
        await supabase.from("customers").update({ status: "klant" } as any).eq("id", customerId);
      }

      // Update vehicle
      await supabase.from("vehicles").update({
        status: "verkocht",
        verkoop_datum: new Date().toISOString().split("T")[0],
        verkoopprijs: details.verkoopprijs,
        koper_naam: `${klant.voornaam} ${klant.achternaam}`,
        koper_email: klant.email || null,
        koper_telefoon: klant.telefoon || null,
        betaalmethode: details.betaalwijze,
        customer_id: customerId,
      } as any).eq("id", vehicle.id);

      // Save sale record
      await supabase.from("vehicle_sales").insert({
        vehicle_id: vehicle.id,
        customer_id: customerId,
        verkoopprijs: details.verkoopprijs,
        betaalwijze: details.betaalwijze,
        contant_bedrag: details.contantBedrag,
        overboeking_bedrag: details.overboekingBedrag,
        aanbetaling_actief: details.aanbetalingActief,
        aanbetalingsbedrag: details.aanbetalingsbedrag,
        restbedrag,
        garantie_type: details.garantieType,
        garantie_maanden: details.garantieMaanden,
        wwft_bevestigd: details.wwftBevestigd,
        overeenkomst_ondertekend: overeenkomstOndertekend,
        moneybird_factuur_id: moneybirdFactuurId || null,
        wizard_stap: 5,
        status: "voltooid",
        verkoop_datum: new Date().toISOString().split("T")[0],
      } as any);

      // Log activity
      await supabase.from("vehicle_activity_log").insert({
        vehicle_id: vehicle.id,
        actie_type: "verkocht",
        beschrijving: `Verkocht aan ${klant.voornaam} ${klant.achternaam} voor ${formatEuroDecimal(details.verkoopprijs)}`,
      } as any);

      // Make event
      const kostprijs = calcKostprijs(vehicle);
      await supabase.from("make_events").insert({
        event_type: "vehicle.sold",
        payload: {
          vehicle_id: vehicle.id,
          kenteken: vehicle.kenteken,
          merk: vehicle.merk,
          model: vehicle.model,
          verkoopprijs: details.verkoopprijs,
          kostprijs,
          winst: details.verkoopprijs - kostprijs,
          koper_naam: `${klant.voornaam} ${klant.achternaam}`,
          betaalmethode: details.betaalwijze,
        },
      } as any);

      clearWizard();
      toast.success("Verkoop afgerond!");
      onOpenChange(false);
      onComplete();
    } catch (err: any) {
      toast.error("Fout bij afronden: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const kostprijs = calcKostprijs(vehicle);
  const winst = details.verkoopprijs - kostprijs;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onOpenChange(false); }}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden max-h-[90vh]">
        {/* Resume prompt */}
        {resumePrompt ? (
          <div className="p-6 space-y-4">
            <h2 className="text-base font-semibold font-['Poppins'] text-foreground">Onafgeronde verkoop gevonden</h2>
            <p className="text-sm text-muted-foreground">Je hebt een onafgeronde verkoop voor dit voertuig. Wil je doorgaan waar je gebleven was?</p>
            <div className="flex gap-3">
              <button onClick={restoreState} className={btnPrimary}>Doorgaan</button>
              <button onClick={startFresh} className={btnSecondary}>Opnieuw beginnen</button>
            </div>
          </div>
        ) : (
          <>
            {/* Progress bar */}
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
                        <span className="hidden sm:inline">{s.label}</span>
                      </div>
                      {i < steps.length - 1 && <div className={`flex-1 h-px mx-1 ${done ? "bg-emerald-500/40" : "bg-border"}`} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* STEP 1: Klantgegevens */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold font-['Poppins'] text-foreground">Klantgegevens</h3>

                      {duplicateFound && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-[3px] space-y-2">
                          <p className="text-xs text-amber-400 flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Dit lijkt op een bestaande klant: {duplicateFound.voornaam} {duplicateFound.achternaam}
                          </p>
                          <div className="flex gap-2">
                            <button onClick={useDuplicate} className="text-xs px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-[3px] hover:bg-amber-500/30 transition-colors">Ja, gebruik bestaande</button>
                            <button onClick={() => { setDuplicateFound(null); setStep(2); }} className="text-xs px-3 py-1.5 bg-secondary text-secondary-foreground rounded-[3px] hover:bg-secondary/80 transition-colors">Nee, maak nieuwe aan</button>
                          </div>
                        </div>
                      )}

                      {showExistingSelect ? (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Selecteer een bestaande klant:</p>
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {customers.map(c => (
                              <button key={c.id} onClick={() => selectExisting(c)} className="w-full text-left px-3 py-2 text-sm bg-secondary/50 border border-border rounded-[3px] hover:bg-accent/10 transition-colors">
                                {c.voornaam} {c.achternaam} — {c.telefoon}
                              </button>
                            ))}
                          </div>
                          <button onClick={() => setShowExistingSelect(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Annuleren</button>
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

                          <button onClick={() => setShowExistingSelect(true)} className="text-xs text-muted-foreground hover:text-foreground underline transition-colors">
                            Bestaande klant selecteren
                          </button>
                        </>
                      )}

                      <div className="flex justify-end pt-2">
                        <button onClick={checkDuplicate} disabled={!klantValid} className={btnPrimary}>
                          Volgende <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Verkoopdetails */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold font-['Poppins'] text-foreground">Verkoopdetails</h3>

                      <div>
                        <label className={labelCls}>Verkoopprijs (€)</label>
                        <input type="number" step="0.01" value={details.verkoopprijs} onChange={e => setDetails(d => ({ ...d, verkoopprijs: Number(e.target.value) }))} className={inputCls} />
                      </div>

                      {/* Betaalwijze */}
                      <div>
                        <label className={labelCls}>Betaalwijze</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { key: "contant", label: "Contant" },
                            { key: "overboeking", label: "Overboeking" },
                            { key: "financiering", label: "Financiering" },
                            { key: "combinatie", label: "Combinatie" },
                          ].map(opt => (
                            <button
                              key={opt.key}
                              onClick={() => setDetails(d => ({ ...d, betaalwijze: opt.key }))}
                              className={`px-3 py-3 text-xs font-medium border rounded-[3px] transition-all ${details.betaalwijze === opt.key ? "border-foreground bg-foreground/10 text-foreground" : "border-border text-muted-foreground hover:border-foreground/30"}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {details.betaalwijze === "combinatie" && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelCls}>Bedrag contant (€)</label>
                            <input type="number" step="0.01" value={details.contantBedrag} onChange={e => setDetails(d => ({ ...d, contantBedrag: Number(e.target.value) }))} className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Bedrag overboeking (€)</label>
                            <input type="number" step="0.01" value={details.overboekingBedrag} onChange={e => setDetails(d => ({ ...d, overboekingBedrag: Number(e.target.value) }))} className={inputCls} />
                          </div>
                          {!combinatieKlopt && (
                            <p className="col-span-2 text-xs text-red-400">Bedragen tellen niet op tot de verkoopprijs ({formatEuroDecimal(details.verkoopprijs)}). Verschil: {formatEuroDecimal(details.verkoopprijs - combinatieTotaal)}</p>
                          )}
                        </div>
                      )}

                      {/* Wwft */}
                      {wwftNodig && (
                        <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-[3px] space-y-2">
                          <p className="text-xs text-red-400 flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Contante betaling boven €3.000 — Wwft identificatieplicht van toepassing.
                          </p>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={details.wwftBevestigd} onChange={e => setDetails(d => ({ ...d, wwftBevestigd: e.target.checked }))} className="w-3.5 h-3.5 rounded-sm border-border" />
                            <span className="text-xs text-foreground">Ik bevestig dat de Wwft-identificatieplicht is nageleefd</span>
                          </label>
                        </div>
                      )}

                      {/* Aanbetaling */}
                      <div className="space-y-3">
                        <label className={labelCls}>Aanbetaling</label>
                        <div className="inline-flex bg-secondary/50 border border-border rounded-[3px] p-0.5">
                          <button
                            onClick={() => setDetails(d => ({ ...d, aanbetalingActief: false }))}
                            className={`px-4 py-1.5 text-xs font-medium rounded-[2px] transition-all ${!details.aanbetalingActief ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                          >
                            Nee
                          </button>
                          <button
                            onClick={() => setDetails(d => ({ ...d, aanbetalingActief: true }))}
                            className={`px-4 py-1.5 text-xs font-medium rounded-[2px] transition-all ${details.aanbetalingActief ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                          >
                            Ja
                          </button>
                        </div>
                        <AnimatePresence>
                          {details.aanbetalingActief && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="grid grid-cols-2 gap-3 pt-1">
                                <div>
                                  <label className={labelCls}>Aanbetalingsbedrag (€)</label>
                                  <input type="number" step="0.01" value={details.aanbetalingsbedrag} onChange={e => setDetails(d => ({ ...d, aanbetalingsbedrag: Number(e.target.value) }))} className={inputCls} />
                                </div>
                                <div>
                                  <label className={labelCls}>Aanbetalingsdatum</label>
                                  <input type="date" value={details.aanbetalingDatum} onChange={e => setDetails(d => ({ ...d, aanbetalingDatum: e.target.value }))} className={inputCls} />
                                </div>
                                <p className="col-span-2 text-xs text-muted-foreground">Restbedrag: {formatEuroDecimal(restbedrag)}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Afleverdatum */}
                      <div>
                        <label className={labelCls}>Afleverdatum (optioneel)</label>
                        <input type="date" value={details.afleverdatum} onChange={e => setDetails(d => ({ ...d, afleverdatum: e.target.value }))} className={inputCls} />
                      </div>

                      {/* Garantie */}
                      <div>
                        <label className={labelCls}>Garantie</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: "geen", label: "Geen garantie" },
                            { key: "autotrust", label: "AutoTrust" },
                            { key: "eigen", label: "Eigen garantie" },
                          ].map(opt => (
                            <button
                              key={opt.key}
                              onClick={() => setDetails(d => ({ ...d, garantieType: opt.key }))}
                              className={`px-3 py-3 text-xs font-medium border rounded-[3px] transition-all ${details.garantieType === opt.key ? "border-foreground bg-foreground/10 text-foreground" : "border-border text-muted-foreground hover:border-foreground/30"}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        <AnimatePresence>
                          {(details.garantieType === "autotrust" || details.garantieType === "eigen") && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 space-y-3">
                                <div>
                                  <label className={labelCls}>Garantieduur (maanden)</label>
                                  <input type="number" value={details.garantieMaanden} onChange={e => setDetails(d => ({ ...d, garantieMaanden: Number(e.target.value) }))} className={inputCls + " w-24"} />
                                </div>
                                <div>
                                  <label className={labelCls}>Garantiekosten (€)</label>
                                  <input type="number" step="0.01" value={details.garantieKosten} onChange={e => setDetails(d => ({ ...d, garantieKosten: Number(e.target.value) }))} className={inputCls + " w-32"} />
                                </div>
                                {details.garantieKosten > 0 && (
                                  <div>
                                    <label className={labelCls}>Wie betaalt?</label>
                                    <div className="grid grid-cols-3 gap-2">
                                      {[
                                        { key: "dealer", label: "Dealer" },
                                        { key: "klant", label: "Klant" },
                                        { key: "gedeeld", label: "Gedeeld" },
                                      ].map(opt => (
                                        <button
                                          key={opt.key}
                                          onClick={() => setDetails(d => ({ ...d, garantieBetaler: opt.key }))}
                                          className={`px-3 py-2 text-xs font-medium border rounded-[3px] transition-all ${details.garantieBetaler === opt.key ? "border-foreground bg-foreground/10 text-foreground" : "border-border text-muted-foreground hover:border-foreground/30"}`}
                                        >
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="flex justify-between pt-2">
                        <button onClick={() => setStep(1)} className={btnSecondary}><ChevronLeft className="w-3.5 h-3.5" /> Terug</button>
                        <button onClick={() => setStep(3)} disabled={!detailsValid} className={btnPrimary}>Volgende <ChevronRight className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Koopovereenkomst */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold font-['Poppins'] text-foreground">Koopovereenkomst</h3>
                      <p className="text-xs text-muted-foreground">De koopovereenkomst is automatisch gegenereerd met alle gegevens. Print het document, laat het ondertekenen en overhandig het aan de klant.</p>

                      <div className="p-4 bg-secondary/50 border border-border rounded-[3px] space-y-2 text-xs">
                        <div className="flex justify-between"><span className="text-muted-foreground">Voertuig</span><span className="text-foreground">{vehicle.merk} {vehicle.model} {vehicle.bouwjaar}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Kenteken</span><span className="text-foreground font-mono">{vehicle.kenteken}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Koper</span><span className="text-foreground">{klant.voornaam} {klant.achternaam}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Verkoopprijs</span><span className="text-foreground font-medium">{formatEuroDecimal(details.verkoopprijs)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Betaalwijze</span><span className="text-foreground capitalize">{details.betaalwijze}</span></div>
                        {details.garantieType !== "geen" && (
                          <div className="flex justify-between"><span className="text-muted-foreground">Garantie</span><span className="text-foreground">{details.garantieType === "autotrust" ? "AutoTrust" : "Eigen"} — {details.garantieMaanden} mnd</span></div>
                        )}
                      </div>

                      <button onClick={handlePrint} className="w-full py-3 bg-foreground text-background text-sm font-medium rounded-[3px] hover:bg-foreground/90 transition-all flex items-center justify-center gap-2">
                        <Printer className="w-4 h-4" /> Koopovereenkomst printen
                      </button>

                      <label className="flex items-center gap-2 cursor-pointer p-3 bg-secondary/50 border border-border rounded-[3px]">
                        <input type="checkbox" checked={overeenkomstOndertekend} onChange={e => setOvereenkomstOndertekend(e.target.checked)} className="w-3.5 h-3.5 rounded-sm border-border" />
                        <span className="text-xs text-foreground">Overeenkomst is ondertekend en overhandigd aan klant</span>
                      </label>

                      <div className="flex justify-between pt-2">
                        <button onClick={() => setStep(2)} className={btnSecondary}><ChevronLeft className="w-3.5 h-3.5" /> Terug</button>
                        <button onClick={() => setStep(4)} disabled={!overeenkomstOndertekend} className={btnPrimary}>Volgende <ChevronRight className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Factuur */}
                  {step === 4 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold font-['Poppins'] text-foreground">Factuur aanmaken</h3>

                      <div className="p-4 bg-secondary/50 border border-border rounded-[3px] space-y-2 text-xs">
                        <div className="flex justify-between"><span className="text-muted-foreground">Klant</span><span className="text-foreground">{klant.voornaam} {klant.achternaam}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Omschrijving</span><span className="text-foreground">{vehicle.merk} {vehicle.model} {vehicle.bouwjaar}, kenteken {vehicle.kenteken}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Bedrag</span><span className="text-foreground font-medium">{formatEuroDecimal(details.verkoopprijs)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Betaaltermijn</span><span className="text-foreground">{details.betaalwijze === "contant" ? "Voldaan bij aflevering" : details.aanbetalingActief ? `Restbedrag ${formatEuroDecimal(restbedrag)}` : "14 dagen"}</span></div>
                      </div>

                      {factuurAangemaakt ? (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-[3px] flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs text-emerald-400">Factuur aangemaakt in Moneybird</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button onClick={handleCreateInvoice} disabled={mbLoading} className="w-full py-3 bg-foreground text-background text-sm font-medium rounded-[3px] hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                            {mbLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            <Receipt className="w-4 h-4" /> Factuur aanmaken in Moneybird
                          </button>
                          <button onClick={() => { setStep(5); }} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-2">
                            Overslaan voor nu
                          </button>
                        </div>
                      )}

                      <div className="flex justify-between pt-2">
                        <button onClick={() => setStep(3)} className={btnSecondary}><ChevronLeft className="w-3.5 h-3.5" /> Terug</button>
                        <button onClick={() => setStep(5)} className={btnPrimary}>Volgende <ChevronRight className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  )}

                  {/* STEP 5: Afronden */}
                  {step === 5 && (
                    <div className="space-y-4">
                      <div className="text-center py-4">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h3 className="text-sm font-semibold font-['Poppins'] text-foreground">Verkoop samenvatting</h3>
                      </div>

                      <div className="p-4 bg-secondary/50 border border-border rounded-[3px] space-y-2.5 text-xs">
                        <div className="flex justify-between"><span className="text-muted-foreground">Klant</span><span className="text-foreground">{klant.voornaam} {klant.achternaam}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Voertuig</span><span className="text-foreground">{vehicle.merk} {vehicle.model} — {vehicle.kenteken}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Verkoopprijs</span><span className="text-foreground font-medium">{formatEuroDecimal(details.verkoopprijs)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Betaalwijze</span><span className="text-foreground capitalize">{details.betaalwijze}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Garantie</span><span className="text-foreground">{details.garantieType === "geen" ? "Geen" : `${details.garantieType === "autotrust" ? "AutoTrust" : "Eigen"} — ${details.garantieMaanden} mnd`}</span></div>
                        <div className="border-t border-border pt-2 flex justify-between">
                          <span className="text-muted-foreground">Overeenkomst</span>
                          <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Ondertekend</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Factuur</span>
                          {factuurAangemaakt ? (
                            <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Aangemaakt</span>
                          ) : (
                            <span className="text-amber-400">Nog aan te maken</span>
                          )}
                        </div>
                        <div className="border-t border-border pt-2 flex justify-between">
                          <span className="font-medium text-foreground">Marge</span>
                          <span className={`font-bold ${winst >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatEuroDecimal(winst)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-2">
                        <button onClick={handleFinalize} disabled={saving} className="w-full py-3 bg-emerald-600 text-white text-sm font-medium rounded-[3px] hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                          <Check className="w-4 h-4" /> Voertuig markeren als Verkocht
                        </button>
                        <button onClick={() => { clearWizard(); onOpenChange(false); }} className="text-xs text-center text-muted-foreground hover:text-foreground transition-colors py-2">
                          Terug naar voertuigen
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VerkoopWizard;

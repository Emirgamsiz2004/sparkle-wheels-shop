import { useState, useEffect } from "react";
import { Vehicle, formatEuroDecimal } from "@/types/vehicle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, X, AlertCircle, Download, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateConsignatieOvereenkomstPDF, generateConsignatieOvereenkomstBlob } from "@/lib/consignatieOvereenkomstPdf";

interface Props {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle;
}

type GarantieType = "geen" | "platin" | "autotrust";
type Betaalwijze = "bank" | "contant" | "combinatie";

interface FormData {
  voornaam: string;
  achternaam: string;
  adres: string;
  postcode: string;
  woonplaats: string;
  telefoon: string;
  email: string;
  iban: string;
  vin: string;
  apkTot: string;
  vraagprijs: number;
  minimumprijs: number;
  commissiePercentage: number;
  garantie: GarantieType;
  aangepastCommissiePercentage: number;
  advertentiekosten: number;
  poetskosten: number;
  overigeKosten: number;
  datum: string;
  plaats: string;
  betaalwijze: Betaalwijze;
  contantBedrag: number;
}

const ConsignatieOvereenkomstDialog = ({ open, onClose, vehicle }: Props) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [existingAgreement, setExistingAgreement] = useState<any>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  const [form, setForm] = useState<FormData>({
    voornaam: "",
    achternaam: "",
    adres: "",
    postcode: "",
    woonplaats: "",
    telefoon: "",
    email: "",
    iban: "",
    vin: "",
    apkTot: "",
    vraagprijs: vehicle.verkoopprijs || 0,
    minimumprijs: 0,
    commissiePercentage: vehicle.consignatieCommissiePerc ?? 10,
    garantie: "geen",
    aangepastCommissiePercentage: 15,
    advertentiekosten: 0,
    poetskosten: 0,
    overigeKosten: 0,
    datum: new Date().toISOString().split("T")[0],
    plaats: "Roelofarendsveen",
    betaalwijze: "bank",
    contantBedrag: 0,
  });

  useEffect(() => {
    if (!open) return;
    // Pre-fill eigenaar from vehicle
    const nameParts = (vehicle.consignatieEigenaarNaam || "").split(" ");
    setForm((f) => ({
      ...f,
      voornaam: nameParts[0] || "",
      achternaam: nameParts.slice(1).join(" ") || "",
      telefoon: vehicle.consignatieEigenaarTelefoon || "",
      email: vehicle.consignatieEigenaarEmail || "",
      vraagprijs: vehicle.verkoopprijs || 0,
      commissiePercentage: vehicle.consignatieCommissiePerc ?? 10,
    }));
    // Check for existing agreement
    loadExisting();
  }, [open, vehicle]);

  const loadExisting = async () => {
    setLoadingExisting(true);
    const { data } = await supabase
      .from("consignatie_overeenkomsten")
      .select("*")
      .eq("vehicle_id", vehicle.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (data && data.length > 0) {
      setExistingAgreement(data[0]);
      const a = data[0] as any;
      setForm({
        voornaam: a.eigenaar_voornaam,
        achternaam: a.eigenaar_achternaam,
        adres: a.eigenaar_adres,
        postcode: a.eigenaar_postcode,
        woonplaats: a.eigenaar_woonplaats,
        telefoon: a.eigenaar_telefoon,
        email: a.eigenaar_email,
        iban: a.eigenaar_iban,
        vin: a.voertuig_vin || "",
        apkTot: a.voertuig_apk_tot || "",
        vraagprijs: Number(a.vraagprijs) || 0,
        minimumprijs: Number(a.minimumprijs) || 0,
        commissiePercentage: Number(a.commissie_percentage) || 10,
        garantie: a.garantie || "geen",
        aangepastCommissiePercentage: Number(a.aangepast_commissie_percentage) || 15,
        advertentiekosten: Number(a.advertentiekosten) || 0,
        poetskosten: Number(a.poetskosten) || 0,
        overigeKosten: Number(a.overige_kosten) || 0,
        datum: a.datum || new Date().toISOString().split("T")[0],
        plaats: a.plaats || "Roelofarendsveen",
        betaalwijze: "bank",
        contantBedrag: 0,
      });
    }
    setLoadingExisting(false);
  };

  const update = (key: keyof FormData, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const contantTooHigh = (form.betaalwijze === "contant" && form.vraagprijs > 3000) ||
    (form.betaalwijze === "combinatie" && form.contantBedrag > 3000);

  const bankBedrag = form.betaalwijze === "combinatie" ? form.vraagprijs - form.contantBedrag : 0;

  const isValid = () => {
    return (
      form.voornaam.trim() &&
      form.achternaam.trim() &&
      form.adres.trim() &&
      form.postcode.trim() &&
      form.woonplaats.trim() &&
      form.telefoon.trim() &&
      form.email.trim() &&
      form.iban.trim() &&
      form.vraagprijs > 0 &&
      form.minimumprijs > 0 &&
      !contantTooHigh
    );
  };

  const effectiveCommissie = form.garantie === "platin" ? form.aangepastCommissiePercentage : form.commissiePercentage;

  const handleGenerate = async () => {
    if (!isValid()) {
      toast.error("Vul alle verplichte velden in");
      return;
    }
    setSaving(true);

    try {
      const record = {
        vehicle_id: vehicle.id,
        eigenaar_voornaam: form.voornaam,
        eigenaar_achternaam: form.achternaam,
        eigenaar_adres: form.adres,
        eigenaar_postcode: form.postcode,
        eigenaar_woonplaats: form.woonplaats,
        eigenaar_telefoon: form.telefoon,
        eigenaar_email: form.email,
        eigenaar_iban: form.iban,
        voertuig_merk: vehicle.merk,
        voertuig_model: vehicle.model,
        voertuig_bouwjaar: vehicle.bouwjaar,
        voertuig_kenteken: vehicle.kenteken,
        voertuig_kilometerstand: vehicle.kilometerstand,
        voertuig_vin: form.vin || null,
        voertuig_kleur: vehicle.kleur,
        voertuig_apk_tot: form.apkTot || null,
        vraagprijs: form.vraagprijs,
        minimumprijs: form.minimumprijs,
        commissie_percentage: effectiveCommissie,
        garantie: form.garantie,
        aangepast_commissie_percentage: form.garantie === "platin" ? form.aangepastCommissiePercentage : null,
        advertentiekosten: form.advertentiekosten,
        poetskosten: form.poetskosten,
        overige_kosten: form.overigeKosten,
        datum: form.datum,
        plaats: form.plaats,
        user_id: user?.id || null,
      } as any;

      let agreementId = existingAgreement?.id;
      if (existingAgreement) {
        await supabase.from("consignatie_overeenkomsten").update(record).eq("id", existingAgreement.id);
      } else {
        const { data: inserted } = await supabase.from("consignatie_overeenkomsten").insert(record).select("id").single();
        agreementId = inserted?.id;
      }

      // Generate PDF blob for storage
      const pdfData = { vehicle, form, effectiveCommissie };
      const pdfBlob = generateConsignatieOvereenkomstBlob(pdfData);

      // Upload to storage
      const storagePath = `consignatie/${vehicle.id}/${agreementId}.pdf`;
      await supabase.storage.from("vehicle-documents").upload(storagePath, pdfBlob, {
        contentType: "application/pdf",
        upsert: true,
      });

      // Update pdf_path on agreement
      if (agreementId) {
        await supabase.from("consignatie_overeenkomsten").update({ pdf_path: storagePath }).eq("id", agreementId);
      }

      // Save to document archive
      await supabase.from("document_archive").insert({
        document_type: "consignatieovereenkomst",
        kenteken: vehicle.kenteken || null,
        klant_naam: `${form.voornaam} ${form.achternaam}`,
        vehicle_id: vehicle.id,
        consignatie_overeenkomst_id: agreementId || null,
        file_path: storagePath,
        storage_bucket: "vehicle-documents",
      } as any);

      // Also download locally
      generateConsignatieOvereenkomstPDF(pdfData);

      toast.success("Overeenkomst opgeslagen en PDF gedownload");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Er ging iets mis");
    }
    setSaving(false);
  };

  if (!open) return null;

  const inputCls = "w-full px-2.5 py-1.5 text-sm bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-background border border-border rounded-lg w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-medium">Consignatieovereenkomst</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        {loadingExisting ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="px-5 py-4 space-y-5 max-h-[70vh] overflow-y-auto">
            {existingAgreement && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-accent/50 rounded-md border border-border">
                <AlertCircle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">Er bestaat al een overeenkomst voor dit voertuig. Wijzigingen worden overschreven.</p>
              </div>
            )}

            {/* Voertuiggegevens */}
            <Section title="Voertuiggegevens">
              <div className="grid grid-cols-2 gap-3">
                <ReadOnly label="Merk / Model" value={`${vehicle.merk} ${vehicle.model}`} />
                <ReadOnly label="Bouwjaar" value={String(vehicle.bouwjaar || "")} />
                <ReadOnly label="Kenteken" value={vehicle.kenteken || ""} />
                <ReadOnly label="KM-stand" value={`${vehicle.kilometerstand?.toLocaleString("nl-NL")} km`} />
                <ReadOnly label="Kleur" value={vehicle.kleur || ""} />
                <Field label="Chassisnummer (VIN)" value={form.vin} onChange={(v) => update("vin", v)} cls={inputCls} />
                <Field label="APK geldig tot" value={form.apkTot} onChange={(v) => update("apkTot", v)} cls={inputCls} placeholder="dd-mm-jjjj" />
              </div>
            </Section>

            {/* Eigenaar */}
            <Section title="Eigenaargegevens">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Voornaam *" value={form.voornaam} onChange={(v) => update("voornaam", v)} cls={inputCls} />
                <Field label="Achternaam *" value={form.achternaam} onChange={(v) => update("achternaam", v)} cls={inputCls} />
                <Field label="Adres *" value={form.adres} onChange={(v) => update("adres", v)} cls={inputCls} />
                <Field label="Postcode *" value={form.postcode} onChange={(v) => update("postcode", v)} cls={inputCls} />
                <Field label="Woonplaats *" value={form.woonplaats} onChange={(v) => update("woonplaats", v)} cls={inputCls} />
                <Field label="Telefoon *" value={form.telefoon} onChange={(v) => update("telefoon", v)} cls={inputCls} />
                <Field label="E-mailadres *" value={form.email} onChange={(v) => update("email", v)} cls={inputCls} />
                <Field label="IBAN *" value={form.iban} onChange={(v) => update("iban", v)} cls={inputCls} />
              </div>
            </Section>

            {/* Financieel */}
            <Section title="Financiële afspraken">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Vraagprijs (€) *" value={form.vraagprijs} onChange={(v) => update("vraagprijs", Number(v))} cls={inputCls} type="number" />
                <Field label="Minimumprijs (€) *" value={form.minimumprijs} onChange={(v) => update("minimumprijs", Number(v))} cls={inputCls} type="number" />
                <Field label="Commissie %" value={form.commissiePercentage} onChange={(v) => update("commissiePercentage", Number(v))} cls={inputCls} type="number" />
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Garantie</label>
                  <select value={form.garantie} onChange={(e) => update("garantie", e.target.value)} className={inputCls}>
                    <option value="geen">Geen garantie</option>
                    <option value="platin">Platin Automotive draagt garantie</option>
                    <option value="autotrust">AutoTrust garantiepakket</option>
                  </select>
                </div>
              </div>

              {form.garantie === "autotrust" && (
                <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-amber-500/10 rounded-md border border-amber-500/20">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-400">Kosten AutoTrust zijn voor rekening van eigenaar</p>
                </div>
              )}

              {form.garantie === "platin" && (
                <div className="mt-3">
                  <Field label="Aangepast commissiepercentage (%)" value={form.aangepastCommissiePercentage} onChange={(v) => update("aangepastCommissiePercentage", Number(v))} cls={inputCls} type="number" />
                </div>
              )}

              {form.vraagprijs > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="bg-secondary/50 border border-border rounded-md p-3">
                    <p className="text-xs text-muted-foreground mb-1">Commissie ({effectiveCommissie}%)</p>
                    <p className="text-base font-semibold text-emerald-500 tabular-nums">{formatEuroDecimal(form.vraagprijs * (effectiveCommissie / 100))}</p>
                  </div>
                  <div className="bg-secondary/50 border border-border rounded-md p-3">
                    <p className="text-xs text-muted-foreground mb-1">Uitbetaling eigenaar</p>
                    <p className="text-base font-semibold tabular-nums">{formatEuroDecimal(form.vraagprijs - form.vraagprijs * (effectiveCommissie / 100))}</p>
                  </div>
                </div>
              )}
            </Section>

            {/* Opzeggingskosten */}
            <Section title="Opzeggingskosten (indicatie)">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Advertentiekosten (€)" value={form.advertentiekosten} onChange={(v) => update("advertentiekosten", Number(v))} cls={inputCls} type="number" />
                <Field label="Poetskosten (€)" value={form.poetskosten} onChange={(v) => update("poetskosten", Number(v))} cls={inputCls} type="number" />
                <Field label="Overige kosten (€)" value={form.overigeKosten} onChange={(v) => update("overigeKosten", Number(v))} cls={inputCls} type="number" />
              </div>
            </Section>

            {/* Betaalwijze */}
            <Section title="Betaalwijze (Wwft)">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Betaalwijze *</label>
                <select value={form.betaalwijze} onChange={(e) => update("betaalwijze", e.target.value)} className={inputCls}>
                  <option value="bank">Volledig per bank</option>
                  <option value="contant">Volledig contant (max € 3.000)</option>
                  <option value="combinatie">Combinatie contant + bank</option>
                </select>
              </div>

              {form.betaalwijze === "contant" && form.vraagprijs > 3000 && (
                <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-destructive/10 rounded-md border border-destructive/30">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-destructive font-medium">
                    ⚠️ Contante betaling is wettelijk beperkt tot € 3.000. Kies voor een combinatie van contant en bankoverschrijving.
                  </p>
                </div>
              )}

              {form.betaalwijze === "combinatie" && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Contant bedrag (€) — max € 3.000</label>
                    <input type="number" value={form.contantBedrag} onChange={(e) => update("contantBedrag", Number(e.target.value))} className={inputCls} max={3000} />
                    {form.contantBedrag > 3000 && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Maximum € 3.000 contant toegestaan</p>
                    )}
                  </div>
                  <div className="bg-secondary/50 border border-border rounded-md p-3">
                    <p className="text-xs text-muted-foreground mb-1">Per bank</p>
                    <p className="text-base font-semibold tabular-nums">{formatEuroDecimal(bankBedrag > 0 ? bankBedrag : 0)}</p>
                  </div>
                </div>
              )}
            </Section>

            {/* Datum / Plaats */}
            <Section title="Overig">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Datum" value={form.datum} onChange={(v) => update("datum", v)} cls={inputCls} type="date" />
                <Field label="Plaats" value={form.plaats} onChange={(v) => update("plaats", v)} cls={inputCls} />
              </div>
            </Section>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">Annuleren</button>
          <button
            onClick={handleGenerate}
            disabled={saving || !isValid()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Genereer overeenkomst
          </button>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
    {children}
  </div>
);

const ReadOnly = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label className="block text-xs text-muted-foreground mb-1">{label}</label>
    <p className="px-2.5 py-1.5 text-sm bg-secondary/50 border border-border rounded-md text-foreground">{value || "—"}</p>
  </div>
);

const Field = ({ label, value, onChange, cls, type = "text", placeholder }: {
  label: string; value: any; onChange: (v: string) => void; cls: string; type?: string; placeholder?: string;
}) => (
  <div>
    <label className="block text-xs text-muted-foreground mb-1">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={cls} placeholder={placeholder} />
  </div>
);

export default ConsignatieOvereenkomstDialog;

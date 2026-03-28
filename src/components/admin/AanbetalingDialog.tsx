import { useState } from "react";
import { Vehicle, formatEuroDecimal } from "@/types/vehicle";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, X, Download } from "lucide-react";
import { generateAanbetalingPDF, generateAanbetalingBlob } from "@/lib/aanbetalingPdf";

interface Props {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  onStatusChange?: () => void;
}

type Betaalwijze = "bank" | "contant" | "combinatie";

interface FormData {
  voornaam: string;
  achternaam: string;
  adres: string;
  postcode: string;
  woonplaats: string;
  telefoon: string;
  email: string;
  vin: string;
  verkoopprijs: number;
  aanbetalingsbedrag: number;
  uiterlijkeDatum: string;
  datum: string;
  plaats: string;
  betaalwijze: Betaalwijze;
  contantBedrag: number;
}

const AanbetalingDialog = ({ open, onClose, vehicle, onStatusChange }: Props) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormData>({
    voornaam: "",
    achternaam: "",
    adres: "",
    postcode: "",
    woonplaats: "",
    telefoon: "",
    email: "",
    vin: "",
    verkoopprijs: vehicle.verkoopprijs || 0,
    aanbetalingsbedrag: 0,
    uiterlijkeDatum: "",
    datum: new Date().toISOString().split("T")[0],
    plaats: "Roelofarendsveen",
    betaalwijze: "bank",
    contantBedrag: 0,
  });

  const update = (key: keyof FormData, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const restbedrag = form.verkoopprijs - form.aanbetalingsbedrag;

  const contantTooHigh = (form.betaalwijze === "contant" && form.verkoopprijs > 3000) ||
    (form.betaalwijze === "combinatie" && form.contantBedrag > 3000);

  const bankBedrag = form.betaalwijze === "combinatie" ? form.verkoopprijs - form.contantBedrag : 0;

  const isValid = () =>
    form.voornaam.trim() &&
    form.achternaam.trim() &&
    form.adres.trim() &&
    form.postcode.trim() &&
    form.woonplaats.trim() &&
    form.telefoon.trim() &&
    form.email.trim() &&
    form.verkoopprijs > 0 &&
    form.aanbetalingsbedrag > 0 &&
    form.uiterlijkeDatum &&
    !contantTooHigh;

  const handleGenerate = async () => {
    if (!isValid()) {
      toast.error("Vul alle verplichte velden in");
      return;
    }
    setSaving(true);

    try {
      const record = {
        vehicle_id: vehicle.id,
        klant_voornaam: form.voornaam,
        klant_achternaam: form.achternaam,
        klant_adres: form.adres,
        klant_postcode: form.postcode,
        klant_woonplaats: form.woonplaats,
        klant_telefoon: form.telefoon,
        klant_email: form.email,
        voertuig_merk: vehicle.merk,
        voertuig_model: vehicle.model,
        voertuig_bouwjaar: vehicle.bouwjaar,
        voertuig_kenteken: vehicle.kenteken,
        voertuig_kilometerstand: vehicle.kilometerstand,
        voertuig_vin: form.vin || null,
        verkoopprijs: form.verkoopprijs,
        aanbetalingsbedrag: form.aanbetalingsbedrag,
        restbedrag,
        uiterlijke_datum: form.uiterlijkeDatum,
        datum: form.datum,
        plaats: form.plaats,
        user_id: user?.id || null,
      };

      const { data: inserted } = await supabase
        .from("aanbetalingen")
        .insert(record)
        .select("id")
        .single();

      const aanbetalingId = inserted?.id;

      // Generate PDF
      const pdfData = {
        voertuig: {
          merk: vehicle.merk,
          model: vehicle.model,
          bouwjaar: vehicle.bouwjaar,
          kenteken: vehicle.kenteken,
          kilometerstand: vehicle.kilometerstand,
          vin: form.vin,
        },
        klant: {
          voornaam: form.voornaam,
          achternaam: form.achternaam,
          adres: form.adres,
          postcode: form.postcode,
          woonplaats: form.woonplaats,
          telefoon: form.telefoon,
          email: form.email,
        },
        financieel: {
          verkoopprijs: form.verkoopprijs,
          aanbetalingsbedrag: form.aanbetalingsbedrag,
          restbedrag,
          uiterlijkeDatum: form.uiterlijkeDatum,
        },
        datum: form.datum,
        plaats: form.plaats,
      };

      const pdfBlob = generateAanbetalingBlob(pdfData);

      // Upload to storage
      const storagePath = `aanbetalingen/${vehicle.id}/${aanbetalingId}.pdf`;
      await supabase.storage.from("vehicle-documents").upload(storagePath, pdfBlob, {
        contentType: "application/pdf",
        upsert: true,
      });

      // Update pdf_path
      if (aanbetalingId) {
        await supabase.from("aanbetalingen").update({ pdf_path: storagePath }).eq("id", aanbetalingId);
      }

      // Save to document archive
      await supabase.from("document_archive").insert({
        document_type: "aanbetalingsovereenkomst",
        kenteken: vehicle.kenteken || null,
        klant_naam: `${form.voornaam} ${form.achternaam}`,
        vehicle_id: vehicle.id,
        file_path: storagePath,
        storage_bucket: "vehicle-documents",
      });

      // Update vehicle status to gereserveerd
      await supabase.from("vehicles").update({ status: "gereserveerd" }).eq("id", vehicle.id);

      // Download locally
      generateAanbetalingPDF(pdfData);

      toast.success("Aanbetaling geregistreerd, voertuig is nu gereserveerd");
      onStatusChange?.();
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-medium">Aanbetaling registreren</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 py-4 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Voertuiggegevens */}
          <Section title="Voertuiggegevens">
            <div className="grid grid-cols-2 gap-3">
              <ReadOnly label="Merk / Model" value={`${vehicle.merk} ${vehicle.model}`} />
              <ReadOnly label="Bouwjaar" value={String(vehicle.bouwjaar || "")} />
              <ReadOnly label="Kenteken" value={vehicle.kenteken || ""} />
              <ReadOnly label="KM-stand" value={`${vehicle.kilometerstand?.toLocaleString("nl-NL")} km`} />
              <Field label="Chassisnummer (VIN)" value={form.vin} onChange={(v) => update("vin", v)} cls={inputCls} />
            </div>
          </Section>

          {/* Klantgegevens */}
          <Section title="Klantgegevens">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Voornaam *" value={form.voornaam} onChange={(v) => update("voornaam", v)} cls={inputCls} />
              <Field label="Achternaam *" value={form.achternaam} onChange={(v) => update("achternaam", v)} cls={inputCls} />
              <Field label="Adres *" value={form.adres} onChange={(v) => update("adres", v)} cls={inputCls} />
              <Field label="Postcode *" value={form.postcode} onChange={(v) => update("postcode", v)} cls={inputCls} />
              <Field label="Woonplaats *" value={form.woonplaats} onChange={(v) => update("woonplaats", v)} cls={inputCls} />
              <Field label="Telefoon *" value={form.telefoon} onChange={(v) => update("telefoon", v)} cls={inputCls} />
              <Field label="E-mailadres *" value={form.email} onChange={(v) => update("email", v)} cls={inputCls} type="email" />
            </div>
          </Section>

          {/* Financieel */}
          <Section title="Financiële afspraken">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Totale verkoopprijs (€) *" value={form.verkoopprijs} onChange={(v) => update("verkoopprijs", Number(v))} cls={inputCls} type="number" />
              <Field label="Aanbetalingsbedrag (€) *" value={form.aanbetalingsbedrag} onChange={(v) => update("aanbetalingsbedrag", Number(v))} cls={inputCls} type="number" />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-secondary/50 border border-border rounded-md p-3">
                <p className="text-xs text-muted-foreground mb-1">Restbedrag</p>
                <p className="text-base font-semibold tabular-nums">{formatEuroDecimal(restbedrag)}</p>
              </div>
              <Field label="Uiterlijke datum restbetaling *" value={form.uiterlijkeDatum} onChange={(v) => update("uiterlijkeDatum", v)} cls={inputCls} type="date" />
            </div>

            <div className="mt-3 px-3 py-2.5 bg-secondary/50 rounded-md border border-border">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground font-medium">Annuleringsvoorwaarden:</strong> Bij annulering door koper vervalt de aanbetaling aan Platin Automotive als vergoeding voor gemaakte kosten en gederfde inkomsten.
              </p>
            </div>
          </Section>

          {/* Datum / Plaats */}
          <Section title="Overig">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Datum" value={form.datum} onChange={(v) => update("datum", v)} cls={inputCls} type="date" />
              <Field label="Plaats" value={form.plaats} onChange={(v) => update("plaats", v)} cls={inputCls} />
            </div>
          </Section>
        </div>

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

const Field = ({ label, value, onChange, cls, type = "text" }: {
  label: string; value: any; onChange: (v: string) => void; cls: string; type?: string;
}) => (
  <div>
    <label className="block text-xs text-muted-foreground mb-1">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
  </div>
);

export default AanbetalingDialog;

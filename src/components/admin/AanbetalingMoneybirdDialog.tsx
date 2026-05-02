import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMoneybird } from "@/hooks/useMoneybird";
import { Vehicle, formatEuroDecimal } from "@/types/vehicle";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const AANBETALING_WORKFLOW_ID = "486041642798679627";

interface Props {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  onCreated?: () => void;
}

const inputCls =
  "w-full px-4 py-3 text-sm bg-secondary/50 border border-border rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all";

const AanbetalingMoneybirdDialog = ({ open, onClose, vehicle, onCreated }: Props) => {
  const { invoke } = useMoneybird();
  const [saving, setSaving] = useState(false);
  const [voornaam, setVoornaam] = useState("");
  const [achternaam, setAchternaam] = useState("");
  const [email, setEmail] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [bedrag, setBedrag] = useState<number | "">("");
  const [notities, setNotities] = useState("");

  const isValid =
    !!voornaam.trim() &&
    !!achternaam.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    Number(bedrag) > 0;

  const handleSubmit = async () => {
    if (!isValid) {
      toast.error("Vul alle verplichte velden correct in");
      return;
    }
    setSaving(true);
    try {
      const workflow_id = AANBETALING_WORKFLOW_ID;

      const res = await invoke("create_aanbetaling_invoice", {
        voornaam,
        achternaam,
        email,
        telefoon,
        bedrag: Number(bedrag),
        workflow_id,
        vehicle: {
          merk: vehicle.merk,
          model: vehicle.model,
          bouwjaar: vehicle.bouwjaar,
          kenteken: vehicle.kenteken,
        },
      });

      const invoice = res?.invoice;
      const contact = res?.contact;
      if (!invoice?.id) throw new Error("Geen factuur ontvangen");

      await supabase.from("aanbetalingen").insert({
        vehicle_id: vehicle.id,
        klant_voornaam: voornaam,
        klant_achternaam: achternaam,
        klant_email: email,
        klant_telefoon: telefoon || "",
        voertuig_merk: vehicle.merk,
        voertuig_model: vehicle.model,
        voertuig_bouwjaar: vehicle.bouwjaar,
        voertuig_kenteken: vehicle.kenteken,
        voertuig_kilometerstand: vehicle.kilometerstand,
        verkoopprijs: vehicle.verkoopprijs,
        aanbetalingsbedrag: Number(bedrag),
        restbedrag: Math.max(0, (vehicle.verkoopprijs || 0) - Number(bedrag)),
        moneybird_invoice_id: String(invoice.id),
        moneybird_contact_id: contact?.id ? String(contact.id) : null,
        notities: notities || null,
        status: "open",
        bron: "moneybird",
      } as any);

      await supabase.from("vehicles").update({
        heeft_aanbetaling: true,
        aanbetalingsbedrag: Number(bedrag),
      } as any).eq("id", vehicle.id);

      await supabase.from("vehicle_activity_log").insert({
        vehicle_id: vehicle.id,
        actie_type: "aanbetaling_aangemaakt",
        beschrijving: `Aanbetalingsfactuur €${Number(bedrag).toFixed(0)} verstuurd naar ${email}`,
      } as any);

      toast.success(`Aanbetalingsfactuur verstuurd naar ${email}`);
      onCreated?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Aanmaken mislukt");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto admin-theme">
        <DialogHeader>
          <DialogTitle>Aanbetaling op afstand</DialogTitle>
          <DialogDescription>
            Verstuur een Moneybird-aanbetalingsfactuur naar de klant
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="px-4 py-3 bg-secondary/40 rounded-2xl border border-border text-xs text-muted-foreground">
            <strong className="text-foreground font-medium">Voertuig:</strong>{" "}
            {vehicle.merk} {vehicle.model} {vehicle.bouwjaar} — {vehicle.kenteken} —{" "}
            {formatEuroDecimal(vehicle.verkoopprijs)}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Voornaam *" value={voornaam} onChange={setVoornaam} />
            <Field label="Achternaam *" value={achternaam} onChange={setAchternaam} />
          </div>
          <Field label="E-mailadres *" value={email} onChange={setEmail} type="email" />
          <Field label="Telefoonnummer" value={telefoon} onChange={setTelefoon} />
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Aanbetalingsbedrag (€) *</label>
            <input
              type="number"
              min={1}
              value={bedrag}
              onChange={(e) => setBedrag(e.target.value === "" ? "" : Number(e.target.value))}
              className={inputCls}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Notities (intern)</label>
            <textarea
              value={notities}
              onChange={(e) => setNotities(e.target.value)}
              rows={3}
              className={inputCls}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-xl"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !isValid}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-emerald-500/30 text-emerald-400 rounded-xl hover:bg-emerald-500/10 active:scale-[0.97] transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Aanbetalingsfactuur aanmaken & versturen
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({
  label, value, onChange, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <div>
    <label className="block text-xs text-muted-foreground mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
    />
  </div>
);

export default AanbetalingMoneybirdDialog;

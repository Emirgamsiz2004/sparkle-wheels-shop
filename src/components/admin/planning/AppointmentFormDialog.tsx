import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Car, Phone, PackageCheck } from "lucide-react";
import { AppointmentType } from "@/hooks/useAppointments";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: { id: string; voornaam: string; achternaam: string }[];
  vehicles: { id: string; merk: string; model: string; kenteken: string | null }[];
  onSubmit: (data: any) => Promise<void>;
}

const typeOptions: { value: AppointmentType; label: string; icon: typeof Eye; color: string }[] = [
  { value: "bezichtiging", label: "Bezichtiging", icon: Eye, color: "border-blue-400/40 bg-blue-500/5 text-blue-300/80" },
  { value: "proefrit", label: "Proefrit", icon: Car, color: "border-emerald-400/40 bg-emerald-500/5 text-emerald-300/80" },
  { value: "terugbelafspraak", label: "Terugbelafspraak", icon: Phone, color: "border-amber-400/40 bg-amber-500/5 text-amber-300/80" },
  { value: "aflevering", label: "Aflevering", icon: PackageCheck, color: "border-violet-400/40 bg-violet-500/5 text-violet-300/80" },
];

const AppointmentFormDialog = ({ open, onOpenChange, customers, vehicles, onSubmit }: Props) => {
  const [step, setStep] = useState<"type" | "form">("type");
  const [type, setType] = useState<AppointmentType | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    datum: "",
    tijd: "10:00",
    customer_id: "",
    vehicle_id: "",
    medewerker: "",
    notities: "",
    onderwerp: "",
    betalingsstatus: "openstaand" as "volledig_betaald" | "openstaand",
  });

  const reset = () => {
    setStep("type");
    setType(null);
    setForm({ datum: "", tijd: "10:00", customer_id: "", vehicle_id: "", medewerker: "", notities: "", onderwerp: "", betalingsstatus: "openstaand" });
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSubmit = async () => {
    if (!type || !form.datum || !form.tijd) return;
    if (type === "terugbelafspraak" && !form.onderwerp) return;
    setSaving(true);
    try {
      const datum_tijd = new Date(`${form.datum}T${form.tijd}`).toISOString();
      await onSubmit({
        type,
        datum_tijd,
        customer_id: form.customer_id || null,
        vehicle_id: form.vehicle_id || null,
        medewerker: form.medewerker || null,
        notities: form.notities || null,
        onderwerp: type === "terugbelafspraak" ? form.onderwerp : null,
        betalingsstatus: type === "aflevering" ? form.betalingsstatus : null,
        voertuig_klaargemaakt: false,
        status: "gepland",
      });
      handleOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{step === "type" ? "Type afspraak kiezen" : `${typeOptions.find(t => t.value === type)?.label} plannen`}</DialogTitle>
        </DialogHeader>

        {step === "type" ? (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setType(opt.value); setStep("form"); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:scale-[1.02] ${opt.color}`}
              >
                <opt.icon className="w-6 h-6" />
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Datum *</Label>
                <Input type="date" value={form.datum} onChange={(e) => setForm({ ...form, datum: e.target.value })} />
              </div>
              <div>
                <Label>Tijdstip *</Label>
                <Input type="time" value={form.tijd} onChange={(e) => setForm({ ...form, tijd: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Klant</Label>
              <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecteer klant" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.voornaam} {c.achternaam}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Voertuig</Label>
              <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecteer voertuig" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.merk} {v.model} {v.kenteken ? `(${v.kenteken})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Medewerker</Label>
              <Input value={form.medewerker} onChange={(e) => setForm({ ...form, medewerker: e.target.value })} placeholder="Naam medewerker" />
            </div>

            {type === "terugbelafspraak" && (
              <div>
                <Label>Onderwerp *</Label>
                <Input value={form.onderwerp} onChange={(e) => setForm({ ...form, onderwerp: e.target.value })} placeholder="Onderwerp van het gesprek" />
              </div>
            )}

            {type === "aflevering" && (
              <div>
                <Label>Betalingsstatus</Label>
                <Select value={form.betalingsstatus} onValueChange={(v: any) => setForm({ ...form, betalingsstatus: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="volledig_betaald">Volledig betaald</SelectItem>
                    <SelectItem value="openstaand">Nog openstaand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Notities</Label>
              <Textarea value={form.notities} onChange={(e) => setForm({ ...form, notities: e.target.value })} placeholder="Eventuele opmerkingen" rows={3} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("type")}>Terug</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={saving || !form.datum}>
                {saving ? "Opslaan..." : "Afspraak plannen"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentFormDialog;

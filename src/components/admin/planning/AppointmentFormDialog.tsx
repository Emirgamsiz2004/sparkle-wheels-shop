import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Eye, Car, Phone, PackageCheck, CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AppointmentType } from "@/hooks/useAppointments";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: { id: string; voornaam: string; achternaam: string }[];
  vehicles: { id: string; merk: string; model: string; kenteken: string | null }[];
  onSubmit: (data: any) => Promise<void>;
  defaultType?: string;
}

const typeOptions: { value: AppointmentType; label: string; icon: typeof Eye; color: string }[] = [
  { value: "bezichtiging", label: "Bezichtiging", icon: Eye, color: "border-blue-400/40 bg-blue-500/5 text-blue-300/80" },
  { value: "proefrit", label: "Proefrit", icon: Car, color: "border-emerald-400/40 bg-emerald-500/5 text-emerald-300/80" },
  { value: "terugbelafspraak", label: "Terugbelafspraak", icon: Phone, color: "border-amber-400/40 bg-amber-500/5 text-amber-300/80" },
  { value: "aflevering", label: "Aflevering", icon: PackageCheck, color: "border-violet-400/40 bg-violet-500/5 text-violet-300/80" },
];

const timeSlots = Array.from({ length: 20 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

const AppointmentFormDialog = ({ open, onOpenChange, customers, vehicles, onSubmit, defaultType }: Props) => {
  const [step, setStep] = useState<"type" | "form">(defaultType ? "form" : "type");
  const [type, setType] = useState<AppointmentType | null>(defaultType as AppointmentType || null);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [form, setForm] = useState({
    tijd: "10:00",
    klant_naam: "",
    vehicle_id: "",
    notities: "",
    onderwerp: "",
    betalingsstatus: "openstaand" as "volledig_betaald" | "openstaand",
  });

  useEffect(() => {
    if (open && defaultType) {
      setType(defaultType as AppointmentType);
      setStep("form");
    }
  }, [open, defaultType]);

  const reset = () => {
    setStep("type");
    setType(null);
    setSelectedDate(undefined);
    setVehicleSearch("");
    setForm({ tijd: "10:00", klant_naam: "", vehicle_id: "", notities: "", onderwerp: "", betalingsstatus: "openstaand" });
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const filteredVehicles = useMemo(() => {
    if (!vehicleSearch) return vehicles;
    const q = vehicleSearch.toLowerCase().replace(/[-\s]/g, "");
    return vehicles.filter(v =>
      `${v.merk} ${v.model}`.toLowerCase().includes(q) ||
      (v.kenteken || "").toLowerCase().replace(/[-\s]/g, "").includes(q)
    );
  }, [vehicles, vehicleSearch]);

  const handleSubmit = async () => {
    if (!type || !selectedDate || !form.tijd) return;
    if (type === "terugbelafspraak" && !form.onderwerp) return;
    setSaving(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const datum_tijd = new Date(`${dateStr}T${form.tijd}`).toISOString();
      await onSubmit({
        type,
        datum_tijd,
        customer_id: null,
        vehicle_id: form.vehicle_id || null,
        medewerker: null,
        notities: [form.klant_naam ? `Klant: ${form.klant_naam}` : "", form.notities].filter(Boolean).join("\n") || null,
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
      <DialogContent className="sm:max-w-[500px] rounded-[3px] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {step === "type" ? "Type afspraak kiezen" : `${typeOptions.find(t => t.value === type)?.label} plannen`}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "type" ? (
            <motion.div
              key="type-step"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 gap-3 pt-2"
            >
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setType(opt.value); setStep("form"); }}
                  className={`flex flex-col items-center gap-2 p-5 rounded-[3px] border transition-all duration-200 hover:brightness-125 ${opt.color}`}
                >
                  <opt.icon className="w-5 h-5 opacity-80" />
                  <span className="text-sm font-body tracking-wide">{opt.label}</span>
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="form-step"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 pt-2"
            >
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Datum *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal rounded-[3px] h-10",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-60" />
                        {selectedDate ? format(selectedDate, "d MMM yyyy", { locale: nl }) : "Kies datum"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-[3px]" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        locale={nl}
                        className="p-3 pointer-events-auto"
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Tijdstip *</Label>
                  <Select value={form.tijd} onValueChange={(v) => setForm({ ...form, tijd: v })}>
                    <SelectTrigger className="rounded-[3px] h-10">
                      <Clock className="mr-2 h-4 w-4 opacity-60" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-[3px] max-h-[240px]">
                      {timeSlots.map((t) => (
                        <SelectItem key={t} value={t} className="rounded-[3px]">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Klant naam (optioneel) */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Klant naam <span className="opacity-50">(optioneel)</span></Label>
                <Input
                  value={form.klant_naam}
                  onChange={(e) => setForm({ ...form, klant_naam: e.target.value })}
                  placeholder="Naam van de klant"
                  className="rounded-[3px] h-10"
                />
              </div>

              {/* Voertuig */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Voertuig</Label>
                <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
                  <SelectTrigger className="rounded-[3px] h-10">
                    <SelectValue placeholder="Selecteer voertuig" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[3px] max-h-[240px]">
                    <div className="px-2 pb-2 pt-1">
                      <Input
                        placeholder="Zoek op merk, model of kenteken..."
                        value={vehicleSearch}
                        onChange={(e) => setVehicleSearch(e.target.value)}
                        className="rounded-[3px] h-8 text-xs"
                      />
                    </div>
                    {filteredVehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id} className="rounded-[3px]">
                        {v.merk} {v.model} {v.kenteken ? `(${v.kenteken})` : ""}
                      </SelectItem>
                    ))}
                    {filteredVehicles.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-3">Geen voertuigen gevonden</p>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Terugbelafspraak: onderwerp */}
              <AnimatePresence>
                {type === "terugbelafspraak" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Onderwerp *</Label>
                    <Input
                      value={form.onderwerp}
                      onChange={(e) => setForm({ ...form, onderwerp: e.target.value })}
                      placeholder="Onderwerp van het gesprek"
                      className="rounded-[3px] h-10"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Aflevering: betalingsstatus */}
              <AnimatePresence>
                {type === "aflevering" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Betalingsstatus</Label>
                    <Select value={form.betalingsstatus} onValueChange={(v: any) => setForm({ ...form, betalingsstatus: v })}>
                      <SelectTrigger className="rounded-[3px] h-10"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-[3px]">
                        <SelectItem value="volledig_betaald" className="rounded-[3px]">Volledig betaald</SelectItem>
                        <SelectItem value="openstaand" className="rounded-[3px]">Nog openstaand</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Notities */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Notities <span className="opacity-50">(optioneel)</span></Label>
                <Textarea
                  value={form.notities}
                  onChange={(e) => setForm({ ...form, notities: e.target.value })}
                  placeholder="Eventuele opmerkingen"
                  rows={2}
                  className="rounded-[3px]"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 rounded-[3px]" onClick={() => setStep("type")}>Terug</Button>
                <Button className="flex-1 rounded-[3px]" onClick={handleSubmit} disabled={saving || !selectedDate}>
                  {saving ? "Opslaan..." : "Afspraak plannen"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentFormDialog;

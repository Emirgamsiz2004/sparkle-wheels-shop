import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Eye, Car, PackageCheck, CalendarIcon, Clock, Wrench, Truck, MoreHorizontal, ArrowLeft, X, Mail } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AppointmentType, typeColors, typeLabels } from "@/hooks/useAppointments";
import { motion, AnimatePresence } from "framer-motion";
import { sendAppointmentConfirmation } from "@/lib/sendAppointmentConfirmation";

interface CustomerOption {
  id: string;
  voornaam: string;
  achternaam: string;
  telefoon?: string;
  email?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: CustomerOption[];
  vehicles: { id: string; merk: string; model: string; kenteken: string | null; status?: string }[];
  allVehicles?: { id: string; merk: string; model: string; kenteken: string | null; status?: string }[];
  onSubmit: (data: any) => Promise<string | null | void>;
  defaultType?: string;
  defaultVehicleId?: string;
  anchorRect?: DOMRect | null;
}

const typeOptions: { value: AppointmentType; label: string; icon: typeof Eye }[] = [
  { value: "bezichtiging", label: "Bezichtiging", icon: Eye },
  { value: "proefrit", label: "Proefrit", icon: Car },
  { value: "ophalen", label: "Ophalen", icon: Truck },
  { value: "aflevering", label: "Aflevering", icon: PackageCheck },
  { value: "onderhoud", label: "Onderhoud / reparatie", icon: Wrench },
  { value: "anders", label: "Anders", icon: MoreHorizontal },
];

const timeSlots = Array.from({ length: 20 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

const defaultDuurMinuten: Record<string, number> = {
  bezichtiging: 30,
  proefrit: 60,
  ophalen: 30,
  aflevering: 60,
  onderhoud: 120,
  terugbelafspraak: 15,
  anders: 60,
  poetsbeurt: 120,
};

const AppointmentFormDialog = ({ open, onOpenChange, customers, vehicles, allVehicles, onSubmit, defaultType, defaultVehicleId, anchorRect }: Props) => {
  const [step, setStep] = useState<"type" | "form">(defaultType ? "form" : "type");
  const [type, setType] = useState<AppointmentType | null>((defaultType as AppointmentType) || null);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const customerWrapRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    tijd: "10:00",
    klant_naam: "",
    klant_telefoon: "",
    klant_email: "",
    vehicle_id: defaultVehicleId || "",
    notities: "",
    onderwerp: "",
    betalingsstatus: "openstaand" as "volledig_betaald" | "openstaand",
    duur_minuten: 60,
    stuur_bevestigingsmail: false,
  });

  const selectedCustomerEmail = useMemo(() => {
    if (!selectedCustomerId) return "";
    return customers.find((c) => c.id === selectedCustomerId)?.email || "";
  }, [selectedCustomerId, customers]);

  const effectiveEmail = (selectedCustomerEmail || form.klant_email || "").trim();

  // Update default duur on type change
  useEffect(() => {
    if (!type) return;
    setForm((f) => ({ ...f, duur_minuten: defaultDuurMinuten[type] || 60 }));
  }, [type]);

  // Toggle: standaard aan zodra er een e-mailadres beschikbaar is
  useEffect(() => {
    setForm((f) => ({ ...f, stuur_bevestigingsmail: Boolean(effectiveEmail) }));
  }, [effectiveEmail]);

  useEffect(() => {
    if (open && defaultType) {
      setType(defaultType as AppointmentType);
      setStep("form");
    }
  }, [open, defaultType]);

  useEffect(() => {
    if (open && defaultVehicleId) {
      setForm((f) => ({ ...f, vehicle_id: defaultVehicleId }));
    }
  }, [open, defaultVehicleId]);

  // close customer dropdown on outside click
  useEffect(() => {
    if (!customerOpen) return;
    const onDown = (e: MouseEvent) => {
      if (customerWrapRef.current && !customerWrapRef.current.contains(e.target as Node)) setCustomerOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [customerOpen]);

  const reset = () => {
    setStep("type");
    setType(null);
    setSelectedDate(undefined);
    setVehicleSearch("");
    setCustomerSearch("");
    setSelectedCustomerId(null);
    setCustomerOpen(false);
    setForm({ tijd: "10:00", klant_naam: "", klant_telefoon: "", vehicle_id: "", notities: "", onderwerp: "", betalingsstatus: "openstaand" });
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const vehicleList = type === "aflevering" && allVehicles ? allVehicles : vehicles;
  const filteredVehicles = useMemo(() => {
    if (!vehicleSearch) return vehicleList;
    const q = vehicleSearch.toLowerCase().replace(/[-\s]/g, "");
    return vehicleList.filter(v =>
      `${v.merk} ${v.model}`.toLowerCase().includes(q) ||
      (v.kenteken || "").toLowerCase().replace(/[-\s]/g, "").includes(q)
    );
  }, [vehicleList, vehicleSearch]);

  const filteredCustomers = useMemo(() => {
    const q = (customerSearch || form.klant_naam).trim().toLowerCase();
    if (!q) return [];
    return customers
      .filter((c) => `${c.voornaam} ${c.achternaam}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [customers, customerSearch, form.klant_naam]);

  const pickCustomer = (c: CustomerOption) => {
    setSelectedCustomerId(c.id);
    setForm((f) => ({
      ...f,
      klant_naam: `${c.voornaam} ${c.achternaam}`.trim(),
      klant_telefoon: c.telefoon || f.klant_telefoon,
    }));
    setCustomerSearch("");
    setCustomerOpen(false);
  };

  const handleSubmit = async () => {
    if (!type || !selectedDate || !form.tijd) return;
    if (type === "terugbelafspraak" && !form.onderwerp) return;
    setSaving(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const datum_tijd = new Date(`${dateStr}T${form.tijd}`).toISOString();
      const noteParts = [
        !selectedCustomerId && form.klant_naam ? `Klant: ${form.klant_naam}` : "",
        !selectedCustomerId && form.klant_telefoon ? `Tel: ${form.klant_telefoon}` : "",
        form.notities,
      ].filter(Boolean);
      await onSubmit({
        type,
        datum_tijd,
        eind_datum_tijd: null,
        customer_id: selectedCustomerId,
        vehicle_id: form.vehicle_id || null,
        medewerker: null,
        notities: noteParts.join("\n") || null,
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

  // Popover positioning + outside-click + ESC
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleOpenChange(false); };
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (containerRef.current && containerRef.current.contains(target)) return;
      // Ignore clicks inside Radix portals (Popover/Select/Calendar rendered outside our container)
      const el = target as HTMLElement;
      if (el.closest && el.closest('[data-radix-popper-content-wrapper], [data-radix-popover-content], [data-radix-select-content], [role="listbox"], [role="dialog"]')) return;
      handleOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => document.addEventListener("mousedown", onDown), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
      document.removeEventListener("mousedown", onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useLayoutEffect(() => {
    if (!open || isMobile || !anchorRect) { setPos(null); return; }
    const W = 360;
    const margin = 8;
    const vw = window.innerWidth;
    let left = anchorRect.right - W;
    if (left < margin) left = margin;
    if (left + W > vw - margin) left = vw - W - margin;
    const top = anchorRect.bottom + 6;
    setPos({ top, left });
  }, [open, isMobile, anchorRect]);

  // Auto-resize textarea (notities)
  const notitiesRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = notitiesRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [form.notities, open]);

  if (!open) return null;

  const containerClass = isMobile
    ? "fixed left-0 right-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto border-t border-x border-white/[0.08] bg-[hsl(0_0%_8%)] shadow-[0_-8px_32px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300"
    : "fixed z-50 w-[360px] max-h-[85vh] overflow-y-auto border border-white/[0.08] bg-[hsl(0_0%_8%)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-in fade-in-0 zoom-in-[0.97] duration-200 transition-[height] ease-out";

  const containerStyle: React.CSSProperties = isMobile
    ? { borderRadius: "20px 20px 0 0", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)", willChange: "transform" }
    : { borderRadius: 16, willChange: "transform", ...(pos ? { top: pos.top, left: pos.left } : { top: -9999, left: -9999 }) };

  return createPortal(
    <div ref={containerRef} className={containerClass} style={containerStyle} role="dialog" aria-label="Nieuwe afspraak">
      {isMobile && (
        <div className="pt-2 pb-1 flex justify-center">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>
      )}
      <button
        onClick={() => handleOpenChange(false)}
        className="absolute top-3 right-3 z-10 h-7 w-7 inline-flex items-center justify-center rounded-full text-muted-foreground/70 hover:text-foreground hover:bg-accent/40 transition-colors"
        aria-label="Sluiten"
      >
        <X className="w-4 h-4" />
      </button>
      <div style={{ padding: 18 }}>
        <motion.div layout transition={{ duration: 0.25, ease: "easeOut" }}>
        <AnimatePresence mode="wait" initial={false}>
          {step === "type" ? (
            <motion.div
              key="type-step"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
            >
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground px-1 mb-2">
                Wat voor afspraak?
              </div>
              <ul className="flex flex-col">
                {typeOptions.map((opt) => (
                  <li key={opt.value}>
                    <button
                      onClick={() => { setType(opt.value); setStep("form"); }}
                      className="w-full flex items-center gap-3 rounded-[8px] px-2.5 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-[rgba(255,255,255,0.08)]"
                    >
                      <opt.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>{opt.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          ) : (
            <motion.div
              key="form-step"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              {/* Header — back arrow + type badge */}
              {type && (
                <button
                  type="button"
                  onClick={() => setStep("type")}
                  className="inline-flex items-center gap-1.5 group mb-1"
                  title="Wijzig type"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <Badge className={`${typeColors[type]} border text-[11px] cursor-pointer`}>
                    {typeLabels[type]}
                  </Badge>
                </button>
              )}

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
                        <span className="flex items-center gap-2">
                          {v.merk} {v.model} {v.kenteken ? `(${v.kenteken})` : ""}
                          {v.status === "verkocht" && <span className="text-[9px] px-1.5 py-0.5 bg-muted rounded-[2px] text-muted-foreground">Verkocht</span>}
                          {v.status === "gereserveerd" && <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/15 rounded-[2px] text-amber-400">Gereserveerd</span>}
                        </span>
                      </SelectItem>
                    ))}
                    {filteredVehicles.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-3">Geen voertuigen gevonden</p>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Klant naam met autocomplete */}
              <div ref={customerWrapRef} className="relative">
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Klant naam {selectedCustomerId && <span className="text-emerald-400 ml-1">· bestaande klant</span>}
                </Label>
                <Input
                  value={form.klant_naam}
                  onChange={(e) => {
                    setForm({ ...form, klant_naam: e.target.value });
                    setSelectedCustomerId(null);
                    setCustomerSearch(e.target.value);
                    setCustomerOpen(true);
                  }}
                  onFocus={() => setCustomerOpen(true)}
                  placeholder="Begin met typen om te zoeken..."
                  className="rounded-[3px] h-10"
                  autoComplete="off"
                />
                {customerOpen && filteredCustomers.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 rounded-[3px] border border-border bg-popover shadow-md max-h-[200px] overflow-y-auto">
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => pickCustomer(c)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent/40 transition-colors flex items-center justify-between gap-2"
                      >
                        <span>{c.voornaam} {c.achternaam}</span>
                        {c.telefoon && <span className="text-xs text-muted-foreground">{c.telefoon}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Telefoonnummer */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Telefoonnummer <span className="opacity-50">(optioneel)</span></Label>
                <Input
                  value={form.klant_telefoon}
                  onChange={(e) => setForm({ ...form, klant_telefoon: e.target.value })}
                  placeholder="06 12345678"
                  type="tel"
                  className="rounded-[3px] h-10"
                />
              </div>

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

              {/* Notities — autosize */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Notities <span className="opacity-50">(optioneel)</span></Label>
                <Textarea
                  ref={notitiesRef}
                  value={form.notities}
                  onChange={(e) => setForm({ ...form, notities: e.target.value })}
                  placeholder="Eventuele opmerkingen"
                  rows={2}
                  className="rounded-[3px] resize-none overflow-hidden min-h-[60px] transition-[height] duration-150"
                />
              </div>

              {/* Submit */}
              <div className="pt-1">
                <Button
                  variant="outline"
                  className="w-full rounded-[3px]"
                  onClick={handleSubmit}
                  disabled={saving || !selectedDate}
                >
                  {saving ? "Opslaan..." : "Inplannen"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
      </div>
    </div>,
    document.body
  );
};

export default AppointmentFormDialog;

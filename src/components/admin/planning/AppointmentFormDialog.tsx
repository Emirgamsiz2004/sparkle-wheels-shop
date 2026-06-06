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
import {
  Eye, Car, PackageCheck, CalendarIcon, Clock, Wrench, Truck, MoreHorizontal,
  ArrowLeft, X, Mail, Sparkles, MapPin, Plus, Trash2, ListChecks,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AppointmentType, typeColors, typeLabels } from "@/hooks/useAppointments";
import { motion, AnimatePresence } from "framer-motion";
import { sendAppointmentConfirmation } from "@/lib/sendAppointmentConfirmation";
import { useDiensten, dienstCategorieLabels, DienstCategorie } from "@/hooks/useDiensten";
import AddressAutocomplete from "@/components/admin/AddressAutocomplete";
import { supabase } from "@/integrations/supabase/client";

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
  { value: "poetsbeurt", label: "Poetsbeurt", icon: Sparkles },
  { value: "anders", label: "Anders", icon: MoreHorizontal },
];

// 15-min slots 08:00–20:00
const timeSlots = Array.from({ length: ((20 - 8) * 4) + 1 }, (_, i) => {
  const total = 8 * 60 + i * 15;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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

// Helper: berekent eindtijd vanuit begintijd + minuten
const addMinutesToTime = (time: string, minutes: number): string => {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

const formatDuur = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h} uur ${m} min`;
  if (h) return `${h} uur`;
  return `${m} min`;
};

// Welke types vragen om voertuig uit voorraad?
const requiresVoorraadVehicle = (t: AppointmentType | null) =>
  t === "bezichtiging" || t === "proefrit" || t === "ophalen" || t === "aflevering";

// Welke types vragen om diensten? Alleen werk-gerelateerde types.
const showsDiensten = (t: AppointmentType | null) =>
  t === "onderhoud" || t === "poetsbeurt" || t === "anders";

// Bij welke types is dienst verplicht?
const requiresDiensten = (t: AppointmentType | null) =>
  t === "onderhoud" || t === "poetsbeurt" || t === "anders";

// Adres veld?
const showsAdres = (t: AppointmentType | null) => t === "ophalen" || t === "aflevering";

// Vrij voertuig (kenteken + omschrijving)?
const showsVrijVoertuig = (t: AppointmentType | null) =>
  t === "onderhoud" || t === "poetsbeurt" || t === "anders";

// Werkzaamheden veld?
const showsWerkzaamheden = (t: AppointmentType | null) =>
  t === "onderhoud" || t === "poetsbeurt" || t === "anders";

const AppointmentFormDialog = ({ open, onOpenChange, customers, vehicles, allVehicles, onSubmit, defaultType, defaultVehicleId, anchorRect }: Props) => {
  const [step, setStep] = useState<"type" | "form">(defaultType ? "form" : "type");
  const [type, setType] = useState<AppointmentType | null>((defaultType as AppointmentType) || null);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [klantMode, setKlantMode] = useState<"bestaand" | "nieuw">("bestaand");
  const [bewaarAlsKlant, setBewaarAlsKlant] = useState(false);
  const customerWrapRef = useRef<HTMLDivElement>(null);
  const { diensten } = useDiensten();

  const [selectedDiensten, setSelectedDiensten] = useState<string[]>([]);
  const [andersNotitie, setAndersNotitie] = useState("");
  const [eindtijdManueel, setEindtijdManueel] = useState(false);
  const [checklist, setChecklist] = useState<string[]>([]);
  const [checklistInput, setChecklistInput] = useState("");

  const [form, setForm] = useState({
    tijd: "10:00",
    eindtijd: "11:00",
    klant_naam: "",
    klant_telefoon: "",
    klant_email: "",
    vehicle_id: defaultVehicleId || "",
    notities: "",
    onderwerp: "",
    werkzaamheden: "",
    adres: "",
    voertuig_klant_kenteken: "",
    voertuig_klant_omschrijving: "",
    betalingsstatus: "openstaand" as "volledig_betaald" | "openstaand",
    duur_minuten: 60,
    stuur_bevestigingsmail: false,
  });

  const selectedCustomer = useMemo(
    () => (selectedCustomerId ? customers.find((c) => c.id === selectedCustomerId) : null),
    [selectedCustomerId, customers]
  );
  const selectedCustomerEmail = selectedCustomer?.email || "";
  const effectiveEmail = (selectedCustomerEmail || form.klant_email || "").trim();
  const effectiveNaam = selectedCustomer
    ? `${selectedCustomer.voornaam} ${selectedCustomer.achternaam}`.trim()
    : form.klant_naam.trim();

  // Bereken totale duur diensten
  const dienstenDuur = useMemo(() => {
    return selectedDiensten.reduce((sum, id) => {
      const d = diensten.find((x) => x.id === id);
      return sum + (d?.duur_minuten || 0);
    }, 0);
  }, [selectedDiensten, diensten]);

  // Eindtijd auto-bijwerken
  useEffect(() => {
    if (eindtijdManueel) return;
    const duur = dienstenDuur > 0 ? dienstenDuur : (defaultDuurMinuten[type || ""] || 60);
    setForm((f) => ({ ...f, eindtijd: addMinutesToTime(f.tijd, duur), duur_minuten: duur }));
  }, [form.tijd, dienstenDuur, type, eindtijdManueel]);

  // Bevestigingsmail standaard uit – gebruiker moet bewust aanvinken


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
    setKlantMode("bestaand");
    setBewaarAlsKlant(false);
    setSelectedDiensten([]);
    setAndersNotitie("");
    setEindtijdManueel(false);
    setChecklist([]);
    setChecklistInput("");
    setForm({
      tijd: "10:00", eindtijd: "11:00", klant_naam: "", klant_telefoon: "", klant_email: "",
      vehicle_id: "", notities: "", onderwerp: "", werkzaamheden: "", adres: "",
      voertuig_klant_kenteken: "", voertuig_klant_omschrijving: "",
      betalingsstatus: "openstaand", duur_minuten: 60, stuur_bevestigingsmail: false,
    });
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const vehicleList = type === "aflevering" || type === "ophalen"
    ? (allVehicles || vehicles)
    : (allVehicles || vehicles || []).filter((v) => v.status !== "verkocht");

  const filteredVehicles = useMemo(() => {
    if (!vehicleSearch) return vehicleList;
    const q = vehicleSearch.toLowerCase().replace(/[-\s]/g, "");
    return vehicleList.filter(v =>
      `${v.merk} ${v.model}`.toLowerCase().includes(q) ||
      (v.kenteken || "").toLowerCase().replace(/[-\s]/g, "").includes(q)
    );
  }, [vehicleList, vehicleSearch]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers.slice(0, 6);
    return customers
      .filter((c) =>
        `${c.voornaam} ${c.achternaam}`.toLowerCase().includes(q) ||
        (c.telefoon || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [customers, customerSearch]);

  const pickCustomer = (c: CustomerOption) => {
    setSelectedCustomerId(c.id);
    setCustomerSearch("");
    setCustomerOpen(false);
  };

  const toggleDienst = (id: string) => {
    setSelectedDiensten((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  // Groepeer diensten per categorie
  const dienstenPerCategorie = useMemo(() => {
    const result: Record<DienstCategorie, typeof diensten> = {
      detailing: [], onderhoud: [], reparatie: [], overig: [],
    };
    diensten.forEach((d) => {
      const c = (d.categorie as DienstCategorie) in result ? d.categorie as DienstCategorie : "overig";
      result[c].push(d);
    });
    return result;
  }, [diensten]);

  // Welke categorieën tonen we per afspraaktype?
  const visibleDienstCategorieen: DienstCategorie[] = useMemo(() => {
    if (type === "onderhoud") return ["onderhoud", "reparatie", "overig"];
    if (type === "poetsbeurt") return ["detailing", "overig"];
    if (type === "bezichtiging" || type === "proefrit") return ["detailing", "overig"];
    return ["detailing", "onderhoud", "reparatie", "overig"];
  }, [type]);

  // "Anders" dienst geselecteerd?
  const andersDienstId = useMemo(() => diensten.find((d) => d.naam === "Anders")?.id, [diensten]);
  const andersGeselecteerd = andersDienstId ? selectedDiensten.includes(andersDienstId) : false;

  const handleSubmit = async () => {
    if (!type || !selectedDate || !form.tijd) return;

    // Validaties
    if (requiresDiensten(type) && selectedDiensten.length === 0) {
      return;
    }
    if (requiresVoorraadVehicle(type) && !form.vehicle_id) {
      return;
    }
    if (!effectiveNaam) return;

    setSaving(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const datum_tijd = new Date(`${dateStr}T${form.tijd}`).toISOString();
      const eindStr = form.eindtijd || addMinutesToTime(form.tijd, form.duur_minuten);
      const eind_datum_tijd = new Date(`${dateStr}T${eindStr}`).toISOString();
      const duur = Math.max(5, Math.round((new Date(eind_datum_tijd).getTime() - new Date(datum_tijd).getTime()) / 60000));

      // Optioneel: nieuwe klant opslaan
      let customerIdToUse = selectedCustomerId;
      if (!customerIdToUse && klantMode === "nieuw" && bewaarAlsKlant && form.klant_naam.trim()) {
        const parts = form.klant_naam.trim().split(/\s+/);
        const voornaam = parts[0];
        const achternaam = parts.slice(1).join(" ") || "—";
        const { data: newCust, error: custErr } = await supabase
          .from("customers")
          .insert({
            voornaam, achternaam,
            email: form.klant_email || `${voornaam.toLowerCase()}.${Date.now()}@onbekend.nl`,
            telefoon: form.klant_telefoon || "",
            status: "prospect",
            bron: "afspraak",
          } as any)

          .select("id")
          .maybeSingle();
        if (!custErr && newCust?.id) customerIdToUse = newCust.id;
      }

      const dienstenNamen = selectedDiensten
        .map((id) => diensten.find((d) => d.id === id)?.naam)
        .filter(Boolean) as string[];

      const noteParts = [
        showsAdres(type) && form.adres ? `Adres: ${form.adres}` : "",
        form.notities,
      ].filter(Boolean);

      const result = await onSubmit({
        type,
        datum_tijd,
        eind_datum_tijd,
        customer_id: customerIdToUse,
        vehicle_id: form.vehicle_id || null,
        medewerker: null,
        notities: noteParts.join("\n") || null,
        onderwerp: type === "terugbelafspraak" ? form.onderwerp : null,
        betalingsstatus: type === "aflevering" ? form.betalingsstatus : null,
        voertuig_klaargemaakt: false,
        status: "gepland",
        klant_email: effectiveEmail || null,
        duur_minuten: duur,
        // Nieuwe velden
        diensten: dienstenNamen,
        diensten_notitie: andersGeselecteerd && andersNotitie.trim() ? andersNotitie.trim() : null,
        geschatte_duur_minuten: dienstenDuur || null,
        voertuig_klant_kenteken: showsVrijVoertuig(type) && form.voertuig_klant_kenteken ? form.voertuig_klant_kenteken : null,
        voertuig_klant_omschrijving: showsVrijVoertuig(type) && form.voertuig_klant_omschrijving ? form.voertuig_klant_omschrijving : null,
        werkzaamheden_omschrijving: showsWerkzaamheden(type) && form.werkzaamheden ? form.werkzaamheden : null,
        klant_naam_los: !customerIdToUse && form.klant_naam ? form.klant_naam : null,
        klant_telefoon_los: !customerIdToUse && form.klant_telefoon ? form.klant_telefoon : null,
        klant_email_los: !customerIdToUse && form.klant_email ? form.klant_email : null,
      });

      const newId = typeof result === "string" ? result : null;
      if (newId && form.stuur_bevestigingsmail && effectiveEmail) {
        const voornaam = selectedCustomer?.voornaam || form.klant_naam.split(" ")[0] || "";
        const veh = (form.vehicle_id ? vehicleList.find((v) => v.id === form.vehicle_id) : null) || null;
        await sendAppointmentConfirmation({
          appointmentId: newId,
          recipientEmail: effectiveEmail,
          voornaam,
          type,
          datumTijd: datum_tijd,
          eindDatumTijd: eind_datum_tijd,
          duurMinuten: duur,
          voertuig: veh ? { merk: veh.merk, model: veh.model, kenteken: veh.kenteken } : null,
          omschrijving: form.werkzaamheden || form.notities,
        });
      }

      handleOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  // Popover positioning
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Sluit alleen op Escape of via het kruisje — NIET op outside-click,
  // zodat per ongeluk klikken naast de popover de invoer niet verloren gaat.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleOpenChange(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useLayoutEffect(() => {
    if (!open || isMobile || !anchorRect) { setPos(null); return; }
    const W = 420;
    const margin = 8;
    const vw = window.innerWidth;
    let left = anchorRect.right - W;
    if (left < margin) left = margin;
    if (left + W > vw - margin) left = vw - W - margin;
    const top = anchorRect.bottom + 6;
    setPos({ top, left });
  }, [open, isMobile, anchorRect]);

  if (!open) return null;

  const containerClass = isMobile
    ? "fixed left-0 right-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto border-t border-x border-white/[0.08] bg-[hsl(0_0%_8%)] shadow-[0_-8px_32px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300"
    : "fixed z-50 w-[420px] max-h-[85vh] overflow-y-auto border border-white/[0.08] bg-[hsl(0_0%_8%)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-in fade-in-0 zoom-in-[0.97] duration-200";

  const containerStyle: React.CSSProperties = isMobile
    ? { borderRadius: "20px 20px 0 0", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }
    : { borderRadius: 16, ...(pos ? { top: pos.top, left: pos.left } : { top: -9999, left: -9999 }) };

  // ---------- JSX helpers ----------
  const PillButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 text-[11px] rounded-[3px] border transition-all",
        active
          ? "bg-foreground/10 border-foreground/40 text-foreground"
          : "bg-transparent border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
      )}
    >
      {children}
    </button>
  );

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
                {/* Header */}
                {type && (
                  <button
                    type="button"
                    onClick={() => setStep("type")}
                    className="inline-flex items-center gap-1.5 group mb-1"
                    title="Wijzig type"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <Badge className={`${typeColors[type as keyof typeof typeColors] || "bg-muted/30 text-muted-foreground"} border text-[11px] cursor-pointer`}>
                      {typeLabels[type as keyof typeof typeLabels] || type}
                    </Badge>
                  </button>
                )}

                {/* Voertuig (voorraad) */}
                {requiresVoorraadVehicle(type) && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs text-muted-foreground block">Voertuig *</Label>
                      {form.vehicle_id && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, vehicle_id: "" })}
                          className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                        >
                          Verwijderen
                        </button>
                      )}
                    </div>
                    <Select value={form.vehicle_id || undefined} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
                      <SelectTrigger className="rounded-[3px] h-10">
                        <SelectValue placeholder="Selecteer voertuig" />
                      </SelectTrigger>
                      <SelectContent className="rounded-[3px] max-h-[260px]">
                        <div className="px-2 pb-2 pt-1" onKeyDown={(e) => e.stopPropagation()}>
                          <Input
                            placeholder="Zoek op merk, model of kenteken..."
                            value={vehicleSearch}
                            onChange={(e) => setVehicleSearch(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="rounded-[3px] h-8 text-xs"
                          />
                        </div>
                        {filteredVehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id} className="rounded-[3px]">
                            <span className="flex items-center gap-2">
                              {v.kenteken && <span className="text-[10px] tabular-nums text-muted-foreground">{v.kenteken}</span>}
                              {v.merk} {v.model}
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
                )}

                {/* Klant sectie — toggle bestaand/nieuw */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Klant</Label>
                    <div className="inline-flex p-0.5 rounded-[3px] bg-secondary/40 border border-border">
                      {(["bestaand", "nieuw"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => { setKlantMode(m); if (m === "nieuw") setSelectedCustomerId(null); }}
                          className={cn(
                            "px-2.5 py-1 text-[11px] rounded-[2px] transition-colors",
                            klantMode === m ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {m === "bestaand" ? "Bestaande klant" : "Losse invoer"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {klantMode === "bestaand" ? (
                    <div ref={customerWrapRef} className="relative">
                      <Input
                        value={selectedCustomer ? `${selectedCustomer.voornaam} ${selectedCustomer.achternaam}` : customerSearch}
                        onChange={(e) => {
                          setSelectedCustomerId(null);
                          setCustomerSearch(e.target.value);
                          setCustomerOpen(true);
                        }}
                        onFocus={() => setCustomerOpen(true)}
                        placeholder="Zoek op naam, telefoon of e-mail..."
                        className="rounded-[3px] h-10"
                        autoComplete="off"
                      />
                      {customerOpen && filteredCustomers.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 mt-1 rounded-[3px] border border-border bg-popover shadow-md max-h-[220px] overflow-y-auto">
                          {filteredCustomers.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => pickCustomer(c)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-accent/40 transition-colors flex items-center justify-between gap-2"
                            >
                              <span>{c.voornaam} {c.achternaam}</span>
                              <span className="text-[11px] text-muted-foreground truncate ml-2">{c.telefoon || c.email}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {selectedCustomer && (
                        <p className="text-[10px] text-emerald-400 mt-1">✓ Gekoppeld: {selectedCustomer.voornaam} {selectedCustomer.achternaam}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        value={form.klant_naam}
                        onChange={(e) => setForm({ ...form, klant_naam: e.target.value })}
                        placeholder="Naam *"
                        className="rounded-[3px] h-10"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={form.klant_telefoon}
                          onChange={(e) => setForm({ ...form, klant_telefoon: e.target.value })}
                          placeholder="06 12345678"
                          type="tel"
                          className="rounded-[3px] h-10"
                        />
                        <Input
                          value={form.klant_email}
                          onChange={(e) => setForm({ ...form, klant_email: e.target.value })}
                          placeholder="naam@voorbeeld.nl"
                          type="email"
                          className="rounded-[3px] h-10"
                        />
                      </div>
                      {form.klant_naam.trim() && (
                        <button
                          type="button"
                          onClick={() => setBewaarAlsKlant((v) => !v)}
                          className={cn(
                            "text-[11px] transition-colors",
                            bewaarAlsKlant ? "text-emerald-400" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {bewaarAlsKlant ? "✓ Wordt opgeslagen als nieuwe klant" : "+ Bewaar als nieuwe klant"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Vrij voertuig (onderhoud / poetsbeurt / anders) */}
                {showsVrijVoertuig(type) && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground block">Voertuig van klant <span className="opacity-50">(optioneel)</span></Label>
                    <div className="grid grid-cols-[110px_1fr] gap-2">
                      <Input
                        value={form.voertuig_klant_kenteken}
                        onChange={(e) => setForm({ ...form, voertuig_klant_kenteken: e.target.value.toUpperCase() })}
                        placeholder="Kenteken"
                        className="rounded-[3px] h-10 tabular-nums"
                      />
                      <Input
                        value={form.voertuig_klant_omschrijving}
                        onChange={(e) => setForm({ ...form, voertuig_klant_omschrijving: e.target.value })}
                        placeholder="Merk + model"
                        className="rounded-[3px] h-10"
                      />
                    </div>
                  </div>
                )}

                {/* Datum */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Datum *</Label>
                  <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
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
                    <PopoverContent className="w-auto p-0 rounded-[12px]" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(d) => {
                          if (!d) return;
                          setSelectedDate(d);
                          setDatePopoverOpen(false);
                        }}
                        locale={nl}
                        className="p-3 pointer-events-auto"
                        classNames={{
                          day: cn(
                            "h-9 w-9 p-0 font-normal rounded-full inline-flex items-center justify-center hover:bg-accent/50 transition-colors aria-selected:opacity-100"
                          ),
                          day_selected:
                            "bg-primary text-primary-foreground rounded-full hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                          day_today:
                            "ring-1 ring-primary/60 text-primary font-semibold rounded-full",
                          cell:
                            "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Afspraaktijd */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Tijd *</Label>
                  <Select value={form.tijd} onValueChange={(v) => setForm({ ...form, tijd: v })}>
                    <SelectTrigger className="rounded-[3px] h-10">
                      <Clock className="mr-2 h-4 w-4 opacity-60" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-[3px] max-h-[240px]">
                      {timeSlots.map((t) => <SelectItem key={t} value={t} className="rounded-[3px]">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {dienstenDuur > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Geschatte duur diensten: <span className="text-foreground">{formatDuur(dienstenDuur)}</span>
                    </p>
                  )}
                </div>

                {/* Diensten pills */}
                {showsDiensten(type) && (
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground block">
                      Diensten {requiresDiensten(type) && <span className="text-foreground">*</span>}
                    </Label>
                    {visibleDienstCategorieen.map((cat) => {
                      const items = dienstenPerCategorie[cat];
                      if (!items || items.length === 0) return null;
                      return (
                        <div key={cat}>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1.5">
                            {dienstCategorieLabels[cat]}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {items.map((d) => (
                              <PillButton
                                key={d.id}
                                active={selectedDiensten.includes(d.id)}
                                onClick={() => toggleDienst(d.id)}
                              >
                                {d.naam}
                                <span className="ml-1 opacity-50 text-[10px]">{d.duur_minuten}m</span>
                              </PillButton>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {andersGeselecteerd && (
                      <Input
                        value={andersNotitie}
                        onChange={(e) => setAndersNotitie(e.target.value)}
                        placeholder="Anders: omschrijf de dienst..."
                        className="rounded-[3px] h-9 text-xs"
                      />
                    )}
                  </div>
                )}

                {/* Werkzaamheden — onderhoud / poetsbeurt / anders */}
                {showsWerkzaamheden(type) && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Omschrijving werkzaamheden <span className="opacity-50">(optioneel)</span></Label>
                    <Textarea
                      value={form.werkzaamheden}
                      onChange={(e) => setForm({ ...form, werkzaamheden: e.target.value })}
                      placeholder="Bijv. links voor klopt iets bij hobbel..."
                      rows={2}
                      className="rounded-[3px] resize-none min-h-[60px]"
                    />
                  </div>
                )}

                {/* Adres — ophalen / aflevering */}
                {showsAdres(type) && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> Adres <span className="opacity-50">(optioneel)</span>
                    </Label>
                    <AddressAutocomplete
                      value={form.adres}
                      onChange={(v) => setForm({ ...form, adres: v })}
                      onAddressSelected={(d) => setForm({ ...form, adres: `${d.adres}, ${d.postcode} ${d.woonplaats}` })}
                      placeholder="Begin met typen..."
                      className="rounded-[3px] h-10"
                    />
                  </div>
                )}

                {/* Aflevering: betalingsstatus */}
                {type === "aflevering" && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Betalingsstatus</Label>
                    <Select value={form.betalingsstatus} onValueChange={(v: any) => setForm({ ...form, betalingsstatus: v })}>
                      <SelectTrigger className="rounded-[3px] h-10"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-[3px]">
                        <SelectItem value="volledig_betaald" className="rounded-[3px]">Volledig betaald</SelectItem>
                        <SelectItem value="openstaand" className="rounded-[3px]">Nog openstaand</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Notities */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Notities <span className="opacity-50">(optioneel)</span></Label>
                  <Textarea
                    value={form.notities}
                    onChange={(e) => setForm({ ...form, notities: e.target.value })}
                    placeholder="Eventuele opmerkingen"
                    rows={2}
                    className="rounded-[3px] resize-none min-h-[60px]"
                  />
                </div>

                {/* Toggle bevestigingsmail */}
                {effectiveEmail && (
                  <div className="flex items-center justify-between gap-3 py-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-foreground">Stuur bevestigingsmail</span>
                    </div>
                    <Switch
                      checked={form.stuur_bevestigingsmail}
                      onCheckedChange={(v) => setForm({ ...form, stuur_bevestigingsmail: v })}
                    />
                  </div>
                )}

                {/* Submit */}
                <div className="pt-1">
                  <Button
                    variant="outline"
                    className="w-full rounded-[3px]"
                    onClick={handleSubmit}
                    disabled={
                      saving ||
                      !selectedDate ||
                      !effectiveNaam ||
                      (requiresVoorraadVehicle(type) && !form.vehicle_id) ||
                      (requiresDiensten(type) && selectedDiensten.length === 0)
                    }
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

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Phone, Car, Clock, User, FileText, Trash2, CheckCircle2, Pencil, CalendarIcon, X, MessageCircle, Check, XCircle, Repeat, ShoppingCart, Wrench, Receipt } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Appointment, AppointmentType, AppointmentStatus, typeLabels, typeColors } from "@/hooks/useAppointments";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Props {
  appointment: Appointment | null;
  anchorRect?: DOMRect | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Appointment>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCreate?: (data: any) => Promise<string | null | void>;
}

const timeSlots = Array.from({ length: 20 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

const statusOptions: { value: AppointmentStatus; label: string }[] = [
  { value: "gepland", label: "Gepland" },
  { value: "voltooid", label: "Voltooid" },
  { value: "geannuleerd", label: "Geannuleerd" },
];

const AppointmentDetailDialog = ({ appointment, anchorRect, open, onOpenChange, onUpdate, onDelete, onCreate }: Props) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // ESC + click outside
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false); };
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    // Defer to next tick so the opening click doesn't immediately close
    const t = setTimeout(() => document.addEventListener("mousedown", onDown), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, onOpenChange]);

  // Position popover near anchorRect (desktop)
  useLayoutEffect(() => {
    if (!open || isMobile || !anchorRect) { setPos(null); return; }
    const POPOVER_W = 340;
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = anchorRect.right + margin;
    if (left + POPOVER_W > vw - margin) left = anchorRect.left - POPOVER_W - margin;
    if (left < margin) left = margin;
    let top = anchorRect.top;
    // Estimate height after mount
    requestAnimationFrame(() => {
      const h = containerRef.current?.offsetHeight ?? 360;
      let t = top;
      if (t + h > vh - margin) t = Math.max(margin, vh - h - margin);
      setPos({ top: t, left });
    });
    setPos({ top, left });
  }, [open, isMobile, anchorRect]);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [editTime, setEditTime] = useState("10:00");
  const [editEindTime, setEditEindTime] = useState("");
  const [editTijdvenster, setEditTijdvenster] = useState(false);
  const [editStatus, setEditStatus] = useState<AppointmentStatus>("gepland");
  const [editNotities, setEditNotities] = useState("");
  const [editOnderwerp, setEditOnderwerp] = useState("");
  const [editBetalingsstatus, setEditBetalingsstatus] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [localStatus, setLocalStatus] = useState<AppointmentStatus | null>(appointment?.status ?? null);
  const [statusSaving, setStatusSaving] = useState(false);

  useEffect(() => {
    setLocalStatus(appointment?.status ?? null);
  }, [appointment?.id, appointment?.status]);

  if (!appointment) return null;

  const dt = new Date(appointment.datum_tijd);
  const isGepland = appointment.status === "gepland";

  const startEdit = () => {
    const d = new Date(appointment.datum_tijd);
    setEditDate(d);
    setEditTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    if (appointment.eind_datum_tijd) {
      const ed = new Date(appointment.eind_datum_tijd);
      setEditEindTime(`${String(ed.getHours()).padStart(2, "0")}:${String(ed.getMinutes()).padStart(2, "0")}`);
      setEditTijdvenster(true);
    } else {
      setEditEindTime("");
      setEditTijdvenster(false);
    }
    setEditStatus(appointment.status);
    setEditNotities(appointment.notities || "");
    setEditOnderwerp(appointment.onderwerp || "");
    setEditBetalingsstatus(appointment.betalingsstatus || "");
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const handleSave = async () => {
    if (!editDate) return;
    setSaving(true);
    try {
      const dateStr = format(editDate, "yyyy-MM-dd");
      // Find closest time slot or use exact
      const datum_tijd = new Date(`${dateStr}T${editTime}`).toISOString();
      const eind_datum_tijd = editTijdvenster && editEindTime ? new Date(`${dateStr}T${editEindTime}`).toISOString() : null;
      await onUpdate(appointment.id, {
        datum_tijd,
        eind_datum_tijd,
        status: editStatus,
        notities: editNotities || null,
        onderwerp: editOnderwerp || null,
        betalingsstatus: editBetalingsstatus || null,
      } as any);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = (v: boolean) => {
    if (!v) setEditing(false);
    onOpenChange(v);
  };

  const customerName = appointment.customer ? `${appointment.customer.voornaam} ${appointment.customer.achternaam}`.trim() : null;
  const phoneRaw = appointment.customer?.telefoon?.replace(/[^\d+]/g, "") || "";
  // wa.me expects digits only, leading country code, no +
  const waNumber = (() => {
    if (!phoneRaw) return "";
    let n = phoneRaw.replace(/^\+/, "");
    if (n.startsWith("00")) n = n.slice(2);
    if (n.startsWith("0")) n = "31" + n.slice(1);
    return n;
  })();
  const dateStr = format(dt, "d MMMM yyyy", { locale: nl });
  const timeStr = format(dt, "HH:mm", { locale: nl });
  const naam = appointment.customer?.voornaam?.trim() || "u";
  const merkModel = appointment.vehicle ? `${appointment.vehicle.merk} ${appointment.vehicle.model}` : "";
  const waMessageByType: Record<string, string> = {
    bezichtiging: `Goedendag ${naam}, we willen u herinneren aan uw bezichtiging op ${dateStr} om ${timeStr} bij Platin Automotive${merkModel ? ` voor de ${merkModel}` : ""}. Tot dan!`,
    proefrit: `Goedendag ${naam}, we willen u herinneren aan uw proefrit op ${dateStr} om ${timeStr} bij Platin Automotive${merkModel ? ` met de ${merkModel}` : ""}. Tot dan!`,
    ophalen: `Goedendag ${naam},${merkModel ? ` uw ${merkModel} staat` : " uw voertuig staat"} klaar om opgehaald te worden op ${dateStr} om ${timeStr}. We zien u graag!`,
    aflevering: `Goedendag ${naam},${merkModel ? ` uw ${merkModel} wordt` : " uw voertuig wordt"} op ${dateStr} om ${timeStr} afgeleverd. Heeft u nog vragen, neem dan contact op.`,
    onderhoud: `Goedendag ${naam}, we willen u herinneren aan uw onderhoudsafspraak op ${dateStr} om ${timeStr} bij Platin Automotive. Tot dan!`,
  };
  const waMessage = encodeURIComponent(
    waMessageByType[appointment.type] ||
    `Goedendag ${naam}, we willen u herinneren aan uw afspraak op ${dateStr} om ${timeStr} bij Platin Automotive${merkModel ? ` voor de ${merkModel}` : ""}. Tot dan!`
  );

  const setStatus = async (s: AppointmentStatus) => {
    if (!appointment || statusSaving) return;
    if (localStatus === s) return;
    const previous = localStatus;
    setLocalStatus(s);
    setStatusSaving(true);
    try {
      await onUpdate(appointment.id, { status: s });
      toast.success("Status bijgewerkt");
    } catch (e) {
      setLocalStatus(previous);
    } finally {
      setStatusSaving(false);
    }
  };

  const goToVehicle = () => {
    if (!appointment.vehicle) return;
    handleClose(false);
    navigate(`/admin/voertuigen/${appointment.vehicle.id}`);
  };
  const goToCustomer = () => {
    if (!appointment.customer) return;
    handleClose(false);
    navigate(`/admin/klanten/${appointment.customer.id}`);
  };

  const startVerkoop = () => {
    if (!appointment.vehicle) return;
    handleClose(false);
    navigate(`/admin/verkopen/nieuw/${appointment.vehicle.id}`);
  };
  const goToProefritDoc = () => {
    if (!appointment.vehicle) return;
    handleClose(false);
    navigate(`/admin/proefriten?vehicle=${appointment.vehicle.id}`);
  };
  const goToVerkoopList = () => {
    if (!appointment.vehicle) return;
    handleClose(false);
    navigate(`/admin/verkopen?vehicle=${appointment.vehicle.id}`);
  };
  const goToKosten = () => {
    if (!appointment.vehicle) return;
    handleClose(false);
    navigate(`/admin/voertuigen/${appointment.vehicle.id}?tab=kosten`);
  };
  const convertToProefrit = async () => {
    if (!onCreate || !appointment.vehicle) return;
    await onCreate({
      type: "proefrit",
      datum_tijd: appointment.datum_tijd,
      eind_datum_tijd: null,
      customer_id: appointment.customer?.id || null,
      vehicle_id: appointment.vehicle.id,
      medewerker: null,
      notities: appointment.notities || null,
      onderwerp: null,
      betalingsstatus: null,
      voertuig_klaargemaakt: false,
      status: "gepland",
    });
    handleClose(false);
  };

  const containerClass = isMobile
    ? "fixed left-0 right-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-[14px] border-t border-x border-border/70 bg-card shadow-2xl animate-in slide-in-from-bottom duration-200"
    : "fixed z-50 w-[340px] rounded-[10px] border border-border/70 bg-card shadow-[0_12px_40px_rgba(0,0,0,0.55)] animate-in fade-in-0 zoom-in-95 duration-150 overflow-hidden";


  const containerStyle: React.CSSProperties = isMobile
    ? { paddingBottom: "env(safe-area-inset-bottom, 0px)" }
    : pos
      ? { top: pos.top, left: pos.left }
      : { top: -9999, left: -9999 };

  if (!open) return null;

  return createPortal(
    <div ref={containerRef} className={containerClass} style={containerStyle} role="dialog">
      {isMobile && (
        <div className="pt-2 pb-1 flex justify-center">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>
      )}
      <button
        onClick={() => onOpenChange(false)}
        className="absolute top-3 right-3 z-10 h-7 w-7 inline-flex items-center justify-center rounded-full text-muted-foreground/70 hover:text-foreground hover:bg-accent/40 transition-colors"
        aria-label="Sluiten"
      >
        <X className="w-4 h-4" />
      </button>
      <div>
        {!editing ? (
          <AnimatePresence mode="wait">
            <motion.div
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ padding: 18 }}
            >
              {/* 1. Header — type badge */}
              <div className="flex items-center justify-between gap-2 mb-3 pr-7">
                <span className={cn("inline-flex items-center px-2.5 py-1 rounded-[8px] border text-[11px] font-medium", typeColors[appointment.type])}>
                  {typeLabels[appointment.type]}
                </span>
              </div>

              {/* 2. Datum + tijd */}
              <div className="text-[15px] font-semibold text-foreground leading-tight mb-3">
                {format(dt, "EEEE d MMMM", { locale: nl })}
                <span className="text-muted-foreground font-normal"> · </span>
                {format(dt, "HH:mm", { locale: nl })}
                {appointment.eind_datum_tijd && (
                  <span className="text-muted-foreground font-normal"> – {format(new Date(appointment.eind_datum_tijd), "HH:mm")}</span>
                )}
              </div>

              {/* 3. Voertuig */}
              {appointment.vehicle && (
                <button
                  onClick={goToVehicle}
                  className="group flex items-center gap-2 text-sm text-foreground hover:text-emerald-400 transition-colors text-left mb-3 w-full"
                >
                  <Car className="w-4 h-4 text-muted-foreground group-hover:text-emerald-400 shrink-0 transition-colors" />
                  <span className="truncate">
                    {appointment.vehicle.merk} {appointment.vehicle.model}
                    {appointment.vehicle.kenteken && <span className="text-muted-foreground group-hover:text-emerald-400/80"> · {appointment.vehicle.kenteken}</span>}
                  </span>
                </button>
              )}

              {/* 4. Klant */}
              <div className="mb-1">
                {customerName ? (
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{customerName}</span>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground/70">Geen klant gekoppeld</div>
                )}
              </div>

              {/* 4b. Diensten */}
              {appointment.diensten && appointment.diensten.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {appointment.diensten.map((d) => (
                      <span key={d} className="inline-flex items-center px-2 py-0.5 rounded-[6px] bg-accent/40 border border-border/60 text-[11px] text-foreground">
                        {d}
                      </span>
                    ))}
                  </div>
                  {appointment.geschatte_duur_minuten ? (
                    <div className="text-[11px] text-muted-foreground mt-1.5 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {appointment.geschatte_duur_minuten} min geschat
                    </div>
                  ) : null}
                </div>
              )}

              {/* 4c. Klant-voertuig (onderhoud/poetsbeurt) */}
              {(appointment.voertuig_klant_kenteken || appointment.voertuig_klant_omschrijving) && (
                <div className="mt-3 flex items-center gap-2 text-sm text-foreground">
                  <Car className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="truncate">
                    {appointment.voertuig_klant_omschrijving || ""}
                    {appointment.voertuig_klant_kenteken && (
                      <span className="text-muted-foreground"> · {appointment.voertuig_klant_kenteken}</span>
                    )}
                  </span>
                </div>
              )}

              {/* 4d. Werkzaamheden / notitie diensten */}
              {(appointment.werkzaamheden_omschrijving || appointment.diensten_notitie) && (
                <div className="mt-3 text-xs text-muted-foreground bg-accent/20 rounded-[8px] p-2 border border-border/40 whitespace-pre-wrap">
                  {appointment.werkzaamheden_omschrijving || appointment.diensten_notitie}
                </div>
              )}

              {/* 4e. Notities algemeen */}
              {appointment.notities && (
                <div className="mt-3 text-xs text-muted-foreground bg-accent/20 rounded-[8px] p-2 border border-border/40 whitespace-pre-wrap">
                  {appointment.notities}
                </div>
              )}

              {/* divider */}
              <div className="my-4 h-px bg-border/40" />

              {/* 6. Status knoppen */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: "gepland" as AppointmentStatus, label: "Bevestigd", active: "bg-emerald-600/80 text-white border-emerald-500" },
                  { v: "voltooid" as AppointmentStatus, label: "Afgerond", active: "bg-muted-foreground/40 text-white border-muted-foreground/60" },
                  { v: "geannuleerd" as AppointmentStatus, label: "No-show", active: "bg-orange-600/80 text-white border-orange-500" },
                ].map(({ v, label, active }) => {
                  const isActive = localStatus === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      disabled={statusSaving}
                      onClick={() => setStatus(v)}
                      className={cn(
                        "py-2 rounded-[10px] border text-[11px] font-medium transition-colors disabled:opacity-70",
                        isActive ? active : "bg-transparent text-foreground/80 border-border/60 hover:bg-accent/30"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* divider */}
              <div className="my-4 h-px bg-border/40" />

              {/* 8. Acties */}
              <div className="space-y-2.5">
                {/* Bellen + WhatsApp */}
                {appointment.customer?.telefoon && (
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`tel:${appointment.customer.telefoon}`}
                      className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-[10px] border border-border/60 text-xs text-foreground hover:bg-accent/40 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" /> Bellen
                    </a>
                    {waNumber ? (
                      <a
                        href={`https://wa.me/${waNumber}?text=${waMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-[10px] border border-emerald-500/40 text-xs text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    ) : <span />}
                  </div>
                )}

                {/* Type-specifieke extra acties */}
                {appointment.type === "bezichtiging" && appointment.vehicle && (
                  <div className="flex flex-col gap-1.5 text-xs">
                    {onCreate && (
                      <button onClick={convertToProefrit} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                        <Repeat className="w-3.5 h-3.5" /> Omzetten naar proefrit
                      </button>
                    )}
                    <button onClick={startVerkoop} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                      <ShoppingCart className="w-3.5 h-3.5" /> Verkoop starten
                    </button>
                  </div>
                )}
                {appointment.type === "proefrit" && appointment.vehicle && (
                  <div className="flex flex-col gap-1.5 text-xs">
                    <button onClick={goToProefritDoc} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                      <FileText className="w-3.5 h-3.5" /> Proefrit document
                    </button>
                    <button onClick={startVerkoop} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                      <ShoppingCart className="w-3.5 h-3.5" /> Verkoop starten
                    </button>
                  </div>
                )}
                {(appointment.type === "ophalen" || appointment.type === "aflevering") && appointment.vehicle && (
                  <div className="flex flex-col gap-1.5 text-xs">
                    <button onClick={goToVerkoopList} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                      <ShoppingCart className="w-3.5 h-3.5" /> Naar verkoop
                    </button>
                  </div>
                )}
                {appointment.type === "onderhoud" && appointment.vehicle && (
                  <div className="flex flex-col gap-1.5 text-xs">
                    <button onClick={goToKosten} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                      <Receipt className="w-3.5 h-3.5" /> Kosten toevoegen
                    </button>
                  </div>
                )}

                {/* Onderste rij: Bewerken/Naar voertuig links — Verwijderen rechts */}
                <div className="flex items-center justify-between gap-3 text-xs pt-1">
                  <div className="flex items-center gap-3">
                    <button onClick={startEdit} className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                      <Pencil className="w-3.5 h-3.5" /> Bewerken
                    </button>
                    {appointment.vehicle && (
                      <button onClick={goToVehicle} className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                        <Car className="w-3.5 h-3.5" /> Naar voertuig
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-red-400 hover:text-red-300 transition-colors inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Verwijderen
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="p-4 space-y-4">
            <div className="mb-2 flex items-center gap-2 text-sm">
              <Badge className={`${typeColors[appointment.type]} border text-[11px]`}>{typeLabels[appointment.type]}</Badge>
              <span className="text-muted-foreground font-normal">Bewerken</span>
            </div>

            {/* Status */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Status</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as AppointmentStatus)}>
                <SelectTrigger className="rounded-[3px] h-10"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-[3px]">
                  {statusOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="rounded-[3px]">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Datum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal rounded-[3px] h-10", !editDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 opacity-60" />
                      {editDate ? format(editDate, "d MMM yyyy", { locale: nl }) : "Kies datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-[3px]" align="start">
                    <Calendar mode="single" selected={editDate} onSelect={setEditDate} locale={nl} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Tijd</Label>
                <Select value={editTime} onValueChange={setEditTime}>
                  <SelectTrigger className="rounded-[3px] h-10"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-[3px] max-h-60">
                    {timeSlots.map((t) => (
                      <SelectItem key={t} value={t} className="rounded-[3px]">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

              <AnimatePresence>
                {appointment.type === "terugbelafspraak" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Onderwerp</Label>
                    <Input value={editOnderwerp} onChange={(e) => setEditOnderwerp(e.target.value)} className="rounded-[3px] h-10" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Betalingsstatus (aflevering) */}
              <AnimatePresence>
                {appointment.type === "aflevering" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Betalingsstatus</Label>
                    <Select value={editBetalingsstatus || "openstaand"} onValueChange={setEditBetalingsstatus}>
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
                <Label className="text-xs text-muted-foreground mb-1.5 block">Notities</Label>
                <Textarea value={editNotities} onChange={(e) => setEditNotities(e.target.value)} rows={2} className="rounded-[3px]" />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1 rounded-[3px]" onClick={cancelEdit} disabled={saving}>
                  Annuleren
                </Button>
                <Button className="flex-1 rounded-[3px]" onClick={handleSave} disabled={saving}>
                  {saving ? "Opslaan..." : "Opslaan"}
                </Button>
              </div>

              <div className="pt-1 border-t border-border">
                <Button size="sm" variant="ghost" className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => { onDelete(appointment.id); handleClose(false); }}>
                  <Trash2 className="w-4 h-4 mr-1.5" /> Afspraak verwijderen
                </Button>
              </div>
          </div>
        )}
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Afspraak verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={async () => {
                setConfirmDelete(false);
                await onDelete(appointment.id);
                handleClose(false);
              }}
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>,
    document.body
  );
};

export default AppointmentDetailDialog;

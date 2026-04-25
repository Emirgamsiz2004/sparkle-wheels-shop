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
import { Phone, Car, Clock, User, FileText, Trash2, CheckCircle2, Pencil, CalendarIcon, X, MessageCircle, Check, XCircle } from "lucide-react";
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

interface Props {
  appointment: Appointment | null;
  anchorRect?: DOMRect | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Appointment>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
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

const AppointmentDetailDialog = ({ appointment, anchorRect, open, onOpenChange, onUpdate, onDelete }: Props) => {
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
    const POPOVER_W = 300;
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
  const waMessage = encodeURIComponent(
    `Goedendag, we willen u herinneren aan uw afspraak op ${format(dt, "d MMMM yyyy", { locale: nl })} om ${format(dt, "HH:mm", { locale: nl })} bij Platin Automotive${appointment.vehicle ? ` voor de ${appointment.vehicle.merk} ${appointment.vehicle.model}` : ""}. Tot dan!`
  );

  const setStatus = async (s: AppointmentStatus) => {
    if (appointment.status === s) return;
    await onUpdate(appointment.id, { status: s });
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

  const containerClass = isMobile
    ? "fixed left-0 right-0 bottom-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-[16px] border-t border-x border-border/60 bg-card shadow-2xl animate-in slide-in-from-bottom duration-200"
    : "fixed z-50 w-[300px] rounded-[16px] border border-border/60 bg-card shadow-[0_8px_30px_rgba(0,0,0,0.35)] animate-in fade-in-0 zoom-in-95 duration-150";

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
        className="absolute top-2 right-2 z-10 h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
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
              className="p-4"
            >
              {/* Section 1 — Afspraakinfo */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge className={`${typeColors[appointment.type]} border text-[11px]`}>{typeLabels[appointment.type]}</Badge>
                </div>
                <div className="text-base font-semibold leading-tight">
                  {format(dt, "EEEE d MMMM", { locale: nl })}
                  <span className="text-muted-foreground font-normal"> · </span>
                  {format(dt, "HH:mm", { locale: nl })}
                  {appointment.eind_datum_tijd && <span className="text-muted-foreground font-normal"> – {format(new Date(appointment.eind_datum_tijd), "HH:mm")}</span>}
                </div>
                {appointment.vehicle && (
                  <button
                    onClick={goToVehicle}
                    className="flex items-center gap-1.5 text-sm text-foreground hover:text-primary transition-colors text-left"
                  >
                    <Car className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {appointment.vehicle.merk} {appointment.vehicle.model}
                      {appointment.vehicle.kenteken && <span className="text-muted-foreground"> · {appointment.vehicle.kenteken}</span>}
                    </span>
                  </button>
                )}
                {appointment.notities && (
                  <p className="text-xs text-muted-foreground bg-muted/40 rounded-md p-2 leading-snug">{appointment.notities}</p>
                )}
              </div>

              <div className="my-3 border-t border-border/60" />

              {/* Section 2 — Klantinfo */}
              <div className="space-y-2">
                {customerName ? (
                  <>
                    <div className="flex items-center gap-1.5 text-sm">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium truncate">{customerName}</span>
                    </div>
                    {appointment.customer?.telefoon && (
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${appointment.customer.telefoon}`}
                          className="flex-1 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-xs hover:bg-accent/40 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span className="truncate">{appointment.customer.telefoon}</span>
                        </a>
                        {waNumber && (
                          <a
                            href={`https://wa.me/${waNumber}?text=${waMessage}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-[30px] w-[30px] rounded-md border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            aria-label="WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">Geen klant gekoppeld</div>
                )}
              </div>

              <div className="my-3 border-t border-border/60" />

              {/* Section 3 — Status */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { v: "gepland" as AppointmentStatus, label: "Bevestigd", icon: Check, active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40", base: "text-muted-foreground border-border" },
                  { v: "voltooid" as AppointmentStatus, label: "Afgerond", icon: CheckCircle2, active: "bg-muted text-foreground border-border", base: "text-muted-foreground border-border" },
                  { v: "geannuleerd" as AppointmentStatus, label: "No-show", icon: XCircle, active: "bg-orange-500/15 text-orange-400 border-orange-500/40", base: "text-muted-foreground border-border" },
                ].map(({ v, label, icon: Icon, active, base }) => {
                  const isActive = appointment.status === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setStatus(v)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-md border text-[10px] font-medium transition-colors hover:bg-accent/30",
                        isActive ? active : base
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="my-3 border-t border-border/60" />

              {/* Section 4 — Acties */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                <button onClick={startEdit} className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                  <Pencil className="w-3 h-3" /> Bewerken
                </button>
                {appointment.vehicle && (
                  <button onClick={goToVehicle} className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                    <Car className="w-3 h-3" /> Naar voertuig
                  </button>
                )}
                {appointment.customer && (
                  <button onClick={goToCustomer} className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                    <User className="w-3 h-3" /> Naar klant
                  </button>
                )}
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-red-400 hover:text-red-300 transition-colors inline-flex items-center gap-1 ml-auto"
                >
                  <Trash2 className="w-3 h-3" /> Verwijderen
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="p-4">
            <div className="mb-2 flex items-center gap-2 text-sm">
              <Badge className={`${typeColors[appointment.type]} border text-[11px]`}>{typeLabels[appointment.type]}</Badge>
              <span className="text-muted-foreground font-normal">Bewerken</span>
            </div>

            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 pt-1"
            >
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
                      <Calendar
                        mode="single"
                        selected={editDate}
                        onSelect={setEditDate}
                        locale={nl}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{editTijdvenster ? "Van" : "Tijdstip"}</Label>
                  <Select value={editTime} onValueChange={setEditTime}>
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

              {/* Tijdvenster toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditTijdvenster(!editTijdvenster)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                >
                  {editTijdvenster ? "Exact tijdstip" : "Tijdsvenster (van-tot)"}
                </button>
              </div>

              <AnimatePresence>
                {editTijdvenster && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Tot</Label>
                    <Select value={editEindTime || timeSlots.find(t => t > editTime) || "17:00"} onValueChange={setEditEindTime}>
                      <SelectTrigger className="rounded-[3px] h-10">
                        <Clock className="mr-2 h-4 w-4 opacity-60" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-[3px] max-h-[240px]">
                        {timeSlots.filter(t => t > editTime).map((t) => (
                          <SelectItem key={t} value={t} className="rounded-[3px]">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Onderwerp (terugbelafspraak) */}
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
            </motion.div>
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

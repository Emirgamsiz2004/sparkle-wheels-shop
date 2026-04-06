import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Phone, Car, Clock, User, FileText, Trash2, CheckCircle2, Pencil, CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Appointment, AppointmentType, AppointmentStatus, typeLabels, typeColors } from "@/hooks/useAppointments";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  appointment: Appointment | null;
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

const AppointmentDetailDialog = ({ appointment, open, onOpenChange, onUpdate, onDelete }: Props) => {
  const navigate = useNavigate();
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
      const closestTime = timeSlots.includes(editTime) ? editTime : editTime;
      const datum_tijd = new Date(`${dateStr}T${closestTime}`).toISOString();
      await onUpdate(appointment.id, {
        datum_tijd,
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Badge className={`${typeColors[appointment.type]} border text-xs`}>{typeLabels[appointment.type]}</Badge>
              {appointment.status === "voltooid" && <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">Voltooid</Badge>}
              {appointment.status === "geannuleerd" && <Badge variant="outline" className="text-muted-foreground">Geannuleerd</Badge>}
            </DialogTitle>
            {!editing && (
              <Button variant="ghost" size="sm" onClick={startEdit} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!editing ? (
            <motion.div
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{format(dt, "EEEE d MMMM yyyy 'om' HH:mm", { locale: nl })}</span>
                </div>

                {appointment.customer && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{appointment.customer.voornaam} {appointment.customer.achternaam}</span>
                    </div>
                    <a href={`tel:${appointment.customer.telefoon}`} className="p-1.5 rounded-md hover:bg-accent transition-colors">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                    </a>
                  </div>
                )}

                {appointment.vehicle && (
                  <div className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => { handleClose(false); navigate(`/admin/voertuigen/${appointment.vehicle!.id}`); }}>
                    <Car className="w-4 h-4 text-muted-foreground" />
                    <span>{appointment.vehicle.merk} {appointment.vehicle.model} {appointment.vehicle.kenteken ? `(${appointment.vehicle.kenteken})` : ""}</span>
                  </div>
                )}

                {appointment.medewerker && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Medewerker:</span> {appointment.medewerker}
                  </div>
                )}

                {appointment.onderwerp && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>{appointment.onderwerp}</span>
                  </div>
                )}

                {appointment.betalingsstatus && (
                  <div className="text-sm">
                    <Badge variant="outline" className={appointment.betalingsstatus === "volledig_betaald" ? "text-emerald-400 border-emerald-500/30" : "text-orange-400 border-orange-500/30"}>
                      {appointment.betalingsstatus === "volledig_betaald" ? "Volledig betaald" : "Nog openstaand"}
                    </Badge>
                  </div>
                )}

                {appointment.notities && (
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-2.5">{appointment.notities}</p>
                )}
              </div>

              {isGepland && (
                <div className="flex gap-2 pt-3 border-t border-border mt-3">
                  {(appointment.type === "bezichtiging" || appointment.type === "proefrit") && (
                    <Button size="sm" className="flex-1" variant="outline"
                      onClick={() => { onUpdate(appointment.id, { status: "voltooid" }); handleClose(false); }}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      {appointment.type === "bezichtiging" ? "Proefrit starten" : "Afsluiten"}
                    </Button>
                  )}
                  {appointment.type === "aflevering" && (
                    <Button size="sm" className="flex-1" variant="outline"
                      onClick={() => { onUpdate(appointment.id, { status: "voltooid" }); handleClose(false); }}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />Afgeleverd
                    </Button>
                  )}
                  {appointment.type === "terugbelafspraak" && (
                    <Button size="sm" className="flex-1" variant="outline"
                      onClick={() => { onUpdate(appointment.id, { status: "voltooid" }); handleClose(false); }}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />Voltooid
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => { onDelete(appointment.id); handleClose(false); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          ) : (
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
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Tijdstip</Label>
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
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDetailDialog;

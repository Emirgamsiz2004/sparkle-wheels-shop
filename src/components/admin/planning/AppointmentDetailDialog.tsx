import { useState, useEffect, useRef } from "react";
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
import { Trash2, CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Appointment, AppointmentStatus, typeLabels, typeColors } from "@/hooks/useAppointments";
import AppointmentDetailPanel from "./AppointmentDetailPanel";

interface Props {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Appointment>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  anchorRect?: DOMRect | null;
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

const AppointmentDetailDialog = ({ appointment, open, onOpenChange, onUpdate, onDelete, anchorRect }: Props) => {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [editTime, setEditTime] = useState("10:00");
  const [editEindTime, setEditEindTime] = useState("");
  const [editStatus, setEditStatus] = useState<AppointmentStatus>("gepland");
  const [editNotities, setEditNotities] = useState("");
  const [editOnderwerp, setEditOnderwerp] = useState("");

  // ESC + outside-click
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false); };
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => document.addEventListener("mousedown", onDown), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) setEditing(false);
  }, [open]);

  if (!open || !appointment) return null;

  const startEdit = () => {
    const d = new Date(appointment.datum_tijd);
    setEditDate(d);
    setEditTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    if (appointment.eind_datum_tijd) {
      const ed = new Date(appointment.eind_datum_tijd);
      setEditEindTime(`${String(ed.getHours()).padStart(2, "0")}:${String(ed.getMinutes()).padStart(2, "0")}`);
    } else setEditEindTime("");
    setEditStatus(appointment.status);
    setEditNotities(appointment.notities || "");
    setEditOnderwerp(appointment.onderwerp || "");
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editDate) return;
    setSaving(true);
    try {
      const dateStr = format(editDate, "yyyy-MM-dd");
      const datum_tijd = new Date(`${dateStr}T${editTime}`).toISOString();
      const eind_datum_tijd = editEindTime ? new Date(`${dateStr}T${editEindTime}`).toISOString() : null;
      await onUpdate(appointment.id, {
        datum_tijd, eind_datum_tijd,
        status: editStatus,
        notities: editNotities || null,
        onderwerp: editOnderwerp || null,
      } as any);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  // Position popover near the clicked block (desktop). Mobile = bottom sheet.
  const POPOVER_W = 400;
  const POPOVER_MAX_H = Math.min(640, window.innerHeight - 32);
  let popoverStyle: React.CSSProperties = {};
  if (!isMobile && anchorRect) {
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Prefer right of the block, fall back to left
    let left = anchorRect.right + margin;
    if (left + POPOVER_W > vw - margin) left = anchorRect.left - POPOVER_W - margin;
    if (left < margin) left = margin;
    let top = anchorRect.top;
    if (top + POPOVER_MAX_H > vh - margin) top = Math.max(margin, vh - POPOVER_MAX_H - margin);
    popoverStyle = { top, left, width: POPOVER_W, maxHeight: POPOVER_MAX_H };
  }

  const wrapperClass = isMobile
    ? "fixed left-0 right-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-[3px] border-t border-x border-border bg-background shadow-2xl animate-in slide-in-from-bottom duration-200"
    : anchorRect
      ? "fixed z-50 overflow-y-auto rounded-[3px] border border-border bg-background shadow-[0_20px_60px_rgba(0,0,0,0.65)] animate-in fade-in-0 zoom-in-95 duration-150"
      : "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[400px] max-h-[90vh] overflow-y-auto rounded-[3px] border border-border bg-background shadow-[0_20px_60px_rgba(0,0,0,0.65)] animate-in fade-in-0 zoom-in-95 duration-150";

  return createPortal(
    <>
      <div className="fixed inset-0 z-40 bg-black/40 animate-in fade-in-0 duration-150" />
      <div ref={containerRef} className={wrapperClass} style={popoverStyle} role="dialog">
        {isMobile && (
          <div className="pt-2 pb-1 flex justify-center">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>
        )}
        {!editing ? (
          <AppointmentDetailPanel
            appointment={appointment}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onEdit={startEdit}
            onClose={() => onOpenChange(false)}
            showClose
          />
        ) : (
          <div className="relative p-4 space-y-4 bg-card">
            <button
              onClick={() => setEditing(false)}
              className="absolute top-3 right-3 h-7 w-7 inline-flex items-center justify-center rounded-full text-muted-foreground/70 hover:text-foreground hover:bg-accent/40"
              aria-label="Sluiten"
            ><X className="w-4 h-4" /></button>
            <div className="flex items-center gap-2 text-sm pr-7">
              <Badge className={cn("border text-[11px]", typeColors[appointment.type])}>{typeLabels[appointment.type]}</Badge>
              <span className="text-muted-foreground">Bewerken</span>
            </div>

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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Datum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal rounded-[3px] h-10", !editDate && "text-muted-foreground")}>
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

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Eindtijd (optioneel)</Label>
              <Input value={editEindTime} onChange={(e) => setEditEindTime(e.target.value)} placeholder="HH:MM" className="rounded-[3px] h-10" />
            </div>

            {appointment.type === "terugbelafspraak" && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Onderwerp</Label>
                <Input value={editOnderwerp} onChange={(e) => setEditOnderwerp(e.target.value)} className="rounded-[3px] h-10" />
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Notities</Label>
              <Textarea value={editNotities} onChange={(e) => setEditNotities(e.target.value)} rows={3} className="rounded-[3px]" />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 rounded-[3px]" onClick={() => setEditing(false)} disabled={saving}>Annuleren</Button>
              <Button className="flex-1 rounded-[3px]" onClick={handleSave} disabled={saving}>
                {saving ? "Opslaan..." : "Opslaan"}
              </Button>
            </div>

            <div className="pt-2 border-t border-border">
              <Button size="sm" variant="ghost" className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={async () => { await onDelete(appointment.id); onOpenChange(false); }}>
                <Trash2 className="w-4 h-4 mr-1.5" /> Verwijderen
              </Button>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
};

export default AppointmentDetailDialog;

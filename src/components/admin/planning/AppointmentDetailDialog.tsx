import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Car, Clock, User, FileText, Trash2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Appointment, typeLabels, typeColors } from "@/hooks/useAppointments";
import { useNavigate } from "react-router-dom";

interface Props {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Appointment>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const AppointmentDetailDialog = ({ appointment, open, onOpenChange, onUpdate, onDelete }: Props) => {
  const navigate = useNavigate();
  if (!appointment) return null;

  const dt = new Date(appointment.datum_tijd);
  const isGepland = appointment.status === "gepland";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge className={`${typeColors[appointment.type]} border text-xs`}>{typeLabels[appointment.type]}</Badge>
            {appointment.status === "voltooid" && <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">Voltooid</Badge>}
            {appointment.status === "geannuleerd" && <Badge variant="outline" className="text-muted-foreground">Geannuleerd</Badge>}
          </DialogTitle>
        </DialogHeader>

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
              onClick={() => { onOpenChange(false); navigate(`/admin/voertuigen/${appointment.vehicle!.id}`); }}>
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
          <div className="flex gap-2 pt-3 border-t border-border">
            {(appointment.type === "bezichtiging" || appointment.type === "proefrit") && (
              <Button size="sm" className="flex-1" variant="outline"
                onClick={() => { onUpdate(appointment.id, { status: "voltooid" }); onOpenChange(false); }}>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {appointment.type === "bezichtiging" ? "Proefrit starten" : "Afsluiten"}
              </Button>
            )}
            {appointment.type === "aflevering" && (
              <Button size="sm" className="flex-1" variant="outline"
                onClick={() => { onUpdate(appointment.id, { status: "voltooid" }); onOpenChange(false); }}>
                <CheckCircle2 className="w-4 h-4 mr-1" />Afgeleverd
              </Button>
            )}
            {appointment.type === "terugbelafspraak" && (
              <Button size="sm" className="flex-1" variant="outline"
                onClick={() => { onUpdate(appointment.id, { status: "voltooid" }); onOpenChange(false); }}>
                <CheckCircle2 className="w-4 h-4 mr-1" />Voltooid
              </Button>
            )}
            <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={() => { onDelete(appointment.id); onOpenChange(false); }}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDetailDialog;

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronLeft, ChevronRight, Check, Clock, Car } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, isToday, addWeeks, subWeeks } from "date-fns";
import { nl } from "date-fns/locale";
import { useAppointments, Appointment, typeLabels, typeColors, typeDotColors } from "@/hooks/useAppointments";
import { useCustomers } from "@/hooks/useCustomers";
import { useVehicles } from "@/hooks/useVehicles";
import AppointmentFormDialog from "@/components/admin/planning/AppointmentFormDialog";
import AppointmentDetailDialog from "@/components/admin/planning/AppointmentDetailDialog";

const AdminPlanningPage = () => {
  const { appointments, loading, addAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const { customers } = useCustomers();
  const { vehicles } = useVehicles();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [formOpen, setFormOpen] = useState(false);
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    weekDays.forEach((d) => {
      const key = format(d, "yyyy-MM-dd");
      map.set(key, appointments.filter((a) => a.status !== "geannuleerd" && isSameDay(new Date(a.datum_tijd), d)).sort((a, b) => new Date(a.datum_tijd).getTime() - new Date(b.datum_tijd).getTime()));
    });
    return map;
  }, [appointments, weekDays]);

  const todayAppointments = useMemo(() =>
    appointments.filter((a) => a.status === "gepland" && isSameDay(new Date(a.datum_tijd), new Date())).sort((a, b) => new Date(a.datum_tijd).getTime() - new Date(b.datum_tijd).getTime()),
    [appointments]
  );

  const todayPrep = useMemo(() =>
    todayAppointments.filter((a) => (a.type === "bezichtiging" || a.type === "proefrit") && a.vehicle_id && !a.voertuig_klaargemaakt),
    [todayAppointments]
  );

  const upcoming = useMemo(() =>
    appointments.filter((a) => a.status === "gepland" && new Date(a.datum_tijd) >= new Date()).slice(0, 5),
    [appointments]
  );

  const activeVehicles = useMemo(() =>
    vehicles.filter((v) => v.status !== "verkocht"),
    [vehicles]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Planning</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Agenda & afspraken</p>
        </div>
        <Button onClick={() => setFormOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" />Afspraak plannen
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
        {/* Calendar + Prep */}
        <div className="space-y-6">
          {/* Week navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
              Vandaag
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium ml-2">
              {format(weekStart, "d MMM", { locale: nl })} — {format(addDays(weekStart, 6), "d MMM yyyy", { locale: nl })}
            </span>
          </div>

          {/* Week calendar */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border">
            {weekDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayAppts = appointmentsByDay.get(key) || [];
              const today = isToday(day);
              return (
                <div key={key} className={`bg-card min-h-[160px] flex flex-col ${today ? "ring-1 ring-inset ring-accent" : ""}`}>
                  <div className={`px-2 py-1.5 text-center border-b border-border ${today ? "bg-accent/20" : ""}`}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{format(day, "EEE", { locale: nl })}</p>
                    <p className={`text-sm font-semibold ${today ? "text-accent" : ""}`}>{format(day, "d")}</p>
                    {dayAppts.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1 mt-0.5">{dayAppts.length}</Badge>
                    )}
                  </div>
                  <div className="flex-1 p-1 space-y-0.5 overflow-y-auto">
                    {dayAppts.map((a) => (
                      <button key={a.id} onClick={() => setDetailAppointment(a)}
                        className={`w-full text-left px-1.5 py-1 rounded text-[11px] leading-tight border transition-colors hover:opacity-80 ${typeColors[a.type]}`}>
                        <span className="font-medium">{format(new Date(a.datum_tijd), "HH:mm")}</span>
                        {a.customer && <span className="block truncate">{a.customer.voornaam} {a.customer.achternaam}</span>}
                        {a.vehicle && <span className="block truncate text-[10px] opacity-70">{a.vehicle.merk} {a.vehicle.model}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Today's prep */}
          {todayPrep.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Car className="w-4 h-4 text-muted-foreground" />
                Voertuigen klaarmaken vandaag
              </h3>
              <div className="space-y-2">
                {todayPrep.map((a) => (
                  <div key={a.id} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${typeDotColors[a.type]}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {a.vehicle?.merk} {a.vehicle?.model} {a.vehicle?.kenteken ? `(${a.vehicle.kenteken})` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">{format(new Date(a.datum_tijd), "HH:mm")} — {typeLabels[a.type]}</p>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                      onClick={() => updateAppointment(a.id, { voertuig_klaargemaakt: true })}>
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Upcoming sidebar */}
        <div className="bg-card border border-border rounded-lg p-4 h-fit">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Aankomende afspraken
          </h3>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen aankomende afspraken</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((a) => (
                <button key={a.id} onClick={() => setDetailAppointment(a)}
                  className="w-full text-left bg-muted/50 hover:bg-muted rounded-md px-3 py-2.5 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${typeDotColors[a.type]}`} />
                    <span className="text-xs text-muted-foreground">{format(new Date(a.datum_tijd), "EEE d MMM HH:mm", { locale: nl })}</span>
                  </div>
                  <Badge className={`${typeColors[a.type]} border text-[10px] mb-1`}>{typeLabels[a.type]}</Badge>
                  {a.customer && <p className="text-sm truncate">{a.customer.voornaam} {a.customer.achternaam}</p>}
                  {a.vehicle && <p className="text-xs text-muted-foreground truncate">{a.vehicle.merk} {a.vehicle.model}</p>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AppointmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customers={customers}
        vehicles={activeVehicles}
        onSubmit={addAppointment}
      />
      <AppointmentDetailDialog
        appointment={detailAppointment}
        open={!!detailAppointment}
        onOpenChange={(v) => { if (!v) setDetailAppointment(null); }}
        onUpdate={updateAppointment}
        onDelete={deleteAppointment}
      />
    </div>
  );
};

export default AdminPlanningPage;

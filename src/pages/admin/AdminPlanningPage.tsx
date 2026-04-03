import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronLeft, ChevronRight, Check, Clock, Car, CalendarDays, List, Search } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, isToday, addWeeks, subWeeks, startOfDay, endOfDay, addMonths, isWithinInterval } from "date-fns";
import { nl } from "date-fns/locale";
import { useAppointments, Appointment, AppointmentType, typeLabels, typeColors, typeDotColors } from "@/hooks/useAppointments";
import { useCustomers } from "@/hooks/useCustomers";
import { useVehicles } from "@/hooks/useVehicles";
import AppointmentFormDialog from "@/components/admin/planning/AppointmentFormDialog";
import AppointmentDetailDialog from "@/components/admin/planning/AppointmentDetailDialog";

type ViewMode = "agenda" | "lijst";
type PeriodFilter = "vandaag" | "morgen" | "deze_week" | "deze_maand" | "alles";

const periodLabels: Record<PeriodFilter, string> = {
  vandaag: "Vandaag",
  morgen: "Morgen",
  deze_week: "Deze week",
  deze_maand: "Deze maand",
  alles: "Alles",
};

const AdminPlanningPage = () => {
  const { appointments, loading, addAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const { customers } = useCustomers();
  const { vehicles } = useVehicles();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [formOpen, setFormOpen] = useState(false);
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null);
  const [view, setView] = useState<ViewMode>("agenda");

  // List view filters
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("deze_week");
  const [typeFilter, setTypeFilter] = useState<AppointmentType | "alles">("alles");
  const [searchQuery, setSearchQuery] = useState("");

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    weekDays.forEach((d) => {
      const key = format(d, "yyyy-MM-dd");
      map.set(key, appointments.filter((a) => a.status !== "geannuleerd" && isSameDay(new Date(a.datum_tijd), d)).sort((a, b) => new Date(a.datum_tijd).getTime() - new Date(b.datum_tijd).getTime()));
    });
    return map;
  }, [appointments, weekDays]);

  const todayPrep = useMemo(() =>
    appointments.filter((a) => a.status === "gepland" && isSameDay(new Date(a.datum_tijd), new Date()) && (a.type === "bezichtiging" || a.type === "proefrit") && a.vehicle_id && !a.voertuig_klaargemaakt),
    [appointments]
  );

  const upcoming = useMemo(() =>
    appointments.filter((a) => a.status === "gepland" && new Date(a.datum_tijd) >= new Date()).sort((a, b) => new Date(a.datum_tijd).getTime() - new Date(b.datum_tijd).getTime()).slice(0, 5),
    [appointments]
  );

  // List view filtered appointments
  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = addDays(today, 1);
    const weekEnd = addDays(startOfWeek(now, { weekStartsOn: 1 }), 6);
    const monthEnd = addMonths(startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), 1);

    return appointments
      .filter((a) => a.status !== "geannuleerd")
      .filter((a) => {
        const d = new Date(a.datum_tijd);
        switch (periodFilter) {
          case "vandaag": return isSameDay(d, today);
          case "morgen": return isSameDay(d, tomorrow);
          case "deze_week": return isWithinInterval(d, { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfDay(weekEnd) });
          case "deze_maand": return isWithinInterval(d, { start: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), end: endOfDay(monthEnd) });
          case "alles": return true;
        }
      })
      .filter((a) => typeFilter === "alles" || a.type === typeFilter)
      .filter((a) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const name = `${a.customer?.voornaam || ""} ${a.customer?.achternaam || ""}`.toLowerCase();
        const veh = `${a.vehicle?.merk || ""} ${a.vehicle?.model || ""} ${a.vehicle?.kenteken || ""}`.toLowerCase();
        return name.includes(q) || veh.includes(q) || (a.onderwerp || "").toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(a.datum_tijd).getTime() - new Date(b.datum_tijd).getTime());
  }, [appointments, periodFilter, typeFilter, searchQuery]);

  const activeVehicles = useMemo(() => vehicles.filter((v) => v.status !== "verkocht"), [vehicles]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Planning</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Agenda & afspraken</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-secondary/50 border border-border rounded-md p-0.5">
            <button onClick={() => setView("agenda")} className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${view === "agenda" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <CalendarDays className="w-3.5 h-3.5" /> Agenda
            </button>
            <button onClick={() => setView("lijst")} className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${view === "lijst" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <List className="w-3.5 h-3.5" /> Lijst
            </button>
          </div>
          <Button onClick={() => setFormOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-1.5" />Afspraak plannen
          </Button>
        </div>
      </div>

      {view === "agenda" ? (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5">
          {/* Calendar + Prep */}
          <div className="space-y-5">
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
                      <p className={`text-sm font-semibold ${today ? "text-accent-foreground" : ""}`}>{format(day, "d")}</p>
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
              <p className="text-sm text-muted-foreground py-4 text-center">Geen aankomende afspraken</p>
            ) : (
              <div className="space-y-1.5">
                {upcoming.map((a) => (
                  <button key={a.id} onClick={() => setDetailAppointment(a)}
                    className="w-full text-left bg-muted/30 hover:bg-muted/60 border border-border rounded-md px-3 py-2.5 transition-colors">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${typeDotColors[a.type]}`} />
                      <span className="text-[11px] text-muted-foreground">{format(new Date(a.datum_tijd), "EEE d MMM · HH:mm", { locale: nl })}</span>
                    </div>
                    <Badge className={`${typeColors[a.type]} border text-[10px] mb-1`}>{typeLabels[a.type]}</Badge>
                    {a.customer && <p className="text-sm truncate">{a.customer.voornaam} {a.customer.achternaam}</p>}
                    {a.vehicle && <p className="text-[11px] text-muted-foreground truncate">{a.vehicle.merk} {a.vehicle.model}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── List View ── */
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Period tabs */}
            <div className="flex bg-secondary/50 border border-border rounded-md p-0.5">
              {(Object.keys(periodLabels) as PeriodFilter[]).map((p) => (
                <button key={p} onClick={() => setPeriodFilter(p)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${periodFilter === p ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {periodLabels[p]}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <div className="flex bg-secondary/50 border border-border rounded-md p-0.5">
              <button onClick={() => setTypeFilter("alles")} className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${typeFilter === "alles" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                Alles
              </button>
              {(Object.keys(typeLabels) as AppointmentType[]).map((t) => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${typeFilter === t ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {typeLabels[t]}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Zoek klant of voertuig..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-secondary/50 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50" />
            </div>
          </div>

          {/* Results count */}
          <p className="text-xs text-muted-foreground">{filteredAppointments.length} afspra{filteredAppointments.length === 1 ? "ak" : "ken"}</p>

          {/* Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {filteredAppointments.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Geen afspraken gevonden voor deze filters
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-left px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Datum & tijd</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Klant</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Voertuig</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Notities</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((a) => {
                      const isPast = new Date(a.datum_tijd) < new Date() && a.status === "gepland";
                      return (
                        <tr key={a.id} onClick={() => setDetailAppointment(a)}
                          className={`border-b border-border/50 hover:bg-accent/10 cursor-pointer transition-colors ${isPast ? "opacity-60" : ""}`}>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <p className="font-medium">{format(new Date(a.datum_tijd), "d MMM yyyy", { locale: nl })}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(a.datum_tijd), "HH:mm")}</p>
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge className={`${typeColors[a.type]} border text-[10px]`}>{typeLabels[a.type]}</Badge>
                          </td>
                          <td className="px-4 py-2.5">
                            {a.customer ? (
                              <p className="truncate max-w-[150px]">{a.customer.voornaam} {a.customer.achternaam}</p>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {a.vehicle ? (
                              <div className="min-w-0">
                                <p className="truncate max-w-[140px]">{a.vehicle.merk} {a.vehicle.model}</p>
                                {a.vehicle.kenteken && <p className="text-[11px] text-muted-foreground">{a.vehicle.kenteken}</p>}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge variant={a.status === "voltooid" ? "default" : a.status === "geannuleerd" ? "destructive" : "secondary"} className="text-[10px]">
                              {a.status === "gepland" ? "Gepland" : a.status === "voltooid" ? "Voltooid" : "Geannuleerd"}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[150px]">{a.notities || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AppointmentFormDialog open={formOpen} onOpenChange={setFormOpen} customers={customers} vehicles={activeVehicles} onSubmit={addAppointment} />
      <AppointmentDetailDialog appointment={detailAppointment} open={!!detailAppointment} onOpenChange={(v) => { if (!v) setDetailAppointment(null); }} onUpdate={updateAppointment} onDelete={deleteAppointment} />
    </div>
  );
};

export default AdminPlanningPage;

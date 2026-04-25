import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronLeft, ChevronRight, Check, Clock, Car, CalendarDays, List, Search } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, isToday, addWeeks, subWeeks, startOfDay, endOfDay, addMonths, isWithinInterval } from "date-fns";
import { nl } from "date-fns/locale";
import { useAppointments, Appointment, AppointmentType, typeLabels, typeColors, typeDotColors } from "@/hooks/useAppointments";
import { useCustomers } from "@/hooks/useCustomers";
import { useVehicles } from "@/hooks/useVehicles";
import { useIsMobile } from "@/hooks/use-mobile";
import AppointmentFormDialog from "@/components/admin/planning/AppointmentFormDialog";
import AppointmentTypePicker from "@/components/admin/planning/AppointmentTypePicker";
import AppointmentDetailDialog from "@/components/admin/planning/AppointmentDetailDialog";
import SlidingTabs from "@/components/admin/SlidingTabs";

type ViewMode = "agenda" | "lijst";
type PeriodFilter = "vandaag" | "morgen" | "deze_week" | "deze_maand" | "alles";

const periodLabels: Record<PeriodFilter, string> = {
  vandaag: "Vandaag",
  morgen: "Morgen",
  deze_week: "Deze week",
  deze_maand: "Deze maand",
  alles: "Alles",
};

const viewTabs = [
  { label: "Agenda", value: "agenda" },
  { label: "Lijst", value: "lijst" },
];

const periodTabs = (Object.keys(periodLabels) as PeriodFilter[]).map((p) => ({
  label: periodLabels[p],
  value: p,
}));

const typeTabs = [
  { label: "Alles", value: "alles" },
  ...(Object.keys(typeLabels) as AppointmentType[]).map((t) => ({
    label: typeLabels[t],
    value: t,
  })),
];

const AdminPlanningPage = () => {
  const { appointments, loading, addAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const { customers } = useCustomers();
  const { vehicles } = useVehicles();
  const isMobile = useIsMobile();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [formOpen, setFormOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerRect, setPickerRect] = useState<DOMRect | null>(null);
  const [pickedType, setPickedType] = useState<string | undefined>(undefined);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null);
  const [detailRect, setDetailRect] = useState<DOMRect | null>(null);
  const openDetail = (a: Appointment, e: React.MouseEvent) => {
    setDetailRect((e.currentTarget as HTMLElement).getBoundingClientRect());
    setDetailAppointment(a);
  };
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
  const allSelectableVehicles = useMemo(() => vehicles.filter((v) => ["te_koop", "in_behandeling", "consignatie", "gereserveerd", "verkocht", "reparatie_onderhoud"].includes(v.status)), [vehicles]);

  // On mobile, show day list for agenda instead of 7-col grid
  const todayAppointments = useMemo(() => {
    const today = new Date();
    return appointments
      .filter((a) => a.status !== "geannuleerd" && isSameDay(new Date(a.datum_tijd), today))
      .sort((a, b) => new Date(a.datum_tijd).getTime() - new Date(b.datum_tijd).getTime());
  }, [appointments]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg font-medium text-foreground">Planning</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Agenda & afspraken</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SlidingTabs tabs={viewTabs} value={view} onChange={(v) => setView(v as ViewMode)} />
          <button
            ref={addBtnRef}
            onClick={() => {
              setPickerRect(addBtnRef.current?.getBoundingClientRect() || null);
              setPickerOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors active:scale-[0.97]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Afspraak</span>
          </button>
        </div>
      </div>

      {view === "agenda" ? (
        <>
          {/* Week navigation */}
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekStart(subWeeks(weekStart, 1))} className="inline-flex items-center justify-center w-8 h-8 border border-border rounded-md hover:bg-accent transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors">
              Vandaag
            </button>
            <button onClick={() => setWeekStart(addWeeks(weekStart, 1))} className="inline-flex items-center justify-center w-8 h-8 border border-border rounded-md hover:bg-accent transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium ml-1 truncate">
              {format(weekStart, "d MMM", { locale: nl })} — {format(addDays(weekStart, 6), "d MMM yyyy", { locale: nl })}
            </span>
          </div>

          {isMobile ? (
            /* Mobile: vertical day list */
            <div className="space-y-3">
              {weekDays.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayAppts = appointmentsByDay.get(key) || [];
                const today = isToday(day);
                return (
                  <div key={key} className={`bg-card border rounded-md overflow-hidden ${today ? "border-accent" : "border-border"}`}>
                    <div className={`px-3 py-2 flex items-center justify-between ${today ? "bg-accent/20" : "bg-muted/20"}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">{format(day, "EEEE", { locale: nl })}</span>
                        <span className="text-xs text-muted-foreground">{format(day, "d MMM", { locale: nl })}</span>
                      </div>
                      {dayAppts.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{dayAppts.length}</Badge>
                      )}
                    </div>
                    {dayAppts.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-muted-foreground/50">Geen afspraken</p>
                    ) : (
                      <div className="p-1.5 space-y-1">
                        {dayAppts.map((a) => (
                          <button key={a.id} onClick={(e) => openDetail(a, e)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm leading-tight border transition-colors active:opacity-70 ${typeColors[a.type]}`}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{format(new Date(a.datum_tijd), "HH:mm")}</span>
                              <Badge className={`${typeColors[a.type]} border text-[10px]`}>{typeLabels[a.type]}</Badge>
                            </div>
                            {a.customer && <p className="text-sm mt-0.5 truncate">{a.customer.voornaam} {a.customer.achternaam}</p>}
                            {a.vehicle && <p className="text-xs opacity-70 truncate">{a.vehicle.merk} {a.vehicle.model}</p>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Desktop: 7-column grid */
            <div className="grid grid-cols-7 gap-px bg-border rounded-md overflow-hidden border border-border">
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
                        <button key={a.id} onClick={(e) => openDetail(a, e)}
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
          )}

          {/* Today's prep */}
          {todayPrep.length > 0 && (
            <div className="bg-card border border-border rounded-md p-3 sm:p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Car className="w-4 h-4 text-muted-foreground" />
                Voertuigen klaarmaken vandaag
              </h3>
              <div className="space-y-2">
                {todayPrep.map((a) => (
                  <div key={a.id} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${typeDotColors[a.type]}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {a.vehicle?.merk} {a.vehicle?.model} {a.vehicle?.kenteken ? `(${a.vehicle.kenteken})` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">{format(new Date(a.datum_tijd), "HH:mm")} — {typeLabels[a.type]}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateAppointment(a.id, { voertuig_klaargemaakt: true })}
                      className="inline-flex items-center justify-center w-9 h-9 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-md transition-colors shrink-0"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming sidebar — on mobile below, on desktop to the right */}
          <div className="bg-card border border-border rounded-md p-3 sm:p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Aankomende afspraken
            </h3>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Geen aankomende afspraken</p>
            ) : (
              <div className="space-y-1.5">
                {upcoming.map((a) => (
                  <button key={a.id} onClick={(e) => openDetail(a, e)}
                    className="w-full text-left bg-muted/30 hover:bg-muted/60 border border-border rounded-md px-3 py-2.5 transition-colors active:bg-muted/80">
                    <div className="flex items-center gap-2 mb-1">
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
        </>
      ) : (
        /* ── List View ── */
        <div className="space-y-3">
          {/* Filters — scrollable on mobile */}
          <div className="space-y-2">
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
              <SlidingTabs tabs={periodTabs} value={periodFilter} onChange={(v) => setPeriodFilter(v as PeriodFilter)} className="min-w-max" />
            </div>
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
              <SlidingTabs tabs={typeTabs} value={typeFilter} onChange={(v) => setTypeFilter(v as AppointmentType | "alles")} className="min-w-max" />
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Zoek klant of voertuig..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">{filteredAppointments.length} afspra{filteredAppointments.length === 1 ? "ak" : "ken"}</p>

          {/* Mobile: card list. Desktop: table */}
          {filteredAppointments.length === 0 ? (
            <div className="bg-card border border-border rounded-md py-12 text-center text-sm text-muted-foreground">
              Geen afspraken gevonden voor deze filters
            </div>
          ) : isMobile ? (
            <div className="space-y-1.5">
              {filteredAppointments.map((a) => {
                const isPast = new Date(a.datum_tijd) < new Date() && a.status === "gepland";
                return (
                  <button key={a.id} onClick={(e) => openDetail(a, e)}
                    className={`w-full text-left bg-card border border-border rounded-md p-3 active:bg-accent/30 transition-colors ${isPast ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-medium text-foreground">{format(new Date(a.datum_tijd), "EEE d MMM · HH:mm", { locale: nl })}</span>
                      <Badge variant={a.status === "voltooid" ? "default" : a.status === "geannuleerd" ? "destructive" : "secondary"} className="text-[10px]">
                        {a.status === "gepland" ? "Gepland" : a.status === "voltooid" ? "Voltooid" : "Geannuleerd"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`${typeColors[a.type]} border text-[10px]`}>{typeLabels[a.type]}</Badge>
                      {a.customer && <span className="text-sm truncate">{a.customer.voornaam} {a.customer.achternaam}</span>}
                    </div>
                    {a.vehicle && <p className="text-xs text-muted-foreground truncate">{a.vehicle.merk} {a.vehicle.model} {a.vehicle.kenteken ? `· ${a.vehicle.kenteken}` : ""}</p>}
                    {a.notities && <p className="text-xs text-muted-foreground/60 truncate mt-1">{a.notities}</p>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-md overflow-hidden">
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
                        <tr key={a.id} onClick={(e) => openDetail(a, e)}
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
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <AppointmentTypePicker
        open={pickerOpen}
        anchorRect={pickerRect}
        onOpenChange={setPickerOpen}
        onSelect={(t) => { setPickedType(t); setFormOpen(true); }}
      />
      <AppointmentFormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setPickedType(undefined); }}
        customers={customers}
        vehicles={activeVehicles}
        allVehicles={allSelectableVehicles}
        onSubmit={addAppointment}
        defaultType={pickedType}
      />
      <AppointmentDetailDialog appointment={detailAppointment} anchorRect={detailRect} open={!!detailAppointment} onOpenChange={(v) => { if (!v) setDetailAppointment(null); }} onUpdate={updateAppointment} onDelete={deleteAppointment} />
    </div>
  );
};

export default AdminPlanningPage;

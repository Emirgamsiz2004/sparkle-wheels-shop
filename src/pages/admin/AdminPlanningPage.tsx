import { useState, useMemo, useRef } from "react";
import { Plus, ChevronLeft, ChevronRight, Check, Clock, Car, Search, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, addDays, isSameDay, isToday, addWeeks, subWeeks, startOfDay, endOfDay, addMonths, isWithinInterval } from "date-fns";
import { nl } from "date-fns/locale";
import { useAppointments, Appointment, AppointmentType, typeLabels, typeColors, typeDotColors } from "@/hooks/useAppointments";
import { useCustomers } from "@/hooks/useCustomers";
import { useVehicles } from "@/hooks/useVehicles";
import { useIsMobile } from "@/hooks/use-mobile";
import AppointmentFormDialog from "@/components/admin/planning/AppointmentFormDialog";
import AppointmentDetailDialog from "@/components/admin/planning/AppointmentDetailDialog";
import AppointmentDetailPanel from "@/components/admin/planning/AppointmentDetailPanel";
import OpenstaandeAanvragen from "@/components/admin/planning/OpenstaandeAanvragen";
import SlidingTabs from "@/components/admin/SlidingTabs";
import { cn } from "@/lib/utils";

type ViewMode = "agenda" | "lijst";
type PeriodFilter = "vandaag" | "morgen" | "deze_week" | "deze_maand" | "alles";

const periodLabels: Record<PeriodFilter, string> = {
  vandaag: "Vandaag", morgen: "Morgen", deze_week: "Deze week", deze_maand: "Deze maand", alles: "Alles",
};

const viewTabs = [
  { label: "Agenda", value: "agenda" },
  { label: "Lijst", value: "lijst" },
];

const periodTabs = (Object.keys(periodLabels) as PeriodFilter[]).map((p) => ({ label: periodLabels[p], value: p }));
const typeTabs = [
  { label: "Alles", value: "alles" },
  ...(Object.keys(typeLabels) as AppointmentType[]).map((t) => ({ label: typeLabels[t], value: t })),
];

const AdminPlanningPage = () => {
  const { appointments, loading, addAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const { customers } = useCustomers();
  const { vehicles } = useVehicles();
  const isMobile = useIsMobile();

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [formOpen, setFormOpen] = useState(false);
  const [formAnchorRect, setFormAnchorRect] = useState<DOMRect | null>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDialogId, setMobileDialogId] = useState<string | null>(null);

  const [view, setView] = useState<ViewMode>("agenda");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("deze_week");
  const [typeFilter, setTypeFilter] = useState<AppointmentType | "alles">("alles");
  const [searchQuery, setSearchQuery] = useState("");

  const selected = useMemo(
    () => appointments.find((a) => a.id === selectedId) || null,
    [appointments, selectedId]
  );
  const mobileDialogAppt = useMemo(
    () => appointments.find((a) => a.id === mobileDialogId) || null,
    [appointments, mobileDialogId]
  );

  const openAppt = (a: Appointment) => {
    if (isMobile || view === "lijst") setMobileDialogId(a.id);
    else setSelectedId(a.id);
  };

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    weekDays.forEach((d) => {
      const key = format(d, "yyyy-MM-dd");
      map.set(
        key,
        appointments
          .filter((a) => a.status !== "geannuleerd" && !a.is_aanvraag && isSameDay(new Date(a.datum_tijd), d))
          .sort((a, b) => new Date(a.datum_tijd).getTime() - new Date(b.datum_tijd).getTime())
      );
    });
    return map;
  }, [appointments, weekDays]);

  const aanvragen = useMemo(
    () => appointments.filter((a) => a.is_aanvraag && a.status === "gepland")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [appointments]
  );

  const todayPrep = useMemo(
    () => appointments.filter((a) =>
      a.status === "gepland" &&
      isSameDay(new Date(a.datum_tijd), new Date()) &&
      (a.type === "bezichtiging" || a.type === "proefrit") &&
      a.vehicle_id && !a.voertuig_klaargemaakt
    ),
    [appointments]
  );

  const upcoming = useMemo(
    () => {
      const todayStart = startOfDay(new Date());
      return appointments
        .filter((a) => !a.is_aanvraag && a.status !== "geannuleerd" && new Date(a.datum_tijd) >= todayStart)
        .sort((a, b) => new Date(a.datum_tijd).getTime() - new Date(b.datum_tijd).getTime());
    },
    [appointments]
  );

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = addDays(today, 1);
    const weekEnd = addDays(startOfWeek(now, { weekStartsOn: 1 }), 6);
    const monthEnd = addMonths(startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), 1);

    return appointments
      .filter((a) => a.status !== "geannuleerd" && !a.is_aanvraag)
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
  const allSelectableVehicles = useMemo(
    () => vehicles.filter((v) => ["te_koop", "in_behandeling", "consignatie", "gereserveerd", "verkocht", "reparatie_onderhoud"].includes(v.status)),
    [vehicles]
  );

  // Compact appointment tile
  const Tile = ({ a, dense }: { a: Appointment; dense?: boolean }) => {
    const isSelected = selectedId === a.id;
    const past = new Date(a.datum_tijd) < new Date() && a.status === "gepland";
    return (
      <button
        onClick={() => openAppt(a)}
        className={cn(
          "w-full text-left rounded-[3px] border transition-colors group",
          dense ? "px-1.5 py-1" : "px-2 py-1.5",
          a.status === "voltooid" ? "opacity-50" : past ? "opacity-75" : "",
          isSelected
            ? "bg-accent/40 border-foreground/40"
            : "bg-card border-border/40 hover:bg-accent/20 hover:border-border/70"
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", typeDotColors[a.type])} />
          <span className="text-[11px] font-semibold tabular-nums text-foreground">{format(new Date(a.datum_tijd), "HH:mm")}</span>
          {(a.customer || a.klant_naam_los) && (
            <span className="text-[11px] text-foreground/80 truncate">
              · {a.customer ? `${a.customer.voornaam} ${a.customer.achternaam}` : a.klant_naam_los}
            </span>
          )}
        </div>
        {!dense && (a.vehicle || a.voertuig_klant_omschrijving) && (
          <div className="text-[10px] text-muted-foreground truncate mt-0.5 pl-3">
            {a.vehicle ? `${a.vehicle.merk} ${a.vehicle.model}` : a.voertuig_klant_omschrijving}
          </div>
        )}
      </button>
    );
  };

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
              setFormAnchorRect(addBtnRef.current?.getBoundingClientRect() || null);
              setFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors active:scale-[0.97]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Afspraak</span>
          </button>
        </div>
      </div>

      {view === "agenda" ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 lg:items-stretch">
          {/* LEFT: agenda */}
          <div className="flex flex-col gap-3 min-w-0">
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
              <div className="space-y-2">
                {weekDays.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayAppts = appointmentsByDay.get(key) || [];
                  const today = isToday(day);
                  return (
                    <div key={key} className={cn("bg-card border rounded-md overflow-hidden", today ? "border-foreground/40" : "border-border")}>
                      <div className={cn("px-3 py-2 flex items-center justify-between", today ? "bg-foreground/5" : "")}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">{format(day, "EEEE", { locale: nl })}</span>
                          <span className="text-xs text-muted-foreground">{format(day, "d MMM", { locale: nl })}</span>
                        </div>
                        {dayAppts.length > 0 && (
                          <span className="text-[10px] text-muted-foreground tabular-nums">{dayAppts.length}</span>
                        )}
                      </div>
                      {dayAppts.length === 0 ? (
                        <p className="px-3 py-3 text-[11px] text-muted-foreground/50">—</p>
                      ) : (
                        <div className="p-1.5 space-y-1">
                          {dayAppts.map((a) => <Tile key={a.id} a={a} />)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-px bg-border rounded-md overflow-hidden border border-border flex-1 min-h-[420px]">
                {weekDays.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayAppts = appointmentsByDay.get(key) || [];
                  const today = isToday(day);
                  return (
                    <div key={key} className={cn("bg-card flex flex-col h-full", today ? "ring-1 ring-inset ring-foreground/40" : "")}>
                      <div className={cn("px-2 py-1.5 text-center border-b border-border/60", today ? "bg-foreground/5" : "")}>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{format(day, "EEE", { locale: nl })}</p>
                        <p className={cn("text-sm font-semibold", today ? "text-foreground" : "")}>{format(day, "d")}</p>
                      </div>
                      <div className="flex-1 p-1 space-y-1 overflow-y-auto">
                        {dayAppts.map((a) => <Tile key={a.id} a={a} dense />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <OpenstaandeAanvragen aanvragen={aanvragen} onUpdate={updateAppointment} />

            {todayPrep.length > 0 && (
              <div className="bg-card border border-border rounded-md p-3 sm:p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Car className="w-4 h-4 text-muted-foreground" /> Voertuigen klaarmaken vandaag
                </h3>
                <div className="space-y-2">
                  {todayPrep.map((a) => (
                    <div key={a.id} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("w-2 h-2 rounded-full flex-shrink-0", typeDotColors[a.type])} />
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
                      ><Check className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: detail panel (desktop only) */}
          {!isMobile && (
            <aside className="lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] flex flex-col lg:pt-[44px]">
              {selected ? (
                <AppointmentDetailPanel
                  appointment={selected}
                  onUpdate={updateAppointment}
                  onDelete={async (id) => { await deleteAppointment(id); setSelectedId(null); }}
                  onEdit={() => setMobileDialogId(selected.id)}
                  onClose={() => setSelectedId(null)}
                  showClose
                />
              ) : (
                <div className="bg-card border border-border rounded-[6px] p-5 flex flex-col flex-1 min-h-0">
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <Clock className="w-4 h-4" />
                    <h3 className="text-sm font-semibold text-foreground">Aankomende afspraken</h3>
                  </div>
                  {upcoming.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-6 text-center flex-1">Geen aankomende afspraken</p>
                  ) : (
                    <div className="space-y-1.5 flex-1 overflow-y-auto min-h-0 pr-1">
                      {upcoming.map((a) => (
                        <button key={a.id} onClick={() => openAppt(a)}
                          className="w-full text-left bg-background/40 hover:bg-accent/30 border border-border/40 rounded-[3px] px-3 py-2 transition-colors">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", typeDotColors[a.type])} />
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              {format(new Date(a.datum_tijd), "EEE d MMM · HH:mm", { locale: nl })}
                            </span>
                          </div>
                          {a.customer && <p className="text-sm truncate text-foreground">{a.customer.voornaam} {a.customer.achternaam}</p>}
                          {a.vehicle && <p className="text-[11px] text-muted-foreground truncate">{a.vehicle.merk} {a.vehicle.model}</p>}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground/60 pt-3 mt-3 border-t border-border/40 inline-flex items-center gap-1.5">
                    <CalendarIcon className="w-3 h-3" /> Klik op een afspraak om details te zien
                  </p>
                </div>
              )}
            </aside>
          )}
        </div>
      ) : (
        /* List view */
        <div className="space-y-3">
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

          {filteredAppointments.length === 0 ? (
            <div className="bg-card border border-border rounded-md py-12 text-center text-sm text-muted-foreground">
              Geen afspraken gevonden
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
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((a) => {
                      const isPast = new Date(a.datum_tijd) < new Date() && a.status === "gepland";
                      return (
                        <tr key={a.id} onClick={() => setMobileDialogId(a.id)}
                          className={cn("border-b border-border/50 hover:bg-accent/10 cursor-pointer transition-colors", isPast ? "opacity-60" : "")}>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <p className="font-medium">{format(new Date(a.datum_tijd), "d MMM yyyy", { locale: nl })}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(a.datum_tijd), "HH:mm")}</p>
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge className={cn("border text-[10px]", typeColors[a.type])}>{typeLabels[a.type]}</Badge>
                          </td>
                          <td className="px-4 py-2.5">
                            {a.customer ? <p className="truncate max-w-[150px]">{a.customer.voornaam} {a.customer.achternaam}</p> : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-4 py-2.5">
                            {a.vehicle ? (
                              <div className="min-w-0">
                                <p className="truncate max-w-[140px]">{a.vehicle.merk} {a.vehicle.model}</p>
                                {a.vehicle.kenteken && <p className="text-[11px] text-muted-foreground">{a.vehicle.kenteken}</p>}
                              </div>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge variant={a.status === "voltooid" ? "default" : a.status === "geannuleerd" ? "destructive" : "secondary"} className="text-[10px]">
                              {a.status === "gepland" ? "Gepland" : a.status === "voltooid" ? "Voltooid" : "Geannuleerd"}
                            </Badge>
                          </td>
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
      <AppointmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customers={customers}
        vehicles={activeVehicles}
        allVehicles={allSelectableVehicles}
        onSubmit={addAppointment}
        anchorRect={formAnchorRect}
      />
      <AppointmentDetailDialog
        appointment={mobileDialogAppt}
        open={!!mobileDialogAppt}
        onOpenChange={(v) => { if (!v) setMobileDialogId(null); }}
        onUpdate={updateAppointment}
        onDelete={deleteAppointment}
      />
    </div>
  );
};

export default AdminPlanningPage;

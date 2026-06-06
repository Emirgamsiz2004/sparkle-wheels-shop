import { useMemo, useState, useRef } from "react";
import { format, isSameDay, isToday } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Appointment, typeDotColors, typeLabels } from "@/hooks/useAppointments";

interface Props {
  weekDays: Date[];
  appointments: Appointment[];
  selectedId: string | null;
  onAppointmentClick: (a: Appointment, rect: DOMRect) => void;
}

// 08:00 → 20:00, 30-min rows
const START_HOUR = 8;
const END_HOUR = 20;
const SLOT_MIN = 30;
const ROW_PX = 28; // height per 30-min row
const TOTAL_ROWS = ((END_HOUR - START_HOUR) * 60) / SLOT_MIN;
const GRID_HEIGHT = TOTAL_ROWS * ROW_PX;

const minutesFromStart = (d: Date) =>
  (d.getHours() - START_HOUR) * 60 + d.getMinutes();

const WeekTimeGrid = ({ weekDays, appointments, selectedId, onAppointmentClick }: Props) => {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hour labels
  const hours = useMemo(
    () => Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i),
    []
  );

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

  const hoverAppt = hoverId ? appointments.find((a) => a.id === hoverId) : null;

  return (
    <div ref={containerRef} className="relative border border-border rounded-[3px] overflow-hidden bg-card">
      {/* Header row: day names */}
      <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-border bg-accent/10">
        <div className="border-r border-border" />
        {weekDays.map((day) => {
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "px-2 py-2 text-center border-r border-border last:border-r-0",
                today && "bg-foreground/5"
              )}
            >
              <p className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground font-semibold">
                {format(day, "EEE", { locale: nl })}
              </p>
              <p className={cn(
                "text-sm font-semibold tabular-nums leading-tight mt-0.5",
                today ? "text-foreground" : "text-foreground/80"
              )}>
                {format(day, "d")}
              </p>
            </div>
          );
        })}
      </div>

      {/* Time grid body */}
      <div className="grid grid-cols-[48px_repeat(7,1fr)] relative" style={{ height: GRID_HEIGHT }}>
        {/* Hours column */}
        <div className="border-r border-border relative">
          {hours.slice(0, -1).map((h, i) => (
            <div
              key={h}
              className="absolute right-1.5 text-[10px] text-muted-foreground tabular-nums leading-none"
              style={{ top: i * ROW_PX * 2 - 4 }}
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayAppts = appointmentsByDay.get(key) || [];
          const today = isToday(day);

          return (
            <div
              key={key}
              className={cn(
                "relative border-r border-border last:border-r-0",
                today && "bg-foreground/[0.02]"
              )}
            >
              {/* Horizontal hour grid lines */}
              {hours.slice(0, -1).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-border/40"
                  style={{ top: (i + 1) * ROW_PX * 2 }}
                />
              ))}

              {/* Appointment blocks */}
              {dayAppts.map((a) => {
                const start = new Date(a.datum_tijd);
                const end = a.eind_datum_tijd ? new Date(a.eind_datum_tijd) : new Date(start.getTime() + 30 * 60000);
                const topMin = Math.max(0, minutesFromStart(start));
                const durMin = Math.max(15, (end.getTime() - start.getTime()) / 60000);
                const top = (topMin / SLOT_MIN) * ROW_PX;
                const height = Math.max(16, (durMin / SLOT_MIN) * ROW_PX - 2);

                if (topMin >= (END_HOUR - START_HOUR) * 60) return null;

                const isSelected = selectedId === a.id;
                const past = end < new Date() && a.status === "gepland";
                const completed = a.status === "voltooid";
                const name = a.customer
                  ? `${a.customer.voornaam} ${a.customer.achternaam}`
                  : a.klant_naam_los || typeLabels[a.type];

                return (
                  <button
                    key={a.id}
                    onClick={(e) => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      onAppointmentClick(a, rect);
                    }}
                    onMouseEnter={(e) => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setHoverId(a.id);
                      setHoverPos({ top: rect.top, left: rect.right });
                    }}
                    onMouseLeave={() => {
                      setHoverId((cur) => (cur === a.id ? null : cur));
                    }}
                    className={cn(
                      "absolute left-0.5 right-0.5 rounded-[3px] px-1.5 py-0.5 text-left overflow-hidden transition-all border",
                      "hover:z-10 hover:shadow-lg",
                      completed
                        ? "bg-muted/40 border-border/60 opacity-60"
                        : past
                          ? "bg-accent/30 border-border opacity-70"
                          : isSelected
                            ? "bg-foreground text-background border-foreground z-10 shadow-lg"
                            : "bg-accent/40 border-border hover:bg-accent/70 hover:border-foreground/40"
                    )}
                    style={{ top, height }}
                  >
                    <div className="flex items-center gap-1 leading-tight">
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", typeDotColors[a.type])} />
                      <span className={cn(
                        "text-[10px] font-semibold tabular-nums",
                        isSelected ? "text-background" : "text-foreground"
                      )}>
                        {format(start, "HH:mm")}
                      </span>
                    </div>
                    {height >= 28 && (
                      <div className={cn(
                        "text-[10px] truncate leading-tight mt-0.5",
                        isSelected ? "text-background/85" : "text-foreground/75"
                      )}>
                        {name}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Hover tooltip — quick preview */}
      {hoverAppt && hoverPos && (
        <div
          className="fixed z-[60] pointer-events-none animate-in fade-in-0 zoom-in-95 duration-100"
          style={{
            top: hoverPos.top,
            left: Math.min(hoverPos.left + 6, window.innerWidth - 240),
          }}
        >
          <div className="bg-background border border-border rounded-[3px] shadow-2xl px-3 py-2 min-w-[180px] max-w-[240px]">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", typeDotColors[hoverAppt.type])} />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {typeLabels[hoverAppt.type]}
              </span>
            </div>
            <div className="text-sm font-semibold text-foreground tabular-nums">
              {format(new Date(hoverAppt.datum_tijd), "HH:mm")}
              {hoverAppt.eind_datum_tijd && (
                <span className="text-muted-foreground font-normal"> – {format(new Date(hoverAppt.eind_datum_tijd), "HH:mm")}</span>
              )}
            </div>
            {(hoverAppt.customer || hoverAppt.klant_naam_los) && (
              <div className="text-[12px] text-foreground/85 truncate">
                {hoverAppt.customer
                  ? `${hoverAppt.customer.voornaam} ${hoverAppt.customer.achternaam}`
                  : hoverAppt.klant_naam_los}
              </div>
            )}
            {hoverAppt.vehicle && (
              <div className="text-[11px] text-muted-foreground truncate">
                {hoverAppt.vehicle.merk} {hoverAppt.vehicle.model}
                {hoverAppt.vehicle.kenteken ? ` · ${hoverAppt.vehicle.kenteken}` : ""}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeekTimeGrid;

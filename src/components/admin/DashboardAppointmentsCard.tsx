import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Calendar, ChevronRight } from "lucide-react";
import { format, isSameDay, isAfter, startOfDay } from "date-fns";
import { nl } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useAppointments, typeLabels, typeColors, typeDotColors } from "@/hooks/useAppointments";

const DashboardAppointmentsCard = () => {
  const { appointments, loading } = useAppointments();

  const { today, upcoming } = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const active = appointments.filter((a) => a.status !== "geannuleerd");
    return {
      today: active
        .filter((a) => isSameDay(new Date(a.datum_tijd), now))
        .sort((a, b) => new Date(a.datum_tijd).getTime() - new Date(b.datum_tijd).getTime()),
      upcoming: active
        .filter((a) => isAfter(new Date(a.datum_tijd), todayStart) && !isSameDay(new Date(a.datum_tijd), now))
        .sort((a, b) => new Date(a.datum_tijd).getTime() - new Date(b.datum_tijd).getTime())
        .slice(0, 5),
    };
  }, [appointments]);

  return (
    <div className="bg-card border border-border rounded-md p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Afspraken</h3>
        </div>
        <Link
          to="/admin/planning"
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Bekijk planning
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Type-legend */}
      <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-border">
        {(Object.keys(typeLabels) as Array<keyof typeof typeLabels>).map((t) => (
          <span key={t} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${typeDotColors[t]}`} />
            {typeLabels[t]}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vandaag */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-medium">
            Vandaag · {format(new Date(), "EEEE d MMM", { locale: nl })}
          </p>
          {loading ? (
            <p className="text-xs text-muted-foreground">Laden…</p>
          ) : today.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3">Geen afspraken vandaag</p>
          ) : (
            <div className="space-y-1.5">
              {today.map((a) => (
                <Link
                  key={a.id}
                  to="/admin/planning"
                  className={`block rounded-md border px-3 py-2 text-xs transition-colors hover:opacity-80 ${typeColors[a.type]}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-medium">{format(new Date(a.datum_tijd), "HH:mm")}</span>
                    <Badge className={`${typeColors[a.type]} border text-[10px]`}>
                      {typeLabels[a.type]}
                    </Badge>
                  </div>
                  {a.customer && (
                    <p className="truncate">
                      {a.customer.voornaam} {a.customer.achternaam}
                    </p>
                  )}
                  {a.vehicle && (
                    <p className="text-[11px] opacity-70 truncate">
                      {a.vehicle.merk} {a.vehicle.model}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Aankomend */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-medium">
            Aankomend
          </p>
          {loading ? (
            <p className="text-xs text-muted-foreground">Laden…</p>
          ) : upcoming.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3">Geen aankomende afspraken</p>
          ) : (
            <div className="space-y-1.5">
              {upcoming.map((a) => (
                <Link
                  key={a.id}
                  to="/admin/planning"
                  className="block bg-muted/30 hover:bg-muted/60 border border-border rounded-md px-3 py-2 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${typeDotColors[a.type]}`} />
                    <span className="text-[11px] text-muted-foreground">
                      {format(new Date(a.datum_tijd), "EEE d MMM · HH:mm", { locale: nl })}
                    </span>
                  </div>
                  <Badge className={`${typeColors[a.type]} border text-[10px] mb-1`}>
                    {typeLabels[a.type]}
                  </Badge>
                  {a.customer && (
                    <p className="text-xs truncate">
                      {a.customer.voornaam} {a.customer.achternaam}
                    </p>
                  )}
                  {a.vehicle && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      {a.vehicle.merk} {a.vehicle.model}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardAppointmentsCard;

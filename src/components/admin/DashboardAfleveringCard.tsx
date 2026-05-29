import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { PackageCheck, AlertTriangle, Clock, ArrowRight } from "lucide-react";

interface OpenTaak {
  id: string;
  vehicle_id: string;
  titel: string;
  deadline: string | null;
  vehicle?: { merk: string; model: string; kenteken: string | null };
}

const DashboardAfleveringCard = () => {
  const [items, setItems] = useState<OpenTaak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("aflevering_taken")
        .select("id, vehicle_id, titel, deadline")
        .eq("klaar", false)
        .order("deadline", { ascending: true, nullsFirst: false })
        .limit(15);

      const list = (data || []) as OpenTaak[];
      const ids = Array.from(new Set(list.map((t) => t.vehicle_id)));
      if (ids.length) {
        const { data: vh } = await supabase
          .from("vehicles")
          .select("id, merk, model, kenteken")
          .in("id", ids);
        const map = new Map((vh || []).map((v: any) => [v.id, v]));
        list.forEach((t) => {
          const v = map.get(t.vehicle_id);
          if (v) t.vehicle = { merk: v.merk, model: v.model, kenteken: v.kenteken };
        });
      }
      setItems(list);
      setLoading(false);
    })();
  }, []);

  if (loading || items.length === 0) return null;

  const today = new Date(new Date().toDateString());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const overdue = items.filter((t) => t.deadline && new Date(t.deadline) < today);
  const todayItems = items.filter((t) => t.deadline && new Date(t.deadline).getTime() === today.getTime());

  return (
    <div className="bg-card/50 border border-border rounded-[3px] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PackageCheck className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Openstaande aflever-taken</h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {overdue.length > 0 && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="w-3 h-3" /> {overdue.length} te laat
            </span>
          )}
          {todayItems.length > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <Clock className="w-3 h-3" /> {todayItems.length} vandaag
            </span>
          )}
        </div>
      </div>

      <ul className="space-y-1">
        {items.slice(0, 8).map((t) => {
          const isOverdue = t.deadline && new Date(t.deadline) < today;
          const isToday = t.deadline && new Date(t.deadline).getTime() === today.getTime();
          return (
            <li key={t.id}>
              <Link
                to={`/admin/voertuigen/${t.vehicle_id}`}
                className="flex items-center gap-3 px-3 py-2 rounded-[3px] hover:bg-secondary/40 transition-all group"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isOverdue ? "bg-destructive" : isToday ? "bg-amber-400" : "bg-muted-foreground/40"
                  }`}
                />
                <span className="text-sm flex-1 truncate">{t.titel}</span>
                <span className="text-[11px] text-muted-foreground truncate hidden sm:block">
                  {t.vehicle ? `${t.vehicle.merk} ${t.vehicle.model}${t.vehicle.kenteken ? " · " + t.vehicle.kenteken : ""}` : ""}
                </span>
                {t.deadline && (
                  <span className={`text-[11px] tabular-nums ${
                    isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
                  }`}>
                    {new Date(t.deadline).toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })}
                  </span>
                )}
                <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default DashboardAfleveringCard;

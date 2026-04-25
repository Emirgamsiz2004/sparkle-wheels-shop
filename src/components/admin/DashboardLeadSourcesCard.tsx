import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  from: Date;
  to: Date;
}

interface SourceRow {
  naam: string;
  aantal: number;
}

export default function DashboardLeadSourcesCard({ from, to }: Props) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SourceRow[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      // Haal alle afgesloten verkopen in periode op
      const { data, error } = await supabase
        .from("verkopen" as any)
        .select("lead_source, lead_source_anders, wizard_status, verkoop_datum, created_at")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString());

      if (cancelled) return;
      if (error || !data) {
        setRows([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      const counts = new Map<string, number>();
      let count = 0;
      for (const r of data as any[]) {
        const src = (r.lead_source as string | null)?.trim();
        if (!src) continue;
        const label =
          src === "Anders" && r.lead_source_anders ? `Anders: ${r.lead_source_anders}` : src;
        counts.set(label, (counts.get(label) || 0) + 1);
        count++;
      }

      const list: SourceRow[] = Array.from(counts.entries())
        .map(([naam, aantal]) => ({ naam, aantal }))
        .sort((a, b) => b.aantal - a.aantal);

      setRows(list);
      setTotal(count);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const max = rows[0]?.aantal || 1;

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h2 className="text-[13px] font-semibold text-foreground mb-4">Herkomst klanten</h2>
      {loading ? (
        <Skeleton className="h-[140px]" />
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">
          Nog geen herkomst data beschikbaar — vul dit in bij klantgegevens in de wizard.
        </p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r, i) => {
            const perc = total > 0 ? ((r.aantal / total) * 100).toFixed(0) : "0";
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[12px] text-muted-foreground w-32 truncate">{r.naam}</span>
                <div className="flex-1 h-5 bg-accent/30 rounded overflow-hidden">
                  <div
                    className="h-full bg-emerald-500/40 rounded"
                    style={{ width: `${(r.aantal / max) * 100}%` }}
                  />
                </div>
                <span className="text-[12px] font-medium tabular-nums text-foreground w-10 text-right">
                  {r.aantal}
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums w-10 text-right">
                  {perc}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

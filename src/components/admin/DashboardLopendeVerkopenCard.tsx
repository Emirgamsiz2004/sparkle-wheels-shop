import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useVehicles } from "@/hooks/useVehicles";

const STAP_NAMEN: Record<number, string> = {
  1: "Voertuig",
  2: "Aflevering & aanbetaling",
  3: "Klantgegevens",
  4: "Garantie",
  5: "Koopovereenkomst",
  6: "Inruil document",
  7: "Factuur",
  8: "Betaling",
  9: "Inruil op naam",
  10: "Vrijwaring & overschrijving",
  11: "Uitlevering",
  12: "Afsluiting",
};

interface LopendeVerkoop {
  id: string;
  vehicle_id: string | null;
  customer_id: string | null;
  wizard_stap: number | null;
  updated_at: string;
  created_at: string;
  klantNaam?: string;
}

const DashboardLopendeVerkopenCard = () => {
  const { vehicles } = useVehicles();
  const [items, setItems] = useState<LopendeVerkoop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: verkopen } = await supabase
        .from("verkopen" as any)
        .select("id, vehicle_id, customer_id, wizard_stap, created_at, updated_at")
        .eq("wizard_status", "bezig")
        .order("updated_at", { ascending: false });

      const rows = (verkopen as any[]) || [];
      const customerIds = Array.from(new Set(rows.map(r => r.customer_id).filter(Boolean)));
      let klantMap: Record<string, string> = {};
      if (customerIds.length > 0) {
        const { data: custs } = await supabase
          .from("customers")
          .select("id, voornaam, achternaam, bedrijfsnaam")
          .in("id", customerIds);
        (custs || []).forEach((c: any) => {
          klantMap[c.id] = c.bedrijfsnaam?.trim()
            ? c.bedrijfsnaam
            : `${c.voornaam || ""} ${c.achternaam || ""}`.trim();
        });
      }
      setItems(rows.map(r => ({ ...r, klantNaam: r.customer_id ? klantMap[r.customer_id] : undefined })));
      setLoading(false);
    };
    load();
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-md">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <ShoppingCart className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-medium text-foreground">Lopende verkopen</h3>
        <span className="text-[11px] text-muted-foreground tabular-nums">({items.length})</span>
      </div>
      <div className="divide-y divide-border">
        {items.map(item => {
          const v = vehicles.find(x => x.id === item.vehicle_id);
          const stap = item.wizard_stap || 1;
          const stapNaam = STAP_NAMEN[stap] || "—";
          const titel = v ? `${v.merk} ${v.model}` : "Onbekend voertuig";
          return (
            <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-foreground truncate">{titel}</p>
                  {v?.kenteken && (
                    <span className="text-[10px] font-mono text-muted-foreground uppercase shrink-0">
                      {v.kenteken}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  Stap {stap}/12 — {stapNaam}
                  {item.klantNaam && <span className="text-muted-foreground/70"> · {item.klantNaam}</span>}
                </p>
              </div>
              {item.vehicle_id && (
                <Link
                  to={`/admin/verkopen/nieuw/${item.vehicle_id}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shrink-0"
                >
                  Hervatten
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardLopendeVerkopenCard;

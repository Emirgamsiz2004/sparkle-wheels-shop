import { useState, useMemo, useEffect } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { Link } from "react-router-dom";
import { Search, Loader2, ChevronRight, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { formatEuro, calcWinst, calcMarge, isConsignatie } from "@/types/vehicle";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import SlidingTabs from "@/components/admin/SlidingTabs";

type TabValue = "in_behandeling" | "afgerond";

const tabs = [
  { label: "In behandeling", value: "in_behandeling" },
  { label: "Afgerond", value: "afgerond" },
];

const AdminVerkopenPage = () => {
  const { vehicles, loading } = useVehicles();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabValue>("in_behandeling");
  const isMobile = useIsMobile();
  const [docStatus, setDocStatus] = useState<Record<string, boolean>>({});
  const [pendingSales, setPendingSales] = useState<any[]>([]);

  // Sold vehicles = afgerond
  const soldVehicles = useMemo(() => vehicles.filter(v => v.status === "verkocht"), [vehicles]);

  // Pending sales: vehicle_sales with status != 'voltooid'
  useEffect(() => {
    const fetchPending = async () => {
      const { data } = await supabase
        .from("vehicle_sales")
        .select("id, vehicle_id, customer_id, verkoopprijs, betaalwijze, wizard_stap, status, created_at, updated_at")
        .neq("status", "voltooid")
        .order("updated_at", { ascending: false });
      setPendingSales(data || []);
    };
    fetchPending();
  }, [vehicles]);

  // Filter afgerond
  const filteredSold = useMemo(() => {
    return soldVehicles.filter(v => {
      if (search) {
        const q = search.toLowerCase();
        return (
          v.merk.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.kenteken?.toLowerCase().includes(q) ||
          v.koperNaam?.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => (b.verkoopDatum || "").localeCompare(a.verkoopDatum || ""));
  }, [soldVehicles, search]);

  // Filter in behandeling — combineer pending sales met voertuiginfo
  const filteredPending = useMemo(() => {
    return pendingSales
      .map(ps => {
        const vehicle = vehicles.find(v => v.id === ps.vehicle_id);
        return vehicle ? { ...ps, vehicle } : null;
      })
      .filter(Boolean)
      .filter((row: any) => {
        if (!search) return true;
        const q = search.toLowerCase();
        const v = row.vehicle;
        return v.merk.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) || v.kenteken?.toLowerCase().includes(q);
      });
  }, [pendingSales, vehicles, search]);

  // Doc completeness for sold
  useEffect(() => {
    if (soldVehicles.length === 0) return;
    const fetchDocs = async () => {
      const ids = soldVehicles.map(v => v.id);
      const { data } = await supabase
        .from("vehicle_documents")
        .select("vehicle_id, type")
        .in("vehicle_id", ids);
      const map: Record<string, Set<string>> = {};
      (data || []).forEach((d: any) => {
        if (!map[d.vehicle_id]) map[d.vehicle_id] = new Set();
        map[d.vehicle_id].add(d.type);
      });
      const required = ["Koopovereenkomst", "Verkoopfactuur", "Vrijwaringsbewijs"];
      const result: Record<string, boolean> = {};
      soldVehicles.forEach(v => {
        const docs = map[v.id] || new Set();
        const hasAllDocs = required.every(r => docs.has(r));
        const hasData = !!(v.koperNaam && v.koperEmail && v.koperTelefoon && v.verkoopDatum && v.verkoopprijs > 0);
        result[v.id] = hasAllDocs && hasData;
      });
      setDocStatus(result);
    };
    fetchDocs();
  }, [soldVehicles]);

  const totals = useMemo(() => {
    let omzet = 0, inkoop = 0, winst = 0, count = 0;
    filteredSold.forEach(v => {
      omzet += v.verkoopprijs || 0;
      inkoop += isConsignatie(v) ? 0 : v.inkoopprijs;
      winst += calcWinst(v);
      count++;
    });
    return { omzet, inkoop, winst, gemMarge: count > 0 ? (inkoop > 0 ? (winst / inkoop) * 100 : 0) : 0, count };
  }, [filteredSold]);

  const handleExport = () => {
    const headers = ["Verkoopdatum", "Merk", "Model", "Bouwjaar", "Kenteken", "Koper", "Inkoopprijs", "Verkoopprijs", "Marge €", "Marge %"];
    const rows = filteredSold.map(v => [
      v.verkoopDatum || "", v.merk, v.model, v.bouwjaar, v.kenteken || "",
      v.koperNaam || "", v.inkoopprijs, v.verkoopprijs, calcWinst(v).toFixed(0), calcMarge(v).toFixed(1),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `verkoop_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium text-foreground">Verkoop</h1>
          <p className="text-sm text-muted-foreground">
            {filteredPending.length} in behandeling · {soldVehicles.length} afgerond
          </p>
        </div>
        {tab === "afgerond" && (
          <button onClick={handleExport} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        )}
      </div>

      <div className="space-y-3 overflow-hidden">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          <SlidingTabs tabs={tabs} value={tab} onChange={(v) => setTab(v as TabValue)} className="min-w-max" />
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Zoek op klantnaam, merk, model, kenteken..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-xs pl-8 pr-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {tab === "in_behandeling" ? (
        filteredPending.length === 0 ? (
          <div className="bg-card rounded-lg border border-border px-4 py-12 text-center text-sm text-muted-foreground">
            Geen verkopen in behandeling.
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredPending.map((row: any) => {
              const v = row.vehicle;
              return (
                <Link
                  key={row.id}
                  to={`/admin/voertuigen/${v.id}`}
                  className="flex items-center justify-between gap-3 bg-card border border-border rounded-lg p-3 hover:bg-accent/20 active:bg-accent/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{v.merk} {v.model}</p>
                      <span className="text-xs text-muted-foreground">({v.bouwjaar})</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {v.kenteken && <span className="text-[10px] font-mono text-muted-foreground uppercase">{v.kenteken}</span>}
                      <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        Stap {row.wizard_stap || 1} / 5
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      {row.verkoopprijs > 0 && <span className="text-xs text-muted-foreground tabular-nums">{formatEuro(row.verkoopprijs)}</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                </Link>
              );
            })}
          </div>
        )
      ) : (
        <>
          {/* Totals voor afgerond */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <TotalCard label="Omzet" value={formatEuro(totals.omzet)} />
            <TotalCard label="Inkoop" value={formatEuro(totals.inkoop)} />
            <TotalCard label="Winst" value={formatEuro(totals.winst)} color={totals.winst >= 0 ? "text-emerald-500" : "text-red-500"} />
            <TotalCard label="Gem. marge" value={`${totals.gemMarge.toFixed(1)}%`} color={totals.gemMarge >= 0 ? "text-emerald-500" : "text-red-500"} />
          </div>

          {filteredSold.length === 0 ? (
            <div className="bg-card rounded-lg border border-border px-4 py-12 text-center text-sm text-muted-foreground">
              Geen afgeronde verkopen gevonden.
            </div>
          ) : isMobile ? (
            <div className="space-y-1.5">
              {filteredSold.map(v => {
                const winst = calcWinst(v);
                const complete = docStatus[v.id];
                return (
                  <Link
                    key={v.id}
                    to={`/admin/verkopen/${v.id}`}
                    className="flex items-center justify-between gap-3 bg-card border border-border rounded-lg p-3 active:bg-accent/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{v.merk} {v.model}</p>
                        <span className="text-xs text-muted-foreground">({v.bouwjaar})</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {v.kenteken && <span className="text-[10px] font-mono text-muted-foreground uppercase">{v.kenteken}</span>}
                        {v.koperNaam && <span className="text-[10px] text-muted-foreground">· {v.koperNaam}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-muted-foreground">{formatEuro(v.verkoopprijs)}</span>
                        <span className={`text-xs font-medium tabular-nums ${winst >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatEuro(winst)}</span>
                        {complete !== undefined && (
                          complete ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <AlertCircle className="w-3 h-3 text-amber-400" />
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Verkoopdatum", "Voertuig", "Kenteken", "Koper", "Inkoopprijs", "Verkoopprijs", "Marge", "Dossier"].map((h, i) => (
                        <th key={h} className={`${i >= 4 && i <= 6 ? "text-right" : i === 7 ? "text-center" : "text-left"} px-4 py-2.5 text-xs font-medium text-muted-foreground`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSold.map(v => {
                      const winst = calcWinst(v);
                      const marge = calcMarge(v);
                      const complete = docStatus[v.id];
                      return (
                        <tr key={v.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors cursor-pointer" onClick={() => window.location.href = `/admin/verkopen/${v.id}`}>
                          <td className="px-4 py-2.5 text-muted-foreground text-xs whitespace-nowrap">
                            {v.verkoopDatum ? new Date(v.verkoopDatum).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-foreground hover:underline">{v.merk} {v.model} <span className="text-muted-foreground">({v.bouwjaar})</span></span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-muted-foreground text-xs font-mono uppercase whitespace-nowrap">{v.kenteken || "—"}</span>
                          </td>
                          <td className="px-4 py-2.5 text-sm">{v.koperNaam || "—"}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            {isConsignatie(v) ? <span className="text-muted-foreground text-xs">{v.consignatieCommissiePerc || 10}%</span> : formatEuro(v.inkoopprijs)}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{formatEuro(v.verkoopprijs)}</td>
                          <td className={`px-4 py-2.5 text-right font-medium tabular-nums ${winst >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {formatEuro(winst)} <span className="text-xs font-normal opacity-60">({marge.toFixed(0)}%)</span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {complete !== undefined && (
                              complete
                                ? <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded bg-emerald-500/15 text-emerald-400">Compleet</span>
                                : <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded bg-amber-500/15 text-amber-400">Ontbrekend</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const TotalCard = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <div className="bg-card border border-border rounded-lg p-3">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className={`text-base font-semibold tabular-nums ${color || ""}`}>{value}</p>
  </div>
);

export default AdminVerkopenPage;

import { useState, useMemo } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { Link } from "react-router-dom";
import { Search, Loader2, Eye, ChevronRight, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { formatEuro, calcWinst, calcMarge, isConsignatie, Vehicle } from "@/types/vehicle";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import SlidingTabs from "@/components/admin/SlidingTabs";

const periodTabs = [
  { label: "Alles", value: "alles" },
  { label: "Deze week", value: "week" },
  { label: "Deze maand", value: "maand" },
  { label: "Dit kwartaal", value: "kwartaal" },
  { label: "Dit jaar", value: "jaar" },
];

function getFilterRange(period: string): { start: Date | null; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  if (period === "alles") return { start: null, end };
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "week") {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
  } else if (period === "maand") {
    start.setDate(1);
  } else if (period === "kwartaal") {
    const q = Math.floor(start.getMonth() / 3) * 3;
    start.setMonth(q, 1);
  } else if (period === "jaar") {
    start.setMonth(0, 1);
  }
  return { start, end };
}

const AdminVerkopenPage = () => {
  const { vehicles, loading } = useVehicles();
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("alles");
  const isMobile = useIsMobile();
  const [docStatus, setDocStatus] = useState<Record<string, boolean>>({});

  // Only sold vehicles
  const soldVehicles = useMemo(() => vehicles.filter(v => v.status === "verkocht"), [vehicles]);

  // Filter by period
  const filtered = useMemo(() => {
    const { start } = getFilterRange(period);
    return soldVehicles.filter(v => {
      if (start && v.verkoopDatum) {
        const vd = new Date(v.verkoopDatum);
        if (vd < start) return false;
      } else if (start && !v.verkoopDatum) {
        return false;
      }
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
    }).sort((a, b) => {
      const da = a.verkoopDatum || "";
      const db = b.verkoopDatum || "";
      return db.localeCompare(da);
    });
  }, [soldVehicles, period, search]);

  // Fetch doc completeness for all sold vehicles
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

  // Totals
  const totals = useMemo(() => {
    let omzet = 0, inkoop = 0, winst = 0, count = 0;
    filtered.forEach(v => {
      omzet += v.verkoopprijs || 0;
      inkoop += isConsignatie(v) ? 0 : v.inkoopprijs;
      winst += calcWinst(v);
      count++;
    });
    return { omzet, inkoop, winst, gemMarge: count > 0 ? (inkoop > 0 ? (winst / inkoop) * 100 : 0) : 0, count };
  }, [filtered]);

  const handleExport = () => {
    const headers = ["Verkoopdatum", "Merk", "Model", "Bouwjaar", "Kenteken", "Koper", "Inkoopprijs", "Verkoopprijs", "Marge €", "Marge %"];
    const rows = filtered.map(v => [
      v.verkoopDatum || "",
      v.merk,
      v.model,
      v.bouwjaar,
      v.kenteken || "",
      v.koperNaam || "",
      v.inkoopprijs,
      v.verkoopprijs,
      calcWinst(v).toFixed(0),
      calcMarge(v).toFixed(1),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `verkopen_export_${new Date().toISOString().slice(0, 10)}.csv`;
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
          <h1 className="text-lg font-medium text-foreground">Verkopen</h1>
          <p className="text-sm text-muted-foreground">{soldVehicles.length} verkocht</p>
        </div>
        <button onClick={handleExport} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      <div className="space-y-3 overflow-hidden">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          <SlidingTabs tabs={periodTabs} value={period} onChange={setPeriod} className="min-w-max" />
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

      {/* Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <TotalCard label="Omzet" value={formatEuro(totals.omzet)} />
        <TotalCard label="Inkoop" value={formatEuro(totals.inkoop)} />
        <TotalCard label="Winst" value={formatEuro(totals.winst)} color={totals.winst >= 0 ? "text-emerald-500" : "text-red-500"} />
        <TotalCard label="Gem. marge" value={`${totals.gemMarge.toFixed(1)}%`} color={totals.gemMarge >= 0 ? "text-emerald-500" : "text-red-500"} />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-lg border border-border px-4 py-12 text-center text-sm text-muted-foreground">
          Geen verkopen gevonden in deze periode.
        </div>
      ) : isMobile ? (
        <div className="space-y-1.5">
          {filtered.map(v => {
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
                      complete
                        ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        : <AlertCircle className="w-3 h-3 text-amber-400" />
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
                  {["Verkoopdatum", "Voertuig", "Kenteken", "Koper", "Inkoopprijs", "Verkoopprijs", "Marge", "Dossier", ""].map((h, i) => (
                    <th key={h || i} className={`${i >= 4 && i <= 6 ? "text-right" : i >= 7 ? "text-center" : "text-left"} px-4 py-2.5 text-xs font-medium text-muted-foreground`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => {
                  const winst = calcWinst(v);
                  const marge = calcMarge(v);
                  const complete = docStatus[v.id];
                  return (
                    <tr key={v.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-2.5 text-muted-foreground text-xs whitespace-nowrap">
                        {v.verkoopDatum ? new Date(v.verkoopDatum).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <Link to={`/admin/verkopen/${v.id}`} className="text-foreground hover:underline">
                          {v.merk} {v.model} <span className="text-muted-foreground">({v.bouwjaar})</span>
                        </Link>
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
                      <td className="px-4 py-2.5 text-center">
                        <Link to={`/admin/verkopen/${v.id}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-accent/30">
                  <td className="px-4 py-2.5 text-xs font-medium text-muted-foreground" colSpan={4}>Totaal ({filtered.length} verkopen)</td>
                  <td className="px-4 py-2.5 text-right text-xs font-medium tabular-nums">{formatEuro(totals.inkoop)}</td>
                  <td className="px-4 py-2.5 text-right text-xs font-medium tabular-nums">{formatEuro(totals.omzet)}</td>
                  <td className={`px-4 py-2.5 text-right text-xs font-medium tabular-nums ${totals.winst >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {formatEuro(totals.winst)} <span className="opacity-60">({totals.gemMarge.toFixed(1)}%)</span>
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
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

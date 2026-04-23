import { useState, useMemo, useEffect } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { Link } from "react-router-dom";
import { Search, Loader2, ChevronRight, Download, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { formatEuro, calcWinst, calcMarge, isConsignatie } from "@/types/vehicle";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { BADGE_BASE } from "@/components/admin/StatusBadge";

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

interface PendingSale {
  id: string;
  vehicle_id: string | null;
  customer_id: string | null;
  wizard_stap: number | null;
  created_at: string;
  updated_at: string;
  klantNaam?: string;
}

const AdminVerkopenPage = () => {
  const { vehicles, loading } = useVehicles();
  const [search, setSearch] = useState("");
  const [showInBehandeling, setShowInBehandeling] = useState(false);
  const [showAfgerond, setShowAfgerond] = useState(false);
  const isMobile = useIsMobile();
  const [docStatus, setDocStatus] = useState<Record<string, boolean>>({});
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);

  const soldVehicles = useMemo(() => vehicles.filter(v => v.status === "verkocht"), [vehicles]);

  useEffect(() => {
    const fetchPending = async () => {
      const { data } = await supabase
        .from("verkopen" as any)
        .select("id, vehicle_id, customer_id, wizard_stap, created_at, updated_at")
        .eq("wizard_status", "bezig")
        .order("updated_at", { ascending: false });

      const rows = (data as any[]) || [];
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
      setPendingSales(rows.map(r => ({ ...r, klantNaam: r.customer_id ? klantMap[r.customer_id] : undefined })));
    };
    fetchPending();
  }, [vehicles]);

  const matchesSearch = (v: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.merk?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      v.kenteken?.toLowerCase().includes(q) ||
      v.koperNaam?.toLowerCase().includes(q)
    );
  };

  const filteredSold = useMemo(
    () => soldVehicles.filter(matchesSearch).sort((a, b) => (b.verkoopDatum || "").localeCompare(a.verkoopDatum || "")),
    [soldVehicles, search]
  );

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
        return (
          row.vehicle.merk?.toLowerCase().includes(q) ||
          row.vehicle.model?.toLowerCase().includes(q) ||
          row.vehicle.kenteken?.toLowerCase().includes(q) ||
          row.klantNaam?.toLowerCase().includes(q)
        );
      });
  }, [pendingSales, vehicles, search]);

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

  // Default: alles zichtbaar als geen filter actief is
  const noFilter = !showInBehandeling && !showAfgerond;
  const showPending = noFilter || showInBehandeling;
  const showSold = noFilter || showAfgerond;

  const FilterButton = ({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) => (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground"
      }`}
    >
      {label}
      <span className={`tabular-nums ${active ? "opacity-70" : "opacity-60"}`}>{count}</span>
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium text-foreground">Verkoop</h1>
          <p className="text-sm text-muted-foreground">
            {filteredPending.length} in behandeling · {soldVehicles.length} afgerond
          </p>
        </div>
        {showSold && (
          <button onClick={handleExport} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <FilterButton
            active={showInBehandeling}
            onClick={() => setShowInBehandeling(v => !v)}
            label="In behandeling"
            count={filteredPending.length}
          />
          <FilterButton
            active={showAfgerond}
            onClick={() => setShowAfgerond(v => !v)}
            label="Afgerond"
            count={filteredSold.length}
          />
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

      {showPending && (
        <div className="space-y-2">
          {noFilter && <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">In behandeling</h2>}
          {filteredPending.length === 0 ? (
            <div className="bg-card rounded-lg border border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Geen verkopen in behandeling.
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredPending.map((row: any) => {
                const v = row.vehicle;
                const stap = row.wizard_stap || 1;
                const stapNaam = STAP_NAMEN[stap] || "—";
                const startDatum = new Date(row.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
                return (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-3 bg-card border border-border rounded-lg p-3 hover:bg-accent/20 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground">{v.merk} {v.model}</p>
                        {v.kenteken && <span className="text-[10px] font-mono text-muted-foreground uppercase">{v.kenteken}</span>}
                        <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          Stap {stap}/12
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Klant: <span className="text-foreground/80">{row.klantNaam || "Klant nog niet ingevuld"}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Gestopt bij stap {stap} van 12 — {stapNaam}
                      </p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                        Gestart op {startDatum}
                      </p>
                    </div>
                    <Link
                      to={`/admin/verkopen/nieuw/${v.id}`}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shrink-0"
                    >
                      Wizard hervatten
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showSold && (
        <div className="space-y-3">
          {noFilter && <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Afgerond</h2>}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <TotalCard label="Omzet" value={formatEuro(totals.omzet)} />
            <TotalCard label="Inkoop" value={formatEuro(totals.inkoop)} />
            <TotalCard label="Winst" value={formatEuro(totals.winst)} color={totals.winst >= 0 ? "text-emerald-500" : "text-red-500"} />
            <TotalCard label="Gem. marge" value={`${totals.gemMarge.toFixed(1)}%`} color={totals.gemMarge >= 0 ? "text-emerald-500" : "text-red-500"} />
          </div>

          {filteredSold.length === 0 ? (
            <div className="bg-card rounded-lg border border-border px-4 py-8 text-center text-sm text-muted-foreground">
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
                    to={`/admin/voertuigen/${v.id}`}
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
                        <th key={h} className={`${i >= 4 && i <= 6 ? "text-right" : i === 7 ? "text-center" : "text-left"} px-3 py-2 text-[11px] font-medium text-muted-foreground`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSold.map(v => {
                      const winst = calcWinst(v);
                      const marge = calcMarge(v);
                      const complete = docStatus[v.id];
                      return (
                        <tr
                          key={v.id}
                          onClick={() => window.location.href = `/admin/voertuigen/${v.id}`}
                          className="border-b border-border/50 hover:bg-muted/70 transition-colors cursor-pointer"
                        >
                          <td className="px-3 py-2.5 text-muted-foreground text-[11px] whitespace-nowrap">
                            {v.verkoopDatum ? new Date(v.verkoopDatum).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-foreground">
                            {v.merk} {v.model} <span className="text-muted-foreground text-xs">({v.bouwjaar})</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-muted-foreground text-[11px] font-mono uppercase whitespace-nowrap">{v.kenteken || "—"}</span>
                          </td>
                          <td className="px-3 py-2.5 text-xs">{v.koperNaam || "—"}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-xs">
                            {isConsignatie(v) ? <span className="text-muted-foreground">{v.consignatieCommissiePerc || 10}%</span> : formatEuro(v.inkoopprijs)}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-xs">{formatEuro(v.verkoopprijs)}</td>
                          <td className={`px-3 py-2.5 text-right font-medium tabular-nums text-xs ${winst >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {formatEuro(winst)} <span className="text-[10px] font-normal opacity-60">({marge.toFixed(0)}%)</span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {complete !== undefined && (
                              complete
                                ? <span className={`${BADGE_BASE} bg-emerald-500/15 text-emerald-400 border-emerald-500/30`}>Compleet</span>
                                : <span className={`${BADGE_BASE} bg-amber-500/15 text-amber-400 border-amber-500/30`}>Ontbrekend</span>
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

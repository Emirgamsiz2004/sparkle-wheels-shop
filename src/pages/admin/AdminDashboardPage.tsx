import { useState, useMemo } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { useTestDrives } from "@/hooks/useTestDrives";
import { useDashboardData, getPeriodRange, calcTrend, PeriodKey } from "@/hooks/useDashboardData";
import { formatEuro, isConsignatie } from "@/types/vehicle";
import {
  Loader2, TrendingUp, TrendingDown, Minus, Download,
  Calendar as CalendarIcon, ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

/* ─── Constants ─── */
const periodLabels: Record<PeriodKey, string> = {
  vandaag: "Vandaag", week: "Deze week", maand: "Deze maand",
  kwartaal: "Dit kwartaal", jaar: "Dit jaar", custom: "Aangepast",
};

const DONUT_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];

/* ─── Trend arrow ─── */
function Trend({ current, previous }: { current: number; previous: number }) {
  const t = calcTrend(current, previous);
  if (t === 0) return <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground"><Minus className="w-3 h-3" />0%</span>;
  const up = t > 0;
  return (
    <span className={`flex items-center gap-0.5 text-[11px] font-medium ${up ? "text-emerald-500" : "text-red-400"}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? "+" : ""}{t.toFixed(1)}%
    </span>
  );
}

/* ─── KPI card (compact) ─── */
function KpiCard({ label, value, compare, current, previous }: {
  label: string; value: string; compare?: boolean; current?: number; previous?: number;
}) {
  return (
    <div className="bg-card border border-border rounded-md p-3 sm:p-4">
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-semibold tabular-nums text-foreground">{value}</p>
      {compare && current !== undefined && previous !== undefined && (
        <div className="mt-1.5"><Trend current={current} previous={previous} /></div>
      )}
    </div>
  );
}

/* ─── Euro tooltip formatter ─── */
const euroFormatter = (val: number) => formatEuro(val);

/* ─── Main ─── */
const AdminDashboardPage = () => {
  const { vehicles, loading: vLoading } = useVehicles();
  const { testDrives, loading: tdLoading } = useTestDrives();
  const [period, setPeriod] = useState<PeriodKey>("maand");
  const [compare, setCompare] = useState(true);
  const [customFrom, setCustomFrom] = useState<Date>();
  const [customTo, setCustomTo] = useState<Date>();

  const range = useMemo(() => getPeriodRange(period, customFrom, customTo), [period, customFrom, customTo]);
  const data = useDashboardData(vehicles, testDrives, range, compare);
  const loading = vLoading || tdLoading;

  const { kpis, chartData, voorraadStats, populariteit, margeAnalyse, inkoopAnalyse, proefritStats, proefritAnalyse, financieel, activities } = data;

  // Brandstof verdeling voor donut
  const brandstofData = useMemo(() => {
    const total = populariteit.brandstofVerkopen.reduce((s, b) => s + b.aantal, 0);
    return populariteit.brandstofVerkopen.slice(0, 5).map(b => ({
      name: b.naam, value: b.aantal, perc: total > 0 ? ((b.aantal / total) * 100).toFixed(1) : "0",
    }));
  }, [populariteit.brandstofVerkopen]);

  // Voorraad tabel data
  const voorraadTabel = useMemo(() => {
    const now = new Date();
    const actief = vehicles.filter(v => v.status !== 'verkocht');
    return actief
      .map(v => {
        const dagen = Math.floor((now.getTime() - new Date(v.inkoopDatum).getTime()) / 86400000);
        return { ...v, dagen };
      })
      .sort((a, b) => b.dagen - a.dagen)
      .slice(0, 8);
  }, [vehicles]);

  // Langste stager
  const langsteStager = useMemo(() => {
    if (voorraadTabel.length === 0) return 0;
    return voorraadTabel[0].dagen;
  }, [voorraadTabel]);

  // Totale inkoopwaarde voorraad
  const totaleInkoopVoorraad = useMemo(() => {
    return vehicles.filter(v => v.status !== 'verkocht' && !isConsignatie(v)).reduce((s, v) => s + v.inkoopprijs, 0);
  }, [vehicles]);

  // Inkoop per maand chart
  const inkoopChartData = useMemo(() => inkoopAnalyse.inkoopPerPeriode, [inkoopAnalyse]);

  // Laatste 5 proefriten
  const laatsteProefriten = useMemo(() => {
    return [...testDrives]
      .sort((a, b) => new Date(b.start_tijd).getTime() - new Date(a.start_tijd).getTime())
      .slice(0, 5);
  }, [testDrives]);

  // Export CSV
  const exportCSV = () => {
    const headers = ["Datum", "Voertuig", "Type", "Inkoop", "Kosten", "Verkoop", "Winst"];
    const rows = financieel.transacties.map(t => [t.datum, t.voertuig, t.type, t.inkoop, t.kosten, t.verkoop, t.winst]);
    const csv = [headers, ...rows].map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `transacties-${format(range.from, "yyyy-MM-dd")}-${format(range.to, "yyyy-MM-dd")}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* ─── Header + period selector ─── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Overzicht van je bedrijf</p>
          </div>
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)}
              className="rounded border-border bg-card w-3.5 h-3.5" />
            Vergelijk
          </label>
        </div>
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          <div className="flex items-center gap-1.5 min-w-max">
            {(Object.keys(periodLabels) as PeriodKey[]).filter(k => k !== 'custom').map(k => (
              <button key={k} onClick={() => setPeriod(k)}
                className={`px-2.5 py-1.5 text-[11px] font-medium rounded border transition-colors whitespace-nowrap ${
                  period === k ? "border-border bg-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                {periodLabels[k]}
              </button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <button className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded border transition-colors whitespace-nowrap ${
                  period === 'custom' ? "border-border bg-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                  <CalendarIcon className="w-3 h-3" />
                  {period === 'custom' && customFrom && customTo ? `${format(customFrom, 'dd/MM')} - ${format(customTo, 'dd/MM')}` : "Custom"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="range" selected={{ from: customFrom, to: customTo }}
                  onSelect={(r: any) => { setCustomFrom(r?.from); setCustomTo(r?.to); if (r?.from && r?.to) setPeriod('custom'); }}
                  numberOfMonths={1} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* ═══ BLOK 1 — Omzet grafiek ═══ */}
      <div className="bg-card border border-border rounded-md p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-[13px] font-semibold text-foreground">Omzet</h2>
          <div className="flex items-center gap-4 sm:gap-6">
            {loading ? (
              <><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-16" /></>
            ) : (
              <>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Totale omzet</p>
                  <p className="text-sm font-semibold tabular-nums text-foreground">{formatEuro(kpis.omzet)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Brutowinst</p>
                  <p className="text-sm font-semibold tabular-nums text-emerald-500">{formatEuro(kpis.brutowinst)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Netto marge</p>
                  <p className="text-sm font-semibold tabular-nums text-foreground">{financieel.nettoMargePerc.toFixed(1)}%</p>
                </div>
              </>
            )}
          </div>
        </div>
        {loading ? <Skeleton className="h-[180px] w-full" /> : chartData.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-16">Geen verkopen in deze periode</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} width={40} />
              <RechartsTooltip formatter={euroFormatter} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 3, fontSize: 12 }} />
              <Line type="monotone" dataKey="omzet" stroke="#10b981" strokeWidth={2} dot={false} name="Omzet" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ═══ BLOK 2 — Vier KPI's ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[88px] rounded-lg" />) : (
          <>
            <KpiCard label="Verkochte voertuigen" value={String(kpis.verkocht)} compare={compare} current={kpis.verkocht} previous={kpis.verkochtPrev} />
            <KpiCard label="Gem. marge per voertuig" value={formatEuro(kpis.gemiddeldeMarge)} compare={compare} current={kpis.gemiddeldeMarge} previous={kpis.gemiddeldeMargePrev} />
            <KpiCard label="Gem. verkoopprijs" value={formatEuro(kpis.omzet / Math.max(kpis.verkocht, 1))} />
            <KpiCard label="Gem. stagedagen" value={`${Math.round(kpis.gemStageDagen)} dagen`} compare={compare} current={kpis.gemStageDagen} previous={kpis.gemStageDagenPrev} />
          </>
        )}
      </div>

      {/* ═══ BLOK 3 — Merken + Brandstof ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Meest verkochte merken */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-[13px] font-semibold text-foreground mb-4">Meest verkochte merken</h2>
          {loading ? <Skeleton className="h-[140px]" /> : populariteit.merkVerkopen.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Geen data</p>
          ) : (
            <div className="space-y-2.5">
              {populariteit.merkVerkopen.slice(0, 5).map((m, i) => {
                const max = populariteit.merkVerkopen[0].aantal;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[12px] text-muted-foreground w-24 truncate">{m.naam}</span>
                    <div className="flex-1 h-5 bg-accent/30 rounded overflow-hidden">
                      <div className="h-full bg-emerald-500/40 rounded" style={{ width: `${(m.aantal / max) * 100}%` }} />
                    </div>
                    <span className="text-[12px] font-medium tabular-nums text-foreground w-6 text-right">{m.aantal}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Brandstofverdeling */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-[13px] font-semibold text-foreground mb-4">Brandstofverdeling</h2>
          {loading ? <Skeleton className="h-[140px]" /> : brandstofData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Geen data</p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="w-[120px] h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={brandstofData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" strokeWidth={0}>
                      {brandstofData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex-1">
                {brandstofData.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-[12px]">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span className="text-muted-foreground flex-1">{b.name}</span>
                    <span className="font-medium tabular-nums text-foreground">{b.perc}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ BLOK 4 — Voorraad overzicht ═══ */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] font-semibold text-foreground">Voorraad overzicht</h2>
          <Link to="/admin/voertuigen" className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
            Bekijk alle voorraad <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {loading ? <Skeleton className="h-[200px]" /> : voorraadTabel.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">Geen voertuigen in voorraad</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-[11px] text-muted-foreground">
                  <th className="text-left py-2 pr-3 font-medium">Voertuig</th>
                  <th className="text-left py-2 pr-3 font-medium">Kenteken</th>
                  <th className="text-left py-2 pr-3 font-medium">Inkoopdatum</th>
                  <th className="text-right py-2 pr-3 font-medium">Inkoopprijs</th>
                  <th className="text-right py-2 pr-3 font-medium">Vraagprijs</th>
                  <th className="text-right py-2 font-medium">Dagen</th>
                </tr>
              </thead>
              <tbody>
                {voorraadTabel.map(v => (
                  <tr key={v.id} className={`border-t border-border/40 ${v.dagen > 90 ? "bg-red-500/5" : v.dagen > 60 ? "bg-amber-500/5" : ""}`}>
                    <td className="py-2 pr-3">
                      <Link to={`/admin/voertuigen/${v.id}`} className="text-foreground hover:underline">{v.merk} {v.model}</Link>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{v.kenteken || "—"}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{format(parseISO(v.inkoopDatum), 'dd MMM yyyy', { locale: nl })}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">{isConsignatie(v) ? "—" : formatEuro(v.inkoopprijs)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-foreground">{v.verkoopprijs > 0 ? formatEuro(v.verkoopprijs) : "—"}</td>
                    <td className={`py-2 text-right tabular-nums font-medium ${v.dagen > 90 ? "text-red-400" : v.dagen > 60 ? "text-amber-400" : "text-foreground"}`}>
                      {v.dagen}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ BLOK 5 — Drie voorraad getallen ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[88px] rounded-md" />) : (
          <>
            <KpiCard label="Voertuigen in voorraad" value={String(kpis.voorraad)} />
            <KpiCard label="Langste stager" value={`${langsteStager} dagen`} />
            <KpiCard label="Totale inkoopwaarde" value={formatEuro(totaleInkoopVoorraad)} />
          </>
        )}
      </div>

      {/* ═══ BLOK 6 — Beste verkopen + Marge per merk ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Beste verkopen */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-[13px] font-semibold text-foreground mb-4">Beste verkopen</h2>
          {loading ? <Skeleton className="h-[140px]" /> : margeAnalyse.top5.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Geen data</p>
          ) : (
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border text-[10px] text-muted-foreground">
                  <th className="text-left py-1.5 font-medium">Voertuig</th>
                  <th className="text-right py-1.5 font-medium">Inkoop</th>
                  <th className="text-right py-1.5 font-medium">Verkoop</th>
                  <th className="text-right py-1.5 font-medium">Winst</th>
                </tr>
              </thead>
              <tbody>
                {margeAnalyse.top5.slice(0, 5).map((m, i) => (
                  <tr key={i} className="border-t border-border/40">
                    <td className="py-1.5">
                      <Link to={`/admin/voertuigen/${m.vehicle.id}`} className="text-foreground hover:underline">
                        {m.vehicle.merk} {m.vehicle.model}
                      </Link>
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-muted-foreground">{isConsignatie(m.vehicle) ? "—" : formatEuro(m.vehicle.inkoopprijs)}</td>
                    <td className="py-1.5 text-right tabular-nums text-muted-foreground">{formatEuro(m.vehicle.verkoopprijs)}</td>
                    <td className="py-1.5 text-right tabular-nums font-medium text-emerald-500">+{formatEuro(m.winst)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Marge per merk */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-[13px] font-semibold text-foreground mb-4">Marge per merk</h2>
          {loading ? <Skeleton className="h-[140px]" /> : margeAnalyse.margePerMerk.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Geen data</p>
          ) : (
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border text-[10px] text-muted-foreground">
                  <th className="text-left py-1.5 font-medium">Merk</th>
                  <th className="text-right py-1.5 font-medium">Gem. marge</th>
                </tr>
              </thead>
              <tbody>
                {margeAnalyse.margePerMerk.slice(0, 5).map((m, i) => (
                  <tr key={i} className="border-t border-border/40">
                    <td className="py-1.5 text-foreground">{m.merk}</td>
                    <td className="py-1.5 text-right tabular-nums font-medium text-foreground">{m.margePerc.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ═══ BLOK 7 — Inkoop grafiek + getallen ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-[13px] font-semibold text-foreground mb-4">Inkoop per periode</h2>
          {loading ? <Skeleton className="h-[180px]" /> : inkoopChartData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-12">Geen inkopen in deze periode</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={inkoopChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="aantal" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Ingekocht" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="flex flex-col gap-4">
          {loading ? (
            <><Skeleton className="h-[88px] rounded-lg flex-1" /><Skeleton className="h-[88px] rounded-lg flex-1" /></>
          ) : (
            <>
              <div className="bg-card border border-border rounded-lg p-4 flex-1 flex flex-col justify-center">
                <p className="text-[11px] text-muted-foreground mb-1">Totale inkoop deze periode</p>
                <p className="text-xl font-semibold tabular-nums text-foreground">{formatEuro(financieel.totaleInkoop)}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 flex-1 flex flex-col justify-center">
                <p className="text-[11px] text-muted-foreground mb-1">Gem. inkoopprijs</p>
                <p className="text-xl font-semibold tabular-nums text-foreground">{formatEuro(inkoopAnalyse.gemInkoopprijs)}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══ BLOK 8 — Proefriten ═══ */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-[13px] font-semibold text-foreground mb-4">Proefriten</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
          {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[72px] rounded-lg" />) : (
            <>
              <div className="bg-accent/20 rounded-lg p-3 text-center">
                <p className="text-xl font-semibold tabular-nums text-foreground">{kpis.proefriten}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Totaal proefriten</p>
              </div>
              <div className="bg-accent/20 rounded-lg p-3 text-center">
                <p className="text-xl font-semibold tabular-nums text-foreground">{kpis.conversie.toFixed(1)}%</p>
                <p className="text-[10px] text-muted-foreground mt-1">Conversie naar verkoop</p>
              </div>
              <div className="bg-accent/20 rounded-lg p-3 text-center">
                <p className="text-xl font-semibold tabular-nums text-foreground">{proefritAnalyse.proefritenPerVoertuig.toFixed(1)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Gem. proefriten per verkoop</p>
              </div>
            </>
          )}
        </div>

        {/* Laatste 5 proefriten */}
        {loading ? <Skeleton className="h-[120px]" /> : laatsteProefriten.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Geen proefriten</p>
        ) : (
          <>
            <table className="w-full text-[12px] mb-3">
              <thead>
                <tr className="border-b border-border text-[10px] text-muted-foreground">
                  <th className="text-left py-1.5 font-medium">Datum</th>
                  <th className="text-left py-1.5 font-medium">Klant</th>
                  <th className="text-left py-1.5 font-medium">Voertuig</th>
                  <th className="text-right py-1.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {laatsteProefriten.map(td => {
                  const statusColors: Record<string, string> = {
                    gestart: "bg-blue-500/15 text-blue-400",
                    afgesloten: "bg-emerald-500/15 text-emerald-400",
                    gepland: "bg-amber-500/15 text-amber-400",
                    wacht_op_formulier: "bg-purple-500/15 text-purple-400",
                  };
                  return (
                    <tr key={td.id} className="border-t border-border/40">
                      <td className="py-1.5 text-muted-foreground">{format(parseISO(td.start_tijd), 'dd MMM yyyy', { locale: nl })}</td>
                      <td className="py-1.5 text-foreground">{td.customer_id ? "Klant" : "—"}</td>
                      <td className="py-1.5 text-foreground">{td.voertuig_merk} {td.voertuig_model}</td>
                      <td className="py-1.5 text-right">
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${statusColors[td.status] || "bg-accent text-muted-foreground"}`}>
                          {td.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Link to="/admin/proefriten" className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
              Bekijk alle proefriten <ChevronRight className="w-3 h-3" />
            </Link>
          </>
        )}
      </div>

      {/* ═══ BLOK 9 — Recente activiteit ═══ */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-[13px] font-semibold text-foreground mb-4">Recente activiteit</h2>
        {loading ? <Skeleton className="h-[200px]" /> : activities.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">Geen recente activiteit</p>
        ) : (
          <div className="space-y-2.5">
            {activities.slice(0, 10).map((a, i) => {
              const badges: Record<string, { bg: string; label: string }> = {
                verkocht: { bg: "bg-emerald-500/15 text-emerald-400", label: "Verkocht" },
                ingekocht: { bg: "bg-amber-500/15 text-amber-400", label: "Ingekocht" },
                proefrit: { bg: "bg-blue-500/15 text-blue-400", label: "Proefrit" },
                document: { bg: "bg-purple-500/15 text-purple-400", label: "Document" },
              };
              const badge = badges[a.type] || { bg: "bg-accent text-muted-foreground", label: a.type };
              const link = a.vehicleId ? `/admin/voertuigen/${a.vehicleId}` : a.testDriveId ? `/admin/proefriten` : undefined;
              const content = (
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded shrink-0 ${badge.bg}`}>{badge.label}</span>
                  <span className="text-[13px] text-foreground flex-1 truncate">{a.label}</span>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {(() => { try { return format(parseISO(a.time), 'dd MMM HH:mm', { locale: nl }); } catch { return a.time; } })()}
                  </span>
                </div>
              );
              return link ? (
                <Link key={i} to={link} className="block hover:bg-accent/30 rounded px-1 py-0.5 -mx-1 transition-colors">{content}</Link>
              ) : <div key={i} className="px-1 py-0.5">{content}</div>;
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;

import { useState, useMemo } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { useTestDrives } from "@/hooks/useTestDrives";
import { useDashboardData, getPeriodRange, calcTrend, PeriodKey } from "@/hooks/useDashboardData";
import { formatEuro, statusLabels, statusColors, isConsignatie } from "@/types/vehicle";
import { Loader2, TrendingUp, TrendingDown, Minus, Car, DollarSign, BarChart3, Package, TestTube, ArrowUpRight, ArrowDownRight, Clock, ShoppingCart, Tag, Download, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { format, parseISO, differenceInDays, formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const periodLabels: Record<PeriodKey, string> = {
  vandaag: "Vandaag",
  week: "Deze week",
  maand: "Deze maand",
  kwartaal: "Dit kwartaal",
  jaar: "Dit jaar",
  custom: "Aangepast",
};

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  const trend = calcTrend(current, previous);
  if (trend === 0) return <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground"><Minus className="w-3 h-3" /> 0%</span>;
  const positive = trend > 0;
  return (
    <span className={`flex items-center gap-0.5 text-[11px] font-medium ${positive ? "text-emerald-500" : "text-red-400"}`}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? "+" : ""}{trend.toFixed(1)}%
    </span>
  );
}

const AdminDashboardPage = () => {
  const { vehicles, loading: vLoading } = useVehicles();
  const { testDrives, loading: tdLoading } = useTestDrives();
  const [period, setPeriod] = useState<PeriodKey>("maand");
  const [compare, setCompare] = useState(true);
  const [customFrom, setCustomFrom] = useState<Date>();
  const [customTo, setCustomTo] = useState<Date>();

  const range = useMemo(() => getPeriodRange(period, customFrom, customTo), [period, customFrom, customTo]);
  const { kpis, chartData, voorraadStats, proefritStats, winstVerkopen, activities, financieel } = useDashboardData(vehicles, testDrives, range, compare);

  if (vLoading || tdLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const kpiCards = [
    { label: "Omzet", value: formatEuro(kpis.omzet), current: kpis.omzet, previous: kpis.omzetPrev, icon: DollarSign },
    { label: "Brutowinst", value: formatEuro(kpis.brutowinst), current: kpis.brutowinst, previous: kpis.brutwinstPrev, icon: BarChart3, color: kpis.brutowinst >= 0 },
    { label: "Verkocht", value: String(kpis.verkocht), current: kpis.verkocht, previous: kpis.verkochtPrev, icon: Tag },
    { label: "Gem. marge / auto", value: formatEuro(kpis.gemiddeldeMarge), current: kpis.gemiddeldeMarge, previous: kpis.gemiddeldeMargePrev, icon: ArrowUpRight },
    { label: "In voorraad", value: String(kpis.voorraad), current: kpis.voorraad, previous: kpis.voorraadPrev, icon: Package },
    { label: "Proefriten", value: String(kpis.proefriten), current: kpis.proefriten, previous: kpis.proefritenPrev, icon: TestTube },
  ];

  const exportCSV = () => {
    const headers = ["Datum", "Voertuig", "Type", "Inkoop", "Kosten", "Verkoop", "Winst"];
    const rows = financieel.transacties.map(t => [t.datum, t.voertuig, t.type, t.inkoop, t.kosten, t.verkoop, t.winst]);
    const csv = [headers, ...rows].map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transacties-${format(range.from, "yyyy-MM-dd")}-${format(range.to, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activityIcons: Record<string, typeof Car> = { proefrit: TestTube, verkocht: Tag, ingekocht: ShoppingCart };
  const activityColors: Record<string, string> = { proefrit: "text-blue-400", verkocht: "text-emerald-400", ingekocht: "text-amber-400" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Overzicht van je bedrijf</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(periodLabels) as PeriodKey[]).filter(k => k !== 'custom').map(k => (
            <button
              key={k}
              onClick={() => setPeriod(k)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
                period === k ? "border-border bg-accent/50 text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {periodLabels[k]}
            </button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <button className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
                period === 'custom' ? "border-border bg-accent/50 text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
                <CalendarIcon className="w-3 h-3" />
                {period === 'custom' && customFrom && customTo
                  ? `${format(customFrom, 'dd/MM')} - ${format(customTo, 'dd/MM')}`
                  : "Custom"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: customFrom, to: customTo }}
                onSelect={(r: any) => {
                  setCustomFrom(r?.from);
                  setCustomTo(r?.to);
                  if (r?.from && r?.to) setPeriod('custom');
                }}
                numberOfMonths={2}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer ml-1">
            <input
              type="checkbox"
              checked={compare}
              onChange={e => setCompare(e.target.checked)}
              className="rounded border-border bg-card w-3.5 h-3.5"
            />
            Vergelijk
          </label>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiCards.map(kpi => (
          <div key={kpi.label} className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground">{kpi.label}</span>
              <kpi.icon className="w-3.5 h-3.5 text-muted-foreground/40" />
            </div>
            <p className={`text-xl font-semibold tabular-nums ${
              'color' in kpi ? (kpi.color ? "text-emerald-400" : "text-red-400") : "text-foreground"
            }`}>
              {kpi.value}
            </p>
            {compare && <div className="mt-1.5"><TrendBadge current={kpi.current} previous={kpi.previous} /></div>}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="bg-card rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium text-foreground mb-4">Omzet & Marge</h2>
        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Geen verkoopdata in deze periode</div>
        ) : (
          <div className="space-y-6">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
                  <XAxis dataKey="label" tick={{ fill: 'hsl(0 0% 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(0 0% 50%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(0 0% 8%)', border: '1px solid hsl(0 0% 15%)', borderRadius: '6px', fontSize: 12 }}
                    labelStyle={{ color: 'hsl(0 0% 75%)' }}
                    formatter={(v: number) => [formatEuro(v), '']}
                  />
                  <Line type="monotone" dataKey="omzet" stroke="hsl(0 0% 75%)" strokeWidth={2} dot={false} name="Omzet" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
                  <XAxis dataKey="label" tick={{ fill: 'hsl(0 0% 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(0 0% 50%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(0 0% 8%)', border: '1px solid hsl(0 0% 15%)', borderRadius: '6px', fontSize: 12 }}
                    formatter={(v: number) => [formatEuro(v), '']}
                  />
                  <Bar dataKey="inkoop" stackId="a" fill="hsl(0 0% 30%)" name="Inkoop" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="verkoop" stackId="b" fill="hsl(0 0% 55%)" name="Verkoop" radius={[2, 2, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(0 0% 50%)' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Voorraad + Proefriten */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Voorraad */}
        <div className="bg-card rounded-lg border border-border">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium text-foreground">Voorraad</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[11px] text-muted-foreground">Gem. inkoop</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">{formatEuro(voorraadStats.gemInkoop)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Gem. verkoop</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">{formatEuro(voorraadStats.gemVerkoop)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Gem. dagen</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">{Math.round(voorraadStats.gemDagen)}d</p>
              </div>
            </div>
            {voorraadStats.langstStaand.length > 0 ? (
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">Langst in voorraad</p>
                <div className="space-y-1.5">
                  {voorraadStats.langstStaand.map(v => (
                    <Link key={v.id} to={`/admin/voertuigen/${v.id}`} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-accent/30 transition-colors">
                      <span className="text-xs text-foreground">{v.merk} {v.model}</span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">{differenceInDays(new Date(), parseISO(v.inkoopDatum))}d</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">Geen voertuigen in voorraad</p>
            )}
          </div>
        </div>

        {/* Proefriten */}
        <div className="bg-card rounded-lg border border-border">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium text-foreground">Proefriten</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-muted-foreground">Conversie</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">{proefritStats.conversie.toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Totaal</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">{proefritStats.total}</p>
              </div>
            </div>
            {proefritStats.recent.length > 0 ? (
              <div className="space-y-1.5">
                {proefritStats.recent.map(td => (
                  <div key={td.id} className="flex items-center justify-between py-1.5 px-2 rounded">
                    <span className="text-xs text-foreground">{td.voertuig_merk} {td.voertuig_model}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        td.status === 'afgesloten' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : td.status === 'actief' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {td.status === 'afgesloten' ? 'Klaar' : td.status === 'actief' ? 'Actief' : 'Wacht'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">Geen proefriten in deze periode</p>
            )}
          </div>
        </div>
      </div>

      {/* Winst verkopen + Activiteit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Winst */}
        <div className="bg-card rounded-lg border border-border">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium text-foreground">Winst / Verlies</h2>
          </div>
          <div className="p-4">
            {winstVerkopen.top3.length === 0 && winstVerkopen.bottom3.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Geen verkopen in deze periode</p>
            ) : (
              <div className="space-y-4">
                {winstVerkopen.top3.length > 0 && (
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-2">Meest winstgevend</p>
                    {winstVerkopen.top3.map(({ vehicle: v, winst }) => (
                      <Link key={v.id} to={`/admin/voertuigen/${v.id}`} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-accent/30 transition-colors">
                        <span className="text-xs text-foreground">{v.merk} {v.model}</span>
                        <span className="text-xs font-medium tabular-nums text-emerald-400">{formatEuro(winst)}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {winstVerkopen.bottom3.length > 0 && (
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-2">Minst winstgevend</p>
                    {winstVerkopen.bottom3.map(({ vehicle: v, winst }) => (
                      <Link key={v.id} to={`/admin/voertuigen/${v.id}`} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-accent/30 transition-colors">
                        <span className="text-xs text-foreground">{v.merk} {v.model}</span>
                        <span className={`text-xs font-medium tabular-nums ${winst >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatEuro(winst)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Activiteit */}
        <div className="bg-card rounded-lg border border-border">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium text-foreground">Activiteit</h2>
          </div>
          <div className="p-4">
            {activities.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Geen activiteit in deze periode</p>
            ) : (
              <div className="space-y-1.5">
                {activities.map(a => {
                  const Icon = activityIcons[a.type] || Clock;
                  const color = activityColors[a.type] || "text-muted-foreground";
                  let timeLabel: string;
                  try {
                    timeLabel = formatDistanceToNow(parseISO(a.time), { addSuffix: true, locale: nl });
                  } catch {
                    timeLabel = a.time;
                  }
                  return (
                    <div key={a.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded">
                      <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
                      <span className="text-xs text-foreground flex-1 truncate">{a.label}</span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeLabel}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Financieel Overzicht */}
      <div className="bg-card rounded-lg border border-border">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Financieel overzicht</h2>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium border border-border rounded hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div>
              <p className="text-[11px] text-muted-foreground">Totale inkoop</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">{formatEuro(financieel.totaleInkoop)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Totale kosten</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">{formatEuro(financieel.totaleKosten)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Totale omzet</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">{formatEuro(financieel.totaleOmzet)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Netto marge</p>
              <p className={`text-sm font-semibold tabular-nums ${financieel.nettoMarge >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatEuro(financieel.nettoMarge)}</p>
            </div>
          </div>

          {financieel.transacties.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Geen transacties in deze periode</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-[11px] font-medium text-muted-foreground">Datum</th>
                    <th className="text-left py-2 px-2 text-[11px] font-medium text-muted-foreground">Voertuig</th>
                    <th className="text-left py-2 px-2 text-[11px] font-medium text-muted-foreground hidden sm:table-cell">Type</th>
                    <th className="text-right py-2 px-2 text-[11px] font-medium text-muted-foreground">Inkoop</th>
                    <th className="text-right py-2 px-2 text-[11px] font-medium text-muted-foreground hidden md:table-cell">Kosten</th>
                    <th className="text-right py-2 px-2 text-[11px] font-medium text-muted-foreground">Verkoop</th>
                    <th className="text-right py-2 px-2 text-[11px] font-medium text-muted-foreground">Winst</th>
                  </tr>
                </thead>
                <tbody>
                  {financieel.transacties.map(t => (
                    <tr key={t.id} className="border-t border-border/50 hover:bg-accent/20 transition-colors">
                      <td className="py-2 px-2 text-muted-foreground tabular-nums">{t.datum ? format(parseISO(t.datum), 'dd/MM/yy') : '—'}</td>
                      <td className="py-2 px-2 text-foreground">
                        <Link to={`/admin/voertuigen/${t.id}`} className="hover:underline">{t.voertuig}</Link>
                      </td>
                      <td className="py-2 px-2 text-muted-foreground hidden sm:table-cell">{t.type}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-muted-foreground">{formatEuro(t.inkoop)}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-muted-foreground hidden md:table-cell">{formatEuro(t.kosten)}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-foreground">{formatEuro(t.verkoop)}</td>
                      <td className={`py-2 px-2 text-right tabular-nums font-medium ${t.winst >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatEuro(t.winst)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

import { useState, useMemo } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { useTestDrives } from "@/hooks/useTestDrives";
import { useDashboardData, getPeriodRange, calcTrend, PeriodKey } from "@/hooks/useDashboardData";
import { formatEuro, isConsignatie } from "@/types/vehicle";
import {
  Loader2, TrendingUp, TrendingDown, Minus, Car, DollarSign, BarChart3, Package,
  TestTube, ArrowUpRight, Clock, ShoppingCart, Tag, Download, Calendar as CalendarIcon,
  Percent, Timer, ChevronDown
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, parseISO, differenceInDays, formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const periodLabels: Record<PeriodKey, string> = {
  vandaag: "Vandaag", week: "Deze week", maand: "Deze maand",
  kwartaal: "Dit kwartaal", jaar: "Dit jaar", custom: "Aangepast",
};

const COLORS = ['hsl(0 0% 45%)', 'hsl(0 0% 55%)', 'hsl(0 0% 35%)', 'hsl(0 0% 65%)', 'hsl(0 0% 25%)', 'hsl(0 0% 75%)'];
const chartTooltipStyle = { background: 'hsl(0 0% 8%)', border: '1px solid hsl(0 0% 15%)', borderRadius: '6px', fontSize: 12 };
const axisTick = { fill: 'hsl(0 0% 50%)', fontSize: 11 };

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

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground text-center py-6">{text}</p>;
}

function MiniTable({ headers, rows }: { headers: string[]; rows: (string | number | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead><tr className="border-b border-border">
          {headers.map((h, i) => <th key={i} className={`py-2 px-2 text-[11px] font-medium text-muted-foreground ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-t border-border/50 hover:bg-accent/20 transition-colors">
              {row.map((cell, ci) => <td key={ci} className={`py-1.5 px-2 ${ci > 0 ? 'text-right tabular-nums' : ''} ${ci === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DonutChart({ data, nameKey = 'naam', valueKey = 'aantal' }: { data: any[]; nameKey?: string; valueKey?: string }) {
  if (data.length === 0) return <EmptyState text="Geen data" />;
  return (
    <div className="flex items-center gap-4">
      <div className="w-32 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey={valueKey} nameKey={nameKey} cx="50%" cy="50%" innerRadius={30} outerRadius={55} strokeWidth={1} stroke="hsl(0 0% 10%)">
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={chartTooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-1">
        {data.slice(0, 6).map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="text-muted-foreground flex-1 truncate">{d[nameKey]}</span>
            <span className="text-foreground tabular-nums font-medium">{d[valueKey]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HBarChart({ data, nameKey = 'naam', valueKey = 'aantal' }: { data: any[]; nameKey?: string; valueKey?: string }) {
  if (data.length === 0) return <EmptyState text="Geen data" />;
  const max = Math.max(...data.map(d => d[valueKey]));
  return (
    <div className="space-y-1.5">
      {data.slice(0, 10).map((d, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-24 text-muted-foreground truncate">{d[nameKey]}</span>
          <div className="flex-1 h-4 bg-accent/30 rounded overflow-hidden">
            <div className="h-full bg-muted-foreground/40 rounded" style={{ width: `${(d[valueKey] / max) * 100}%` }} />
          </div>
          <span className="w-8 text-right tabular-nums text-foreground font-medium">{d[valueKey]}</span>
        </div>
      ))}
    </div>
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
  const {
    kpis, chartData, voorraadStats, proefritStats, winstVerkopen, activities, financieel,
    populariteit, margeAnalyse, inkoopAnalyse, verkoopAnalyse, proefritAnalyse,
  } = useDashboardData(vehicles, testDrives, range, compare);

  if (vLoading || tdLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  const kpiCards = [
    { label: "Omzet", value: formatEuro(kpis.omzet), current: kpis.omzet, previous: kpis.omzetPrev, icon: DollarSign },
    { label: "Brutowinst", value: formatEuro(kpis.brutowinst), current: kpis.brutowinst, previous: kpis.brutwinstPrev, icon: BarChart3, color: kpis.brutowinst >= 0 },
    { label: "Verkocht", value: String(kpis.verkocht), current: kpis.verkocht, previous: kpis.verkochtPrev, icon: Tag },
    { label: "Gem. marge", value: `${formatEuro(kpis.gemiddeldeMarge)} (${kpis.gemiddeldeMargePerc.toFixed(0)}%)`, current: kpis.gemiddeldeMarge, previous: kpis.gemiddeldeMargePrev, icon: ArrowUpRight },
    { label: "In voorraad", value: String(kpis.voorraad), current: kpis.voorraad, previous: kpis.voorraadPrev, icon: Package },
    { label: "Proefriten", value: String(kpis.proefriten), current: kpis.proefriten, previous: kpis.proefritenPrev, icon: TestTube },
    { label: "Conversie", value: `${kpis.conversie.toFixed(0)}%`, current: kpis.conversie, previous: kpis.conversiePrev, icon: Percent },
    { label: "Gem. stagedagen", value: `${Math.round(kpis.gemStageDagen)}d`, current: kpis.gemStageDagen, previous: kpis.gemStageDagenPrev, icon: Timer },
  ];

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

  const activityIcons: Record<string, typeof Car> = { proefrit: TestTube, verkocht: Tag, ingekocht: ShoppingCart };
  const activityColors: Record<string, string> = { proefrit: "text-blue-400", verkocht: "text-emerald-400", ingekocht: "text-amber-400" };

  return (
    <div className="space-y-6">
      {/* ─── Header + Period selector ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Overzicht van je bedrijf</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(periodLabels) as PeriodKey[]).filter(k => k !== 'custom').map(k => (
            <button key={k} onClick={() => setPeriod(k)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${period === k ? "border-border bg-accent/50 text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {periodLabels[k]}
            </button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <button className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${period === 'custom' ? "border-border bg-accent/50 text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                <CalendarIcon className="w-3 h-3" />
                {period === 'custom' && customFrom && customTo ? `${format(customFrom, 'dd/MM')} - ${format(customTo, 'dd/MM')}` : "Custom"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="range" selected={{ from: customFrom, to: customTo }}
                onSelect={(r: any) => { setCustomFrom(r?.from); setCustomTo(r?.to); if (r?.from && r?.to) setPeriod('custom'); }}
                numberOfMonths={2} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer ml-1">
            <input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)} className="rounded border-border bg-card w-3.5 h-3.5" />
            Vergelijk
          </label>
        </div>
      </div>

      {/* ─── Sectie 1: KPI Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {kpiCards.map(kpi => (
          <div key={kpi.label} className="bg-card rounded-lg border border-border p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted-foreground leading-tight">{kpi.label}</span>
              <kpi.icon className="w-3 h-3 text-muted-foreground/40" />
            </div>
            <p className={`text-lg font-semibold tabular-nums leading-tight ${
              'color' in kpi ? (kpi.color ? "text-emerald-400" : "text-red-400") : "text-foreground"
            }`}>{kpi.value}</p>
            {compare && <div className="mt-1"><TrendBadge current={kpi.current} previous={kpi.previous} /></div>}
          </div>
        ))}
      </div>

      {/* ─── Omzet chart ─── */}
      <SectionCard title="Omzet & Inkoop vs Verkoop">
        {chartData.length === 0 ? <EmptyState text="Geen verkoopdata in deze periode" /> : (
          <div className="space-y-6">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
                  <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [formatEuro(v), '']} />
                  <Line type="monotone" dataKey="omzet" stroke="hsl(0 0% 75%)" strokeWidth={2} dot={false} name="Omzet" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
                  <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [formatEuro(v), '']} />
                  <Bar dataKey="inkoop" fill="hsl(0 0% 30%)" name="Inkoop" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="verkoop" fill="hsl(0 0% 55%)" name="Verkoop" radius={[2, 2, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(0 0% 50%)' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ─── Sectie 2: Voorraad & doorlooptijd ─── */}
      <SectionCard title="Voorraad & Doorlooptijd">
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><p className="text-[11px] text-muted-foreground">Gem. inkoop</p><p className="text-sm font-semibold tabular-nums text-foreground">{formatEuro(voorraadStats.gemInkoop)}</p></div>
            <div><p className="text-[11px] text-muted-foreground">Gem. verkoop</p><p className="text-sm font-semibold tabular-nums text-foreground">{formatEuro(voorraadStats.gemVerkoop)}</p></div>
            <div><p className="text-[11px] text-muted-foreground">Gem. dagen in voorraad</p><p className="text-sm font-semibold tabular-nums text-foreground">{Math.round(voorraadStats.gemDagen)}d</p></div>
            <div><p className="text-[11px] text-muted-foreground">Voorraad</p><p className="text-sm font-semibold tabular-nums text-foreground">{kpis.voorraad} voertuigen</p></div>
          </div>

          {/* Speed distribution */}
          <div>
            <p className="text-[11px] text-muted-foreground mb-2">Doorlooptijd verdeling (verkocht)</p>
            <div className="grid grid-cols-3 gap-3">
              {[{ label: '< 30 dagen', val: voorraadStats.snelVerkocht, c: 'text-emerald-400' },
                { label: '30-90 dagen', val: voorraadStats.normaal, c: 'text-amber-400' },
                { label: '> 90 dagen', val: voorraadStats.langstanders, c: 'text-red-400' }].map(g => (
                <div key={g.label} className="bg-accent/20 rounded-lg p-3 text-center">
                  <p className={`text-lg font-bold tabular-nums ${g.c}`}>{g.val}</p>
                  <p className="text-[10px] text-muted-foreground">{g.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top 10 langst staand */}
          {voorraadStats.top10Langst.length > 0 && (
            <div>
              <p className="text-[11px] text-muted-foreground mb-2">Top 10 langst in voorraad</p>
              <MiniTable
                headers={['Voertuig', 'Bouwjaar', 'Kenteken', 'Inkoop', 'Inkoopdatum', 'Dagen']}
                rows={voorraadStats.top10Langst.map(v => [
                  <Link to={`/admin/voertuigen/${v.id}`} className="hover:underline text-foreground">{v.merk} {v.model}</Link>,
                  v.bouwjaar, v.kenteken || '—', formatEuro(v.inkoopprijs),
                  v.inkoopDatum ? format(parseISO(v.inkoopDatum), 'dd/MM/yy') : '—',
                  <span className={v.dagen > 90 ? 'text-red-400 font-medium' : v.dagen > 30 ? 'text-amber-400' : 'text-foreground'}>{v.dagen}d</span>,
                ])}
              />
            </div>
          )}

          {/* Doorlooptijd per merk & prijsklasse */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {voorraadStats.doorlooptijdPerMerk.length > 0 && (
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">Doorlooptijd per merk</p>
                <HBarChart data={voorraadStats.doorlooptijdPerMerk} nameKey="merk" valueKey="dagen" />
              </div>
            )}
            <div>
              <p className="text-[11px] text-muted-foreground mb-2">Doorlooptijd per prijsklasse</p>
              {voorraadStats.doorlooptijdPerPrijsklasse.filter(d => d.dagen > 0).length > 0 ? (
                <HBarChart data={voorraadStats.doorlooptijdPerPrijsklasse.filter(d => d.dagen > 0)} nameKey="klasse" valueKey="dagen" />
              ) : <EmptyState text="Geen data" />}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ─── Sectie 3: Populariteit & vraag ─── */}
      <SectionCard title="Populariteit & Vraag">
        {populariteit.merkVerkopen.length === 0 ? <EmptyState text="Geen verkopen in deze periode" /> : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">Meest verkochte merken</p>
                <HBarChart data={populariteit.merkVerkopen} />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">Meest verkochte modellen</p>
                <HBarChart data={populariteit.modelVerkopen} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">Brandstoftype</p>
                <DonutChart data={populariteit.brandstofVerkopen} />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">Prijsklasse</p>
                <DonutChart data={populariteit.prijsklasseVerkopen} />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">Kleur</p>
                {populariteit.kleurVerkopen.length > 0 ? (
                  <div className="space-y-1">
                    {populariteit.kleurVerkopen.slice(0, 8).map((k, i) => (
                      <div key={i} className="flex justify-between text-xs"><span className="text-muted-foreground">{k.naam}</span><span className="text-foreground font-medium tabular-nums">{k.aantal}</span></div>
                    ))}
                  </div>
                ) : <EmptyState text="Geen data" />}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">Bouwjaar verdeling</p>
                <HBarChart data={populariteit.bouwjaarVerkopen.slice(0, 8)} />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">Transmissie</p>
                <DonutChart data={populariteit.transmissieVerkopen} />
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ─── Sectie 4: Marge analyse ─── */}
      <SectionCard title="Marge Analyse">
        {margeAnalyse.margePerMerk.length === 0 ? <EmptyState text="Geen verkopen in deze periode" /> : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div><p className="text-[11px] text-muted-foreground">Gem. kosten/voertuig</p><p className="text-sm font-semibold tabular-nums text-foreground">{formatEuro(margeAnalyse.gemKostenPerVoertuig)}</p></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">Marge per merk</p>
                <MiniTable headers={['Merk', 'Gem. marge', '%']}
                  rows={margeAnalyse.margePerMerk.map(m => [m.merk, <span className={m.marge >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatEuro(m.marge)}</span>, `${m.margePerc.toFixed(0)}%`])} />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">Marge per brandstof</p>
                <MiniTable headers={['Brandstof', 'Gem. marge']}
                  rows={margeAnalyse.margePerBrandstof.map(m => [m.naam, <span className={m.marge >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatEuro(m.marge)}</span>])} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">Marge per prijsklasse</p>
                <MiniTable headers={['Prijsklasse', 'Gem. marge']}
                  rows={margeAnalyse.margePerPrijsklasse.map(m => [m.klasse, <span className={m.marge >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatEuro(m.marge)}</span>])} />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">Marge per bouwjaargroep</p>
                <MiniTable headers={['Groep', 'Gem. marge']}
                  rows={margeAnalyse.margePerBouwjaargroep.map(m => [m.groep, <span className={m.marge >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatEuro(m.marge)}</span>])} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">Top 5 meest winstgevend</p>
                <MiniTable headers={['Voertuig', 'Inkoop', 'Verkoop', 'Marge', '%']}
                  rows={margeAnalyse.top5.map(m => [
                    <Link to={`/admin/voertuigen/${m.vehicle.id}`} className="hover:underline">{m.vehicle.merk} {m.vehicle.model}</Link>,
                    formatEuro(isConsignatie(m.vehicle) ? 0 : m.vehicle.inkoopprijs),
                    formatEuro(m.vehicle.verkoopprijs),
                    <span className="text-emerald-400 font-medium">{formatEuro(m.winst)}</span>,
                    `${m.margePerc.toFixed(0)}%`,
                  ])} />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">Bottom 5 minst winstgevend</p>
                <MiniTable headers={['Voertuig', 'Inkoop', 'Verkoop', 'Marge', '%']}
                  rows={margeAnalyse.bottom5.map(m => [
                    <Link to={`/admin/voertuigen/${m.vehicle.id}`} className="hover:underline">{m.vehicle.merk} {m.vehicle.model}</Link>,
                    formatEuro(isConsignatie(m.vehicle) ? 0 : m.vehicle.inkoopprijs),
                    formatEuro(m.vehicle.verkoopprijs),
                    <span className={m.winst >= 0 ? "text-emerald-400" : "text-red-400"}>{formatEuro(m.winst)}</span>,
                    `${m.margePerc.toFixed(0)}%`,
                  ])} />
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ─── Sectie 5: Inkoop analyse ─── */}
      <SectionCard title="Inkoop Analyse">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-[11px] text-muted-foreground">Gem. inkoopprijs</p><p className="text-sm font-semibold tabular-nums text-foreground">{formatEuro(inkoopAnalyse.gemInkoopprijs)}</p></div>
          </div>

          {inkoopAnalyse.inkoopPerPeriode.length > 0 && (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={inkoopAnalyse.inkoopPerPeriode}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
                  <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Line type="monotone" dataKey="aantal" stroke="hsl(0 0% 65%)" strokeWidth={2} dot={false} name="Ingekocht" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[11px] text-muted-foreground mb-2">Meest ingekochte merken</p>
              <HBarChart data={inkoopAnalyse.merkInkopen} />
            </div>
            {inkoopAnalyse.inkoopVsVerkoopPerMerk.length > 0 && (
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">Inkoop vs Verkoop per merk</p>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inkoopAnalyse.inkoopVsVerkoopPerMerk}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
                      <XAxis dataKey="merk" tick={axisTick} axisLine={false} tickLine={false} />
                      <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [formatEuro(v), '']} />
                      <Bar dataKey="inkoop" fill="hsl(0 0% 35%)" name="Inkoop" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="verkoop" fill="hsl(0 0% 60%)" name="Verkoop" radius={[2, 2, 0, 0]} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ─── Sectie 6: Verkoop analyse ─── */}
      <SectionCard title="Verkoop Analyse">
        <div className="space-y-6">
          {verkoopAnalyse.omzetPerPeriode.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">Omzet per periode</p>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={verkoopAnalyse.omzetPerPeriode}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
                      <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                      <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [formatEuro(v), '']} />
                      <Line type="monotone" dataKey="omzet" stroke="hsl(0 0% 70%)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">Verkopen per periode</p>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={verkoopAnalyse.omzetPerPeriode}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
                      <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                      <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="aantal" fill="hsl(0 0% 50%)" name="Verkopen" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[11px] text-muted-foreground mb-2">Verkopen per dag</p>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={verkoopAnalyse.dagVerkopen}>
                    <XAxis dataKey="dag" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="aantal" fill="hsl(0 0% 45%)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-2">Historische verkopen per maand</p>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={verkoopAnalyse.maandVerkopen}>
                    <XAxis dataKey="maand" tick={{ ...axisTick, fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="aantal" fill="hsl(0 0% 50%)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ─── Sectie 7: Proefrit analyse ─── */}
      <SectionCard title="Proefrit Analyse">
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><p className="text-[11px] text-muted-foreground">Totaal</p><p className="text-sm font-semibold tabular-nums text-foreground">{proefritStats.total}</p></div>
            <div><p className="text-[11px] text-muted-foreground">Conversie</p><p className="text-sm font-semibold tabular-nums text-foreground">{proefritStats.conversie.toFixed(0)}%</p></div>
            <div><p className="text-[11px] text-muted-foreground">Gem. proefriten/verkoop</p><p className="text-sm font-semibold tabular-nums text-foreground">{proefritAnalyse.proefritenPerVoertuig.toFixed(1)}</p></div>
          </div>

          {proefritAnalyse.aantalPerPeriode.length > 0 && (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={proefritAnalyse.aantalPerPeriode}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
                  <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="aantal" fill="hsl(0 0% 50%)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {proefritAnalyse.conversiePerMerk.length > 0 && (
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">Conversie per merk</p>
                <MiniTable headers={['Merk', 'Proefriten', 'Conversie']}
                  rows={proefritAnalyse.conversiePerMerk.map(m => [m.merk, m.proefriten, `${m.conversie.toFixed(0)}%`])} />
              </div>
            )}
            <div>
              <p className="text-[11px] text-muted-foreground mb-2">Tijdstip verdeling</p>
              <DonutChart data={proefritAnalyse.tijdstipVerdeling} nameKey="tijdstip" />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ─── Sectie 8: Financieel overzicht ─── */}
      <SectionCard title="Financieel Overzicht" action={
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium border border-border rounded hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
          <Download className="w-3 h-3" /> Export CSV
        </button>
      }>
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div><p className="text-[11px] text-muted-foreground">Totale inkoop</p><p className="text-sm font-semibold tabular-nums text-foreground">{formatEuro(financieel.totaleInkoop)}</p></div>
            <div><p className="text-[11px] text-muted-foreground">Totale kosten</p><p className="text-sm font-semibold tabular-nums text-foreground">{formatEuro(financieel.totaleKosten)}</p></div>
            <div><p className="text-[11px] text-muted-foreground">Totale omzet</p><p className="text-sm font-semibold tabular-nums text-foreground">{formatEuro(financieel.totaleOmzet)}</p></div>
            <div><p className="text-[11px] text-muted-foreground">Brutowinst</p><p className={`text-sm font-semibold tabular-nums ${financieel.brutowinst >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatEuro(financieel.brutowinst)}</p></div>
            <div><p className="text-[11px] text-muted-foreground">Netto marge</p><p className={`text-sm font-semibold tabular-nums ${financieel.nettoMarge >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatEuro(financieel.nettoMarge)} ({financieel.nettoMargePerc.toFixed(1)}%)</p></div>
          </div>

          {financieel.maandOverzicht.length > 0 && (
            <div>
              <p className="text-[11px] text-muted-foreground mb-2">Maandoverzicht</p>
              <MiniTable headers={['Maand', 'Inkoop', 'Kosten', 'Omzet', 'Winst', 'Marge']}
                rows={financieel.maandOverzicht.map(m => [
                  m.maand, formatEuro(m.inkoop), formatEuro(m.kosten), formatEuro(m.omzet),
                  <span className={m.winst >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatEuro(m.winst)}</span>,
                  `${m.marge.toFixed(0)}%`,
                ])} />
            </div>
          )}

          {financieel.transacties.length === 0 ? <EmptyState text="Geen transacties in deze periode" /> : (
            <div>
              <p className="text-[11px] text-muted-foreground mb-2">Transacties</p>
              <MiniTable headers={['Datum', 'Voertuig', 'Type', 'Inkoop', 'Kosten', 'Verkoop', 'Winst']}
                rows={financieel.transacties.map(t => [
                  t.datum ? format(parseISO(t.datum), 'dd/MM/yy') : '—',
                  <Link to={`/admin/voertuigen/${t.id}`} className="hover:underline text-foreground">{t.voertuig}</Link>,
                  t.type, formatEuro(t.inkoop), formatEuro(t.kosten), formatEuro(t.verkoop),
                  <span className={t.winst >= 0 ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>{formatEuro(t.winst)}</span>,
                ])} />
            </div>
          )}
        </div>
      </SectionCard>

      {/* ─── Sectie 9: Recente activiteit ─── */}
      <SectionCard title="Recente Activiteit">
        {activities.length === 0 ? <EmptyState text="Geen activiteit in deze periode" /> : (
          <div className="space-y-1">
            {activities.map(a => {
              const Icon = activityIcons[a.type] || Clock;
              const color = activityColors[a.type] || "text-muted-foreground";
              let timeLabel: string;
              try { timeLabel = formatDistanceToNow(parseISO(a.time), { addSuffix: true, locale: nl }); } catch { timeLabel = a.time; }
              const linkTo = a.vehicleId ? `/admin/voertuigen/${a.vehicleId}` : '#';
              return (
                <Link key={a.id} to={linkTo} className="flex items-center gap-2.5 py-2 px-2 rounded hover:bg-accent/30 transition-colors">
                  <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
                  <span className="text-xs text-foreground flex-1 truncate">{a.label}</span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeLabel}</span>
                </Link>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default AdminDashboardPage;

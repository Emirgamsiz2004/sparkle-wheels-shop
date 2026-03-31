import { useState, useMemo } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { useTestDrives } from "@/hooks/useTestDrives";
import { useDashboardData, getPeriodRange, calcTrend, PeriodKey } from "@/hooks/useDashboardData";
import { formatEuro, isConsignatie } from "@/types/vehicle";
import {
  Loader2, TrendingUp, TrendingDown, Minus, Car, DollarSign, Tag,
  Package, TestTube, Clock, Download, Calendar as CalendarIcon,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

/* ─── Period labels ─── */
const periodLabels: Record<PeriodKey, string> = {
  vandaag: "Vandaag", week: "Deze week", maand: "Deze maand",
  kwartaal: "Dit kwartaal", jaar: "Dit jaar", custom: "Aangepast",
};

/* ─── Trend badge ─── */
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

/* ─── Report card wrapper ─── */
function ReportCard({ title, icon: Icon, children }: {
  title: string; icon?: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center gap-2.5">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground/60" />}
        <h2 className="text-[13px] font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ─── Simple stat row ─── */
function Stat({ label, value, sub, compare, current, previous }: {
  label: string; value: string; sub?: string;
  compare?: boolean; current?: number; previous?: number;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-xl font-semibold tabular-nums text-foreground leading-tight">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      {compare && current !== undefined && previous !== undefined && (
        <div className="mt-1"><Trend current={current} previous={previous} /></div>
      )}
    </div>
  );
}

/* ─── Simple ranked list ─── */
function RankedList({ items, valuePrefix }: { items: { label: string; value: number | string }[]; valuePrefix?: string }) {
  if (items.length === 0) return <p className="text-xs text-muted-foreground py-4 text-center">Geen data</p>;
  return (
    <div className="space-y-2">
      {items.slice(0, 8).map((item, i) => (
        <div key={i} className="flex items-center justify-between text-[13px]">
          <span className="text-muted-foreground">{i + 1}. {item.label}</span>
          <span className="text-foreground font-medium tabular-nums">{valuePrefix}{item.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Dashboard ─── */
const AdminDashboardPage = () => {
  const { vehicles, loading: vLoading } = useVehicles();
  const { testDrives, loading: tdLoading } = useTestDrives();
  const [period, setPeriod] = useState<PeriodKey>("maand");
  const [compare, setCompare] = useState(true);
  const [customFrom, setCustomFrom] = useState<Date>();
  const [customTo, setCustomTo] = useState<Date>();

  const range = useMemo(() => getPeriodRange(period, customFrom, customTo), [period, customFrom, customTo]);
  const data = useDashboardData(vehicles, testDrives, range, compare);

  if (vLoading || tdLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  const { kpis, voorraadStats, populariteit, margeAnalyse, inkoopAnalyse, proefritStats, proefritAnalyse, financieel, activities } = data;

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
    <div className="space-y-6 max-w-6xl">
      {/* ─── Header + period selector ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Overzicht van je bedrijf</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(periodLabels) as PeriodKey[]).filter(k => k !== 'custom').map(k => (
            <button key={k} onClick={() => setPeriod(k)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
                period === k ? "border-border bg-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {periodLabels[k]}
            </button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <button className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
                period === 'custom' ? "border-border bg-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
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
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer ml-2">
            <input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)}
              className="rounded border-border bg-card w-3.5 h-3.5" />
            Vergelijk
          </label>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          RAPPORT 1 — Kerngetallen
      ═══════════════════════════════════════════ */}
      <ReportCard title="Kerngetallen" icon={DollarSign}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Stat label="Totale omzet" value={formatEuro(kpis.omzet)} compare={compare} current={kpis.omzet} previous={kpis.omzetPrev} />
          <Stat label="Brutowinst" value={formatEuro(kpis.brutowinst)} compare={compare} current={kpis.brutowinst} previous={kpis.brutwinstPrev} />
          <Stat label="Verkocht" value={`${kpis.verkocht} voertuigen`} compare={compare} current={kpis.verkocht} previous={kpis.verkochtPrev} />
          <Stat label="Gem. marge" value={formatEuro(kpis.gemiddeldeMarge)} sub={`${kpis.gemiddeldeMargePerc.toFixed(0)}% per voertuig`} compare={compare} current={kpis.gemiddeldeMarge} previous={kpis.gemiddeldeMargePrev} />
        </div>
      </ReportCard>

      {/* ═══════════════════════════════════════════
          RAPPORT 2 — Voorraad
      ═══════════════════════════════════════════ */}
      <ReportCard title="Voorraad" icon={Package}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <Stat label="Voertuigen in voorraad" value={String(kpis.voorraad)} compare={compare} current={kpis.voorraad} previous={kpis.voorraadPrev} />
          <Stat label="Gem. stagedagen" value={`${Math.round(kpis.gemStageDagen)} dagen`} compare={compare} current={kpis.gemStageDagen} previous={kpis.gemStageDagenPrev} />
          <Stat label="Gem. inkoopprijs" value={formatEuro(voorraadStats.gemInkoop)} />
          <Stat label="Gem. verkoopprijs" value={formatEuro(voorraadStats.gemVerkoop)} />
        </div>

        {/* Doorlooptijd verdeling */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Snel verkocht (< 30d)", val: voorraadStats.snelVerkocht, color: "text-emerald-500" },
            { label: "Normaal (30-90d)", val: voorraadStats.normaal, color: "text-foreground" },
            { label: "Langstanders (> 90d)", val: voorraadStats.langstanders, color: "text-red-400" },
          ].map(g => (
            <div key={g.label} className="bg-accent/30 rounded-lg p-3 text-center">
              <p className={`text-2xl font-bold tabular-nums ${g.color}`}>{g.val}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{g.label}</p>
            </div>
          ))}
        </div>

        {/* Langst staande voertuigen */}
        {voorraadStats.top10Langst.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-muted-foreground mb-2">Langst in voorraad</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-[11px] text-muted-foreground">
                    <th className="text-left py-2 pr-3 font-medium">Voertuig</th>
                    <th className="text-left py-2 pr-3 font-medium">Kenteken</th>
                    <th className="text-right py-2 pr-3 font-medium">Inkoop</th>
                    <th className="text-right py-2 font-medium">Dagen</th>
                  </tr>
                </thead>
                <tbody>
                  {voorraadStats.top10Langst.slice(0, 5).map(v => (
                    <tr key={v.id} className="border-t border-border/40">
                      <td className="py-2 pr-3">
                        <Link to={`/admin/voertuigen/${v.id}`} className="text-foreground hover:underline">
                          {v.merk} {v.model}
                        </Link>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">{v.kenteken || "—"}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">{formatEuro(v.inkoopprijs)}</td>
                      <td className={`py-2 text-right tabular-nums font-medium ${v.dagen > 90 ? "text-red-400" : v.dagen > 30 ? "text-amber-400" : "text-foreground"}`}>
                        {v.dagen}d
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ReportCard>

      {/* ═══════════════════════════════════════════
          RAPPORT 3 — Proefriten
      ═══════════════════════════════════════════ */}
      <ReportCard title="Proefriten" icon={TestTube}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Stat label="Totaal proefriten" value={String(kpis.proefriten)} compare={compare} current={kpis.proefriten} previous={kpis.proefritenPrev} />
          <Stat label="Conversie naar verkoop" value={`${kpis.conversie.toFixed(0)}%`} compare={compare} current={kpis.conversie} previous={kpis.conversiePrev} />
          <Stat label="Gem. proefriten per verkoop" value={proefritAnalyse.proefritenPerVoertuig.toFixed(1)} />
          <Stat label="Totaal afgerond" value={String(proefritStats.total)} />
        </div>
      </ReportCard>

      {/* ═══════════════════════════════════════════
          RAPPORT 4 — Meest verkocht & meest winstgevend
      ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReportCard title="Meest verkochte merken" icon={Car}>
          <RankedList items={populariteit.merkVerkopen.map(m => ({ label: m.naam, value: `${m.aantal}x` }))} />
        </ReportCard>

        <ReportCard title="Meest winstgevende verkopen" icon={TrendingUp}>
          {margeAnalyse.top5.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Geen data</p>
          ) : (
            <div className="space-y-3">
              {margeAnalyse.top5.map((m, i) => (
                <Link key={i} to={`/admin/voertuigen/${m.vehicle.id}`} className="flex items-center justify-between group">
                  <div>
                    <p className="text-[13px] text-foreground group-hover:underline">{m.vehicle.merk} {m.vehicle.model}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Inkoop {formatEuro(isConsignatie(m.vehicle) ? 0 : m.vehicle.inkoopprijs)} → Verkoop {formatEuro(m.vehicle.verkoopprijs)}
                    </p>
                  </div>
                  <span className="text-emerald-500 font-semibold tabular-nums text-sm">+{formatEuro(m.winst)}</span>
                </Link>
              ))}
            </div>
          )}
        </ReportCard>
      </div>

      {/* ═══════════════════════════════════════════
          RAPPORT 5 — Brandstof & Transmissie
      ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReportCard title="Verkopen per brandstof" icon={Tag}>
          <RankedList items={populariteit.brandstofVerkopen.map(m => ({ label: m.naam, value: `${m.aantal}x` }))} />
        </ReportCard>
        <ReportCard title="Verkopen per transmissie" icon={Tag}>
          <RankedList items={populariteit.transmissieVerkopen.map(m => ({ label: m.naam, value: `${m.aantal}x` }))} />
        </ReportCard>
      </div>

      {/* ═══════════════════════════════════════════
          RAPPORT 6 — Marge per merk
      ═══════════════════════════════════════════ */}
      <ReportCard title="Marge per merk" icon={DollarSign}>
        {margeAnalyse.margePerMerk.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Geen verkopen in deze periode</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-[11px] text-muted-foreground">
                  <th className="text-left py-2 pr-3 font-medium">Merk</th>
                  <th className="text-right py-2 pr-3 font-medium">Gem. marge</th>
                  <th className="text-right py-2 font-medium">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {margeAnalyse.margePerMerk.map(m => (
                  <tr key={m.merk} className="border-t border-border/40">
                    <td className="py-2 pr-3 text-foreground">{m.merk}</td>
                    <td className={`py-2 pr-3 text-right tabular-nums font-medium ${m.marge >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                      {formatEuro(m.marge)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">{m.margePerc.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportCard>

      {/* ═══════════════════════════════════════════
          RAPPORT 7 — Top & bottom verkopen
      ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReportCard title="Meest winstgevend" icon={TrendingUp}>
          {margeAnalyse.top5.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Geen data</p>
          ) : (
            <div className="space-y-3">
              {margeAnalyse.top5.map((m, i) => (
                <Link key={i} to={`/admin/voertuigen/${m.vehicle.id}`} className="flex items-center justify-between group">
                  <div>
                    <p className="text-[13px] text-foreground group-hover:underline">{m.vehicle.merk} {m.vehicle.model}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Inkoop {formatEuro(isConsignatie(m.vehicle) ? 0 : m.vehicle.inkoopprijs)} → Verkoop {formatEuro(m.vehicle.verkoopprijs)}
                    </p>
                  </div>
                  <span className="text-emerald-500 font-semibold tabular-nums text-sm">+{formatEuro(m.winst)}</span>
                </Link>
              ))}
            </div>
          )}
        </ReportCard>

        <ReportCard title="Minst winstgevend" icon={TrendingDown}>
          {margeAnalyse.bottom5.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Geen data</p>
          ) : (
            <div className="space-y-3">
              {margeAnalyse.bottom5.map((m, i) => (
                <Link key={i} to={`/admin/voertuigen/${m.vehicle.id}`} className="flex items-center justify-between group">
                  <div>
                    <p className="text-[13px] text-foreground group-hover:underline">{m.vehicle.merk} {m.vehicle.model}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Inkoop {formatEuro(isConsignatie(m.vehicle) ? 0 : m.vehicle.inkoopprijs)} → Verkoop {formatEuro(m.vehicle.verkoopprijs)}
                    </p>
                  </div>
                  <span className={`font-semibold tabular-nums text-sm ${m.winst >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                    {m.winst >= 0 ? "+" : ""}{formatEuro(m.winst)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </ReportCard>
      </div>

      {/* ═══════════════════════════════════════════
          RAPPORT 8 — Financieel overzicht
      ═══════════════════════════════════════════ */}
      <ReportCard title="Financieel overzicht" icon={DollarSign}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">
          <Stat label="Totale inkoop" value={formatEuro(financieel.totaleInkoop)} />
          <Stat label="Totale kosten" value={formatEuro(financieel.totaleKosten)} />
          <Stat label="Totale omzet" value={formatEuro(financieel.totaleOmzet)} />
          <Stat label="Netto marge" value={formatEuro(financieel.nettoMarge)} />
          <Stat label="Marge %" value={`${financieel.nettoMargePerc.toFixed(1)}%`} />
        </div>

        {financieel.transacties.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium text-muted-foreground">Transacties</p>
              <button onClick={exportCSV}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                <Download className="w-3 h-3" />
                CSV Export
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-[11px] text-muted-foreground">
                    <th className="text-left py-2 pr-3 font-medium">Datum</th>
                    <th className="text-left py-2 pr-3 font-medium">Voertuig</th>
                    <th className="text-right py-2 pr-3 font-medium">Inkoop</th>
                    <th className="text-right py-2 pr-3 font-medium">Kosten</th>
                    <th className="text-right py-2 pr-3 font-medium">Verkoop</th>
                    <th className="text-right py-2 font-medium">Winst</th>
                  </tr>
                </thead>
                <tbody>
                  {financieel.transacties.slice(0, 20).map((t, i) => (
                    <tr key={i} className="border-t border-border/40">
                      <td className="py-1.5 pr-3 text-muted-foreground">{t.datum}</td>
                      <td className="py-1.5 pr-3 text-foreground">{t.voertuig}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums text-muted-foreground">{formatEuro(Number(t.inkoop))}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums text-muted-foreground">{formatEuro(Number(t.kosten))}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums text-muted-foreground">{formatEuro(Number(t.verkoop))}</td>
                      <td className={`py-1.5 text-right tabular-nums font-medium ${Number(t.winst) >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                        {formatEuro(Number(t.winst))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ReportCard>

      {/* ═══════════════════════════════════════════
          RAPPORT 9 — Recente activiteit
      ═══════════════════════════════════════════ */}
      <ReportCard title="Recente activiteit" icon={Clock}>
        {activities.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Geen recente activiteit</p>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 10).map((a, i) => {
              const typeLabels: Record<string, string> = { proefrit: "Proefrit", verkocht: "Verkocht", ingekocht: "Ingekocht" };
              const typeColors: Record<string, string> = { proefrit: "bg-blue-500/10 text-blue-400", verkocht: "bg-emerald-500/10 text-emerald-400", ingekocht: "bg-amber-500/10 text-amber-400" };
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${typeColors[a.type] || "bg-accent text-muted-foreground"}`}>
                    {typeLabels[a.type] || a.type}
                  </span>
                  <span className="text-[13px] text-foreground flex-1">{a.label}</span>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">{a.time}</span>
                </div>
              );
            })}
          </div>
        )}
      </ReportCard>
    </div>
  );
};

export default AdminDashboardPage;

import { useState, useEffect } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { useMoneybird } from "@/hooks/useMoneybird";
import {
  formatEuroDecimal, calcKostprijs, calcTotalKosten, calcWinst,
  calcBtwMarge, calcNettoMarge, calcMarge,
} from "@/types/vehicle";
import {
  Loader2, Download, Info, Send, Upload, RefreshCw,
  CheckCircle, FileText, Receipt, BarChart3, Link2,
  LayoutDashboard, Wallet, Repeat, Car,
} from "lucide-react";
import FinancienOverzichtTab from "@/components/admin/financien/FinancienOverzichtTab";
import KostenTab from "@/components/admin/financien/KostenTab";
import AbonnementenTab from "@/components/admin/financien/AbonnementenTab";
import VoertuigMargesTab from "@/components/admin/financien/VoertuigMargesTab";
import { useIsMobile } from "@/hooks/use-mobile";
import GoogleDriveIcon from "@/components/admin/GoogleDriveIcon";
import { DateRangePicker } from "@/components/admin/DateRangePicker";
import MobilePeriodSheet from "@/components/admin/MobilePeriodSheet";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

type MainTab = "dashboard" | "verkoop" | "btw" | "kosten";
type VerkoopSection = "winst" | "marges";
type BtwSection = "aangifte" | "moneybird";
type KostenSection = "kosten" | "abonnementen" | "moneybird_kosten";

const quarters = [
  { q: 1, label: "Q1 — Jan t/m Mrt", deadline: "30 april", months: [0, 1, 2] },
  { q: 2, label: "Q2 — Apr t/m Jun", deadline: "31 juli", months: [3, 4, 5] },
  { q: 3, label: "Q3 — Jul t/m Sep", deadline: "31 oktober", months: [6, 7, 8] },
  { q: 4, label: "Q4 — Okt t/m Dec", deadline: "31 januari volgend jaar", months: [9, 10, 11] },
];

/* ──────────────────── MAIN ──────────────────── */

const AdminFinancieelPage = () => {
  const [tab, setTab] = useState<MainTab>("dashboard");
  const [verkoopSection, setVerkoopSection] = useState<VerkoopSection>("winst");
  const [btwSection, setBtwSection] = useState<BtwSection>("aangifte");
  const [kostenSection, setKostenSection] = useState<KostenSection>("kosten");
  const { vehicles, loading } = useVehicles();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tabs: { key: MainTab; label: string; icon: typeof BarChart3 }[] = [
    { key: "dashboard", label: "Overzicht", icon: LayoutDashboard },
    { key: "verkoop", label: "Verkoop & Marges", icon: BarChart3 },
    { key: "btw", label: "BTW & Boekhouding", icon: Receipt },
    { key: "kosten", label: "Kosten", icon: Wallet },
  ];

  const verkoopSubtabs: { key: VerkoopSection; label: string }[] = [
    { key: "winst", label: "Verkoop & Winst" },
    { key: "marges", label: "Voertuigmarges" },
  ];
  const btwSubtabs: { key: BtwSection; label: string }[] = [
    { key: "aangifte", label: "BTW Aangifte" },
    { key: "moneybird", label: "Moneybird" },
  ];
  const kostenSubtabs: { key: KostenSection; label: string }[] = [
    { key: "kosten", label: "Kosten" },
    { key: "abonnementen", label: "Abonnementen" },
  ];

  const renderSubtabs = (items: { key: string; label: string }[], active: string, setActive: (k: any) => void) => (
    <div className="inline-flex gap-0.5 bg-card border border-border rounded-lg p-0.5">
      {items.map(s => (
        <button
          key={s.key}
          onClick={() => setActive(s.key)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            active === s.key
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financiën</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Verkoop, BTW-aangifte en boekhouding in één overzicht
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <FinancienOverzichtTab />}

      {tab === "verkoop" && (
        <div className="space-y-4">
          {renderSubtabs(verkoopSubtabs, verkoopSection, setVerkoopSection)}
          {verkoopSection === "winst" && <OverzichtTab vehicles={vehicles} />}
          {verkoopSection === "marges" && <VoertuigMargesTab />}
        </div>
      )}

      {tab === "btw" && (
        <div className="space-y-4">
          {renderSubtabs(btwSubtabs, btwSection, setBtwSection)}
          {btwSection === "aangifte" && <BtwTab vehicles={vehicles} />}
          {btwSection === "moneybird" && <MoneybirdTab vehicles={vehicles} />}
        </div>
      )}

      {tab === "kosten" && (
        <div className="space-y-4">
          {renderSubtabs(kostenSubtabs, kostenSection, setKostenSection)}
          {kostenSection === "kosten" && <KostenTab />}
          {kostenSection === "abonnementen" && <AbonnementenTab />}
        </div>
      )}
    </div>
  );
};

/* ──────────── PERIOD TYPES ──────────── */

type PeriodType = 'jaar' | 'kwartaal' | 'maand' | 'custom';

const maandNamen = ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December'];

function getAvailableYears(vehicles: any[]): number[] {
  const currentYear = new Date().getFullYear();
  const years = Array.from(new Set(
    vehicles.filter(v => v.status === 'verkocht' && v.verkoopDatum)
      .map(v => new Date(v.verkoopDatum).getFullYear())
  )).sort((a, b) => b - a);
  if (!years.includes(currentYear)) years.unshift(currentYear);
  return years;
}

function filterByPeriod(vehicles: any[], periodType: PeriodType, year: number, quarter: number, month: number, customFrom?: Date, customTo?: Date) {
  return vehicles.filter(v => {
    if (v.status !== 'verkocht' || !v.verkoopDatum) return false;
    const d = new Date(v.verkoopDatum);
    if (periodType === 'custom' && customFrom && customTo) {
      return d >= customFrom && d <= customTo;
    }
    if (d.getFullYear() !== year) return false;
    if (periodType === 'kwartaal') {
      const qMonths = quarters[quarter - 1].months;
      return qMonths.includes(d.getMonth());
    }
    if (periodType === 'maand') return d.getMonth() === month;
    return true; // jaar
  });
}

/* ──────────── PERIOD SELECTOR COMPONENT ──────────── */

function PeriodSelector({ periodType, setPeriodType, year, setYear, quarter, setQuarter, month, setMonth, customFrom, setCustomFrom, customTo, setCustomTo, availableYears, showMonth = false }: {
  periodType: PeriodType; setPeriodType: (t: PeriodType) => void;
  year: number; setYear: (y: number) => void;
  quarter: number; setQuarter: (q: number) => void;
  month: number; setMonth: (m: number) => void;
  customFrom?: Date; setCustomFrom: (d: Date | undefined) => void;
  customTo?: Date; setCustomTo: (d: Date | undefined) => void;
  availableYears: number[];
  showMonth?: boolean;
}) {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  const periods: { key: PeriodType; label: string }[] = [
    { key: 'jaar', label: 'Jaar' },
    { key: 'kwartaal', label: 'Kwartaal' },
    { key: 'maand', label: 'Maand' },
    { key: 'custom', label: 'Periode' },
  ];

  // ===== MOBILE: single trigger that opens bottom sheet =====
  if (isMobile) {
    const label = getPeriodLabel(periodType, year, quarter, month, customFrom, customTo) || 'Kies periode';
    return (
      <>
        <button
          onClick={() => setSheetOpen(true)}
          className="w-full flex items-center justify-between px-4 h-12 bg-card border border-border rounded-[10px] text-sm text-foreground active:bg-white/[0.04] transition-colors"
        >
          <span className="font-medium truncate">{label}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
        </button>
        <MobilePeriodSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          value={{ periodType, year, quarter, month, customFrom, customTo }}
          onApply={(next) => {
            setPeriodType(next.periodType);
            setYear(next.year);
            setQuarter(next.quarter);
            setMonth(next.month);
            setCustomFrom(next.customFrom);
            setCustomTo(next.customTo);
          }}
          availableYears={availableYears}
        />
      </>
    );
  }

  // ===== DESKTOP =====
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-0.5 bg-card border border-border rounded-lg p-0.5">
        {periods.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriodType(p.key)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              periodType === p.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {periodType !== 'custom' && (
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="px-2.5 py-1.5 text-sm bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      )}

      {periodType === 'kwartaal' && (
        <div className="flex gap-0.5 bg-card border border-border rounded-lg p-0.5">
          {[1,2,3,4].map(q => (
            <button key={q} onClick={() => setQuarter(q)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${quarter === q ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}
            >Q{q}</button>
          ))}
        </div>
      )}

      {periodType === 'maand' && (
        <select value={month} onChange={e => setMonth(Number(e.target.value))} className="px-2.5 py-1.5 text-sm bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
          {maandNamen.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
      )}

      {periodType === 'custom' && (
        <DateRangePicker
          from={customFrom}
          to={customTo}
          onChange={(f, t) => { setCustomFrom(f); setCustomTo(t); }}
        />
      )}
    </div>
  );
}

function getPeriodLabel(periodType: PeriodType, year: number, quarter: number, month: number, customFrom?: Date, customTo?: Date): string {
  if (periodType === 'jaar') return String(year);
  if (periodType === 'kwartaal') return `Q${quarter} ${year}`;
  if (periodType === 'maand') return `${maandNamen[month]} ${year}`;
  if (periodType === 'custom' && customFrom && customTo) return `${customFrom.toLocaleDateString('nl-NL')} t/m ${customTo.toLocaleDateString('nl-NL')}`;
  return '';
}

/* ──────────── VERKOOP & WINST TAB ──────────── */

function OverzichtTab({ vehicles }: { vehicles: any[] }) {
  const now = new Date();
  const [periodType, setPeriodType] = useState<PeriodType>('jaar');
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);
  const [month, setMonth] = useState(now.getMonth());
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const isMobile = useIsMobile();
  const availableYears = getAvailableYears(vehicles);

  const filtered = filterByPeriod(vehicles, periodType, year, quarter, month, customFrom, customTo);

  const totals = filtered.reduce(
    (acc, v) => ({
      inkoop: acc.inkoop + v.inkoopprijs, kosten: acc.kosten + calcTotalKosten(v),
      kostprijs: acc.kostprijs + calcKostprijs(v), verkoop: acc.verkoop + v.verkoopprijs,
      bruto: acc.bruto + calcWinst(v), btw: acc.btw + calcBtwMarge(v), netto: acc.netto + calcNettoMarge(v),
    }),
    { inkoop: 0, kosten: 0, kostprijs: 0, verkoop: 0, bruto: 0, btw: 0, netto: 0 }
  );

  const exportCsv = () => {
    const headers = ["Voertuig", "Inkoopdatum", "Verkoopdatum", "Inkoopprijs", "Kosten", "Kostprijs", "Verkoopprijs", "Brutomarge", "BTW (marge)", "Nettomarge", "Marge %"];
    const rows = filtered.map((v) => [
      `${v.merk} ${v.model} (${v.bouwjaar})`, v.inkoopDatum, v.verkoopDatum || "", v.inkoopprijs, calcTotalKosten(v), calcKostprijs(v),
      v.verkoopprijs, calcWinst(v), calcBtwMarge(v).toFixed(2), calcNettoMarge(v).toFixed(2), calcMarge(v).toFixed(1) + "%",
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `financieel-overzicht.csv`; a.click();
  };

  return (
    <div className="space-y-4">
      <PeriodSelector
        periodType={periodType} setPeriodType={setPeriodType}
        year={year} setYear={setYear} quarter={quarter} setQuarter={setQuarter}
        month={month} setMonth={setMonth} customFrom={customFrom} setCustomFrom={setCustomFrom}
        customTo={customTo} setCustomTo={setCustomTo} availableYears={availableYears}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Totale omzet" value={formatEuroDecimal(totals.verkoop)} />
        <SummaryCard label="Totale inkoop" value={formatEuroDecimal(totals.inkoop)} />
        <SummaryCard label="Bruto winst" value={formatEuroDecimal(totals.bruto)} positive={totals.bruto >= 0} />
        <SummaryCard label="Netto winst" value={formatEuroDecimal(totals.netto)} positive={totals.netto >= 0} />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filtered.length} verkochte voertuig{filtered.length !== 1 ? "en" : ""} — {getPeriodLabel(periodType, year, quarter, month, customFrom, customTo)}</p>
        <button onClick={exportCsv} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors">
          <Download className="w-3.5 h-3.5" /> CSV
        </button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">Geen verkochte voertuigen in deze periode.</div>
        ) : isMobile ? (
          <div className="divide-y divide-border">
            {filtered.map((v) => {
              const netto = calcNettoMarge(v);
              return (
                <div key={v.id} className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{v.merk} {v.model} ({v.bouwjaar})</p>
                    <span className={`text-xs font-medium tabular-nums ${netto >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatEuroDecimal(netto)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><p className="text-[10px] text-muted-foreground">Inkoop</p><p className="text-xs tabular-nums">{formatEuroDecimal(v.inkoopprijs)}</p></div>
                    <div><p className="text-[10px] text-muted-foreground">Kosten</p><p className="text-xs tabular-nums">{formatEuroDecimal(calcTotalKosten(v))}</p></div>
                    <div><p className="text-[10px] text-muted-foreground">Verkoop</p><p className="text-xs tabular-nums">{formatEuroDecimal(v.verkoopprijs)}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Voertuig", "Inkoopdatum", "Verkoopdatum", "Inkoopprijs", "Kosten", "Kostprijs", "Verkoopprijs", "Brutomarge", "BTW", "Nettomarge", "Marge %", "Drive"].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const netto = calcNettoMarge(v);
                  return (
                    <tr key={v.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                      <td className="px-3 py-2.5 font-medium whitespace-nowrap">{v.merk} {v.model} ({v.bouwjaar})</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{v.inkoopDatum ? new Date(v.inkoopDatum).toLocaleDateString("nl-NL") : "—"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{v.verkoopDatum ? new Date(v.verkoopDatum).toLocaleDateString("nl-NL") : "—"}</td>
                      <td className="px-3 py-2.5 tabular-nums">{formatEuroDecimal(v.inkoopprijs)}</td>
                      <td className="px-3 py-2.5 tabular-nums">{formatEuroDecimal(calcTotalKosten(v))}</td>
                      <td className="px-3 py-2.5 font-medium tabular-nums">{formatEuroDecimal(calcKostprijs(v))}</td>
                      <td className="px-3 py-2.5 tabular-nums">{formatEuroDecimal(v.verkoopprijs)}</td>
                      <td className={`px-3 py-2.5 font-medium tabular-nums ${calcWinst(v) >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatEuroDecimal(calcWinst(v))}</td>
                      <td className="px-3 py-2.5 text-muted-foreground tabular-nums">{formatEuroDecimal(calcBtwMarge(v))}</td>
                      <td className={`px-3 py-2.5 font-medium tabular-nums ${netto >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatEuroDecimal(netto)}</td>
                      <td className={`px-3 py-2.5 tabular-nums ${netto >= 0 ? "text-emerald-500" : "text-red-500"}`}>{calcMarge(v).toFixed(1)}%</td>
                      <td className="px-3 py-2.5"><GoogleDriveIcon linked={!!v.googleDriveFolderId} url={v.googleDriveFolderUrl} /></td>
                    </tr>
                  );
                })}
                <tr className="bg-accent/20 border-t border-border font-medium">
                  <td className="px-3 py-2.5" colSpan={3}>Totaal</td>
                  <td className="px-3 py-2.5 tabular-nums">{formatEuroDecimal(totals.inkoop)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{formatEuroDecimal(totals.kosten)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{formatEuroDecimal(totals.kostprijs)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{formatEuroDecimal(totals.verkoop)}</td>
                  <td className={`px-3 py-2.5 tabular-nums ${totals.bruto >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatEuroDecimal(totals.bruto)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground tabular-nums">{formatEuroDecimal(totals.btw)}</td>
                  <td className={`px-3 py-2.5 tabular-nums ${totals.netto >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatEuroDecimal(totals.netto)}</td>
                  <td className="px-3 py-2.5">—</td>
                  <td className="px-3 py-2.5">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────── BTW AANGIFTE TAB ──────────── */

function BtwTab({ vehicles }: { vehicles: any[] }) {
  const now = new Date();
  const [periodType, setPeriodType] = useState<PeriodType>('maand');
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);
  const [month, setMonth] = useState(now.getMonth());
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [overrides, setOverrides] = useState<Record<string, { inkoopprijs?: number; verkoopprijs?: number }>>({});
  const availableYears = getAvailableYears(vehicles);

  const setOverride = (id: string, field: 'inkoopprijs' | 'verkoopprijs', value: number) => {
    setOverrides(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const getEffective = (v: any) => {
    const o = overrides[v.id];
    const inkoopprijs = o?.inkoopprijs ?? v.inkoopprijs;
    const verkoopprijs = o?.verkoopprijs ?? v.verkoopprijs;
    const totalKosten = v.kosten.reduce((s: number, k: any) => s + k.amount, 0);
    const kostprijs = inkoopprijs + totalKosten;
    const winst = verkoopprijs - kostprijs;
    let btwMarge: number;
    if (v.btwMargeType === 'btw') {
      btwMarge = verkoopprijs * (21 / 121);
    } else {
      btwMarge = winst > 0 ? winst * (21 / 121) : 0;
    }
    return { inkoopprijs, verkoopprijs, kostprijs, winst, btwMarge };
  };

  const filtered = filterByPeriod(vehicles, periodType, year, quarter, month, customFrom, customTo);

  const btwOntvangen = filtered.reduce((s, v) => s + getEffective(v).btwMarge, 0);
  const btwBetaald = filtered.reduce((s, v) => {
    return s + v.kosten.reduce((cs: number, k: any) => {
      if (k.date) {
        const kd = new Date(k.date);
        // Check if cost falls within the selected period
        let inPeriod = false;
        if (periodType === 'custom' && customFrom && customTo) {
          inPeriod = kd >= customFrom && kd <= customTo;
        } else if (periodType === 'jaar') {
          inPeriod = kd.getFullYear() === year;
        } else if (periodType === 'kwartaal') {
          inPeriod = kd.getFullYear() === year && quarters[quarter - 1].months.includes(kd.getMonth());
        } else if (periodType === 'maand') {
          inPeriod = kd.getFullYear() === year && kd.getMonth() === month;
        }
        if (inPeriod) return cs + k.amount * ((k.btwPercentage || 21) / 100);
      }
      return cs;
    }, 0);
  }, 0);
  const teBetalen = btwOntvangen - btwBetaald;

  // Year totals for context
  const yearVerkocht = vehicles.filter(v => v.status === 'verkocht' && v.verkoopDatum && new Date(v.verkoopDatum).getFullYear() === year);
  const yearBtwOntvangen = yearVerkocht.reduce((s, v) => s + getEffective(v).btwMarge, 0);
  const yearBtwBetaald = yearVerkocht.reduce((s, v) => {
    return s + v.kosten.reduce((cs: number, k: any) => {
      if (k.date && new Date(k.date).getFullYear() === year) return cs + k.amount * ((k.btwPercentage || 21) / 100);
      return cs;
    }, 0);
  }, 0);

  const hasOverrides = Object.keys(overrides).length > 0;
  const periodLabel = getPeriodLabel(periodType, year, quarter, month, customFrom, customTo);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <PeriodSelector
          periodType={periodType} setPeriodType={setPeriodType}
          year={year} setYear={setYear} quarter={quarter} setQuarter={setQuarter}
          month={month} setMonth={setMonth} customFrom={customFrom} setCustomFrom={setCustomFrom}
          customTo={customTo} setCustomTo={setCustomTo} availableYears={availableYears}
          showMonth
        />
        {hasOverrides && (
          <button
            onClick={() => setOverrides({})}
            className="ml-auto px-2.5 py-1.5 text-xs font-medium text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 transition-colors"
          >
            Reset aanpassingen
          </button>
        )}
      </div>

      {hasOverrides && (
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <Info className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            <strong className="text-amber-400">Let op:</strong> Je hebt prijzen aangepast. Deze aanpassingen gelden alleen binnen dit BTW-overzicht en worden niet opgeslagen.
          </p>
        </div>
      )}

      {/* Period detail */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">BTW Overzicht — {periodLabel}</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-secondary/30 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Verkocht</p>
            <p className="text-xl font-bold text-foreground">{filtered.length}</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">BTW Ontvangen</p>
            <p className="text-xl font-bold text-foreground">{formatEuroDecimal(btwOntvangen)}</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">BTW Betaald</p>
            <p className="text-xl font-bold text-foreground">{formatEuroDecimal(btwBetaald)}</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{teBetalen >= 0 ? "Te Betalen" : "Te Ontvangen"}</p>
            <p className={`text-xl font-bold ${teBetalen >= 0 ? "text-destructive" : "text-emerald-400"}`}>
              {formatEuroDecimal(Math.abs(teBetalen))}
            </p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Geen voertuigen verkocht in deze periode.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Voertuig</th>
                  <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Datum</th>
                  <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Type</th>
                  <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Inkoopprijs</th>
                  <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Verkoopprijs</th>
                  <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Marge</th>
                  <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">BTW Marge</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v: any) => {
                  const eff = getEffective(v);
                  const isOverridden = !!overrides[v.id];
                  return (
                    <tr key={v.id} className={`border-b border-border/50 hover:bg-accent/10 ${isOverridden ? "bg-amber-500/5" : ""}`}>
                      <td className="px-3 py-2 text-foreground font-medium">
                        {v.merk} {v.model} <span className="text-muted-foreground font-normal">({v.kenteken})</span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{new Date(v.verkoopDatum).toLocaleDateString("nl-NL")}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${v.btwMargeType === 'btw' ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                          {v.btwMargeType === 'btw' ? 'BTW' : 'Marge'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <EditablePrice value={eff.inkoopprijs} original={v.inkoopprijs} onChange={(val) => setOverride(v.id, 'inkoopprijs', val)} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <EditablePrice value={eff.verkoopprijs} original={v.verkoopprijs} onChange={(val) => setOverride(v.id, 'verkoopprijs', val)} />
                      </td>
                      <td className={`px-3 py-2 text-right font-medium ${eff.winst >= 0 ? "text-emerald-400" : "text-destructive"}`}>{formatEuroDecimal(eff.winst)}</td>
                      <td className="px-3 py-2 text-right text-foreground">{formatEuroDecimal(eff.btwMarge)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td colSpan={5} className="px-3 py-2 text-sm font-medium text-foreground">Totaal</td>
                  <td className="px-3 py-2 text-right font-bold text-foreground">
                    {formatEuroDecimal(filtered.reduce((s: number, v: any) => s + getEffective(v).winst, 0))}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-foreground">{formatEuroDecimal(btwOntvangen)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Year totals */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Jaaroverzicht {year}</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">BTW Ontvangen</p>
            <p className="text-xl font-bold text-foreground">{formatEuroDecimal(yearBtwOntvangen)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">BTW Betaald</p>
            <p className="text-xl font-bold text-foreground">{formatEuroDecimal(yearBtwBetaald)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{(yearBtwOntvangen - yearBtwBetaald) >= 0 ? "Te Betalen" : "Te Ontvangen"}</p>
            <p className={`text-xl font-bold ${(yearBtwOntvangen - yearBtwBetaald) >= 0 ? "text-destructive" : "text-emerald-400"}`}>
              {formatEuroDecimal(Math.abs(yearBtwOntvangen - yearBtwBetaald))}
            </p>
          </div>
        </div>
      </div>

      {/* Moneybird BTW samenvatting */}
      <MoneybirdBtwSummary year={year} btwOntvangen={btwOntvangen} btwBetaald={btwBetaald} />

      <div className="flex items-start gap-3 px-4 py-3.5 bg-primary/5 rounded-xl border border-primary/10">
        <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Tip:</strong> Klik op een inkoop- of verkoopprijs om deze tijdelijk aan te passen voor de BTW-berekening. Aangifte doen via{" "}
          <a href="https://mbd.belastingdienst.nl" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80">mbd.belastingdienst.nl</a>
        </p>
      </div>
    </div>
  );
}

/* ──────────── MONEYBIRD BTW SUMMARY ──────────── */

function MoneybirdBtwSummary({ year, btwOntvangen, btwBetaald }: { year: number; btwOntvangen: number; btwBetaald: number }) {
  const { getSalesInvoices, getReceipts, loading } = useMoneybird();
  const [mbData, setMbData] = useState<{ salesBtw: number; receiptsBtw: number; loaded: boolean }>({ salesBtw: 0, receiptsBtw: 0, loaded: false });
  const [fetching, setFetching] = useState(false);

  const fetchMbData = async () => {
    setFetching(true);
    try {
      // Fetch sales invoices for this year
      const invoices = await getSalesInvoices(1, `period:${year}`);
      const salesBtw = (Array.isArray(invoices) ? invoices : []).reduce((sum: number, inv: any) => {
        const totalTax = parseFloat(inv.total_tax || '0');
        return sum + totalTax;
      }, 0);

      // Fetch receipts/purchase invoices for this year
      const receipts = await getReceipts(1, `period:${year}`);
      const receiptsBtw = (Array.isArray(receipts) ? receipts : []).reduce((sum: number, r: any) => {
        const totalTax = parseFloat(r.total_tax || '0');
        return sum + totalTax;
      }, 0);

      setMbData({ salesBtw, receiptsBtw, loaded: true });
    } catch {
      // Silently fail — Moneybird might not be configured
    } finally {
      setFetching(false);
    }
  };

  const teBetalen = btwOntvangen - btwBetaald;
  const mbTeBetalen = mbData.salesBtw - mbData.receiptsBtw;

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Receipt className="w-4 h-4" />
          BTW Totaaloverzicht {year}
        </h3>
        {!mbData.loaded && (
          <button
            onClick={fetchMbData}
            disabled={fetching || loading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
          >
            {fetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Ophalen uit Moneybird
          </button>
        )}
        {mbData.loaded && (
          <button
            onClick={fetchMbData}
            disabled={fetching || loading}
            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${fetching ? 'animate-spin' : ''}`} /> Vernieuwen
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Bron</th>
              <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">BTW Ontvangen</th>
              <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">BTW Betaald</th>
              <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Saldo</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/50">
              <td className="px-3 py-2 text-foreground font-medium">Voertuigverkopen (berekend)</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatEuroDecimal(btwOntvangen)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatEuroDecimal(btwBetaald)}</td>
              <td className={`px-3 py-2 text-right font-medium tabular-nums ${teBetalen >= 0 ? "text-destructive" : "text-emerald-400"}`}>
                {teBetalen >= 0 ? "" : "−"}{formatEuroDecimal(Math.abs(teBetalen))}
              </td>
            </tr>
            {mbData.loaded && (
              <tr className="border-b border-border/50">
                <td className="px-3 py-2 text-foreground font-medium flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-muted-foreground" /> Moneybird
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{formatEuroDecimal(mbData.salesBtw)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatEuroDecimal(mbData.receiptsBtw)}</td>
                <td className={`px-3 py-2 text-right font-medium tabular-nums ${mbTeBetalen >= 0 ? "text-destructive" : "text-emerald-400"}`}>
                  {mbTeBetalen >= 0 ? "" : "−"}{formatEuroDecimal(Math.abs(mbTeBetalen))}
                </td>
              </tr>
            )}
          </tbody>
          {mbData.loaded && (
            <tfoot>
              <tr className="border-t-2 border-border bg-accent/20">
                <td className="px-3 py-2.5 text-foreground font-bold">Totaal</td>
                <td className="px-3 py-2.5 text-right font-bold tabular-nums">{formatEuroDecimal(btwOntvangen + mbData.salesBtw)}</td>
                <td className="px-3 py-2.5 text-right font-bold tabular-nums">{formatEuroDecimal(btwBetaald + mbData.receiptsBtw)}</td>
                <td className={`px-3 py-2.5 text-right font-bold text-lg tabular-nums ${(teBetalen + mbTeBetalen) >= 0 ? "text-destructive" : "text-emerald-400"}`}>
                  {(teBetalen + mbTeBetalen) >= 0 ? "" : "−"}{formatEuroDecimal(Math.abs(teBetalen + mbTeBetalen))}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {!mbData.loaded && (
        <p className="text-xs text-muted-foreground text-center py-2 mt-2">
          Klik op "Ophalen uit Moneybird" om de BTW uit je boekhouding te laden en te combineren.
        </p>
      )}
    </div>
  );
}

/* ──────────── EDITABLE PRICE CELL ──────────── */

function EditablePrice({ value, original, onChange }: { value: number; original: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(value));
  const isModified = value !== original;

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        step="0.01"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onBlur={() => {
          const parsed = parseFloat(input);
          if (!isNaN(parsed)) onChange(parsed);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.currentTarget.blur(); }
          if (e.key === "Escape") { setInput(String(value)); setEditing(false); }
        }}
        className="w-24 px-1.5 py-0.5 text-sm text-right tabular-nums bg-background border border-primary/50 rounded focus:outline-none focus:ring-1 focus:ring-primary"
      />
    );
  }

  return (
    <button
      onClick={() => { setInput(String(value)); setEditing(true); }}
      className={`tabular-nums hover:underline cursor-pointer transition-colors ${
        isModified ? "text-amber-400 font-medium" : "text-foreground"
      }`}
      title={isModified ? `Origineel: ${formatEuroDecimal(original)}` : "Klik om aan te passen"}
    >
      {formatEuroDecimal(value)}
    </button>
  );
}

/* ──────────── MONEYBIRD TAB ──────────── */

type MBSubTab = "facturen" | "kosten" | "overzicht";

function MoneybirdTab({ vehicles }: { vehicles: any[] }) {
  const { loading: mbLoading, getAdministration, createVehicleInvoice, syncVehicleCosts, getSalesInvoices } = useMoneybird();
  const [admin, setAdmin] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [subTab, setSubTab] = useState<MBSubTab>("facturen");
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    getAdministration().then(setAdmin).catch(() => {});
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await getSalesInvoices();
      setInvoices(Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(() => {
    if (subTab === "overzicht") loadInvoices();
  }, [subTab]);

  const verkochteVoertuigen = vehicles.filter((v) => v.status === "verkocht");
  const alleMetKosten = vehicles.filter((v) => v.kosten.length > 0);

  const handleCreateInvoice = async (v: any) => {
    if (!v.koperNaam) { toast.error("Geen koper gegevens ingevuld"); return; }
    setSyncing(v.id);
    try {
      await createVehicleInvoice(v, v.koperNaam, v.koperEmail, v.koperTelefoon);
      toast.success(`Factuur aangemaakt voor ${v.merk} ${v.model}`);
    } catch {} finally { setSyncing(null); }
  };

  const handleSyncCosts = async (v: any) => {
    setSyncing(v.id);
    try {
      const result = await syncVehicleCosts(v);
      toast.success(`${result.synced} kosten gesynchroniseerd`);
    } catch {} finally { setSyncing(null); }
  };

  const subTabs: { key: MBSubTab; label: string; icon: typeof FileText }[] = [
    { key: "facturen", label: "Verkoopfacturen", icon: FileText },
    { key: "kosten", label: "Kosten Sync", icon: Upload },
    { key: "overzicht", label: "Factuuroverzicht", icon: Receipt },
  ];

  return (
    <div className="space-y-4">
      {/* Connection status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {admin ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Verbonden met: <strong className="text-foreground">{admin.name || admin.company_name || "Moneybird"}</strong></span>
            </>
          ) : mbLoading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verbinding controleren...</>
          ) : (
            <span className="text-amber-400">Geen verbinding met Moneybird</span>
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
        {subTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              subTab === t.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Verkoopfacturen */}
      {subTab === "facturen" && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {verkochteVoertuigen.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-muted-foreground">Geen verkochte voertuigen om te factureren.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary border-b border-border">
                    {["Voertuig", "Koper", "Verkoopprijs", "Datum", "Actie"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {verkochteVoertuigen.map((v) => (
                    <tr key={v.id} className="border-b border-border hover:bg-secondary/50">
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{v.merk} {v.model} ({v.bouwjaar})</td>
                      <td className="px-4 py-3 text-muted-foreground">{v.koperNaam || <span className="text-red-400 text-xs">Geen koper</span>}</td>
                      <td className="px-4 py-3 text-foreground">{formatEuroDecimal(v.verkoopprijs)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{v.verkoopDatum ? new Date(v.verkoopDatum).toLocaleDateString("nl-NL") : "—"}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleCreateInvoice(v)}
                          disabled={mbLoading || syncing === v.id || !v.koperNaam}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs font-medium rounded-md hover:bg-accent disabled:opacity-50 transition-colors"
                        >
                          {syncing === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                          Factuur Aanmaken
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Kosten sync */}
      {subTab === "kosten" && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {alleMetKosten.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-muted-foreground">Geen voertuigen met kosten om te synchroniseren.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary border-b border-border">
                    {["Voertuig", "Status", "Kosten", "Totaal", "Actie"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alleMetKosten.map((v) => (
                    <tr key={v.id} className="border-b border-border hover:bg-secondary/50">
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{v.merk} {v.model} ({v.bouwjaar})</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{v.status.replace("_", " ")}</td>
                      <td className="px-4 py-3 text-foreground">{v.kosten.length}</td>
                      <td className="px-4 py-3 text-foreground">{formatEuroDecimal(calcTotalKosten(v))}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleSyncCosts(v)}
                          disabled={mbLoading || syncing === v.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs font-medium rounded-md hover:bg-accent disabled:opacity-50 transition-colors"
                        >
                          {syncing === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                          Sync naar Moneybird
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Factuuroverzicht uit Moneybird */}
      {subTab === "overzicht" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={loadInvoices} disabled={mbLoading} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent disabled:opacity-50 transition-colors">
              {mbLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Vernieuwen
            </button>
          </div>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {mbLoading && invoices.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-muted-foreground">Geen facturen gevonden in Moneybird.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary border-b border-border">
                      {["Factuurnr", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv: any) => (
                      <tr key={inv.id} className="border-b border-border hover:bg-secondary/50">
                        <td className="px-4 py-3 font-medium text-foreground">{inv.invoice_id || inv.id?.slice(0, 8)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{inv.contact?.company_name || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString("nl-NL") : "—"}</td>
                        <td className="px-4 py-3 text-foreground">{inv.total_price_incl_tax ? formatEuroDecimal(Number(inv.total_price_incl_tax)) : "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 text-xs rounded ${
                            inv.state === "open" ? "bg-amber-500/20 text-amber-400" :
                            inv.state === "paid" ? "bg-emerald-500/20 text-emerald-400" :
                            inv.state === "late" ? "bg-red-500/20 text-red-400" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {inv.state === "open" ? "Open" : inv.state === "paid" ? "Betaald" : inv.state === "late" ? "Te laat" : inv.state || "Onbekend"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────── HELPERS ──────────── */

function SummaryCard({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${positive !== undefined ? (positive ? "text-emerald-500" : "text-red-500") : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function BtwRow({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-sm ${bold ? "font-bold" : ""} ${color ? "text-emerald-400" : bold ? "text-foreground" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

export default AdminFinancieelPage;

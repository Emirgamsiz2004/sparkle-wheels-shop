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
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import GoogleDriveIcon from "@/components/admin/GoogleDriveIcon";
import { toast } from "sonner";

type Tab = "overzicht" | "btw" | "moneybird";

const quarters = [
  { q: 1, label: "Q1 — Jan t/m Mrt", deadline: "30 april", months: [0, 1, 2] },
  { q: 2, label: "Q2 — Apr t/m Jun", deadline: "31 juli", months: [3, 4, 5] },
  { q: 3, label: "Q3 — Jul t/m Sep", deadline: "31 oktober", months: [6, 7, 8] },
  { q: 4, label: "Q4 — Okt t/m Dec", deadline: "31 januari volgend jaar", months: [9, 10, 11] },
];

/* ──────────────────── MAIN ──────────────────── */

const AdminFinancieelPage = () => {
  const [tab, setTab] = useState<Tab>("overzicht");
  const { vehicles, loading } = useVehicles();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
    { key: "overzicht", label: "Verkoop & Winst", icon: BarChart3 },
    { key: "btw", label: "BTW Aangifte", icon: Receipt },
    { key: "moneybird", label: "Moneybird", icon: Link2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financiën</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Verkoop, BTW-aangifte en boekhouding in één overzicht
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
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

      {tab === "overzicht" && <OverzichtTab vehicles={vehicles} />}
      {tab === "btw" && <BtwTab vehicles={vehicles} />}
      {tab === "moneybird" && <MoneybirdTab vehicles={vehicles} />}
    </div>
  );
};

/* ──────────── VERKOOP & WINST TAB ──────────── */

function OverzichtTab({ vehicles }: { vehicles: any[] }) {
  const currentYear = new Date().getFullYear();
  const [yearFilter, setYearFilter] = useState<string>("alle");
  const isMobile = useIsMobile();

  const filtered = vehicles.filter((v) => {
    if (v.status !== "verkocht") return false;
    if (yearFilter === "alle") return true;
    const year = v.verkoopDatum ? new Date(v.verkoopDatum).getFullYear() : new Date(v.inkoopDatum).getFullYear();
    return year === Number(yearFilter);
  });

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
    const a = document.createElement("a"); a.href = url; a.download = `financieel-overzicht-${yearFilter}.csv`; a.click();
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Totale omzet" value={formatEuroDecimal(totals.verkoop)} />
        <SummaryCard label="Totale inkoop" value={formatEuroDecimal(totals.inkoop)} />
        <SummaryCard label="Bruto winst" value={formatEuroDecimal(totals.bruto)} positive={totals.bruto >= 0} />
        <SummaryCard label="Netto winst" value={formatEuroDecimal(totals.netto)} positive={totals.netto >= 0} />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filtered.length} verkochte voertuig{filtered.length !== 1 ? "en" : ""}</p>
        <div className="flex items-center gap-2">
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="px-2.5 py-1.5 text-sm bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="alle">Alle jaren</option>
            <option value={String(currentYear)}>{currentYear}</option>
            <option value={String(currentYear - 1)}>{currentYear - 1}</option>
          </select>
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
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
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const verkocht = vehicles.filter((v) => {
    if (v.status !== "verkocht" || !v.verkoopDatum) return false;
    return new Date(v.verkoopDatum).getFullYear() === year;
  });

  const getQuarterData = (months: number[]) => {
    const qVehicles = verkocht.filter((v) => months.includes(new Date(v.verkoopDatum!).getMonth()));
    const btwOntvangen = qVehicles.reduce((s, v) => s + calcBtwMarge(v), 0);
    const btwBetaald = qVehicles.reduce((s, v) => {
      return s + v.kosten.reduce((cs: number, k: any) => {
        if (k.date) {
          const m = new Date(k.date).getMonth();
          if (months.includes(m) && new Date(k.date).getFullYear() === year) return cs + k.amount * ((k.btwPercentage || 21) / 100);
        }
        return cs;
      }, 0);
    }, 0);
    return { btwOntvangen, btwBetaald, teBetalen: btwOntvangen - btwBetaald, count: qVehicles.length };
  };

  const yearTotal = quarters.reduce((acc, q) => {
    const d = getQuarterData(q.months);
    return { ontvangen: acc.ontvangen + d.btwOntvangen, betaald: acc.betaald + d.btwBetaald, teBetalen: acc.teBetalen + d.teBetalen };
  }, { ontvangen: 0, betaald: 0, teBetalen: 0 });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Kwartaaloverzicht margeregeling — {year}</p>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-2.5 py-1.5 text-sm bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
          <option value={currentYear}>{currentYear}</option>
          <option value={currentYear - 1}>{currentYear - 1}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quarters.map((q) => {
          const data = getQuarterData(q.months);
          return (
            <div key={q.q} className="bg-card rounded-xl border border-border p-5 hover:border-primary/20 transition-colors duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">{q.label}</h3>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest bg-accent/50 px-2 py-0.5 rounded">{q.deadline}</span>
              </div>
              <div className="space-y-2.5">
                <BtwRow label="BTW Ontvangen (marge)" value={formatEuroDecimal(data.btwOntvangen)} />
                <BtwRow label="BTW Betaald (kosten)" value={formatEuroDecimal(data.btwBetaald)} />
                <div className="border-t border-border pt-2.5">
                  <BtwRow label={data.teBetalen >= 0 ? "Te Betalen" : "Te Ontvangen"} value={formatEuroDecimal(Math.abs(data.teBetalen))} bold color={data.teBetalen < 0} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{data.count} voertuig{data.count !== 1 ? "en" : ""} verkocht</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Year totals */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Jaaroverzicht {year}</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">BTW Ontvangen</p>
            <p className="text-xl font-bold text-foreground">{formatEuroDecimal(yearTotal.ontvangen)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">BTW Betaald</p>
            <p className="text-xl font-bold text-foreground">{formatEuroDecimal(yearTotal.betaald)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{yearTotal.teBetalen >= 0 ? "Te Betalen" : "Te Ontvangen"}</p>
            <p className={`text-xl font-bold ${yearTotal.teBetalen >= 0 ? "text-red-400" : "text-emerald-400"}`}>
              {formatEuroDecimal(Math.abs(yearTotal.teBetalen))}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 px-4 py-3.5 bg-primary/5 rounded-xl border border-primary/10">
        <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Aangifte doen via <strong className="text-foreground">Mijn Belastingdienst Zakelijk</strong> op{" "}
          <a href="https://mbd.belastingdienst.nl" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80">mbd.belastingdienst.nl</a>
        </p>
      </div>
    </div>
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

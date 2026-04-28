import { useEffect, useMemo, useState } from "react";
import { useMoneybird } from "@/hooks/useMoneybird";
import { formatEuroDecimal } from "@/types/vehicle";
import { Loader2, AlertTriangle, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";

/* ───────── Categorie mapping ───────── */
type CatKey =
  | "voertuigkosten"
  | "vaste_energie"
  | "vaste_verzekering"
  | "advertentie"
  | "abonnementen"
  | "software"
  | "overig";

const CAT_LABELS: Record<CatKey, string> = {
  voertuigkosten: "Voertuigkosten",
  vaste_energie: "Vaste kosten — Energie",
  vaste_verzekering: "Vaste kosten — Verzekering",
  advertentie: "Advertentiekosten",
  abonnementen: "Abonnementen",
  software: "Software",
  overig: "Overig",
};

function categorize(supplier: string, description: string): CatKey {
  const s = (supplier || "").toLowerCase();
  const d = (description || "").toLowerCase();

  if (s.includes("alliance automotive") || s.includes("partspoint")) return "voertuigkosten";
  if (s.includes("elix")) return "vaste_energie";
  if (s.includes("asr") || s.includes("schadeverzekering") || s.includes("verzekering")) return "vaste_verzekering";
  if (s.includes("marktplaats") || s.includes("autoscout")) return "advertentie";
  if (s.includes("vwe") || s.includes("autotrust")) return "abonnementen";
  if (s.includes("moneybird") || s.includes("lovable")) return "software";
  if (d.includes("auto") || d.includes("voertuig")) return "voertuigkosten";
  return "overig";
}

/* ───────── Periode helpers ───────── */
type PeriodInput = {
  periodType: "jaar" | "kwartaal" | "maand" | "custom";
  year: number;
  quarter: number;
  month: number;
  customFrom?: Date;
  customTo?: Date;
};

function fmtYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function buildMoneybirdFilter(p: PeriodInput): string {
  const now = new Date();
  if (p.periodType === "custom" && p.customFrom && p.customTo) {
    return `period:${fmtYmd(p.customFrom)}..${fmtYmd(p.customTo)}`;
  }
  if (p.periodType === "jaar") {
    if (p.year === now.getFullYear()) return "period:this_year";
    return `period:${p.year}0101..${p.year}1231`;
  }
  if (p.periodType === "kwartaal") {
    const months = [[0, 2], [3, 5], [6, 8], [9, 11]][p.quarter - 1];
    const from = new Date(p.year, months[0], 1);
    const to = new Date(p.year, months[1] + 1, 0);
    if (p.year === now.getFullYear() && p.quarter === Math.floor(now.getMonth() / 3) + 1) {
      return "period:this_quarter";
    }
    return `period:${fmtYmd(from)}..${fmtYmd(to)}`;
  }
  if (p.periodType === "maand") {
    const from = new Date(p.year, p.month, 1);
    const to = new Date(p.year, p.month + 1, 0);
    if (p.year === now.getFullYear() && p.month === now.getMonth()) return "period:this_month";
    if (p.year === now.getFullYear() && p.month === now.getMonth() - 1) return "period:prev_month";
    return `period:${fmtYmd(from)}..${fmtYmd(to)}`;
  }
  return "period:this_year";
}

/* ───────── Kenteken filter ───────── */
const PLATE_RE = /^\s*[A-Z0-9]{1,3}-?[A-Z0-9]{1,3}-?[A-Z0-9]{1,3}\s*,/i;

function isVehiclePurchase(desc: string) {
  return PLATE_RE.test(desc || "");
}

/* ───────── Component ───────── */
type Props = { period: PeriodInput };

const MoneybirdKostenTab = ({ period }: Props) => {
  const { getPurchaseInvoices } = useMoneybird();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filter = useMemo(() => buildMoneybirdFilter(period), [period]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const all: any[] = [];
      for (let page = 1; page <= 10; page++) {
        const res: any = await getPurchaseInvoices(page, filter);
        const arr = Array.isArray(res) ? res : (res?.data || []);
        if (!arr.length) break;
        all.push(...arr);
        if (arr.length < 100) break;
      }
      setInvoices(all);
    } catch (e: any) {
      setError(e?.message || "Kon Moneybird niet bereiken");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  /* ── Filter & enrich ── */
  const enriched = useMemo(() => {
    return invoices
      .filter((inv) => {
        const desc = inv?.details?.[0]?.description || "";
        return !isVehiclePurchase(desc);
      })
      .map((inv) => {
        const supplier = inv?.contact?.company_name || inv?.contact?.firstname || "Onbekend";
        const desc = inv?.details?.[0]?.description || "—";
        const cat = categorize(supplier, desc);
        const total = parseFloat(inv?.total_price_incl_tax || "0");
        const state = inv?.state || "open";
        return { inv, supplier, desc, cat, total, state };
      });
  }, [invoices]);

  /* ── Aggregations ── */
  const totalCost = enriched.reduce((s, e) => s + e.total, 0);

  const supplierTotals = useMemo(() => {
    const m = new Map<string, number>();
    enriched.forEach((e) => m.set(e.supplier, (m.get(e.supplier) || 0) + e.total));
    let max = { name: "—", val: 0 };
    m.forEach((v, k) => { if (v > max.val) max = { name: k, val: v }; });
    return max;
  }, [enriched]);

  const open = enriched.filter((e) => e.state === "open" || e.state === "late" || e.state === "new");
  const openTotal = open.reduce((s, e) => s + e.total, 0);

  const byCat = useMemo(() => {
    const groups: Record<string, typeof enriched> = {};
    enriched.forEach((e) => {
      if (!groups[e.cat]) groups[e.cat] = [];
      groups[e.cat].push(e);
    });
    return Object.entries(groups)
      .map(([cat, items]) => ({
        cat: cat as CatKey,
        items,
        total: items.reduce((s, i) => s + i.total, 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [enriched]);

  /* ── Render ── */
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 bg-card border border-border rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-card border border-border rounded-lg animate-pulse flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 flex flex-col items-center text-center gap-3">
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <div>
          <p className="font-medium text-foreground">Moneybird ophalen mislukt</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Opnieuw proberen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Samenvatting */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card label="Totale kosten Moneybird" value={formatEuroDecimal(totalCost)} />
        <Card
          label="Grootste kostenpost"
          value={formatEuroDecimal(supplierTotals.val)}
          sub={supplierTotals.name}
        />
        <Card
          label="Openstaande facturen"
          value={formatEuroDecimal(openTotal)}
          sub={`${open.length} factu${open.length === 1 ? "ur" : "ren"}`}
          danger
        />
      </div>

      {/* Categorieën */}
      {byCat.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
          Geen inkoopfacturen gevonden in deze periode.
        </div>
      ) : (
        <div className="space-y-2">
          {byCat.map((g) => {
            const isOpen = expanded[g.cat] ?? true;
            return (
              <div key={g.cat} className="bg-card border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpanded((s) => ({ ...s, [g.cat]: !isOpen }))}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <span className="text-sm font-semibold">{CAT_LABELS[g.cat]}</span>
                    <span className="text-xs text-muted-foreground">({g.items.length})</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatEuroDecimal(g.total)}
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-border divide-y divide-border">
                    {g.items.map(({ inv, supplier, desc, total, state }) => (
                      <div
                        key={inv.id}
                        className="px-4 py-2.5 grid grid-cols-12 gap-3 items-center text-[13px] hover:bg-accent/20"
                      >
                        <div className="col-span-3 font-medium truncate">{supplier}</div>
                        <div className="col-span-4 text-muted-foreground truncate" title={desc}>
                          {desc.length > 50 ? desc.slice(0, 50) + "…" : desc}
                        </div>
                        <div className="col-span-2 text-muted-foreground tabular-nums">
                          {inv.date ? new Date(inv.date).toLocaleDateString("nl-NL") : "—"}
                        </div>
                        <div className="col-span-2 text-right tabular-nums font-medium">
                          {formatEuroDecimal(total)}
                        </div>
                        <div className="col-span-1 text-right">
                          <StateBadge state={state} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Card = ({ label, value, sub, danger }: { label: string; value: string; sub?: string; danger?: boolean }) => (
  <div className="bg-card border border-border rounded-lg p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`text-xl font-semibold tabular-nums mt-1 ${danger ? "text-red-500" : "text-foreground"}`}>
      {value}
    </p>
    {sub && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>}
  </div>
);

const StateBadge = ({ state }: { state: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    paid: { label: "Betaald", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
    open: { label: "Open", cls: "bg-muted text-muted-foreground border-border" },
    new: { label: "Open", cls: "bg-muted text-muted-foreground border-border" },
    late: { label: "Te laat", cls: "bg-red-500/15 text-red-500 border-red-500/30" },
  };
  const m = map[state] || { label: state, cls: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded border ${m.cls}`}>
      {m.label}
    </span>
  );
};

export default MoneybirdKostenTab;

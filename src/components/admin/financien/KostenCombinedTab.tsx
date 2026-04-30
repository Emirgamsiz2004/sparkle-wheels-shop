import { useEffect, useMemo, useState, useCallback } from "react";
import { useMoneybird } from "@/hooks/useMoneybird";
import { useKosten, Kost, KostCategorie, KostFrequentie, kostCategorieLabels, kostFrequentieLabels, kostBedragInPeriode } from "@/hooks/useKosten";
import { supabase } from "@/integrations/supabase/client";

import { Plus, X, TrendingUp, TrendingDown, Receipt, Wallet, Percent, ShoppingCart, FileText } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ───────── Section keys ───────── */
type SectionKey =
  | "vaste_kosten"
  | "abonnementen"
  | "inkoop_voertuigen"
  | "variabele_kosten"
  | "advertentiekosten"
  | "personeelskosten";

const SECTION_LABELS: Record<SectionKey, string> = {
  vaste_kosten: "Vaste kosten",
  abonnementen: "Abonnementen & software",
  inkoop_voertuigen: "Inkoop voertuigen",
  variabele_kosten: "Variabele kosten (onderdelen & reparaties)",
  advertentiekosten: "Advertentiekosten",
  personeelskosten: "Personeelskosten",
};

const FILTER_LABELS: Record<SectionKey, string> = {
  vaste_kosten: "Vaste kosten",
  abonnementen: "Abonnementen",
  inkoop_voertuigen: "Inkoop voertuigen",
  variabele_kosten: "Variabele kosten",
  advertentiekosten: "Advertentiekosten",
  personeelskosten: "Personeelskosten",
};

/* ───────── Helpers ───────── */
const PLATE_RE = /\b[A-Z0-9]{1,3}-?[A-Z0-9]{1,3}-?[A-Z0-9]{1,3}\b/i;
const formatEuro = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n || 0);
const formatDate = (d: Date) =>
  d.toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" });

function extractKenteken(text: string): string | null {
  const m = (text || "").match(PLATE_RE);
  return m ? m[0].toUpperCase().replace(/-/g, "") : null;
}

function isAutoSupplier(supplier: string): boolean {
  const s = (supplier || "").toLowerCase();
  if (!s) return false;
  if (s.includes("alliance") || s.includes("partspoint")) return false;
  if (s.includes("sparks")) return true;
  return s.includes("cars") || s.includes("automotive") || s.includes("auto ");
}

function categorizeMoneybird(supplier: string, description: string): SectionKey | "overig" {
  const s = (supplier || "").toLowerCase();
  // Inkoop voertuigen
  if (PLATE_RE.test(description || "") || isAutoSupplier(supplier)) return "inkoop_voertuigen";
  // Abonnementen / software
  if (s.includes("marktplaats") && (s.includes("advertentie") || s.includes("ads"))) return "advertentiekosten";
  if (s.includes("google ads") || s.includes("facebook") || s.includes("meta") || s.includes("instagram")) return "advertentiekosten";
  if (s.includes("marktplaats") || s.includes("autoscout") || s.includes("vwe") || s.includes("autotrust") || s.includes("moneybird") || s.includes("lovable")) return "abonnementen";
  // Variabele kosten
  if (s.includes("alliance") || s.includes("partspoint")) return "variabele_kosten";
  // Vaste kosten
  if (s.includes("asr") || s.includes("elix") || s.includes("verzekering") || s.includes("huur") || s.includes("cilinderweg") || s.includes("nuon") || s.includes("eneco") || s.includes("vattenfall") || s.includes("kpn") || s.includes("ziggo")) return "vaste_kosten";
  return "overig";
}

function mapManualToSection(c: KostCategorie, naam: string): SectionKey | "overig" {
  if (c === "vaste_kosten") return "vaste_kosten";
  if (c === "advertentiekosten") return "advertentiekosten";
  if (c === "abonnementen") return "abonnementen";
  if (c === "personeelskosten") return "personeelskosten";
  if (c === "voertuigkosten") return "variabele_kosten";
  // overig: try by naam
  const n = (naam || "").toLowerCase();
  if (n.includes("software") || n.includes("abonn")) return "abonnementen";
  return "overig";
}

/* ───────── Periode ───────── */
type PeriodType = "maand" | "kwartaal" | "jaar" | "custom";
const maandNamen = ["Januari","Februari","Maart","April","Mei","Juni","Juli","Augustus","September","Oktober","November","December"];

function getPeriodRange(periodType: PeriodType, year: number, quarter: number, month: number, customFrom?: Date, customTo?: Date): { from: Date; to: Date } {
  if (periodType === "custom" && customFrom && customTo) return { from: customFrom, to: customTo };
  if (periodType === "maand") return { from: new Date(year, month, 1), to: new Date(year, month + 1, 0, 23, 59, 59) };
  if (periodType === "kwartaal") {
    const months = [[0, 2], [3, 5], [6, 8], [9, 11]][quarter - 1];
    return { from: new Date(year, months[0], 1), to: new Date(year, months[1] + 1, 0, 23, 59, 59) };
  }
  return { from: new Date(year, 0, 1), to: new Date(year, 11, 31, 23, 59, 59) };
}

function fmtYmd(d: Date) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}
function buildMoneybirdFilter(from: Date, to: Date): string {
  return `period:${fmtYmd(from)}..${fmtYmd(to)}`;
}

/* ───────── Types ───────── */
type PaymentState = "paid" | "open" | "late" | null;

type Row = {
  id: string;
  date: Date;
  description: string;
  supplier: string;
  amount: number;
  section: SectionKey | "overig";
  source: "moneybird" | "handmatig" | "inkoopverklaring";
  state: PaymentState;
  kenteken?: string | null;
  raw?: any;
};

type SaleRow = {
  id: string;
  verkoopprijs: number;
  verkoop_datum: string | null;
  vehicle: {
    id: string;
    kenteken: string | null;
    merk: string | null;
    model: string | null;
    inkoopprijs: number | null;
    verkoop_type: string | null;
    status: string | null;
    consignatie_commissie_perc: number | null;
  } | null;
};

type InkoopRow = {
  id: string;
  inkoopprijs: number;
  datum: string;
  kenteken: string | null;
  merk: string | null;
  model: string | null;
  verkoper_naam: string | null;
};

/* ───────── Component ───────── */
const KostenCombinedTab = () => {
  const isMobile = useIsMobile();
  const { getPurchaseInvoices } = useMoneybird();
  const { kosten, create, remove, reload: reloadKosten } = useKosten();

  const now = new Date();
  const [periodType, setPeriodType] = useState<PeriodType>("maand");
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);
  const [month, setMonth] = useState(now.getMonth());
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  const [filter, setFilter] = useState<SectionKey | "all">("all");

  const [loading, setLoading] = useState(true);
  const [purchaseInvoices, setPurchaseInvoices] = useState<any[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [inkoopverklaringen, setInkoopverklaringen] = useState<InkoopRow[]>([]);

  const [addOpen, setAddOpen] = useState(false);

  const range = useMemo(
    () => getPeriodRange(periodType, year, quarter, month, customFrom, customTo),
    [periodType, year, quarter, month, customFrom, customTo]
  );
  const mbFilter = useMemo(() => buildMoneybirdFilter(range.from, range.to), [range]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const fromIso = range.from.toISOString().slice(0, 10);
    const toIso = range.to.toISOString().slice(0, 10);

    const fetchMb = async (filter: string) => {
      const all: any[] = [];
      for (let page = 1; page <= 10; page++) {
        try {
          const res: any = await getPurchaseInvoices(page, filter);
          const arr = Array.isArray(res) ? res : (res?.data || []);
          if (!arr.length) break;
          all.push(...arr);
          if (arr.length < 100) break;
        } catch (e) {
          console.error("MB error", e);
          break;
        }
      }
      return all;
    };

    const mbP = fetchMb(mbFilter);
    const verkopenP = supabase
      .from("vehicle_sales")
      .select("id, verkoopprijs, verkoop_datum, vehicle:vehicles(id, kenteken, merk, model, inkoopprijs, verkoop_type, status, consignatie_commissie_perc)")
      .eq("status", "voltooid")
      .gte("verkoop_datum", fromIso)
      .lte("verkoop_datum", toIso);
    const ikvP = supabase
      .from("inkoopverklaringen")
      .select("id, inkoopprijs, datum, kenteken, merk, model, verkoper_naam")
      .gte("datum", fromIso)
      .lte("datum", toIso);
    const kostenP = reloadKosten();

    const [mbInv, verkopenRes, ikvRes] = await Promise.all([mbP, verkopenP, ikvP, kostenP]);

    setPurchaseInvoices(mbInv || []);
    setSales((verkopenRes.data as any[] || []) as SaleRow[]);
    setInkoopverklaringen((ikvRes.data as any[] || []) as InkoopRow[]);
    setLoading(false);
  }, [mbFilter, range.from, range.to, getPurchaseInvoices, reloadKosten]);

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [mbFilter]);

  /* ─── Build rows per section ─── */
  const { sectionRows, allRows } = useMemo(() => {
    const byCat: Record<SectionKey, Row[]> = {
      vaste_kosten: [], abonnementen: [], inkoop_voertuigen: [],
      variabele_kosten: [], advertentiekosten: [], personeelskosten: [],
    };

    // Inkoopverklaringen first (for dedupe)
    const ikvKeys = new Set<string>();
    inkoopverklaringen.forEach((i) => {
      const ken = (i.kenteken || "").toUpperCase().replace(/-/g, "") || null;
      const amt = Number(i.inkoopprijs) || 0;
      if (ken) ikvKeys.add(`${ken}|${Math.round(amt)}`);
      byCat.inkoop_voertuigen.push({
        id: `ikv-${i.id}`,
        date: new Date(i.datum),
        description: `${i.merk || ""} ${i.model || ""}`.trim() || "Inkoopverklaring",
        supplier: i.verkoper_naam || "Particulier",
        amount: amt,
        section: "inkoop_voertuigen",
        source: "inkoopverklaring",
        state: null,
        kenteken: ken,
        raw: i,
      });
    });

    // Moneybird invoices
    purchaseInvoices.forEach((inv) => {
      const supplier = inv?.contact?.company_name || inv?.contact?.firstname || "Onbekend";
      const desc = inv?.details?.[0]?.description || inv?.reference || "—";
      const sec = categorizeMoneybird(supplier, desc);
      const amt = parseFloat(inv?.total_price_incl_tax || "0") || 0;
      const state: PaymentState = inv?.state === "paid" ? "paid" : inv?.state === "late" ? "late" : "open";
      const ken = extractKenteken(desc) || extractKenteken(inv?.reference || "");

      if (sec === "inkoop_voertuigen") {
        const dedupKey = ken ? `${ken}|${Math.round(amt)}` : null;
        if (dedupKey && ikvKeys.has(dedupKey)) return;
      }

      const row: Row = {
        id: `mb-${inv.id}`,
        date: inv.date ? new Date(inv.date) : new Date(),
        description: desc,
        supplier,
        amount: amt,
        section: sec,
        source: "moneybird",
        state,
        kenteken: ken,
        raw: inv,
      };
      if (sec !== "overig") byCat[sec].push(row);
    });

    // Manual kosten
    kosten.forEach((k) => {
      const bedrag = kostBedragInPeriode(k, range.from, range.to);
      if (bedrag <= 0) return;
      const sec = mapManualToSection(k.categorie, k.naam);
      const row: Row = {
        id: `man-${k.id}`,
        date: new Date(k.datum),
        description: k.naam,
        supplier: k.leverancier || "—",
        amount: bedrag,
        section: sec,
        source: "handmatig",
        state: null,
        raw: k,
      };
      if (sec !== "overig") byCat[sec].push(row);
    });

    // sort each section newest first
    (Object.keys(byCat) as SectionKey[]).forEach((k) => {
      byCat[k].sort((a, b) => b.date.getTime() - a.date.getTime());
    });

    const all = ([] as Row[]).concat(...Object.values(byCat));
    return { sectionRows: byCat, allRows: all };
  }, [inkoopverklaringen, purchaseInvoices, kosten, range]);

  /* ─── Omzet ─── */
  const { omzet, verkopenAantal } = useMemo(() => {
    let total = 0;
    sales.forEach((s) => {
      const prijs = Number(s.verkoopprijs) || 0;
      const vt = s.vehicle?.verkoop_type || "regulier";
      const vstatus = s.vehicle?.status || "";
      if (vt === "consignatie" || vstatus === "consignatie") {
        const perc = Number(s.vehicle?.consignatie_commissie_perc) || 10;
        total += prijs * (perc / 100);
      } else {
        total += prijs;
      }
    });
    return { omzet: total, verkopenAantal: sales.length };
  }, [sales]);

  const totalCost = allRows.reduce((s, r) => s + r.amount, 0);
  const winst = omzet - totalCost;

  /* ─── BTW (margeregeling) ─── */
  const btwMarge = useMemo(() => {
    let totalBtw = 0;
    sales.forEach((s) => {
      const vt = s.vehicle?.verkoop_type || "regulier";
      const vstatus = s.vehicle?.status || "";
      if (vt === "consignatie" || vstatus === "consignatie") return;
      const verkoop = Number(s.verkoopprijs) || 0;
      const inkoop = Number(s.vehicle?.inkoopprijs) || 0;
      const marge = Math.max(0, verkoop - inkoop);
      totalBtw += marge * (21 / 121);
    });
    return totalBtw;
  }, [sales]);

  /* ─── Gem. marge % eigen voertuigen ─── */
  const gemMargePerc = useMemo(() => {
    const eigen = sales.filter((s) => {
      const vt = s.vehicle?.verkoop_type || "regulier";
      const vstatus = s.vehicle?.status || "";
      return !(vt === "consignatie" || vstatus === "consignatie");
    });
    const valid = eigen.filter((s) => (Number(s.vehicle?.inkoopprijs) || 0) > 0);
    if (!valid.length) return null;
    const total = valid.reduce((sum, s) => {
      const v = Number(s.verkoopprijs) || 0;
      const i = Number(s.vehicle?.inkoopprijs) || 0;
      return sum + ((v - i) / i) * 100;
    }, 0);
    return total / valid.length;
  }, [sales]);

  /* ─── Marge per voertuig ─── */
  const margeRows = useMemo(() => {
    return sales.map((s) => {
      const vt = s.vehicle?.verkoop_type || "regulier";
      const vstatus = s.vehicle?.status || "";
      const isConsign = vt === "consignatie" || vstatus === "consignatie";
      const verkoop = Number(s.verkoopprijs) || 0;
      const inkoop = Number(s.vehicle?.inkoopprijs) || 0;
      let marge = 0;
      let margePerc: number | null = null;
      if (isConsign) {
        const perc = Number(s.vehicle?.consignatie_commissie_perc) || 10;
        marge = verkoop * (perc / 100);
        margePerc = perc;
      } else if (inkoop > 0) {
        marge = verkoop - inkoop;
        margePerc = ((verkoop - inkoop) / inkoop) * 100;
      } else {
        marge = verkoop;
      }
      return {
        id: s.id,
        merk: s.vehicle?.merk || "—",
        model: s.vehicle?.model || "",
        kenteken: s.vehicle?.kenteken || "",
        isConsign,
        inkoop,
        verkoop,
        marge,
        margePerc,
      };
    }).sort((a, b) => b.marge - a.marge);
  }, [sales]);

  const totaleBruto = margeRows.reduce((s, r) => s + r.marge, 0);
  const gemMargeAlle = margeRows.length
    ? margeRows.filter((r) => r.margePerc !== null).reduce((s, r) => s + (r.margePerc || 0), 0) /
      Math.max(1, margeRows.filter((r) => r.margePerc !== null).length)
    : 0;

  /* ─── Render ─── */
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-5">
      {/* Periode selector + Add button */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["maand", "kwartaal", "jaar", "custom"] as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodType(p)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-[10px] border transition-colors",
                periodType === p
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/40 border-border text-muted-foreground hover:bg-secondary/60"
              )}
            >
              {p === "maand" ? "Maand" : p === "kwartaal" ? "Kwartaal" : p === "jaar" ? "Jaar" : "Aangepast"}
            </button>
          ))}

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-secondary/40 border border-border rounded-[10px] px-2 py-1.5 text-xs"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          {periodType === "maand" && (
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-secondary/40 border border-border rounded-[10px] px-2 py-1.5 text-xs"
            >
              {maandNamen.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          )}

          {periodType === "kwartaal" && (
            <select
              value={quarter}
              onChange={(e) => setQuarter(Number(e.target.value))}
              className="bg-secondary/40 border border-border rounded-[10px] px-2 py-1.5 text-xs"
            >
              {[1, 2, 3, 4].map((q) => <option key={q} value={q}>Q{q}</option>)}
            </select>
          )}

          {periodType === "custom" && (
            <>
              <input type="date" value={customFrom ? customFrom.toISOString().slice(0, 10) : ""}
                onChange={(e) => setCustomFrom(e.target.value ? new Date(e.target.value) : undefined)}
                className="bg-secondary/40 border border-border rounded-[10px] px-2 py-1.5 text-xs" />
              <input type="date" value={customTo ? customTo.toISOString().slice(0, 10) : ""}
                onChange={(e) => setCustomTo(e.target.value ? new Date(e.target.value) : undefined)}
                className="bg-secondary/40 border border-border rounded-[10px] px-2 py-1.5 text-xs" />
            </>
          )}
        </div>

        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-[10px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Kost toevoegen
        </button>
      </div>

      {loading ? (
        <SkeletonAll />
      ) : (
        <>
          {/* Hoofdkaarten */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCard
              icon={TrendingUp}
              label="Omzet"
              value={formatEuro(omzet)}
              sub={`${verkopenAantal} verkoop${verkopenAantal === 1 ? "" : "en"}`}
              tone="positive"
            />
            <MetricCard
              icon={Wallet}
              label="Totale kosten"
              value={formatEuro(totalCost)}
              sub={`${allRows.length} posten`}
              tone="neutral"
            />
            <MetricCard
              icon={winst >= 0 ? TrendingUp : TrendingDown}
              label="Winst"
              value={formatEuro(winst)}
              tone={winst >= 0 ? "positive" : "negative"}
            />
            <MetricCard
              icon={Receipt}
              label="BTW"
              value={formatEuro(btwMarge)}
              sub="Schatting margeregeling"
              tone="neutral"
            />
            <MetricCard
              icon={Percent}
              label="Gem. marge %"
              value={gemMargePerc !== null ? `${gemMargePerc.toFixed(1)}%` : "—"}
              sub="Eigen voertuigen"
              tone="neutral"
            />
          </div>

          {/* Categorie filter */}
          <div className="flex flex-wrap gap-2">
            <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>Alle</FilterPill>
            {(Object.keys(FILTER_LABELS) as SectionKey[]).map((k) => (
              <FilterPill key={k} active={filter === k} onClick={() => setFilter(k)}>
                {FILTER_LABELS[k]}
              </FilterPill>
            ))}
          </div>

          {/* Sections */}
          {filter === "all" ? (
            <div className="space-y-4">
              <Section title={SECTION_LABELS.vaste_kosten} rows={sectionRows.vaste_kosten} columns={["date", "desc", "supplier", "state", "amount"]} />
              <SectionAbonnementen rows={sectionRows.abonnementen} />
              <SectionInkoop rows={sectionRows.inkoop_voertuigen} />
              <Section title={SECTION_LABELS.variabele_kosten} rows={sectionRows.variabele_kosten} columns={["date", "desc", "supplier", "state", "amount"]} />
              <Section title={SECTION_LABELS.advertentiekosten} rows={sectionRows.advertentiekosten} columns={["date", "supplier", "desc", "amount"]} />
              <SectionPersoneel rows={sectionRows.personeelskosten} onAdd={() => setAddOpen(true)} />
              <MargeSection rows={margeRows} totaleBruto={totaleBruto} gemMargePerc={gemMargeAlle} />
            </div>
          ) : (
            <FilteredList
              title={SECTION_LABELS[filter]}
              rows={sectionRows[filter]}
              onAddPersoneel={filter === "personeelskosten" ? () => setAddOpen(true) : undefined}
            />
          )}
        </>
      )}

      <AddCostDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={async () => { setAddOpen(false); await loadAll(); }}
        create={create}
        isMobile={isMobile}
      />
    </div>
  );
};

/* ───────── UI Subcomponents ───────── */

function MetricCard({ icon: Icon, label, value, sub, tone }: { icon: any; label: string; value: string; sub?: string; tone: "positive" | "negative" | "neutral" }) {
  const toneCls = tone === "positive" ? "text-emerald-400" : tone === "negative" ? "text-red-400" : "text-foreground";
  return (
    <div className="rounded-[14px] border border-border bg-secondary/30 p-3">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground uppercase tracking-wide">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className={cn("mt-1.5 text-lg font-semibold tabular-nums", toneCls)}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-xs rounded-[10px] border transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-secondary/40 border-border text-muted-foreground hover:bg-secondary/60"
      )}
    >
      {children}
    </button>
  );
}

function StateBadge({ state }: { state: PaymentState }) {
  if (!state) return <span className="text-[11px] text-muted-foreground">—</span>;
  const map = {
    paid: { label: "Betaald", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
    open: { label: "Open", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
    late: { label: "Te laat", cls: "bg-red-500/15 text-red-300 border-red-500/30" },
  } as const;
  const m = map[state];
  return <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", m.cls)}>{m.label}</span>;
}

type Col = "date" | "desc" | "supplier" | "amount" | "state" | "kenteken" | "source";

function Section({ title, rows, columns }: { title: string; rows: Row[]; columns: Col[] }) {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  return (
    <div className="rounded-[14px] border border-border bg-secondary/20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="text-sm font-semibold tabular-nums">{formatEuro(total)}</div>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-6 text-xs text-muted-foreground text-center">Geen posten in deze periode</div>
      ) : (
        <div className="divide-y divide-border/60">
          {rows.map((r) => <RowLine key={r.id} row={r} columns={columns} />)}
        </div>
      )}
      {rows.length > 0 && (
        <div className="px-4 py-2.5 border-t border-border flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Subtotaal</span>
          <span className="font-semibold tabular-nums">{formatEuro(total)}</span>
        </div>
      )}
    </div>
  );
}

function RowLine({ row, columns }: { row: Row; columns: Col[] }) {
  return (
    <div className="px-4 py-2.5 grid gap-2 items-center text-xs hover:bg-secondary/30 transition-colors"
      style={{ gridTemplateColumns: columns.map((c) => c === "amount" ? "auto" : c === "state" ? "70px" : c === "date" ? "85px" : "1fr").join(" ") }}>
      {columns.map((c) => {
        if (c === "date") return <span key={c} className="text-muted-foreground tabular-nums">{formatDate(row.date)}</span>;
        if (c === "desc") return (
          <span key={c} className="truncate">
            {row.kenteken && <span className="text-muted-foreground mr-1.5 tabular-nums">{row.kenteken}</span>}
            {row.description}
          </span>
        );
        if (c === "supplier") return <span key={c} className="truncate text-muted-foreground">{row.supplier}</span>;
        if (c === "kenteken") return <span key={c} className="text-muted-foreground tabular-nums">{row.kenteken || "—"}</span>;
        if (c === "state") return <StateBadge key={c} state={row.state} />;
        if (c === "source") return <span key={c} className="text-[10px] text-muted-foreground uppercase">{row.source === "moneybird" ? "MB" : row.source === "inkoopverklaring" ? "IKV" : "Handm."}</span>;
        if (c === "amount") return <span key={c} className="text-right font-medium tabular-nums whitespace-nowrap">{formatEuro(row.amount)}</span>;
        return null;
      })}
    </div>
  );
}

function SectionAbonnementen({ rows }: { rows: Row[] }) {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  // Approx jaartotaal: assume amounts are monthly equivalents — sum * 12 / aantal_maanden_in_periode is ambiguous; use total * 12 if periode is one month, anders project naar jaar
  // Eenvoudig: per-post jaarbedrag inschatten op basis van handmatige frequentie indien beschikbaar (raw)
  const jaartotaal = rows.reduce((sum, r) => {
    const k: Kost | undefined = r.source === "handmatig" ? r.raw : undefined;
    if (k) {
      if (k.frequentie === "maandelijks") return sum + Number(k.bedrag) * 12;
      if (k.frequentie === "kwartaal") return sum + Number(k.bedrag) * 4;
      if (k.frequentie === "jaarlijks") return sum + Number(k.bedrag);
      return sum + Number(k.bedrag);
    }
    // Moneybird: schat als maandelijks
    return sum + r.amount * 12;
  }, 0);

  return (
    <div className="rounded-[14px] border border-border bg-secondary/20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">{SECTION_LABELS.abonnementen}</h3>
        <div className="text-sm font-semibold tabular-nums">{formatEuro(total)}</div>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-6 text-xs text-muted-foreground text-center">Geen abonnementen in deze periode</div>
      ) : (
        <div className="divide-y divide-border/60">
          {rows.map((r) => (
            <div key={r.id} className="px-4 py-2.5 grid grid-cols-[1fr_auto_70px_auto] gap-2 items-center text-xs hover:bg-secondary/30">
              <span className="truncate">{r.description !== "—" ? r.description : r.supplier}</span>
              <span className="text-muted-foreground tabular-nums">{formatEuro(r.amount)}/maand</span>
              <StateBadge state={r.state} />
              <span className="text-right text-muted-foreground tabular-nums whitespace-nowrap">{r.supplier}</span>
            </div>
          ))}
        </div>
      )}
      {rows.length > 0 && (
        <div className="px-4 py-2.5 border-t border-border flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Subtotaal periode</span>
          <span className="font-semibold tabular-nums">{formatEuro(total)}</span>
        </div>
      )}
      {rows.length > 0 && (
        <div className="px-4 py-2 border-t border-border/60 flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Totaal per jaar</span>
          <span className="font-semibold tabular-nums text-foreground/80">{formatEuro(jaartotaal)}</span>
        </div>
      )}
    </div>
  );
}

function SectionInkoop({ rows }: { rows: Row[] }) {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  return (
    <div className="rounded-[14px] border border-border bg-secondary/20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">{SECTION_LABELS.inkoop_voertuigen}</h3>
        <div className="text-sm font-semibold tabular-nums">{formatEuro(total)}</div>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-6 text-xs text-muted-foreground text-center">Geen inkopen in deze periode</div>
      ) : (
        <div className="divide-y divide-border/60">
          {rows.map((r) => (
            <div key={r.id} className="px-4 py-2.5 grid grid-cols-[85px_1fr_1fr_auto_70px] gap-2 items-center text-xs hover:bg-secondary/30">
              <span className="text-muted-foreground tabular-nums">{formatDate(r.date)}</span>
              <span className="truncate">
                {r.kenteken && <span className="text-muted-foreground mr-1.5 tabular-nums">{r.kenteken}</span>}
                {r.description}
              </span>
              <span className="truncate text-muted-foreground">{r.supplier}</span>
              <span className="text-right font-medium tabular-nums whitespace-nowrap">{formatEuro(r.amount)}</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded border text-center",
                r.source === "inkoopverklaring"
                  ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                  : "bg-violet-500/15 text-violet-300 border-violet-500/30"
              )}>
                {r.source === "inkoopverklaring" ? "IKV" : "MB"}
              </span>
            </div>
          ))}
        </div>
      )}
      {rows.length > 0 && (
        <div className="px-4 py-2.5 border-t border-border flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Subtotaal · {rows.length} voertuig{rows.length === 1 ? "" : "en"}</span>
          <span className="font-semibold tabular-nums">{formatEuro(total)}</span>
        </div>
      )}
    </div>
  );
}

function SectionPersoneel({ rows, onAdd }: { rows: Row[]; onAdd: () => void }) {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  return (
    <div className="rounded-[14px] border border-border bg-secondary/20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">{SECTION_LABELS.personeelskosten}</h3>
        <div className="text-sm font-semibold tabular-nums">{formatEuro(total)}</div>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-6 flex flex-col items-center gap-2">
          <div className="text-xs text-muted-foreground">Geen personeelskosten geregistreerd</div>
          <button onClick={onAdd} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[10px] bg-secondary/60 border border-border hover:bg-secondary">
            <Plus className="w-3.5 h-3.5" /> Toevoegen
          </button>
        </div>
      ) : (
        <>
          <div className="divide-y divide-border/60">
            {rows.map((r) => (
              <div key={r.id} className="px-4 py-2.5 grid grid-cols-[85px_1fr_1fr_auto] gap-2 items-center text-xs hover:bg-secondary/30">
                <span className="text-muted-foreground tabular-nums">{formatDate(r.date)}</span>
                <span className="truncate">{r.description}</span>
                <span className="truncate text-muted-foreground">{r.supplier}</span>
                <span className="text-right font-medium tabular-nums whitespace-nowrap">{formatEuro(r.amount)}</span>
              </div>
            ))}
          </div>
          <div className="px-4 py-2.5 border-t border-border flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Subtotaal</span>
            <span className="font-semibold tabular-nums">{formatEuro(total)}</span>
          </div>
        </>
      )}
    </div>
  );
}

function MargeSection({ rows, totaleBruto, gemMargePerc }: { rows: any[]; totaleBruto: number; gemMargePerc: number }) {
  return (
    <div className="rounded-[14px] border border-border bg-secondary/20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Marge per voertuig</h3>
        <div className="text-sm font-semibold tabular-nums">{formatEuro(totaleBruto)}</div>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-6 text-xs text-muted-foreground text-center">Geen verkopen in deze periode</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border/60">
                  <th className="text-left font-normal px-4 py-2">Voertuig</th>
                  <th className="text-left font-normal px-2 py-2">Type</th>
                  <th className="text-right font-normal px-2 py-2">Inkoop</th>
                  <th className="text-right font-normal px-2 py-2">Verkoop</th>
                  <th className="text-right font-normal px-2 py-2">Marge</th>
                  <th className="text-right font-normal px-4 py-2">Marge %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-2">
                      <div className="truncate">{r.merk} {r.model}</div>
                      <div className="text-[10px] text-muted-foreground tabular-nums">{r.kenteken}</div>
                    </td>
                    <td className="px-2 py-2">
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded border",
                        r.isConsign ? "bg-violet-500/15 text-violet-300 border-violet-500/30" : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      )}>
                        {r.isConsign ? "Consignatie" : "Eigen"}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">{r.isConsign ? "—" : r.inkoop > 0 ? formatEuro(r.inkoop) : "—"}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{formatEuro(r.verkoop)}</td>
                    <td className={cn("px-2 py-2 text-right tabular-nums font-medium", r.marge >= 0 ? "text-emerald-400" : "text-red-400")}>{formatEuro(r.marge)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.margePerc !== null ? `${r.margePerc.toFixed(1)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-border flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Gemiddelde marge: <span className="text-foreground font-medium">{gemMargePerc.toFixed(1)}%</span></span>
            <span className="font-semibold tabular-nums">Totaal: {formatEuro(totaleBruto)}</span>
          </div>
        </>
      )}
    </div>
  );
}

function FilteredList({ title, rows, onAddPersoneel }: { title: string; rows: Row[]; onAddPersoneel?: () => void }) {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  return (
    <div className="rounded-[14px] border border-border bg-secondary/20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="text-sm font-semibold tabular-nums">{formatEuro(total)}</div>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-8 flex flex-col items-center gap-2">
          <div className="text-xs text-muted-foreground">Geen posten in deze periode</div>
          {onAddPersoneel && (
            <button onClick={onAddPersoneel} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[10px] bg-secondary/60 border border-border hover:bg-secondary">
              <Plus className="w-3.5 h-3.5" /> Toevoegen
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {rows.map((r) => (
            <div key={r.id} className="px-4 py-2.5 grid grid-cols-[85px_1fr_1fr_70px_auto] gap-2 items-center text-xs hover:bg-secondary/30">
              <span className="text-muted-foreground tabular-nums">{formatDate(r.date)}</span>
              <span className="truncate">{r.description}</span>
              <span className="truncate text-muted-foreground">{r.supplier}</span>
              <StateBadge state={r.state} />
              <span className="text-right font-medium tabular-nums whitespace-nowrap">{formatEuro(r.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonAll() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-[14px] border border-border bg-secondary/30 p-3 h-[88px]" />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-7 w-24 rounded-[10px] bg-secondary/40 border border-border" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-[14px] border border-border bg-secondary/20 h-[160px]" />
      ))}
    </div>
  );
}

/* ───────── Add cost dialog ───────── */
function AddCostDialog({
  open, onClose, onCreated, create, isMobile,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  create: (input: Partial<Kost>) => Promise<void>;
  isMobile: boolean;
}) {
  const [naam, setNaam] = useState("");
  const [leverancier, setLeverancier] = useState("");
  const [categorie, setCategorie] = useState<KostCategorie>("vaste_kosten");
  const [bedrag, setBedrag] = useState<string>("");
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10));
  const [frequentie, setFrequentie] = useState<KostFrequentie>("eenmalig");
  const [notities, setNotities] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setNaam(""); setLeverancier(""); setCategorie("vaste_kosten");
      setBedrag(""); setDatum(new Date().toISOString().slice(0, 10));
      setFrequentie("eenmalig"); setNotities("");
    }
  }, [open]);

  const submit = async () => {
    if (!naam.trim()) return toast.error("Vul een omschrijving in");
    const b = parseFloat(bedrag.replace(",", "."));
    if (isNaN(b) || b <= 0) return toast.error("Vul een geldig bedrag in");
    setSaving(true);
    try {
      await create({ naam, leverancier: leverancier || null, categorie, bedrag: b, datum, frequentie, notities: notities || null });
      onCreated();
    } catch {
      // toast handled in hook
    } finally {
      setSaving(false);
    }
  };

  const Body = (
    <div className="space-y-3">
      <Field label="Omschrijving">
        <input value={naam} onChange={(e) => setNaam(e.target.value)} className={inputCls} placeholder="bijv. Verzekering bedrijfsauto" />
      </Field>
      <Field label="Leverancier">
        <input value={leverancier} onChange={(e) => setLeverancier(e.target.value)} className={inputCls} placeholder="bijv. ASR" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Categorie">
          <select value={categorie} onChange={(e) => setCategorie(e.target.value as KostCategorie)} className={inputCls}>
            {(Object.keys(kostCategorieLabels) as KostCategorie[]).map((k) => (
              <option key={k} value={k}>{kostCategorieLabels[k]}</option>
            ))}
          </select>
        </Field>
        <Field label="Bedrag">
          <input value={bedrag} onChange={(e) => setBedrag(e.target.value)} className={inputCls} placeholder="0,00" inputMode="decimal" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Datum">
          <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Frequentie">
          <select value={frequentie} onChange={(e) => setFrequentie(e.target.value as KostFrequentie)} className={inputCls}>
            {(Object.keys(kostFrequentieLabels) as KostFrequentie[]).map((k) => (
              <option key={k} value={k}>{kostFrequentieLabels[k]}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Notities">
        <textarea value={notities} onChange={(e) => setNotities(e.target.value)} className={cn(inputCls, "min-h-[60px] resize-none")} />
      </Field>
      <div className="flex gap-2 justify-end pt-2">
        <button onClick={onClose} className="px-3 py-2 text-xs rounded-[10px] bg-secondary/40 border border-border hover:bg-secondary/60">Annuleren</button>
        <button onClick={submit} disabled={saving} className="px-4 py-2 text-xs rounded-[10px] bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {saving ? "Opslaan…" : "Opslaan"}
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="bottom" className="rounded-t-[16px] border-border">
          <SheetHeader className="mb-3">
            <SheetTitle>Kost toevoegen</SheetTitle>
          </SheetHeader>
          {Body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={(v) => !v && onClose()}>
      <PopoverTrigger asChild>
        <button className="hidden" />
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-[420px] rounded-[16px] border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Kost toevoegen</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        {Body}
      </PopoverContent>
    </Popover>
  );
}

const inputCls = "w-full bg-secondary/40 border border-border rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wide block mb-1">{label}</span>
      {children}
    </label>
  );
}

export default KostenCombinedTab;

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useMoneybird } from "@/hooks/useMoneybird";
import { useKosten, Kost, KostCategorie, KostFrequentie, kostCategorieLabels, kostFrequentieLabels, kostBedragInPeriode } from "@/hooks/useKosten";
import { formatEuroDecimal } from "@/types/vehicle";
import { supabase } from "@/integrations/supabase/client";

import { Plus, Search, Trash2, X, Wrench, Car, Home, Megaphone, Repeat, MoreHorizontal, TrendingUp, TrendingDown, ArrowDownRight, ArrowUpRight, AlertTriangle, FileText } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ───────── Categorie ───────── */
type CatKey =
  | "inkoop_voertuigen"
  | "voertuigkosten"
  | "advertentiekosten"
  | "vaste_kosten"
  | "abonnementen"
  | "software"
  | "overig";

const CAT_LABELS: Record<CatKey, string> = {
  inkoop_voertuigen: "Inkoop voertuigen",
  voertuigkosten: "Voertuigkosten",
  advertentiekosten: "Advertentiekosten",
  vaste_kosten: "Vaste kosten",
  abonnementen: "Abonnementen",
  software: "Software",
  overig: "Overig",
};

const CAT_COLORS: Record<CatKey, string> = {
  inkoop_voertuigen: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  voertuigkosten: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  advertentiekosten: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  vaste_kosten: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  abonnementen: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  software: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  overig: "bg-secondary/60 text-muted-foreground border-border",
};

const CAT_BAR: Record<CatKey, string> = {
  inkoop_voertuigen: "bg-amber-400",
  voertuigkosten: "bg-emerald-400",
  advertentiekosten: "bg-pink-400",
  vaste_kosten: "bg-blue-400",
  abonnementen: "bg-violet-400",
  software: "bg-cyan-400",
  overig: "bg-muted-foreground/50",
};

const CAT_ICONS: Record<CatKey, any> = {
  inkoop_voertuigen: Car,
  voertuigkosten: Wrench,
  advertentiekosten: Megaphone,
  vaste_kosten: Home,
  abonnementen: Repeat,
  software: Repeat,
  overig: MoreHorizontal,
};

/* ───────── Helpers ───────── */
const PLATE_RE = /^\s*[A-Z0-9]{1,3}-?[A-Z0-9]{1,3}-?[A-Z0-9]{1,3}\b/i;
const AUTO_KEYWORDS = ["auto", "cars", "automotive"];
const EXCLUDE_FOR_AUTO = ["alliance", "partspoint", "elix", "asr", "moneybird", "lovable", "marktplaats", "autoscout", "vwe", "autotrust"];

function isAutoSupplier(supplier: string): boolean {
  const s = (supplier || "").toLowerCase();
  if (!s) return false;
  if (s.includes("sparks")) return true;
  if (EXCLUDE_FOR_AUTO.some((k) => s.includes(k))) return false;
  return AUTO_KEYWORDS.some((k) => s.includes(k));
}

function categorizeMoneybird(supplier: string, description: string): CatKey {
  const s = (supplier || "").toLowerCase();
  if (PLATE_RE.test(description || "") || isAutoSupplier(supplier)) return "inkoop_voertuigen";
  if (s.includes("alliance") || s.includes("partspoint")) return "voertuigkosten";
  if (s.includes("elix") || s.includes("asr") || s.includes("verzekering") || s.includes("schade") || s.includes("huur") || s.includes("cilinderweg")) return "vaste_kosten";
  if (s.includes("marktplaats") || s.includes("autoscout") || s.includes("facebook") || s.includes("google ads")) return "advertentiekosten";
  if (s.includes("vwe") || s.includes("autotrust")) return "abonnementen";
  if (s.includes("moneybird") || s.includes("lovable")) return "software";
  return "overig";
}

function mapManualCat(c: KostCategorie): CatKey {
  if (c === "vaste_kosten") return "vaste_kosten";
  if (c === "advertentiekosten") return "advertentiekosten";
  if (c === "abonnementen") return "abonnementen";
  if (c === "voertuigkosten") return "voertuigkosten";
  if (c === "personeelskosten") return "vaste_kosten";
  return "overig";
}

function extractKenteken(text: string): string | null {
  const m = (text || "").match(/\b[A-Z0-9]{1,3}-?[A-Z0-9]{1,3}-?[A-Z0-9]{1,3}\b/i);
  return m ? m[0].toUpperCase().replace(/-/g, "") : null;
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

const FREQ_TO_MONTHLY: Record<KostFrequentie, number> = {
  eenmalig: 0, maandelijks: 1, kwartaal: 1 / 3, jaarlijks: 1 / 12,
};

/* ───────── Types ───────── */
type Source = "moneybird" | "handmatig" | "inkoopverklaring";

type UnifiedRow = {
  id: string;
  date: Date;
  description: string;
  supplier: string;
  category: CatKey;
  amount: number;
  source: Source;
  state?: "paid" | "open" | "late" | null;
  raw: any;
  kenteken?: string | null;
};

type SaleRow = {
  id: string;
  verkoopprijs: number;
  verkoop_datum: string | null;
  vehicle: { verkoop_type: string | null; status: string | null; consignatie_commissie_perc: number | null } | null;
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
  const navigate = useNavigate();
  const { getPurchaseInvoices } = useMoneybird();
  const { kosten, create, update, remove, reload: reloadKosten } = useKosten();

  const now = new Date();
  const [periodType, setPeriodType] = useState<PeriodType>("maand");
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);
  const [month, setMonth] = useState(now.getMonth());
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  const [filterCat, setFilterCat] = useState<CatKey | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "open" | "late">("all");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [mbError, setMbError] = useState<string | null>(null);
  const [purchaseInvoices, setPurchaseInvoices] = useState<any[]>([]);
  const [openInvoicesAll, setOpenInvoicesAll] = useState<any[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [inkoopverklaringen, setInkoopverklaringen] = useState<InkoopRow[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Kost | null>(null);
  const [detailRow, setDetailRow] = useState<UnifiedRow | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);

  const range = useMemo(
    () => getPeriodRange(periodType, year, quarter, month, customFrom, customTo),
    [periodType, year, quarter, month, customFrom, customTo]
  );
  const mbFilter = useMemo(() => buildMoneybirdFilter(range.from, range.to), [range]);

  /* ── Load alles parallel ── */
  const loadAll = useCallback(async () => {
    setLoading(true);
    setMbError(null);

    const fromIso = range.from.toISOString().slice(0, 10);
    const toIso = range.to.toISOString().slice(0, 10);

    const fetchMbAll = async (filter: string) => {
      const all: any[] = [];
      for (let page = 1; page <= 10; page++) {
        const res: any = await getPurchaseInvoices(page, filter);
        const arr = Array.isArray(res) ? res : (res?.data || []);
        if (!arr.length) break;
        all.push(...arr);
        if (arr.length < 100) break;
      }
      return all;
    };

    const mbPurchases = fetchMbAll(mbFilter).catch((e) => {
      setMbError(e?.message || "Moneybird onbereikbaar");
      return [] as any[];
    });
    const mbOpen = fetchMbAll("filter=state:open|late").catch(() => [] as any[]);

    const verkopenP = supabase
      .from("vehicle_sales")
      .select("id, verkoopprijs, verkoop_datum, vehicle:vehicles(verkoop_type, status, consignatie_commissie_perc)")
      .eq("status", "voltooid")
      .gte("verkoop_datum", fromIso)
      .lte("verkoop_datum", toIso);

    const ikvP = supabase
      .from("inkoopverklaringen")
      .select("id, inkoopprijs, datum, kenteken, merk, model, verkoper_naam")
      .gte("datum", fromIso)
      .lte("datum", toIso);

    const kostenP = reloadKosten();

    const [mbInv, mbOpenInv, verkopenRes, ikvRes] = await Promise.all([
      mbPurchases, mbOpen, verkopenP, ikvP, kostenP,
    ]);

    setPurchaseInvoices(mbInv || []);
    setOpenInvoicesAll(mbOpenInv || []);

    if (verkopenRes.error) console.error(verkopenRes.error);
    setSales((verkopenRes.data as any[] || []) as SaleRow[]);

    if (ikvRes.error) console.error(ikvRes.error);
    setInkoopverklaringen((ikvRes.data as any[] || []) as InkoopRow[]);

    setLoading(false);
  }, [mbFilter, range.from, range.to, getPurchaseInvoices, reloadKosten]);

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [mbFilter]);

  /* ── Inkoop voertuigen: dedup MB + IKV ── */
  const { ikvRows, mbInkoopRows, dedupedInkoopTotaal, ikvCount, mbInkoopCount } = useMemo(() => {
    const ikvKeys = new Set<string>();
    const ikvRows: UnifiedRow[] = inkoopverklaringen.map((i) => {
      const ken = (i.kenteken || "").toUpperCase().replace(/-/g, "") || null;
      const amt = Number(i.inkoopprijs) || 0;
      if (ken) ikvKeys.add(`${ken}|${Math.round(amt)}`);
      return {
        id: `ikv-${i.id}`,
        date: new Date(i.datum),
        description: `${i.merk || ""} ${i.model || ""}`.trim() || "Inkoopverklaring",
        supplier: i.verkoper_naam || "Particulier",
        category: "inkoop_voertuigen" as CatKey,
        amount: amt,
        source: "inkoopverklaring" as Source,
        state: null,
        raw: i,
        kenteken: ken,
      };
    });

    const mbInkoopRows: UnifiedRow[] = [];
    purchaseInvoices.forEach((inv) => {
      const supplier = inv?.contact?.company_name || inv?.contact?.firstname || "Onbekend";
      const desc = inv?.details?.[0]?.description || "—";
      const cat = categorizeMoneybird(supplier, desc);
      if (cat !== "inkoop_voertuigen") return;
      const amt = parseFloat(inv?.total_price_incl_tax || "0") || 0;
      const ken = extractKenteken(desc) || extractKenteken(inv?.reference || "");
      const dedupKey = ken ? `${ken}|${Math.round(amt)}` : null;
      if (dedupKey && ikvKeys.has(dedupKey)) return; // skip duplicate
      mbInkoopRows.push({
        id: `mb-${inv.id}`,
        date: inv.date ? new Date(inv.date) : new Date(),
        description: desc,
        supplier,
        category: "inkoop_voertuigen",
        amount: amt,
        source: "moneybird",
        state: inv?.state === "paid" ? "paid" : inv?.state === "late" ? "late" : "open",
        raw: inv,
        kenteken: ken,
      });
    });

    const total = ikvRows.reduce((s, r) => s + r.amount, 0) + mbInkoopRows.reduce((s, r) => s + r.amount, 0);
    return { ikvRows, mbInkoopRows, dedupedInkoopTotaal: total, ikvCount: ikvRows.length, mbInkoopCount: mbInkoopRows.length };
  }, [inkoopverklaringen, purchaseInvoices]);

  /* ── Combine all rows ── */
  const rows: UnifiedRow[] = useMemo(() => {
    const mbRows: UnifiedRow[] = purchaseInvoices.map((inv) => {
      const supplier = inv?.contact?.company_name || inv?.contact?.firstname || "Onbekend";
      const desc = inv?.details?.[0]?.description || "—";
      const cat = categorizeMoneybird(supplier, desc);
      if (cat === "inkoop_voertuigen") return null; // handled separately via dedupe
      const amt = parseFloat(inv?.total_price_incl_tax || "0") || 0;
      return {
        id: `mb-${inv.id}`,
        date: inv.date ? new Date(inv.date) : new Date(),
        description: desc,
        supplier,
        category: cat,
        amount: amt,
        source: "moneybird" as Source,
        state: inv?.state === "paid" ? "paid" : inv?.state === "late" ? "late" : "open",
        raw: inv,
      } as UnifiedRow;
    }).filter(Boolean) as UnifiedRow[];

    const manualRows: UnifiedRow[] = kosten.map((k) => {
      const bedrag = kostBedragInPeriode(k, range.from, range.to);
      if (bedrag <= 0) return null;
      return {
        id: `man-${k.id}`,
        date: new Date(k.datum),
        description: k.naam,
        supplier: k.leverancier || "—",
        category: mapManualCat(k.categorie),
        amount: bedrag,
        source: "handmatig" as Source,
        state: null,
        raw: k,
      } as UnifiedRow;
    }).filter(Boolean) as UnifiedRow[];

    return [...mbInkoopRows, ...ikvRows, ...mbRows, ...manualRows]
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [purchaseInvoices, kosten, range, mbInkoopRows, ikvRows]);

  /* ── Filter ── */
  const filtered = useMemo(() => rows.filter((r) => {
    if (filterCat !== "all" && r.category !== filterCat) return false;
    if (filterStatus !== "all") {
      if (r.source !== "moneybird") return false;
      if (r.state !== filterStatus) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (!r.supplier.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [rows, filterCat, filterStatus, search]);

  /* ── Opbrengsten: alleen Supabase verkopen ── */
  const opbrengsten = useMemo(() => {
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
    return total;
  }, [sales]);

  const totalCost = rows.reduce((s, r) => s + r.amount, 0);
  const netResult = opbrengsten - totalCost;

  /* ── Per categorie ── */
  const perCategorie = useMemo(() => {
    const m = new Map<CatKey, { total: number; count: number }>();
    rows.forEach((r) => {
      const cur = m.get(r.category) || { total: 0, count: 0 };
      cur.total += r.amount;
      cur.count += 1;
      m.set(r.category, cur);
    });
    return m;
  }, [rows]);

  const catList = useMemo(() => {
    return (Object.keys(CAT_LABELS) as CatKey[])
      .map((c) => ({ key: c, ...(perCategorie.get(c) || { total: 0, count: 0 }) }))
      .filter((x) => x.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [perCategorie]);

  /* ── Vaste lasten / mnd ── */
  const vasteLasten = useMemo(() => {
    type VL = { id: string; naam: string; perMaand: number };
    const out: VL[] = [];
    // MB ASR + ELIX (most recent)
    const groups = new Map<string, any[]>();
    purchaseInvoices.forEach((inv) => {
      const supplier = (inv?.contact?.company_name || "").toLowerCase();
      if (supplier.includes("asr") || supplier.includes("elix")) {
        const key = supplier.includes("asr") ? "ASR" : "ELIX";
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(inv);
      }
    });
    groups.forEach((arr, key) => {
      const sorted = arr.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      const top = sorted[0];
      const amt = parseFloat(top?.total_price_incl_tax || "0") || 0;
      out.push({ id: `mb-vl-${key}`, naam: top?.contact?.company_name || key, perMaand: amt });
    });
    // Handmatig terugkerend
    kosten.filter((k) => k.actief && k.frequentie !== "eenmalig").forEach((k) => {
      const factor = FREQ_TO_MONTHLY[k.frequentie] || 0;
      out.push({ id: `man-vl-${k.id}`, naam: k.naam, perMaand: (k.bedrag || 0) * factor });
    });
    return out;
  }, [purchaseInvoices, kosten]);
  const totaalVasteLastenPM = vasteLasten.reduce((s, v) => s + v.perMaand, 0);

  /* ── Openstaande facturen ── */
  const openInvoices = useMemo(() => {
    return openInvoicesAll.map((inv) => {
      const supplier = inv?.contact?.company_name || inv?.contact?.firstname || "Onbekend";
      const amt = parseFloat(inv?.total_price_incl_tax || "0") || 0;
      const state: "open" | "late" = inv?.state === "late" ? "late" : "open";
      return { id: inv.id, supplier, amount: amt, state };
    });
  }, [openInvoicesAll]);
  const openTotaal = openInvoices.reduce((s, o) => s + o.amount, 0);

  /* ── Periode UI ── */
  const availableYears = useMemo(() => {
    const ys = new Set<number>([now.getFullYear()]);
    for (let i = 1; i <= 4; i++) ys.add(now.getFullYear() - i);
    return Array.from(ys).sort((a, b) => b - a);
  }, []);

  const periodLabel = useMemo(() => {
    if (periodType === "maand") return `${maandNamen[month]} ${year}`;
    if (periodType === "kwartaal") return `Q${quarter} ${year}`;
    if (periodType === "jaar") return String(year);
    if (customFrom && customTo) return `${customFrom.toLocaleDateString("nl-NL")} t/m ${customTo.toLocaleDateString("nl-NL")}`;
    return "Aangepast";
  }, [periodType, year, quarter, month, customFrom, customTo]);

  const handleCategoryClick = (c: CatKey) => {
    setFilterCat((prev) => prev === c ? "all" : c);
    setTimeout(() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  /* ── Render ── */
  if (loading) {
    return (
      <div className="space-y-5">
        <PeriodeBar
          periodType={periodType} setPeriodType={setPeriodType}
          year={year} setYear={setYear} quarter={quarter} setQuarter={setQuarter}
          month={month} setMonth={setMonth}
          customFrom={customFrom} setCustomFrom={setCustomFrom}
          customTo={customTo} setCustomTo={setCustomTo}
          availableYears={availableYears} periodLabel={periodLabel}
          disabled
        />
        <FullSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PeriodeBar
        periodType={periodType} setPeriodType={setPeriodType}
        year={year} setYear={setYear} quarter={quarter} setQuarter={setQuarter}
        month={month} setMonth={setMonth}
        customFrom={customFrom} setCustomFrom={setCustomFrom}
        customTo={customTo} setCustomTo={setCustomTo}
        availableYears={availableYears} periodLabel={periodLabel}
      />

      {mbError && (
        <div className="bg-card border border-amber-500/30 rounded-[16px] p-3 flex items-center gap-2 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Moneybird tijdelijk niet bereikbaar — handmatige posten en verkopen worden wel getoond.</span>
        </div>
      )}

      {/* SECTIE 1 — Drie hoofdcijfers als één blok */}
      <div className="bg-card border border-border rounded-[16px] overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
        <HeroCell
          label="Opbrengsten"
          amount={opbrengsten}
          color="emerald"
          icon={<ArrowUpRight className="w-4 h-4 text-emerald-400" />}
          sub={`${sales.length} verkochte ${sales.length === 1 ? "voertuig" : "voertuigen"}`}
        />
        <HeroCell
          label="Kosten"
          amount={totalCost}
          color="red"
          icon={<ArrowDownRight className="w-4 h-4 text-red-400" />}
          sub={`${rows.length} ${rows.length === 1 ? "post" : "posten"}`}
        />
        <HeroCell
          label="Netto resultaat"
          amount={netResult}
          color={netResult >= 0 ? "emerald" : "red"}
          icon={netResult >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
          sub="Na alle kosten"
          showSign
        />
      </div>

      {/* SECTIE 2 — twee kolommen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Links: Kosten per categorie */}
        <div className="bg-card border border-border rounded-[16px] overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Kosten per categorie</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Klik om te filteren in de lijst</p>
          </div>
          {catList.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">Geen kosten in deze periode.</div>
          ) : (
            <ul className="divide-y divide-border/40">
              {catList.map(({ key, total, count }) => {
                const Icon = CAT_ICONS[key];
                const pct = totalCost > 0 ? (total / totalCost) * 100 : 0;
                const active = filterCat === key;
                return (
                  <li key={key}>
                    <button
                      onClick={() => handleCategoryClick(key)}
                      className={cn(
                        "w-full px-4 py-3 text-left hover:bg-accent/30 transition-colors",
                        active && "bg-accent/40"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn("inline-flex w-7 h-7 items-center justify-center rounded-md border shrink-0", CAT_COLORS[key])}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[13px] font-medium text-foreground truncate">{CAT_LABELS[key]}</span>
                            <span className="text-[14px] font-semibold tabular-nums text-foreground whitespace-nowrap">{formatEuroDecimal(total)}</span>
                          </div>
                          <div className="mt-1.5 h-1 rounded-full bg-secondary/60 overflow-hidden">
                            <div className={cn("h-full rounded-full transition-all", CAT_BAR[key])} style={{ width: `${Math.min(100, pct)}%` }} />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {pct.toFixed(0)}% · {count} {count === 1 ? "post" : "posten"}
                            {key === "inkoop_voertuigen" && (ikvCount > 0 || mbInkoopCount > 0) && (
                              <span className="ml-1">· {ikvCount} ikv · {mbInkoopCount} mb</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Rechts: vaste lasten + openstaande facturen */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-[16px] overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Vaste lasten <span className="text-muted-foreground font-normal">· per maand</span></h3>
            </div>
            {vasteLasten.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">Geen vaste lasten gevonden.</div>
            ) : (
              <ul className="divide-y divide-border/40">
                {vasteLasten.map((v) => (
                  <li key={v.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                    <span className="text-[13px] text-foreground truncate">{v.naam}</span>
                    <span className="text-[13px] font-semibold tabular-nums text-foreground whitespace-nowrap">{formatEuroDecimal(v.perMaand)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="px-4 py-2.5 border-t border-border bg-secondary/30 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Totaal</span>
              <span className="text-sm font-semibold tabular-nums">{formatEuroDecimal(totaalVasteLastenPM)} <span className="text-[10px] text-muted-foreground font-normal">/ mnd</span></span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-[16px] overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Openstaande facturen</h3>
            </div>
            {openInvoices.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">Geen openstaande facturen</div>
            ) : (
              <ul className="divide-y divide-border/40">
                {openInvoices.map((o) => (
                  <li key={o.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                    <span className="text-[13px] text-foreground truncate">{o.supplier}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={cn("text-[11px]", o.state === "late" ? "text-red-400" : "text-foreground/80")}>
                        {o.state === "late" ? "Te laat" : "Open"}
                      </span>
                      <span className="text-[13px] font-semibold tabular-nums whitespace-nowrap">{formatEuroDecimal(o.amount)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {openInvoices.length > 0 && (
              <div className="px-4 py-2.5 border-t border-border bg-secondary/30 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Totaal openstaand</span>
                <span className="text-sm font-semibold tabular-nums">{formatEuroDecimal(openTotaal)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTIE 3 — alle posten */}
      <div ref={tableRef} className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value as any)}
            className="h-8 px-2.5 text-xs bg-card border border-border rounded-md text-foreground">
            <option value="all">Alle categorieën</option>
            {(Object.keys(CAT_LABELS) as CatKey[]).map((c) => (
              <option key={c} value={c}>{CAT_LABELS[c]}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
            className="h-8 px-2.5 text-xs bg-card border border-border rounded-md text-foreground">
            <option value="all">Alle statussen</option>
            <option value="paid">Betaald</option>
            <option value="open">Open</option>
            <option value="late">Te laat</option>
          </select>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Zoek leverancier of omschrijving"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-card border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="ml-auto">
            <AddCostPopover
              isMobile={isMobile}
              open={addOpen}
              onOpenChange={(v) => { setAddOpen(v); if (!v) setEditing(null); }}
              editing={editing}
              onSubmit={async (data) => {
                if (editing) await update(editing.id, data);
                else await create(data);
                setAddOpen(false);
                setEditing(null);
                await loadAll();
              }}
              onDelete={editing ? async () => {
                if (confirm("Deze kost verwijderen?")) {
                  await remove(editing.id);
                  setAddOpen(false);
                  setEditing(null);
                  await loadAll();
                }
              } : undefined}
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-[16px] overflow-hidden">
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-border">
            <span className="text-xs text-muted-foreground">{filtered.length} {filtered.length === 1 ? "post" : "posten"}{filterCat !== "all" && ` · ${CAT_LABELS[filterCat]}`}</span>
            <span className="text-sm font-semibold tabular-nums">{formatEuroDecimal(filtered.reduce((s, r) => s + r.amount, 0))}</span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Geen posten gevonden.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate" style={{ borderSpacing: 0 }}>
                <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-3 py-2.5 font-semibold border-b border-border">Datum</th>
                    <th className="text-left px-3 py-2.5 font-semibold border-b border-border">Omschrijving</th>
                    <th className="text-left px-3 py-2.5 font-semibold border-b border-border">Categorie</th>
                    <th className="text-left px-3 py-2.5 font-semibold border-b border-border">Bron</th>
                    <th className="text-right px-3 py-2.5 font-semibold border-b border-border">Bedrag</th>
                    <th className="text-left px-3 py-2.5 font-semibold border-b border-border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, idx) => (
                    <tr
                      key={r.id}
                      onClick={() => {
                        if (r.source === "handmatig") { setEditing(r.raw as Kost); setAddOpen(true); }
                        else { setDetailRow(r); }
                      }}
                      className={cn("hover:bg-accent/40 cursor-pointer transition-colors", idx % 2 === 1 && "bg-card/40")}
                    >
                      <td className="px-3 py-3 text-muted-foreground tabular-nums text-[12px] border-b border-border/40 whitespace-nowrap">
                        {r.date.toLocaleDateString("nl-NL")}
                      </td>
                      <td className="px-3 py-3 border-b border-border/40">
                        <div className="text-foreground font-medium text-[13px] truncate max-w-[280px]" title={r.supplier}>{r.supplier}</div>
                        <div className="text-muted-foreground text-[11px] truncate max-w-[280px]" title={r.description}>{r.description}</div>
                      </td>
                      <td className="px-3 py-3 border-b border-border/40">
                        <span className={cn("inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium border", CAT_COLORS[r.category])}>
                          {CAT_LABELS[r.category]}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-b border-border/40">
                        <SourceBadge source={r.source} />
                      </td>
                      <td className="px-3 py-3 text-right text-foreground font-semibold tabular-nums text-[14px] border-b border-border/40 whitespace-nowrap">
                        {formatEuroDecimal(r.amount)}
                      </td>
                      <td className="px-3 py-3 border-b border-border/40">
                        {r.source === "moneybird" && r.state && <StateBadge state={r.state} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <DetailSheet row={detailRow} onClose={() => setDetailRow(null)} isMobile={isMobile} />
    </div>
  );
};

/* ───────── Sub-components ───────── */

const PeriodeBar = ({
  periodType, setPeriodType, year, setYear, quarter, setQuarter, month, setMonth,
  customFrom, setCustomFrom, customTo, setCustomTo, availableYears, periodLabel, disabled,
}: any) => (
  <div className={cn("flex flex-wrap items-center gap-2", disabled && "opacity-60 pointer-events-none")}>
    <div className="flex gap-0.5 bg-card border border-border rounded-lg p-0.5">
      {(["maand","kwartaal","jaar","custom"] as PeriodType[]).map((p) => (
        <button key={p} onClick={() => setPeriodType(p)}
          className={cn(
            "px-2.5 py-1.5 text-xs font-medium rounded-md transition-all",
            periodType === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}>
          {p === "maand" ? "Maand" : p === "kwartaal" ? "Kwartaal" : p === "jaar" ? "Jaar" : "Aangepast"}
        </button>
      ))}
    </div>
    {periodType !== "custom" && (
      <select value={year} onChange={(e) => setYear(Number(e.target.value))}
        className="h-8 px-2.5 text-xs bg-card border border-border rounded-md text-foreground">
        {availableYears.map((y: number) => <option key={y} value={y}>{y}</option>)}
      </select>
    )}
    {periodType === "kwartaal" && (
      <select value={quarter} onChange={(e) => setQuarter(Number(e.target.value))}
        className="h-8 px-2.5 text-xs bg-card border border-border rounded-md text-foreground">
        {[1,2,3,4].map((q) => <option key={q} value={q}>Q{q}</option>)}
      </select>
    )}
    {periodType === "maand" && (
      <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
        className="h-8 px-2.5 text-xs bg-card border border-border rounded-md text-foreground">
        {maandNamen.map((m, i) => <option key={i} value={i}>{m}</option>)}
      </select>
    )}
    {periodType === "custom" && (
      <>
        <input type="date" value={customFrom ? fmtYmd(customFrom).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3") : ""}
          onChange={(e) => setCustomFrom(e.target.value ? new Date(e.target.value) : undefined)}
          className="h-8 px-2 text-xs bg-card border border-border rounded-md text-foreground" />
        <input type="date" value={customTo ? fmtYmd(customTo).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3") : ""}
          onChange={(e) => setCustomTo(e.target.value ? new Date(e.target.value) : undefined)}
          className="h-8 px-2 text-xs bg-card border border-border rounded-md text-foreground" />
      </>
    )}
    <span className="text-xs text-muted-foreground ml-1">Periode: <span className="text-foreground font-medium">{periodLabel}</span></span>
  </div>
);

const HeroCell = ({ label, amount, sub, color, icon, showSign }: {
  label: string; amount: number; sub?: string;
  color: "emerald" | "red" | "neutral";
  icon?: React.ReactNode; showSign?: boolean;
}) => (
  <div className="p-5">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      {icon}
    </div>
    <p className={cn(
      "text-2xl md:text-3xl font-bold tabular-nums",
      color === "emerald" ? "text-emerald-400" : color === "red" ? "text-red-400" : "text-foreground"
    )}>
      {showSign && amount >= 0 ? "+" : ""}{formatEuroDecimal(amount)}
    </p>
    {sub && <p className="text-[11px] text-muted-foreground mt-2">{sub}</p>}
  </div>
);

const SourceBadge = ({ source }: { source: Source }) => {
  const map: Record<Source, { label: string; cls: string }> = {
    moneybird: { label: "Moneybird", cls: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
    handmatig: { label: "Handmatig", cls: "bg-secondary/60 text-muted-foreground border-border" },
    inkoopverklaring: { label: "Inkoopverklaring", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  };
  const m = map[source];
  return <span className={cn("inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border", m.cls)}>{m.label}</span>;
};

const StateBadge = ({ state }: { state: "paid" | "open" | "late" }) => {
  const map = {
    paid: { label: "Betaald", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
    open: { label: "Open", cls: "bg-secondary/60 text-muted-foreground border-border" },
    late: { label: "Te laat", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  } as const;
  const m = map[state];
  return <span className={cn("inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border", m.cls)}>{m.label}</span>;
};

const FullSkeleton = () => (
  <div className="space-y-5">
    <div className="bg-card border border-border rounded-[16px] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
      {[0,1,2].map((i) => (
        <div key={i} className="p-5 space-y-3">
          <div className="h-3 w-24 bg-secondary/60 animate-pulse rounded" />
          <div className="h-8 w-40 bg-secondary/60 animate-pulse rounded" />
          <div className="h-3 w-32 bg-secondary/60 animate-pulse rounded" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[0,1].map((i) => (
        <div key={i} className="bg-card border border-border rounded-[16px] p-4 space-y-3">
          <div className="h-4 w-40 bg-secondary/60 animate-pulse rounded" />
          {[0,1,2,3].map((j) => <div key={j} className="h-10 bg-secondary/60 animate-pulse rounded" />)}
        </div>
      ))}
    </div>
    <div className="bg-card border border-border rounded-[16px] p-4 space-y-2">
      {[0,1,2,3,4,5].map((i) => <div key={i} className="h-12 bg-secondary/60 animate-pulse rounded" />)}
    </div>
  </div>
);

/* ─── Add / edit cost ─── */
function AddCostPopover({
  isMobile, open, onOpenChange, editing, onSubmit, onDelete,
}: {
  isMobile: boolean;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Kost | null;
  onSubmit: (data: Partial<Kost>) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const trigger = (
    <button
      onClick={() => onOpenChange(true)}
      className="h-8 px-3 inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-colors"
    >
      <Plus className="w-3.5 h-3.5" />
      Kost toevoegen
    </button>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-[16px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editing ? "Kost bewerken" : "Nieuwe kost"}</SheetTitle>
            </SheetHeader>
            <KostForm initial={editing} onSubmit={onSubmit} onDelete={onDelete} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-4 rounded-[16px]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">{editing ? "Kost bewerken" : "Nieuwe kost"}</h3>
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <KostForm initial={editing} onSubmit={onSubmit} onDelete={onDelete} />
      </PopoverContent>
    </Popover>
  );
}

const KostForm = ({
  initial, onSubmit, onDelete,
}: {
  initial: Kost | null;
  onSubmit: (data: Partial<Kost>) => Promise<void>;
  onDelete?: () => Promise<void>;
}) => {
  const [naam, setNaam] = useState(initial?.naam || "");
  const [categorie, setCategorie] = useState<KostCategorie>(initial?.categorie || "vaste_kosten");
  const [bedrag, setBedrag] = useState<string>(initial ? String(initial.bedrag) : "");
  const [frequentie, setFrequentie] = useState<KostFrequentie>(initial?.frequentie || "eenmalig");
  const [datum, setDatum] = useState(initial?.datum || new Date().toISOString().slice(0, 10));
  const [leverancier, setLeverancier] = useState(initial?.leverancier || "");
  const [notities, setNotities] = useState(initial?.notities || "");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naam || !bedrag) {
      toast.error("Vul omschrijving en bedrag in");
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        naam, categorie, bedrag: Number(bedrag), frequentie, datum,
        leverancier: leverancier || null, notities: notities || null,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Omschrijving *">
        <input required value={naam} onChange={(e) => setNaam(e.target.value)} className="kf-input" />
      </Field>
      <Field label="Leverancier">
        <input value={leverancier} onChange={(e) => setLeverancier(e.target.value)} className="kf-input" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Categorie *">
          <select value={categorie} onChange={(e) => setCategorie(e.target.value as KostCategorie)} className="kf-input">
            {Object.entries(kostCategorieLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Frequentie">
          <select value={frequentie} onChange={(e) => setFrequentie(e.target.value as KostFrequentie)} className="kf-input">
            {Object.entries(kostFrequentieLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Bedrag incl. BTW *">
          <input required type="number" step="0.01" placeholder="0,00" value={bedrag} onChange={(e) => setBedrag(e.target.value)} className="kf-input" />
        </Field>
        <Field label="Datum *">
          <input type="date" required value={datum} onChange={(e) => setDatum(e.target.value)} className="kf-input" />
        </Field>
      </div>
      <Field label="Notities">
        <textarea rows={2} value={notities} onChange={(e) => setNotities(e.target.value)} className="kf-input resize-none" />
      </Field>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
        {onDelete ? (
          <button type="button" onClick={onDelete}
            className="inline-flex items-center gap-1.5 px-3 h-8 text-xs text-red-400 hover:bg-red-500/10 rounded-md">
            <Trash2 className="w-3.5 h-3.5" />
            Verwijderen
          </button>
        ) : <span />}
        <button type="submit" disabled={busy}
          className="px-4 h-8 bg-primary text-primary-foreground rounded-md text-xs font-medium disabled:opacity-50">
          {busy ? "Opslaan…" : "Opslaan"}
        </button>
      </div>

      <style>{`
        .kf-input { width: 100%; height: 34px; padding: 0 10px; background: hsl(var(--card)); border: 1px solid hsl(var(--border)); border-radius: 6px; color: hsl(var(--foreground)); font-size: 13px; outline: none; }
        .kf-input:focus { border-color: hsl(var(--ring)); }
        textarea.kf-input { height: auto; padding: 8px 10px; }
      `}</style>
    </form>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="block text-[11px] text-muted-foreground mb-1">{label}</span>
    {children}
  </label>
);

/* ─── Detail Sheet ─── */
function DetailSheet({ row, onClose, isMobile }: { row: UnifiedRow | null; onClose: () => void; isMobile: boolean }) {
  if (!row) return null;
  const inv = row.raw;
  return (
    <Sheet open={!!row} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side={isMobile ? "bottom" : "right"} className={cn("overflow-y-auto rounded-[16px]", isMobile ? "h-[80vh] rounded-t-[16px]" : "w-full sm:max-w-md")}>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><FileText className="w-4 h-4" /> Factuur details</SheetTitle>
        </SheetHeader>
        <div className="space-y-3 mt-4">
          <DetailRow label="Leverancier" value={row.supplier} />
          <DetailRow label="Datum" value={row.date.toLocaleDateString("nl-NL")} />
          <DetailRow label="Omschrijving" value={row.description} />
          <DetailRow label="Categorie" value={CAT_LABELS[row.category]} />
          <DetailRow label="Bedrag incl. BTW" value={formatEuroDecimal(row.amount)} />
          {row.state && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status</span>
              <StateBadge state={row.state} />
            </div>
          )}
          {inv?.due_date && <DetailRow label="Vervaldatum" value={new Date(inv.due_date).toLocaleDateString("nl-NL")} />}
          {inv?.paid_at && <DetailRow label="Betaald op" value={new Date(inv.paid_at).toLocaleDateString("nl-NL")} />}
          {inv?.invoice_id && <DetailRow label="Factuurnummer" value={inv.invoice_id} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-3">
    <span className="text-xs text-muted-foreground shrink-0">{label}</span>
    <span className="text-sm text-foreground text-right break-words">{value}</span>
  </div>
);

export default KostenCombinedTab;

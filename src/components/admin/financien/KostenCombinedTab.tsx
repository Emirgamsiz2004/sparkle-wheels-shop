import { useEffect, useMemo, useState } from "react";
import { useMoneybird } from "@/hooks/useMoneybird";
import { useKosten, Kost, KostCategorie, KostFrequentie, kostCategorieLabels, kostFrequentieLabels, kostBedragInPeriode } from "@/hooks/useKosten";
import { formatEuroDecimal } from "@/types/vehicle";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, RefreshCw, Plus, Search, Trash2, Pencil, X, Wrench, Car, Home, Megaphone, Repeat, MoreHorizontal, TrendingUp, TrendingDown, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ───────── Categorie mapping ───────── */
type CatKey =
  | "voertuigkosten"
  | "inkoop_voertuigen"
  | "vaste_kosten"
  | "advertentiekosten"
  | "abonnementen"
  | "software"
  | "overig";

const CAT_LABELS: Record<CatKey, string> = {
  voertuigkosten: "Voertuigkosten",
  inkoop_voertuigen: "Inkoop voertuigen",
  vaste_kosten: "Vaste kosten",
  advertentiekosten: "Advertentiekosten",
  abonnementen: "Abonnementen",
  software: "Software",
  overig: "Overig",
};

const CAT_COLORS: Record<CatKey, string> = {
  voertuigkosten: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  inkoop_voertuigen: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  vaste_kosten: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  advertentiekosten: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  abonnementen: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  software: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  overig: "bg-secondary/60 text-muted-foreground border-border",
};

const CAT_ICONS: Record<CatKey, any> = {
  voertuigkosten: Wrench,
  inkoop_voertuigen: Car,
  vaste_kosten: Home,
  advertentiekosten: Megaphone,
  abonnementen: Repeat,
  software: Repeat,
  overig: MoreHorizontal,
};

const PLATE_RE = /^\s*[A-Z0-9]{1,3}-?[A-Z0-9]{1,3}-?[A-Z0-9]{1,3}\s*,/i;

function categorizeMoneybird(supplier: string, description: string): CatKey {
  const s = (supplier || "").toLowerCase();
  const d = (description || "").toLowerCase();
  if (PLATE_RE.test(description || "") || s.includes("sparks")) return "inkoop_voertuigen";
  if (s.includes("alliance") || s.includes("partspoint")) return "voertuigkosten";
  if (s.includes("elix")) return "vaste_kosten";
  if (s.includes("asr") || s.includes("verzekering") || s.includes("schade")) return "vaste_kosten";
  if (s.includes("huur") || s.includes("cilinderweg")) return "vaste_kosten";
  if (s.includes("marktplaats") || s.includes("autoscout") || s.includes("facebook") || s.includes("google ads")) return "advertentiekosten";
  if (s.includes("vwe") || s.includes("autotrust")) return "abonnementen";
  if (s.includes("moneybird") || s.includes("lovable")) return "software";
  if (d.includes("auto") || d.includes("voertuig")) return "voertuigkosten";
  return "overig";
}

// Map handmatige Kost categorie -> CatKey
function mapManualCat(c: KostCategorie): CatKey {
  if (c === "vaste_kosten") return "vaste_kosten";
  if (c === "advertentiekosten") return "advertentiekosten";
  if (c === "abonnementen") return "abonnementen";
  if (c === "voertuigkosten") return "voertuigkosten";
  if (c === "personeelskosten") return "vaste_kosten";
  return "overig";
}

/* ───────── Periode ───────── */
type PeriodType = "maand" | "kwartaal" | "jaar" | "custom";

const maandNamen = ["Januari","Februari","Maart","April","Mei","Juni","Juli","Augustus","September","Oktober","November","December"];

function getPeriodRange(periodType: PeriodType, year: number, quarter: number, month: number, customFrom?: Date, customTo?: Date): { from: Date; to: Date } {
  if (periodType === "custom" && customFrom && customTo) return { from: customFrom, to: customTo };
  if (periodType === "maand") {
    return { from: new Date(year, month, 1), to: new Date(year, month + 1, 0, 23, 59, 59) };
  }
  if (periodType === "kwartaal") {
    const months = [[0, 2], [3, 5], [6, 8], [9, 11]][quarter - 1];
    return { from: new Date(year, months[0], 1), to: new Date(year, months[1] + 1, 0, 23, 59, 59) };
  }
  return { from: new Date(year, 0, 1), to: new Date(year, 11, 31, 23, 59, 59) };
}

function fmtYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function buildMoneybirdFilter(from: Date, to: Date): string {
  return `period:${fmtYmd(from)}..${fmtYmd(to)}`;
}



const FREQ_TO_MONTHLY: Record<KostFrequentie, number> = {
  eenmalig: 0,
  maandelijks: 1,
  kwartaal: 1 / 3,
  jaarlijks: 1 / 12,
};


/* ───────── Unified row type ───────── */
type UnifiedRow = {
  id: string;
  date: Date;
  description: string;
  supplier: string;
  category: CatKey;
  amount: number;
  source: "moneybird" | "handmatig";
  state?: "paid" | "open" | "late" | null;
  raw: any;
};

/* ───────── Component ───────── */
const KostenCombinedTab = () => {
  const isMobile = useIsMobile();
  const { getPurchaseInvoices } = useMoneybird();
  const { kosten, loading: kostenLoading, create, update, remove } = useKosten();

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

  const [mbLoading, setMbLoading] = useState(true);
  const [mbError, setMbError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Kost | null>(null);
  const [detailRow, setDetailRow] = useState<UnifiedRow | null>(null);

  const range = useMemo(
    () => getPeriodRange(periodType, year, quarter, month, customFrom, customTo),
    [periodType, year, quarter, month, customFrom, customTo]
  );
  const mbFilter = useMemo(() => buildMoneybirdFilter(range.from, range.to), [range]);

  const loadMoneybird = async () => {
    setMbLoading(true);
    setMbError(null);
    try {
      const all: any[] = [];
      for (let page = 1; page <= 10; page++) {
        const res: any = await getPurchaseInvoices(page, mbFilter);
        const arr = Array.isArray(res) ? res : (res?.data || []);
        if (!arr.length) break;
        all.push(...arr);
        if (arr.length < 100) break;
      }
      setInvoices(all);
    } catch (e: any) {
      setMbError(e?.message || "Kon Moneybird niet bereiken");
    } finally {
      setMbLoading(false);
    }
  };

  useEffect(() => { loadMoneybird(); }, [mbFilter]);

  /* ── Combine ── */
  const rows: UnifiedRow[] = useMemo(() => {
    const mbRows: UnifiedRow[] = invoices
      .map((inv) => {
        const supplier = inv?.contact?.company_name || inv?.contact?.firstname || "Onbekend";
        const desc = inv?.details?.[0]?.description || "—";
        const cat = categorizeMoneybird(supplier, desc);
        const total = parseFloat(inv?.total_price_incl_tax || "0");
        const stateRaw = inv?.state || "open";
        const state: UnifiedRow["state"] =
          stateRaw === "paid" ? "paid" :
          stateRaw === "late" ? "late" :
          (stateRaw === "open" || stateRaw === "new") ? "open" : "open";
        return {
          id: `mb-${inv.id}`,
          date: inv.date ? new Date(inv.date) : new Date(),
          description: desc,
          supplier,
          category: cat,
          amount: total,
          source: "moneybird" as const,
          state,
          raw: inv,
        };
      });

    const manualRows: UnifiedRow[] = kosten
      .map((k) => {
        const bedrag = kostBedragInPeriode(k, range.from, range.to);
        if (bedrag <= 0) return null;
        return {
          id: `man-${k.id}`,
          date: new Date(k.datum),
          description: k.naam,
          supplier: k.leverancier || "—",
          category: mapManualCat(k.categorie),
          amount: bedrag,
          source: "handmatig" as const,
          state: null,
          raw: k,
        };
      })
      .filter(Boolean) as UnifiedRow[];

    return [...mbRows, ...manualRows].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [invoices, kosten, range]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
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
    });
  }, [rows, filterCat, filterStatus, search]);

  /* ── KPI's ── */
  const totalCost = filtered.reduce((s, r) => s + r.amount, 0);
  const openInvoices = filtered.filter((r) => r.source === "moneybird" && (r.state === "open" || r.state === "late"));
  const openTotal = openInvoices.reduce((s, r) => s + r.amount, 0);

  const biggest = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((r) => m.set(r.supplier, (m.get(r.supplier) || 0) + r.amount));
    let max = { name: "—", val: 0 };
    m.forEach((v, k) => { if (v > max.val) max = { name: k, val: v }; });
    return max;
  }, [filtered]);

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

  /* ── Render ── */
  return (
    <div className="space-y-4">
      {/* Filterbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-0.5 bg-card border border-border rounded-lg p-0.5">
          {(["maand","kwartaal","jaar","custom"] as PeriodType[]).map((p) => (
            <button key={p} onClick={() => setPeriodType(p)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${periodType === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {p === "maand" ? "Maand" : p === "kwartaal" ? "Kwartaal" : p === "jaar" ? "Jaar" : "Aangepast"}
            </button>
          ))}
        </div>
        {periodType !== "custom" && (
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="h-8 px-2.5 text-xs bg-card border border-border rounded-md text-foreground">
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
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
          }}
          onDelete={editing ? async () => {
            if (confirm("Deze kost verwijderen?")) {
              await remove(editing.id);
              setAddOpen(false);
              setEditing(null);
            }
          } : undefined}
        />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KpiCard label="Totale kosten" value={formatEuroDecimal(totalCost)} sub={periodLabel} />
        <KpiCard
          label="Openstaande facturen"
          value={formatEuroDecimal(openTotal)}
          sub={`${openInvoices.length} factu${openInvoices.length === 1 ? "ur" : "ren"}`}
          danger={openTotal > 0}
        />
        <KpiCard label="Grootste kostenpost" value={formatEuroDecimal(biggest.val)} sub={biggest.name} />
      </div>

      {/* Moneybird error */}
      {mbError && (
        <div className="bg-card border border-red-500/30 rounded-lg p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Moneybird ophalen mislukt: {mbError}</span>
          </div>
          <button onClick={loadMoneybird}
            className="inline-flex items-center gap-1.5 px-3 h-8 text-xs font-medium bg-primary text-primary-foreground rounded-md">
            <RefreshCw className="w-3.5 h-3.5" /> Opnieuw proberen
          </button>
        </div>
      )}

      {/* Tabel */}
      <div className="bg-card border border-border rounded-[16px] overflow-hidden">
        <div className="px-4 py-2.5 flex items-center justify-between border-b border-border">
          <span className="text-xs text-muted-foreground">{filtered.length} {filtered.length === 1 ? "post" : "posten"}</span>
          <span className="text-sm font-semibold tabular-nums">{formatEuroDecimal(totalCost)}</span>
        </div>

        {(mbLoading || kostenLoading) && filtered.length === 0 ? (
          <div className="divide-y divide-border">
            {[0,1,2,3,4].map((i) => (
              <div key={i} className="h-12 bg-card animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Geen kosten in deze periode.</div>
        ) : (
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
                    if (r.source === "handmatig") {
                      setEditing(r.raw as Kost);
                      setAddOpen(true);
                    } else {
                      setDetailRow(r);
                    }
                  }}
                  className={`hover:bg-accent/40 cursor-pointer transition-colors ${idx % 2 === 1 ? "bg-card/40" : ""}`}
                >
                  <td className="px-3 py-3 text-muted-foreground tabular-nums text-[12px] border-b border-border/40 whitespace-nowrap">
                    {r.date.toLocaleDateString("nl-NL")}
                  </td>
                  <td className="px-3 py-3 border-b border-border/40">
                    <div className="text-foreground font-medium text-[13px] truncate max-w-[280px]" title={r.supplier}>{r.supplier}</div>
                    <div className="text-muted-foreground text-[11px] truncate max-w-[280px]" title={r.description}>{r.description}</div>
                  </td>
                  <td className="px-3 py-3 border-b border-border/40">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium border ${CAT_COLORS[r.category]}`}>
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
        )}
      </div>

      {/* Moneybird detail popover/sheet */}
      <DetailSheet row={detailRow} onClose={() => setDetailRow(null)} isMobile={isMobile} />
    </div>
  );
};

/* ───────── Sub components ───────── */

const KpiCard = ({ label, value, sub, danger }: { label: string; value: string; sub?: string; danger?: boolean }) => (
  <div className="bg-card border border-border rounded-[16px] p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`text-xl font-semibold tabular-nums mt-1 ${danger ? "text-red-400" : "text-foreground"}`}>{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>}
  </div>
);

const SourceBadge = ({ source }: { source: "moneybird" | "handmatig" }) => (
  <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border ${
    source === "moneybird"
      ? "bg-orange-500/15 text-orange-300 border-orange-500/30"
      : "bg-secondary/60 text-muted-foreground border-border"
  }`}>
    {source === "moneybird" ? "Moneybird" : "Handmatig"}
  </span>
);

const StateBadge = ({ state }: { state: "paid" | "open" | "late" }) => {
  const map = {
    paid: { label: "Betaald", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
    open: { label: "Open", cls: "bg-secondary/60 text-muted-foreground border-border" },
    late: { label: "Te laat", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  } as const;
  const m = map[state];
  return <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border ${m.cls}`}>{m.label}</span>;
};

/* ─── Add / edit cost (Popover desktop, Sheet mobile) ─── */
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
          <SheetContent side="bottom" className={cn("h-[90vh] rounded-t-[16px] overflow-y-auto")}>
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
      <PopoverContent align="end" className="w-[380px] p-4">
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
        naam,
        categorie,
        bedrag: Number(bedrag),
        frequentie,
        datum,
        leverancier: leverancier || null,
        notities: notities || null,
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

/* ─── Detail Sheet/Popover for Moneybird invoice ─── */
function DetailSheet({ row, onClose, isMobile }: { row: UnifiedRow | null; onClose: () => void; isMobile: boolean }) {
  if (!row) return null;
  const inv = row.raw;
  const content = (
    <div className="space-y-3 mt-2">
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
  );

  return (
    <Sheet open={!!row} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side={isMobile ? "bottom" : "right"} className={cn("overflow-y-auto", isMobile ? "h-[80vh] rounded-t-[16px]" : "w-full sm:max-w-md")}>
        <SheetHeader>
          <SheetTitle>Factuur details</SheetTitle>
        </SheetHeader>
        {content}
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

import { useEffect, useMemo, useState, useCallback } from "react";
import { useMoneybird } from "@/hooks/useMoneybird";
import {
  useKosten,
  Kost,
  KostCategorie,
  KostFrequentie,
  kostCategorieLabels,
  kostFrequentieLabels,
  kostBedragInPeriode,
} from "@/hooks/useKosten";
import { supabase } from "@/integrations/supabase/client";

import {
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Receipt,
  Wallet,
  Percent,
  Settings,
  Pencil,
  Trash2,
  Search,
  Loader2,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ───────── Helpers ───────── */
const PLATE_RE = /\b[A-Z0-9]{1,3}-?[A-Z0-9]{1,3}-?[A-Z0-9]{1,3}\b/i;
const formatEuro = (n: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n || 0);
const formatDate = (d: Date) =>
  d.toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" });

function extractKenteken(text: string): string | null {
  const m = (text || "").match(PLATE_RE);
  return m ? m[0].toUpperCase().replace(/-/g, "") : null;
}

/* ───────── Periode ───────── */
type PeriodType = "maand" | "kwartaal" | "jaar" | "custom";
const maandNamen = [
  "Januari", "Februari", "Maart", "April", "Mei", "Juni",
  "Juli", "Augustus", "September", "Oktober", "November", "December",
];

function getPeriodRange(
  periodType: PeriodType,
  year: number,
  quarter: number,
  month: number,
  customFrom?: Date,
  customTo?: Date
): { from: Date; to: Date } {
  if (periodType === "custom" && customFrom && customTo) return { from: customFrom, to: customTo };
  if (periodType === "maand")
    return { from: new Date(year, month, 1), to: new Date(year, month + 1, 0, 23, 59, 59) };
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

type Categorie = {
  id: string;
  naam: string;
  moneybird_contact_ids: string[];
};

type Row = {
  id: string;
  date: Date;
  description: string;
  supplier: string;
  amount: number;
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

const INKOOP_VOERTUIGEN_NAAM = "Inkoop voertuigen";

/* Filter mapping: gebruik categorie naam → key */
function filterLabel(naam: string): string {
  if (naam === "Abonnementen & software") return "Abonnementen";
  if (naam === "Onderdelen & materialen") return "Onderdelen";
  return naam;
}

/* ───────── Component ───────── */
const KostenCombinedTab = () => {
  const isMobile = useIsMobile();
  const { getPurchaseInvoices } = useMoneybird();
  const { kosten, create, update, remove, reload: reloadKosten } = useKosten();

  const now = new Date();
  const [periodType, setPeriodType] = useState<PeriodType>("maand");
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);
  const [month, setMonth] = useState(now.getMonth());
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  const [filterId, setFilterId] = useState<string | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [purchaseInvoices, setPurchaseInvoices] = useState<any[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [inkoopverklaringen, setInkoopverklaringen] = useState<InkoopRow[]>([]);
  const [categorieen, setCategorieen] = useState<Categorie[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [addPresetCategoryId, setAddPresetCategoryId] = useState<string | null>(null);

  const range = useMemo(
    () => getPeriodRange(periodType, year, quarter, month, customFrom, customTo),
    [periodType, year, quarter, month, customFrom, customTo]
  );
  const mbFilter = useMemo(() => buildMoneybirdFilter(range.from, range.to), [range]);

  const reloadCategorieen = useCallback(async () => {
    const { data, error } = await supabase
      .from("kosten_categorieen")
      .select("id, naam, moneybird_contact_ids")
      .order("aangemaakt_op", { ascending: true });
    if (error) {
      console.error(error);
      toast.error("Categorieën konden niet geladen worden");
      return [] as Categorie[];
    }
    const cats = (data as Categorie[]) || [];
    setCategorieen(cats);
    return cats;
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const fromIso = range.from.toISOString().slice(0, 10);
    const toIso = range.to.toISOString().slice(0, 10);

    const fetchMb = async (filter: string) => {
      const all: any[] = [];
      for (let page = 1; page <= 10; page++) {
        try {
          const res: any = await getPurchaseInvoices(page, filter);
          const arr = Array.isArray(res) ? res : res?.data || [];
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
      .select(
        "id, verkoopprijs, verkoop_datum, vehicle:vehicles(id, kenteken, merk, model, inkoopprijs, verkoop_type, status, consignatie_commissie_perc)"
      )
      .eq("status", "voltooid")
      .gte("verkoop_datum", fromIso)
      .lte("verkoop_datum", toIso);
    const ikvP = supabase
      .from("inkoopverklaringen")
      .select("id, inkoopprijs, datum, kenteken, merk, model, verkoper_naam")
      .gte("datum", fromIso)
      .lte("datum", toIso);
    const kostenP = reloadKosten();
    const catsP = reloadCategorieen();

    const [mbInv, verkopenRes, ikvRes] = await Promise.all([mbP, verkopenP, ikvP, kostenP, catsP]);

    setPurchaseInvoices(mbInv || []);
    setSales(((verkopenRes.data as any[]) || []) as SaleRow[]);
    setInkoopverklaringen(((ikvRes.data as any[]) || []) as InkoopRow[]);
    setLoading(false);
  }, [mbFilter, range.from, range.to, getPurchaseInvoices, reloadKosten, reloadCategorieen]);

  useEffect(() => {
    loadAll();
    /* eslint-disable-next-line */
  }, [mbFilter]);

  /* ─── Auto-koppel default contacten bij eerste laden ─── */
  useEffect(() => {
    if (!categorieen.length || !purchaseInvoices.length) return;
    const defaults: { naam: string; matches: (s: string) => boolean }[] = [
      { naam: "Vaste kosten", matches: (s) => /asr|elix/i.test(s) },
      { naam: "Onderdelen & materialen", matches: (s) => /alliance|partspoint/i.test(s) },
      { naam: "Inkoop voertuigen", matches: (s) => /sparks/i.test(s) },
    ];
    (async () => {
      for (const def of defaults) {
        const cat = categorieen.find((c) => c.naam === def.naam);
        if (!cat) continue;
        const existing = new Set(cat.moneybird_contact_ids || []);
        const found: string[] = [];
        purchaseInvoices.forEach((inv) => {
          const supplier = inv?.contact?.company_name || inv?.contact?.firstname || "";
          const cid = inv?.contact?.id ? String(inv.contact.id) : null;
          if (cid && def.matches(supplier) && !existing.has(cid) && !found.includes(cid)) {
            found.push(cid);
          }
        });
        if (found.length) {
          const merged = [...existing, ...found];
          await supabase
            .from("kosten_categorieen")
            .update({ moneybird_contact_ids: merged })
            .eq("id", cat.id);
        }
      }
      reloadCategorieen();
    })();
    /* eslint-disable-next-line */
  }, [categorieen.length, purchaseInvoices.length]);

  /* ─── Build rows per categorie ─── */
  const rowsPerCat = useMemo(() => {
    const result: Record<string, Row[]> = {};
    categorieen.forEach((c) => (result[c.id] = []));

    const inkoopCat = categorieen.find((c) => c.naam === INKOOP_VOERTUIGEN_NAAM);

    // 1. Inkoopverklaringen → altijd in Inkoop voertuigen
    const ikvKeys = new Set<string>();
    if (inkoopCat) {
      inkoopverklaringen.forEach((i) => {
        const ken = (i.kenteken || "").toUpperCase().replace(/-/g, "") || null;
        const amt = Number(i.inkoopprijs) || 0;
        if (ken) ikvKeys.add(`${ken}|${Math.round(amt)}`);
        result[inkoopCat.id].push({
          id: `ikv-${i.id}`,
          date: new Date(i.datum),
          description: `${i.merk || ""} ${i.model || ""}`.trim() || "Inkoopverklaring",
          supplier: i.verkoper_naam || "Particulier",
          amount: amt,
          source: "inkoopverklaring",
          state: null,
          kenteken: ken,
          raw: i,
        });
      });
    }

    // 2. Moneybird invoices → match per contact_id
    purchaseInvoices.forEach((inv) => {
      const supplier = inv?.contact?.company_name || inv?.contact?.firstname || "Onbekend";
      const desc = inv?.details?.[0]?.description || inv?.reference || "—";
      const cid = inv?.contact?.id ? String(inv.contact.id) : null;
      const amt = parseFloat(inv?.total_price_incl_tax || "0") || 0;
      const state: PaymentState =
        inv?.state === "paid" ? "paid" : inv?.state === "late" ? "late" : "open";
      const ken = extractKenteken(desc) || extractKenteken(inv?.reference || "");

      const targets = categorieen.filter((c) => cid && c.moneybird_contact_ids.includes(cid));
      if (!targets.length) return;

      targets.forEach((cat) => {
        // Dedupe inkoop voertuigen tegen IKV
        if (cat.id === inkoopCat?.id) {
          const dedupKey = ken ? `${ken}|${Math.round(amt)}` : null;
          if (dedupKey && ikvKeys.has(dedupKey)) return;
        }
        result[cat.id].push({
          id: `mb-${inv.id}-${cat.id}`,
          date: inv.date ? new Date(inv.date) : new Date(),
          description: desc,
          supplier,
          amount: amt,
          source: "moneybird",
          state,
          kenteken: ken,
          raw: inv,
        });
      });
    });

    // 3. Manual kosten met categorie_id
    kosten.forEach((k: any) => {
      if (!k.categorie_id) return;
      const target = categorieen.find((c) => c.id === k.categorie_id);
      if (!target) return;
      const bedrag = kostBedragInPeriode(k, range.from, range.to);
      if (bedrag <= 0) return;
      result[target.id].push({
        id: `man-${k.id}`,
        date: new Date(k.datum),
        description: k.naam,
        supplier: k.leverancier || "—",
        amount: bedrag,
        source: "handmatig",
        state: null,
        raw: k,
      });
    });

    Object.keys(result).forEach((k) =>
      result[k].sort((a, b) => b.date.getTime() - a.date.getTime())
    );
    return result;
  }, [categorieen, inkoopverklaringen, purchaseInvoices, kosten, range]);

  const allRows = useMemo(
    () => Object.values(rowsPerCat).flat(),
    [rowsPerCat]
  );

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
    return sales
      .map((s) => {
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
      })
      .sort((a, b) => b.marge - a.marge);
  }, [sales]);

  const totaleBruto = margeRows.reduce((s, r) => s + r.marge, 0);
  const gemMargeAlle = margeRows.length
    ? margeRows.filter((r) => r.margePerc !== null).reduce((s, r) => s + (r.margePerc || 0), 0) /
      Math.max(1, margeRows.filter((r) => r.margePerc !== null).length)
    : 0;

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const handleAddManual = (categoryId?: string) => {
    setAddPresetCategoryId(categoryId || null);
    setAddOpen(true);
  };

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
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {periodType === "maand" && (
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-secondary/40 border border-border rounded-[10px] px-2 py-1.5 text-xs"
            >
              {maandNamen.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          )}

          {periodType === "kwartaal" && (
            <select
              value={quarter}
              onChange={(e) => setQuarter(Number(e.target.value))}
              className="bg-secondary/40 border border-border rounded-[10px] px-2 py-1.5 text-xs"
            >
              {[1, 2, 3, 4].map((q) => (
                <option key={q} value={q}>Q{q}</option>
              ))}
            </select>
          )}

          {periodType === "custom" && (
            <>
              <input
                type="date"
                value={customFrom ? customFrom.toISOString().slice(0, 10) : ""}
                onChange={(e) => setCustomFrom(e.target.value ? new Date(e.target.value) : undefined)}
                className="bg-secondary/40 border border-border rounded-[10px] px-2 py-1.5 text-xs"
              />
              <input
                type="date"
                value={customTo ? customTo.toISOString().slice(0, 10) : ""}
                onChange={(e) => setCustomTo(e.target.value ? new Date(e.target.value) : undefined)}
                className="bg-secondary/40 border border-border rounded-[10px] px-2 py-1.5 text-xs"
              />
            </>
          )}
        </div>

        <button
          onClick={() => handleAddManual()}
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
            <MetricCard icon={TrendingUp} label="Omzet" value={formatEuro(omzet)} sub={`${verkopenAantal} verkoop${verkopenAantal === 1 ? "" : "en"}`} tone="positive" />
            <MetricCard icon={Wallet} label="Totale kosten" value={formatEuro(totalCost)} sub={`${allRows.length} posten`} tone="neutral" />
            <MetricCard icon={winst >= 0 ? TrendingUp : TrendingDown} label="Winst" value={formatEuro(winst)} tone={winst >= 0 ? "positive" : "negative"} />
            <MetricCard icon={Receipt} label="BTW" value={formatEuro(btwMarge)} sub="Schatting margeregeling" tone="neutral" />
            <MetricCard icon={Percent} label="Gem. marge %" value={gemMargePerc !== null ? `${gemMargePerc.toFixed(1)}%` : "—"} sub="Eigen voertuigen" tone="neutral" />
          </div>

          {/* Categorie filter pills */}
          <div className="flex flex-wrap gap-2">
            <FilterPill active={filterId === "all"} onClick={() => { setFilterId("all"); setExpandedId(null); }}>
              Alle
            </FilterPill>
            {categorieen.map((c) => (
              <FilterPill key={c.id} active={filterId === c.id} onClick={() => { setFilterId(c.id); setExpandedId(null); }}>
                {filterLabel(c.naam)}
              </FilterPill>
            ))}
          </div>

          {/* Categorie kaarten */}
          {filterId === "all" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 auto-rows-min">
              {categorieen.map((cat) => {
                const rows = rowsPerCat[cat.id] || [];
                const isExpanded = expandedId === cat.id;
                return (
                  <CategoryCard
                    key={cat.id}
                    categorie={cat}
                    rows={rows}
                    expanded={isExpanded}
                    onToggleExpand={() => setExpandedId(isExpanded ? null : cat.id)}
                    onAddManual={() => handleAddManual(cat.id)}
                    onCategorieChanged={reloadCategorieen}
                    onKostChanged={reloadKosten}
                    onUpdateKost={update}
                    onDeleteKost={remove}
                    isMobile={isMobile}
                  />
                );
              })}
            </div>
          ) : (
            (() => {
              const cat = categorieen.find((c) => c.id === filterId);
              if (!cat) return null;
              return (
                <FullCategoryView
                  categorie={cat}
                  rows={rowsPerCat[cat.id] || []}
                  onAddManual={() => handleAddManual(cat.id)}
                  onCategorieChanged={reloadCategorieen}
                  onUpdateKost={update}
                  onDeleteKost={remove}
                  isMobile={isMobile}
                />
              );
            })()
          )}

          {/* Marge per voertuig — onveranderd */}
          {filterId === "all" && (
            <MargeSection rows={margeRows} totaleBruto={totaleBruto} gemMargePerc={gemMargeAlle} />
          )}
        </>
      )}

      <AddCostDialog
        open={addOpen}
        onClose={() => { setAddOpen(false); setAddPresetCategoryId(null); }}
        onCreated={async () => { setAddOpen(false); setAddPresetCategoryId(null); await loadAll(); }}
        create={create}
        isMobile={isMobile}
        categorieen={categorieen}
        presetCategorieId={addPresetCategoryId}
      />
    </div>
  );
};

/* ───────── MetricCard ───────── */
function MetricCard({
  icon: Icon, label, value, sub, tone,
}: { icon: any; label: string; value: string; sub?: string; tone: "positive" | "negative" | "neutral" }) {
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

function SourceBadge({ source }: { source: Row["source"] }) {
  const map = {
    moneybird: { label: "MB", cls: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
    inkoopverklaring: { label: "IKV", cls: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
    handmatig: { label: "Handm.", cls: "bg-secondary/60 text-muted-foreground border-border" },
  } as const;
  const m = map[source];
  return <span className={cn("text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap", m.cls)}>{m.label}</span>;
}

/* ───────── Category accent colors ───────── */
const CATEGORY_COLORS: Record<string, string> = {
  "Abonnementen & software": "#5DCAA5",
  "Advertentiekosten": "#EF9F27",
  "Personeelskosten": "#85B7EB",
  "Vaste kosten": "#F09995",
  "Onderdelen & materialen": "#AFA9EC",
  "Inkoop voertuigen": "#B4B2A9",
};

/* ───────── CategoryCard (compact) ───────── */
function CategoryCard({
  categorie, rows, expanded, onToggleExpand, onAddManual,
  onCategorieChanged, onKostChanged, onUpdateKost, onDeleteKost, isMobile,
}: {
  categorie: Categorie;
  rows: Row[];
  expanded: boolean;
  onToggleExpand: () => void;
  onAddManual: () => void;
  onCategorieChanged: () => Promise<any>;
  onKostChanged: () => Promise<any>;
  onUpdateKost: (id: string, input: Partial<Kost>) => Promise<void>;
  onDeleteKost: (id: string) => Promise<void>;
  isMobile: boolean;
}) {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const isInkoopVoertuigen = categorie.naam === INKOOP_VOERTUIGEN_NAAM;
  const sourcesUsed: Set<string> = new Set();
  rows.forEach((r) => sourcesUsed.add(r.source));
  const sourceLabel = sourcesUsed.size === 0
    ? "Geen posten"
    : Array.from(sourcesUsed).map((s) =>
        s === "moneybird" ? "Moneybird" : s === "inkoopverklaring" ? "IKV" : "Handmatig"
      ).join(" + ");

  const PREVIEW_LIMIT = 8;
  const visibleRows = expanded ? rows : rows.slice(0, PREVIEW_LIMIT);
  const accentColor = CATEGORY_COLORS[categorie.naam] || "#B4B2A9";
  const hasContacts = (categorie.moneybird_contact_ids || []).length > 0;

  return (
    <div className={cn(
      "rounded-[14px] border border-border bg-secondary/20 overflow-hidden transition-all flex flex-col",
      expanded && "md:col-span-2"
    )}>
      {/* Top accent bar */}
      <div style={{ height: "3px", backgroundColor: accentColor }} />

      {/* Header strip */}
      <div className="px-4 pt-3 pb-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide truncate">{categorie.naam}</h3>
          <div className="mt-1 text-[20px] font-semibold tabular-nums leading-tight text-foreground">{formatEuro(total)}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {rows.length} post{rows.length === 1 ? "" : "en"} · {sourceLabel}
          </div>
        </div>
        <CategorySettingsPopover
          categorie={categorie}
          onCategorieChanged={onCategorieChanged}
          onKostChanged={onKostChanged}
          onUpdateKost={onUpdateKost}
          onDeleteKost={onDeleteKost}
          onAddManual={onAddManual}
          manualRows={rows.filter((r) => r.source === "handmatig")}
          isMobile={isMobile}
        />
      </div>

      {/* Rows */}
      {rows.length === 0 ? (
        <div className="px-4 pb-4 pt-3 border-t border-border/40 flex flex-col items-center gap-1.5">
          <div className="text-[12px] text-muted-foreground">Geen posten deze periode</div>
          {!hasContacts && !isInkoopVoertuigen && (
            <div className="text-[11px] text-muted-foreground/70">Geen contacten gekoppeld</div>
          )}
          <button
            onClick={onAddManual}
            className="text-[12px] text-primary hover:underline mt-0.5"
          >
            + Handmatig toevoegen
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {expanded ? (
            <div className="-mx-px overflow-x-auto border-t border-border/60">
              <ExpandedTable rows={rows} isInkoopVoertuigen={isInkoopVoertuigen} onUpdateKost={onUpdateKost} onDeleteKost={onDeleteKost} onChanged={onKostChanged} isMobile={isMobile} />
            </div>
          ) : (
            <div className="border-t border-border/60 divide-y divide-border/40">
              {visibleRows.map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-[58px_1fr_auto] items-center gap-3 px-4 py-[7px] text-[12px] hover:bg-secondary/30 transition-colors"
                >
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {r.date.toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit" })}
                  </span>
                  <span className="truncate text-foreground">
                    {r.kenteken && <span className="mr-1.5 text-muted-foreground tabular-nums">{r.kenteken}</span>}
                    {r.description}
                  </span>
                  <span className="text-right font-medium tabular-nums whitespace-nowrap text-foreground">{formatEuro(r.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {rows.length > PREVIEW_LIMIT && (
            <div className="px-4 py-2 border-t border-border/60 flex justify-between items-center bg-secondary/10">
              <button
                onClick={onToggleExpand}
                className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {expanded ? "Inklappen" : `Toon alle ${rows.length} posten`}
              </button>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {expanded ? "" : `+${rows.length - PREVIEW_LIMIT} meer`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────── Expanded full table (used in card expand + filtered view) ───────── */
function ExpandedTable({
  rows, isInkoopVoertuigen, onUpdateKost, onDeleteKost, onChanged, isMobile,
}: {
  rows: Row[];
  isInkoopVoertuigen: boolean;
  onUpdateKost: (id: string, input: Partial<Kost>) => Promise<void>;
  onDeleteKost: (id: string) => Promise<void>;
  onChanged: () => Promise<any>;
  isMobile: boolean;
}) {
  const [detail, setDetail] = useState<Row | null>(null);
  return (
    <>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted-foreground border-b border-border/60 bg-secondary/10">
            <th className="text-left font-normal px-4 py-2 w-[90px]">Datum</th>
            <th className="text-left font-normal px-2 py-2">{isInkoopVoertuigen ? "Voertuig" : "Omschrijving"}</th>
            <th className="text-left font-normal px-2 py-2">Leverancier</th>
            <th className="text-left font-normal px-2 py-2 w-[70px]">Bron</th>
            <th className="text-right font-normal px-2 py-2 w-[100px]">Bedrag</th>
            <th className="text-left font-normal px-4 py-2 w-[80px]">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((r) => (
            <tr
              key={r.id}
              onClick={() => setDetail(r)}
              className="hover:bg-secondary/30 cursor-pointer"
            >
              <td className="px-4 py-2 text-muted-foreground tabular-nums">{formatDate(r.date)}</td>
              <td className="px-2 py-2">
                {r.kenteken && <span className="text-muted-foreground mr-1.5 tabular-nums">{r.kenteken}</span>}
                {r.description}
              </td>
              <td className="px-2 py-2 text-muted-foreground truncate max-w-[180px]">{r.supplier}</td>
              <td className="px-2 py-2"><SourceBadge source={r.source} /></td>
              <td className="px-2 py-2 text-right tabular-nums font-medium">{formatEuro(r.amount)}</td>
              <td className="px-4 py-2"><StateBadge state={r.state} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <RowDetailDialog
        row={detail}
        onClose={() => setDetail(null)}
        onUpdateKost={onUpdateKost}
        onDeleteKost={onDeleteKost}
        onChanged={async () => { await onChanged(); setDetail(null); }}
        isMobile={isMobile}
      />
    </>
  );
}

/* ───────── Full category view (when filtered) ───────── */
function FullCategoryView({
  categorie, rows, onAddManual, onCategorieChanged, onUpdateKost, onDeleteKost, isMobile,
}: {
  categorie: Categorie;
  rows: Row[];
  onAddManual: () => void;
  onCategorieChanged: () => Promise<any>;
  onUpdateKost: (id: string, input: Partial<Kost>) => Promise<void>;
  onDeleteKost: (id: string) => Promise<void>;
  isMobile: boolean;
}) {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const isInkoopVoertuigen = categorie.naam === INKOOP_VOERTUIGEN_NAAM;
  return (
    <div className="rounded-[14px] border border-border bg-secondary/20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{categorie.naam}</h3>
          <CategorySettingsPopover
            categorie={categorie}
            onCategorieChanged={onCategorieChanged}
            onKostChanged={async () => {}}
            onUpdateKost={onUpdateKost}
            onDeleteKost={onDeleteKost}
            onAddManual={onAddManual}
            manualRows={rows.filter((r) => r.source === "handmatig")}
            isMobile={isMobile}
          />
        </div>
        <div className="text-sm font-semibold tabular-nums">{formatEuro(total)}</div>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-8 flex flex-col items-center gap-2">
          <div className="text-xs text-muted-foreground">Geen posten in deze periode</div>
          <button
            onClick={onAddManual}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[10px] bg-secondary/60 border border-border hover:bg-secondary"
          >
            <Plus className="w-3.5 h-3.5" /> Handmatig toevoegen
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <ExpandedTable rows={rows} isInkoopVoertuigen={isInkoopVoertuigen} onUpdateKost={onUpdateKost} onDeleteKost={onDeleteKost} onChanged={onCategorieChanged} isMobile={isMobile} />
        </div>
      )}
      {rows.length > 0 && (
        <div className="px-4 py-2.5 border-t border-border flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Subtotaal · {rows.length} post{rows.length === 1 ? "" : "en"}</span>
          <span className="font-semibold tabular-nums">{formatEuro(total)}</span>
        </div>
      )}
    </div>
  );
}

/* ───────── Row detail popover ───────── */
function RowDetailDialog({
  row, onClose, onUpdateKost, onDeleteKost, onChanged, isMobile,
}: {
  row: Row | null;
  onClose: () => void;
  onUpdateKost: (id: string, input: Partial<Kost>) => Promise<void>;
  onDeleteKost: (id: string) => Promise<void>;
  onChanged: () => Promise<any>;
  isMobile: boolean;
}) {
  const [edit, setEdit] = useState(false);
  const [naam, setNaam] = useState("");
  const [bedrag, setBedrag] = useState("");
  const [datum, setDatum] = useState("");
  const [leverancier, setLeverancier] = useState("");
  const [notities, setNotities] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (row?.source === "handmatig" && row.raw) {
      setNaam(row.raw.naam || "");
      setBedrag(String(row.raw.bedrag || ""));
      setDatum(row.raw.datum || "");
      setLeverancier(row.raw.leverancier || "");
      setNotities(row.raw.notities || "");
    }
    setEdit(false);
  }, [row?.id]);

  if (!row) return null;

  const isManual = row.source === "handmatig";

  const Body = (
    <div className="space-y-3">
      {!edit ? (
        <>
          <DetailRow label="Datum" value={formatDate(row.date)} />
          <DetailRow label="Omschrijving" value={row.description} />
          <DetailRow label="Leverancier" value={row.supplier} />
          {row.kenteken && <DetailRow label="Kenteken" value={row.kenteken} />}
          <DetailRow label="Bedrag" value={formatEuro(row.amount)} />
          <DetailRow label="Bron" value={row.source === "moneybird" ? "Moneybird" : row.source === "inkoopverklaring" ? "Inkoopverklaring" : "Handmatig"} />
          {row.state && <DetailRow label="Status" value={row.state === "paid" ? "Betaald" : row.state === "late" ? "Te laat" : "Open"} />}
          {isManual && row.raw?.notities && <DetailRow label="Notities" value={row.raw.notities} />}

          {isManual && (
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={async () => {
                  if (!confirm("Deze post verwijderen?")) return;
                  await onDeleteKost(row.raw.id);
                  await onChanged();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-[10px] bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25"
              >
                <Trash2 className="w-3.5 h-3.5" /> Verwijderen
              </button>
              <button
                onClick={() => setEdit(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-[10px] bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Pencil className="w-3.5 h-3.5" /> Bewerken
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <Field label="Omschrijving">
            <input value={naam} onChange={(e) => setNaam(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Leverancier">
            <input value={leverancier} onChange={(e) => setLeverancier(e.target.value)} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bedrag">
              <input value={bedrag} onChange={(e) => setBedrag(e.target.value)} className={inputCls} inputMode="decimal" />
            </Field>
            <Field label="Datum">
              <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Notities">
            <textarea value={notities} onChange={(e) => setNotities(e.target.value)} className={cn(inputCls, "min-h-[60px] resize-none")} />
          </Field>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setEdit(false)} className="px-3 py-2 text-xs rounded-[10px] bg-secondary/40 border border-border hover:bg-secondary/60">Annuleren</button>
            <button
              disabled={saving}
              onClick={async () => {
                const b = parseFloat(bedrag.replace(",", "."));
                if (isNaN(b) || b <= 0) return toast.error("Vul een geldig bedrag in");
                setSaving(true);
                try {
                  await onUpdateKost(row.raw.id, { naam, bedrag: b, datum, leverancier: leverancier || null, notities: notities || null });
                  await onChanged();
                } finally { setSaving(false); }
              }}
              className="px-4 py-2 text-xs rounded-[10px] bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Opslaan…" : "Opslaan"}
            </button>
          </div>
        </>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={!!row} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="bottom" className="rounded-t-[16px] border-border">
          <SheetHeader className="mb-3">
            <SheetTitle>Postdetail</SheetTitle>
          </SheetHeader>
          {Body}
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <Popover open={!!row} onOpenChange={(v) => !v && onClose()}>
      <PopoverTrigger asChild><button className="hidden" /></PopoverTrigger>
      <PopoverContent side="bottom" align="center" className="w-[440px] rounded-[16px] border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Postdetail</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        {Body}
      </PopoverContent>
    </Popover>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-words">{value}</span>
    </div>
  );
}

/* ───────── Category settings popover (gear icon) ───────── */
function CategorySettingsPopover({
  categorie, onCategorieChanged, onKostChanged, onUpdateKost, onDeleteKost,
  onAddManual, manualRows, isMobile,
}: {
  categorie: Categorie;
  onCategorieChanged: () => Promise<any>;
  onKostChanged: () => Promise<any>;
  onUpdateKost: (id: string, input: Partial<Kost>) => Promise<void>;
  onDeleteKost: (id: string) => Promise<void>;
  onAddManual: () => void;
  manualRows: Row[];
  isMobile: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [linkedContacts, setLinkedContacts] = useState<{ id: string; name: string }[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);

  const loadLinkedContacts = useCallback(async () => {
    if (!categorie.moneybird_contact_ids.length) {
      setLinkedContacts([]);
      return;
    }
    setLoadingContacts(true);
    try {
      // Try to get names from cached purchase invoices isn't easy; fetch via get_contacts page 1 + match
      // Simpler: render IDs with a "?" fallback. We'll fetch contacts lazily.
      const names: { id: string; name: string }[] = categorie.moneybird_contact_ids.map((id) => ({
        id,
        name: `Contact ${id}`,
      }));
      setLinkedContacts(names);
    } finally {
      setLoadingContacts(false);
    }
  }, [categorie.moneybird_contact_ids]);

  useEffect(() => {
    if (open) loadLinkedContacts();
  }, [open, loadLinkedContacts]);

  const removeContact = async (cid: string) => {
    const updated = categorie.moneybird_contact_ids.filter((x) => x !== cid);
    const { error } = await supabase
      .from("kosten_categorieen")
      .update({ moneybird_contact_ids: updated })
      .eq("id", categorie.id);
    if (error) {
      toast.error("Kon koppeling niet verwijderen");
      return;
    }
    toast.success("Contact ontkoppeld");
    await onCategorieChanged();
  };

  const addContact = async (cid: string, name: string) => {
    if (categorie.moneybird_contact_ids.includes(cid)) {
      toast.info("Contact is al gekoppeld");
      return;
    }
    const updated = [...categorie.moneybird_contact_ids, cid];
    const { error } = await supabase
      .from("kosten_categorieen")
      .update({ moneybird_contact_ids: updated })
      .eq("id", categorie.id);
    if (error) {
      toast.error("Kon contact niet koppelen");
      return;
    }
    toast.success(`${name} gekoppeld`);
    setPickOpen(false);
    await onCategorieChanged();
  };

  const Body = (
    <div className="space-y-4">
      {/* Sectie A: Moneybird contacten */}
      <div>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
          Gekoppelde Moneybird contacten
        </div>
        {loadingContacts ? (
          <div className="text-xs text-muted-foreground">Laden…</div>
        ) : linkedContacts.length === 0 ? (
          <div className="text-xs text-muted-foreground italic">Nog geen contacten gekoppeld</div>
        ) : (
          <div className="space-y-1.5">
            {linkedContacts.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-[10px] bg-secondary/40 border border-border text-xs"
              >
                <span className="truncate">{c.name}</span>
                <button
                  onClick={() => removeContact(c.id)}
                  className="text-muted-foreground hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => setPickOpen(true)}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[10px] bg-secondary/60 border border-border hover:bg-secondary"
        >
          <Plus className="w-3.5 h-3.5" /> Koppel Moneybird contact
        </button>
      </div>

      {/* Sectie B: Handmatige posten */}
      <div className="border-t border-border pt-3">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
          Handmatige posten
        </div>
        {manualRows.length === 0 ? (
          <div className="text-xs text-muted-foreground italic">Geen handmatige posten</div>
        ) : (
          <div className="space-y-1 max-h-[180px] overflow-y-auto">
            {manualRows.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-[10px] bg-secondary/40 border border-border text-xs"
              >
                <span className="truncate">{r.description}</span>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-muted-foreground tabular-nums text-[11px]">{formatEuro(r.amount)}</span>
                  <button
                    onClick={async () => {
                      if (!confirm("Deze post verwijderen?")) return;
                      await onDeleteKost(r.raw.id);
                      await onKostChanged();
                    }}
                    className="text-muted-foreground hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => { setOpen(false); onAddManual(); }}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[10px] bg-secondary/60 border border-border hover:bg-secondary"
        >
          <Plus className="w-3.5 h-3.5" /> Handmatig toevoegen
        </button>
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <>
          <button
            onClick={() => setOpen(true)}
            className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors shrink-0"
            title="Categorie instellingen"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="bottom" className="rounded-t-[16px] border-border max-h-[85vh] overflow-y-auto">
              <SheetHeader className="mb-3">
                <SheetTitle>{categorie.naam}</SheetTitle>
              </SheetHeader>
              {Body}
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors shrink-0"
              title="Categorie instellingen"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="end" className="w-[380px] rounded-[16px] border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">{categorie.naam}</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            {Body}
          </PopoverContent>
        </Popover>
      )}

      <ContactPickerDialog
        open={pickOpen}
        onClose={() => setPickOpen(false)}
        onPick={addContact}
        isMobile={isMobile}
      />
    </>
  );
}

/* ───────── Contact picker dialog (zoek Moneybird contacten) ───────── */
function ContactPickerDialog({
  open, onClose, onPick, isMobile,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (id: string, name: string) => void;
  isMobile: boolean;
}) {
  const { invoke } = useMoneybird();
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await invoke("get_contacts", { page: 1, query: q || undefined });
      const arr = Array.isArray(res) ? res : res?.data || [];
      setContacts(arr);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [invoke]);

  useEffect(() => {
    if (!open) return;
    load("");
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => load(query), 300);
    return () => clearTimeout(t);
  }, [query, open, load]);

  const Body = (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op bedrijfsnaam of naam…"
          className={cn(inputCls, "pl-9")}
        />
      </div>
      <div className="max-h-[320px] overflow-y-auto space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-6">Geen contacten gevonden</div>
        ) : (
          contacts.map((c) => {
            const naam =
              c.company_name ||
              [c.firstname, c.lastname].filter(Boolean).join(" ") ||
              "Onbekend";
            return (
              <button
                key={c.id}
                onClick={() => onPick(String(c.id), naam)}
                className="w-full text-left px-3 py-2 rounded-[10px] bg-secondary/30 hover:bg-secondary/60 border border-border text-xs flex items-center justify-between"
              >
                <span className="truncate">{naam}</span>
                <span className="text-muted-foreground text-[10px] ml-2 shrink-0">#{c.id}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="bottom" className="rounded-t-[16px] border-border">
          <SheetHeader className="mb-3"><SheetTitle>Koppel Moneybird contact</SheetTitle></SheetHeader>
          {Body}
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <Popover open={open} onOpenChange={(v) => !v && onClose()}>
      <PopoverTrigger asChild><button className="hidden" /></PopoverTrigger>
      <PopoverContent side="bottom" align="center" className="w-[420px] rounded-[16px] border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Koppel Moneybird contact</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        {Body}
      </PopoverContent>
    </Popover>
  );
}

/* ───────── Marge per voertuig ───────── */
function MargeSection({ rows, totaleBruto, gemMargePerc }: { rows: any[]; totaleBruto: number; gemMargePerc: number }) {
  return (
    <div className="rounded-[14px] border border-border bg-secondary/20 overflow-hidden">
      <div style={{ height: "3px", backgroundColor: "#1D9E75" }} />
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

/* ───────── Skeleton ───────── */
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-[14px] border border-border bg-secondary/20 h-[200px]" />
        ))}
      </div>
    </div>
  );
}

/* ───────── Add cost dialog ───────── */
function AddCostDialog({
  open, onClose, onCreated, create, isMobile, categorieen, presetCategorieId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  create: (input: Partial<Kost>) => Promise<void>;
  isMobile: boolean;
  categorieen: Categorie[];
  presetCategorieId: string | null;
}) {
  const [naam, setNaam] = useState("");
  const [leverancier, setLeverancier] = useState("");
  const [categorieId, setCategorieId] = useState<string>("");
  const [bedrag, setBedrag] = useState<string>("");
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10));
  const [frequentie, setFrequentie] = useState<KostFrequentie>("eenmalig");
  const [notities, setNotities] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCategorieId(presetCategorieId || categorieen[0]?.id || "");
    } else {
      setNaam(""); setLeverancier(""); setBedrag("");
      setDatum(new Date().toISOString().slice(0, 10));
      setFrequentie("eenmalig"); setNotities("");
    }
  }, [open, presetCategorieId, categorieen]);

  const submit = async () => {
    if (!naam.trim()) return toast.error("Vul een omschrijving in");
    const b = parseFloat(bedrag.replace(",", "."));
    if (isNaN(b) || b <= 0) return toast.error("Vul een geldig bedrag in");
    if (!categorieId) return toast.error("Kies een categorie");

    // Map categorie naam → legacy KostCategorie enum (best-effort, niet kritiek)
    const cat = categorieen.find((c) => c.id === categorieId);
    const legacy: KostCategorie =
      cat?.naam === "Vaste kosten" ? "vaste_kosten" :
      cat?.naam === "Advertentiekosten" ? "advertentiekosten" :
      cat?.naam === "Abonnementen & software" ? "abonnementen" :
      cat?.naam === "Personeelskosten" ? "personeelskosten" :
      cat?.naam === "Inkoop voertuigen" ? "voertuigkosten" :
      "overig";

    setSaving(true);
    try {
      await create({
        naam, leverancier: leverancier || null, categorie: legacy,
        bedrag: b, datum, frequentie, notities: notities || null,
        categorie_id: categorieId,
      });
      onCreated();
    } catch {
      // toast in hook
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
          <select value={categorieId} onChange={(e) => setCategorieId(e.target.value)} className={inputCls}>
            {categorieen.map((c) => (
              <option key={c.id} value={c.id}>{c.naam}</option>
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
          <SheetHeader className="mb-3"><SheetTitle>Kost toevoegen</SheetTitle></SheetHeader>
          {Body}
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <Popover open={open} onOpenChange={(v) => !v && onClose()}>
      <PopoverTrigger asChild><button className="hidden" /></PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-[440px] rounded-[16px] border-border bg-card p-4">
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

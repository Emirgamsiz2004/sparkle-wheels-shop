import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, TrendingUp, TrendingDown, Receipt, FileText, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMoneybird } from "@/hooks/useMoneybird";
import { formatEuroDecimal } from "@/types/vehicle";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const MONTHS = [
  "Januari", "Februari", "Maart", "April", "Mei", "Juni",
  "Juli", "Augustus", "September", "Oktober", "November", "December",
];

const pad = (n: number) => String(n).padStart(2, "0");

interface Invoice {
  id: string;
  invoice_id?: string;
  invoice_date: string;
  total_price_incl_tax: string;
  total_price_excl_tax: string;
  state: string;
  contact?: { company_name?: string; firstname?: string; lastname?: string };
  reference?: string;
}

interface Receipt {
  id: string;
  date: string;
  reference?: string;
  total_price_incl_tax: string;
  total_price_excl_tax: string;
  contact?: { company_name?: string; firstname?: string; lastname?: string };
}

interface PurchaseInvoice {
  id: string;
  date: string;
  reference?: string;
  total_price_incl_tax: string;
  total_price_excl_tax: string;
  state?: string;
  contact?: { company_name?: string; firstname?: string; lastname?: string };
}

interface PlatinaKost {
  id: string;
  naam: string;
  bedrag: number;
  datum: string;
  categorie: string;
  leverancier?: string | null;
  source: "kosten" | "vehicle";
  voertuig?: string;
}

const WinstVerliesTab = () => {
  const { getSalesInvoices, getReceipts, getPurchaseInvoices, loading } = useMoneybird();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [platinaKosten, setPlatinaKosten] = useState<PlatinaKost[]>([]);
  const [error, setError] = useState<string | null>(null);

  const periodStart = `${year}${pad(month + 1)}01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const periodEnd = `${year}${pad(month + 1)}${pad(lastDay)}`;
  const filter = `period:${periodStart}..${periodEnd}`;

  const fetchAllPages = async <T,>(fn: (page: number, filter: string) => Promise<T[]>): Promise<T[]> => {
    const all: T[] = [];
    for (let page = 1; page <= 10; page++) {
      const data = await fn(page, filter);
      if (!Array.isArray(data) || data.length === 0) break;
      all.push(...data);
      if (data.length < 100) break;
    }
    return all;
  };

  const loadPlatinaKosten = async () => {
    const dateFrom = `${year}-${pad(month + 1)}-01`;
    const dateTo = `${year}-${pad(month + 1)}-${pad(lastDay)}`;

    // Algemene kosten tabel
    const { data: kostenData } = await supabase
      .from("kosten")
      .select("id, naam, bedrag, datum, categorie, leverancier")
      .gte("datum", dateFrom)
      .lte("datum", dateTo);

    // Auto-gebonden kosten (uit vehicles.kosten JSON array)
    const { data: vehiclesData } = await supabase
      .from("vehicles" as any)
      .select("id, merk, model, kenteken, kosten");

    const vehicleKosten: PlatinaKost[] = [];
    (vehiclesData || []).forEach((v: any) => {
      (v.kosten || []).forEach((k: any) => {
        if (!k.date) return;
        if (k.date >= dateFrom && k.date <= dateTo) {
          vehicleKosten.push({
            id: `${v.id}-${k.id}`,
            naam: k.description || "Kost",
            bedrag: Number(k.amount) || 0,
            datum: k.date,
            categorie: k.category || "overig",
            leverancier: k.leverancier || null,
            source: "vehicle",
            voertuig: `${v.merk || ""} ${v.model || ""} (${v.kenteken || "?"})`.trim(),
          });
        }
      });
    });

    const algemeenKosten: PlatinaKost[] = (kostenData || []).map((k: any) => ({
      id: k.id,
      naam: k.naam,
      bedrag: Number(k.bedrag) || 0,
      datum: k.datum,
      categorie: k.categorie,
      leverancier: k.leverancier,
      source: "kosten",
    }));

    setPlatinaKosten([...vehicleKosten, ...algemeenKosten]);
  };

  const load = async () => {
    setError(null);
    try {
      const [inv, rec, pi] = await Promise.all([
        fetchAllPages<Invoice>((p, f) => getSalesInvoices(p, f)),
        fetchAllPages<Receipt>((p, f) => getReceipts(p, f)),
        fetchAllPages<PurchaseInvoice>((p, f) => getPurchaseInvoices(p, f)),
      ]);
      setInvoices(inv);
      setReceipts(rec);
      setPurchaseInvoices(pi);
      await loadPlatinaKosten();
    } catch (e: any) {
      setError(e.message || "Onbekende fout");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const omzet = useMemo(() => {
    let incl = 0, excl = 0, paid = 0, open = 0;
    for (const inv of invoices) {
      const i = parseFloat(inv.total_price_incl_tax || "0");
      const e = parseFloat(inv.total_price_excl_tax || "0");
      incl += i; excl += e;
      if (inv.state === "paid") paid += i; else open += i;
    }
    return { incl, excl, btw: incl - excl, paid, open, count: invoices.length };
  }, [invoices]);

  const kosten = useMemo(() => {
    const recTotal = receipts.reduce((s, r) => s + parseFloat(r.total_price_incl_tax || "0"), 0);
    const piTotal = purchaseInvoices.reduce((s, p) => s + parseFloat(p.total_price_incl_tax || "0"), 0);
    const platinaTotal = platinaKosten.reduce((s, k) => s + k.bedrag, 0);
    return {
      receipts: recTotal,
      purchaseInvoices: piTotal,
      platina: platinaTotal,
      total: recTotal + piTotal + platinaTotal,
    };
  }, [receipts, purchaseInvoices, platinaKosten]);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <div className="flex items-center justify-between bg-card border border-border rounded-[3px] p-3">
        <Button variant="ghost" size="icon" onClick={prev} className="h-9 w-9">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <div className="text-lg font-semibold text-foreground font-['Poppins']">
            {MONTHS[month]} {year}
          </div>
          <div className="text-xs text-muted-foreground">
            {periodStart.slice(6, 8)}-{periodStart.slice(4, 6)} t/m {periodEnd.slice(6, 8)}-{periodEnd.slice(4, 6)}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={next} className="h-9 w-9">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-[3px]">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* OMZET */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Omzet (Moneybird verkoopfacturen)
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Stat label="Totaal incl. BTW" value={formatEuroDecimal(omzet.incl)} highlight color="emerald" />
            <Stat label="Totaal excl. BTW" value={formatEuroDecimal(omzet.excl)} />
            <Stat label="BTW" value={formatEuroDecimal(omzet.btw)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border">
            <Stat label="Betaald" value={formatEuroDecimal(omzet.paid)} color="emerald" small />
            <Stat label="Openstaand" value={formatEuroDecimal(omzet.open)} color="amber" small />
            <Stat label="Aantal facturen" value={String(omzet.count)} small />
          </div>
        </CardContent>
      </Card>

      {/* KOSTEN */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Kosten
            </h2>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Totaal kosten (incl. BTW)</div>
            <div className="text-3xl font-bold text-red-500 tabular-nums">
              {formatEuroDecimal(kosten.total)}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-border">
            <SourceStat
              icon={<Receipt className="h-4 w-4" />}
              label="Bonnetjes (MB)"
              value={formatEuroDecimal(kosten.receipts)}
              count={receipts.length}
            />
            <SourceStat
              icon={<FileText className="h-4 w-4" />}
              label="Inkoopfacturen (MB)"
              value={formatEuroDecimal(kosten.purchaseInvoices)}
              count={purchaseInvoices.length}
            />
            <SourceStat
              icon={<Wrench className="h-4 w-4" />}
              label="Platina kosten"
              value={formatEuroDecimal(kosten.platina)}
              count={platinaKosten.length}
            />
          </div>
        </CardContent>
      </Card>

      {/* Detail lijsten */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DetailList title="Verkoopfacturen" items={invoices.map(i => ({
          id: i.id,
          ref: i.invoice_id || i.reference || i.id.slice(0, 8),
          name: i.contact?.company_name || [i.contact?.firstname, i.contact?.lastname].filter(Boolean).join(" ") || "—",
          date: i.invoice_date,
          amount: parseFloat(i.total_price_incl_tax || "0"),
          state: i.state,
        }))} positive />

        <DetailList title="Bonnetjes" items={receipts.map(r => ({
          id: r.id,
          ref: r.reference || r.id.slice(0, 8),
          name: r.contact?.company_name || [r.contact?.firstname, r.contact?.lastname].filter(Boolean).join(" ") || "—",
          date: r.date,
          amount: parseFloat(r.total_price_incl_tax || "0"),
        }))} />

        <DetailList title="Inkoopfacturen" items={purchaseInvoices.map(p => ({
          id: p.id,
          ref: p.reference || p.id.slice(0, 8),
          name: p.contact?.company_name || [p.contact?.firstname, p.contact?.lastname].filter(Boolean).join(" ") || "—",
          date: p.date,
          amount: parseFloat(p.total_price_incl_tax || "0"),
          state: p.state,
        }))} />

        <DetailList title="Platina kosten" items={platinaKosten.map(k => ({
          id: k.id,
          ref: k.categorie,
          name: k.voertuig ? `${k.naam} · ${k.voertuig}` : k.naam,
          date: k.datum,
          amount: k.bedrag,
        }))} />
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Stap 2 van 6 — Verifieer dat omzet én kosten matchen. Daarna: categorisatie.
      </div>
    </div>
  );
};

const Stat = ({ label, value, highlight, color, small }: {
  label: string; value: string; highlight?: boolean; color?: "emerald" | "amber" | "red"; small?: boolean;
}) => (
  <div>
    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
    <div className={cn(
      "font-bold tabular-nums",
      small ? "text-lg" : highlight ? "text-3xl" : "text-2xl",
      color === "emerald" && "text-emerald-500",
      color === "amber" && "text-amber-500",
      color === "red" && "text-red-500",
      !color && "text-foreground",
    )}>{value}</div>
  </div>
);

const SourceStat = ({ icon, label, value, count }: { icon: React.ReactNode; label: string; value: string; count: number }) => (
  <div>
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider mb-1">
      {icon}
      {label}
    </div>
    <div className="text-lg font-bold text-foreground tabular-nums">{value}</div>
    <div className="text-xs text-muted-foreground mt-0.5">{count} {count === 1 ? "post" : "posten"}</div>
  </div>
);

const DetailList = ({ title, items, positive }: {
  title: string;
  items: { id: string; ref: string; name: string; date: string; amount: number; state?: string }[];
  positive?: boolean;
}) => (
  <Card>
    <CardContent className="p-0">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          {title}
        </h3>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground text-xs">Geen items</div>
      ) : (
        <div className="divide-y divide-border max-h-80 overflow-y-auto">
          {items.map(it => (
            <div key={it.id} className="px-4 py-2 flex items-center justify-between hover:bg-muted/30">
              <div className="flex-1 min-w-0 mr-3">
                <div className="text-xs font-medium text-foreground truncate">{it.ref} — {it.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {it.date}{it.state && <> · <span className="uppercase">{it.state}</span></>}
                </div>
              </div>
              <div className={cn("text-xs font-semibold tabular-nums", positive ? "text-emerald-500" : "text-red-500")}>
                {positive ? "+" : "−"}{formatEuroDecimal(it.amount)}
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

export default WinstVerliesTab;

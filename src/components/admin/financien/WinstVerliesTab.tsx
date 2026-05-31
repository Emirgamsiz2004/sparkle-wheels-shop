import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMoneybird } from "@/hooks/useMoneybird";
import { formatEuroDecimal } from "@/types/vehicle";
import { cn } from "@/lib/utils";

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

const WinstVerliesTab = () => {
  const { getSalesInvoices, loading } = useMoneybird();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  const periodStart = `${year}${pad(month + 1)}01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const periodEnd = `${year}${pad(month + 1)}${pad(lastDay)}`;
  const filter = `period:${periodStart}..${periodEnd}`;

  const load = async () => {
    setError(null);
    try {
      // Haal alle pagina's op (Moneybird = 100/pagina max)
      const all: Invoice[] = [];
      for (let page = 1; page <= 10; page++) {
        const data = await getSalesInvoices(page, filter);
        if (!Array.isArray(data) || data.length === 0) break;
        all.push(...data);
        if (data.length < 100) break;
      }
      setInvoices(all);
    } catch (e: any) {
      setError(e.message || "Onbekende fout");
      setInvoices([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const totals = useMemo(() => {
    let inclTotal = 0;
    let exclTotal = 0;
    let paid = 0;
    let open = 0;
    for (const inv of invoices) {
      const incl = parseFloat(inv.total_price_incl_tax || "0");
      const excl = parseFloat(inv.total_price_excl_tax || "0");
      inclTotal += incl;
      exclTotal += excl;
      if (inv.state === "paid") paid += incl;
      else open += incl;
    }
    return { inclTotal, exclTotal, btw: inclTotal - exclTotal, paid, open, count: invoices.length };
  }, [invoices]);

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const next = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

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

      {/* Step 1: Omzet card */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Omzet (Moneybird verkoopfacturen)
              </h2>
            </div>
            <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-[3px]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Stat label="Totaal incl. BTW" value={formatEuroDecimal(totals.inclTotal)} highlight />
            <Stat label="Totaal excl. BTW" value={formatEuroDecimal(totals.exclTotal)} />
            <Stat label="BTW" value={formatEuroDecimal(totals.btw)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border">
            <Stat label="Betaald" value={formatEuroDecimal(totals.paid)} color="emerald" small />
            <Stat label="Openstaand" value={formatEuroDecimal(totals.open)} color="amber" small />
            <Stat label="Aantal facturen" value={String(totals.count)} small />
          </div>
        </CardContent>
      </Card>

      {/* Factuur lijst */}
      <Card>
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Facturen ({invoices.length})
            </h3>
          </div>
          {loading && invoices.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Laden...</div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Geen facturen gevonden voor deze maand
            </div>
          ) : (
            <div className="divide-y divide-border">
              {invoices.map((inv) => {
                const incl = parseFloat(inv.total_price_incl_tax || "0");
                const name = inv.contact?.company_name
                  || [inv.contact?.firstname, inv.contact?.lastname].filter(Boolean).join(" ")
                  || "—";
                return (
                  <div key={inv.id} className="px-6 py-3 flex items-center justify-between hover:bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {inv.invoice_id || inv.reference || inv.id.slice(0, 8)} — {name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {inv.invoice_date} · <span className={cn(
                          "uppercase",
                          inv.state === "paid" && "text-emerald-500",
                          inv.state === "open" && "text-amber-500",
                          inv.state === "late" && "text-red-500",
                        )}>{inv.state}</span>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-foreground tabular-nums">
                      {formatEuroDecimal(incl)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground text-center">
        Stap 1 van 6 — Verifieer dat dit totaal overeenkomt met Moneybird. Daarna voegen we kosten toe.
      </div>
    </div>
  );
};

const Stat = ({ label, value, highlight, color, small }: {
  label: string; value: string; highlight?: boolean; color?: "emerald" | "amber"; small?: boolean;
}) => (
  <div>
    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
    <div className={cn(
      "font-bold tabular-nums",
      small ? "text-lg" : highlight ? "text-3xl" : "text-2xl",
      color === "emerald" && "text-emerald-500",
      color === "amber" && "text-amber-500",
      !color && "text-foreground",
    )}>
      {value}
    </div>
  </div>
);

export default WinstVerliesTab;

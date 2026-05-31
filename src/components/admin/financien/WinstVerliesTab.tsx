import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMoneybird } from "@/hooks/useMoneybird";
import { formatEuro } from "@/types/vehicle";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
  ExternalLink,
  Info,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PeriodType = "maand" | "kwartaal" | "jaar";

const maandNamen = [
  "Januari", "Februari", "Maart", "April", "Mei", "Juni",
  "Juli", "Augustus", "September", "Oktober", "November", "December",
];

function getRange(type: PeriodType, year: number, month: number, quarter: number) {
  if (type === "maand") {
    return {
      from: new Date(year, month, 1),
      to: new Date(year, month + 1, 0, 23, 59, 59),
      label: `${maandNamen[month]} ${year}`,
    };
  }
  if (type === "kwartaal") {
    const [m1, m2] = [[0, 2], [3, 5], [6, 8], [9, 11]][quarter - 1];
    return {
      from: new Date(year, m1, 1),
      to: new Date(year, m2 + 1, 0, 23, 59, 59),
      label: `Q${quarter} ${year}`,
    };
  }
  return {
    from: new Date(year, 0, 1),
    to: new Date(year, 11, 31, 23, 59, 59),
    label: `${year}`,
  };
}

function fmtMbDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

interface MbInvoice {
  id: string;
  invoice_date: string;
  reference?: string;
  state?: string;
  total_price_excl_tax?: string | number;
  total_price_incl_tax?: string | number;
  contact_id?: string;
  contact?: { company_name?: string; firstname?: string; lastname?: string };
  details?: Array<{ description?: string; ledger_account_id?: string }>;
}

interface MbReceipt {
  id: string;
  date: string;
  reference?: string;
  total_price_excl_tax?: string | number;
  total_price_incl_tax?: string | number;
  contact_id?: string;
  contact?: { company_name?: string };
}

interface Categorie {
  id: string;
  naam: string;
  moneybird_contact_ids: string[];
}

const num = (v: any) => Number(v || 0);

const WinstVerliesTab = () => {
  const { invoke } = useMoneybird();
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<MbInvoice[]>([]);
  const [receipts, setReceipts] = useState<MbReceipt[]>([]);
  const [categorieen, setCategorieen] = useState<Categorie[]>([]);
  const [vehicleKentekens, setVehicleKentekens] = useState<Set<string>>(new Set());
  const [adminId, setAdminId] = useState<string>("");

  const now = new Date();
  const [periodType, setPeriodType] = useState<PeriodType>("maand");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);

  const { from, to, label } = useMemo(
    () => getRange(periodType, year, month, quarter),
    [periodType, year, month, quarter]
  );

  // Load categorieen + voertuig kentekens (once)
  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: vehs }, admin] = await Promise.all([
        supabase.from("kosten_categorieen").select("id, naam, moneybird_contact_ids"),
        supabase.from("vehicles").select("kenteken"),
        invoke("get_administration").catch(() => null),
      ]);
      setCategorieen((cats as Categorie[]) || []);
      setVehicleKentekens(
        new Set(((vehs as any[]) || []).map((v) => (v.kenteken || "").toUpperCase().replace(/[-\s]/g, "")))
      );
      if (admin?.id) setAdminId(String(admin.id));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMoneybird = useCallback(async () => {
    setLoading(true);
    try {
      const filter = `period:${fmtMbDate(from)}..${fmtMbDate(to)},state:open|paid|late|pending_payment`;
      const recFilter = `period:${fmtMbDate(from)}..${fmtMbDate(to)}`;

      // paginate
      const collectInvoices: MbInvoice[] = [];
      for (let p = 1; p <= 10; p++) {
        const data = await invoke("get_sales_invoices", { page: p, filter });
        const arr = Array.isArray(data) ? data : [];
        collectInvoices.push(...arr);
        if (arr.length < 100) break;
      }

      const collectReceipts: MbReceipt[] = [];
      for (let p = 1; p <= 10; p++) {
        const data = await invoke("get_receipts", { page: p, filter: recFilter });
        const arr = Array.isArray(data) ? data : [];
        collectReceipts.push(...arr);
        if (arr.length < 100) break;
      }

      setInvoices(collectInvoices);
      setReceipts(collectReceipts);
    } catch (e: any) {
      toast.error("Kon Moneybird-data niet laden");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [from, to, invoke]);

  useEffect(() => {
    loadMoneybird();
  }, [loadMoneybird]);

  // ─── Omzet uit Moneybird verkoopfacturen ───
  const omzetGroepen = useMemo(() => {
    const groups = { voertuig: 0, diensten: 0 };
    const voertuigInv: MbInvoice[] = [];
    const dienstInv: MbInvoice[] = [];
    invoices.forEach((inv) => {
      const excl = num(inv.total_price_excl_tax);
      const ref = (inv.reference || "").toUpperCase().replace(/[-\s]/g, "");
      const desc = (inv.details || []).map((d) => d.description || "").join(" ").toUpperCase().replace(/[-\s]/g, "");
      const isVoertuig =
        Array.from(vehicleKentekens).some((k) => k && (ref.includes(k) || desc.includes(k))) ||
        /\b[A-Z0-9]{6,8}\b/.test(ref);
      if (isVoertuig) {
        groups.voertuig += excl;
        voertuigInv.push(inv);
      } else {
        groups.diensten += excl;
        dienstInv.push(inv);
      }
    });
    const totaalIncl = invoices.reduce((s, i) => s + num(i.total_price_incl_tax), 0);
    const totaalExcl = invoices.reduce((s, i) => s + num(i.total_price_excl_tax), 0);
    return { groups, voertuigInv, dienstInv, totaalIncl, totaalExcl, btw: totaalIncl - totaalExcl };
  }, [invoices, vehicleKentekens]);

  // ─── Kosten uit Moneybird receipts gegroepeerd op categorie ───
  const kostGroepen = useMemo(() => {
    const map: Record<string, { naam: string; bedrag: number; count: number }> = {};
    const unmapped: MbReceipt[] = [];
    receipts.forEach((r) => {
      const excl = num(r.total_price_excl_tax);
      const cat = categorieen.find((c) => r.contact_id && c.moneybird_contact_ids?.includes(r.contact_id));
      const key = cat?.id || "__overig__";
      const naam = cat?.naam || "Overig";
      if (!map[key]) map[key] = { naam, bedrag: 0, count: 0 };
      map[key].bedrag += excl;
      map[key].count += 1;
      if (!cat) unmapped.push(r);
    });
    const totaalIncl = receipts.reduce((s, r) => s + num(r.total_price_incl_tax), 0);
    const totaalExcl = receipts.reduce((s, r) => s + num(r.total_price_excl_tax), 0);
    return {
      list: Object.values(map).sort((a, b) => b.bedrag - a.bedrag),
      totaalIncl,
      totaalExcl,
      btw: totaalIncl - totaalExcl,
      unmappedCount: unmapped.length,
    };
  }, [receipts, categorieen]);

  const totaleOmzet = omzetGroepen.totaalExcl;
  const totaleKosten = kostGroepen.totaalExcl;
  const resultaat = totaleOmzet - totaleKosten;
  const marge = totaleOmzet > 0 ? (resultaat / totaleOmzet) * 100 : 0;
  const btwSaldo = omzetGroepen.btw - kostGroepen.btw;

  const navigate = (dir: -1 | 1) => {
    if (periodType === "maand") {
      let m = month + dir, y = year;
      if (m < 0) { m = 11; y -= 1; }
      if (m > 11) { m = 0; y += 1; }
      setMonth(m); setYear(y);
    } else if (periodType === "kwartaal") {
      let q = quarter + dir, y = year;
      if (q < 1) { q = 4; y -= 1; }
      if (q > 4) { q = 1; y += 1; }
      setQuarter(q); setYear(y);
    } else {
      setYear(year + dir);
    }
  };

  return (
    <div className="space-y-5">
      {/* Periode bar */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2 bg-card border border-border rounded-[12px] p-1">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {periodType === "maand" && (
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-transparent text-sm font-medium text-foreground px-2 py-1 outline-none cursor-pointer">
              {maandNamen.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          )}
          {periodType === "kwartaal" && (
            <select value={quarter} onChange={(e) => setQuarter(Number(e.target.value))} className="bg-transparent text-sm font-medium text-foreground px-2 py-1 outline-none cursor-pointer">
              {[1, 2, 3, 4].map((q) => <option key={q} value={q}>Q{q}</option>)}
            </select>
          )}
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-transparent text-sm font-medium text-foreground px-2 py-1 outline-none cursor-pointer">
            {Array.from({ length: 6 }).map((_, i) => {
              const y = now.getFullYear() - i;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
          <button onClick={() => navigate(1)} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-card border border-border rounded-[12px] p-1">
            {(["maand", "kwartaal", "jaar"] as PeriodType[]).map((t) => (
              <button
                key={t}
                onClick={() => setPeriodType(t)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize",
                  periodType === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={loadMoneybird}
            disabled={loading}
            className="p-2 rounded-md bg-card border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title="Vernieuwen vanuit Moneybird"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Top KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <BigStat
          label="Opbrengsten"
          value={formatEuro(totaleOmzet)}
          sub={`${invoices.length} facturen · excl. btw`}
          icon={TrendingUp}
          tone="positive"
        />
        <BigStat
          label="Kosten"
          value={formatEuro(totaleKosten)}
          sub={`${receipts.length} bonnen · excl. btw`}
          icon={TrendingDown}
          tone="negative"
        />
        <BigStat
          label="Resultaat"
          value={formatEuro(resultaat)}
          sub={`Marge ${marge.toFixed(1)}%`}
          icon={Wallet}
          tone={resultaat >= 0 ? "positive" : "negative"}
          highlight
        />
      </div>

      {/* Two column P&L */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Opbrengsten */}
        <Panel title="Opbrengsten" subtitle={label} accent="positive">
          <PnLLine label="Voertuigverkopen" detail={`${omzetGroepen.voertuigInv.length} facturen`} value={omzetGroepen.groups.voertuig} />
          <PnLLine label="Diensten & overig" detail={`${omzetGroepen.dienstInv.length} facturen`} value={omzetGroepen.groups.diensten} />
          {invoices.length === 0 && <EmptyLine text="Geen verkoopfacturen in deze periode" />}
          <Divider />
          <PnLLine label="Totaal excl. btw" value={omzetGroepen.totaalExcl} bold />
          <PnLLine label="BTW" detail="verkoop-btw" value={omzetGroepen.btw} muted />
          <PnLLine label="Totaal incl. btw" value={omzetGroepen.totaalIncl} muted />
        </Panel>

        {/* Kosten */}
        <Panel title="Kosten" subtitle={label} accent="negative">
          {kostGroepen.list.length === 0 ? (
            <EmptyLine text="Geen bonnen in deze periode" />
          ) : (
            kostGroepen.list.map((c) => (
              <PnLLine key={c.naam} label={c.naam} detail={`${c.count} bonnen`} value={c.bedrag} negative />
            ))
          )}
          {kostGroepen.unmappedCount > 0 && (
            <p className="px-4 py-2 text-[11px] text-muted-foreground italic">
              {kostGroepen.unmappedCount} bonnen niet gekoppeld aan categorie. Koppel leveranciers in "Beheer" tab.
            </p>
          )}
          <Divider />
          <PnLLine label="Totaal excl. btw" value={kostGroepen.totaalExcl} bold negative />
          <PnLLine label="BTW" detail="voorbelasting" value={kostGroepen.btw} muted />
          <PnLLine label="Totaal incl. btw" value={kostGroepen.totaalIncl} muted />
        </Panel>
      </div>

      {/* Resultaat sheet */}
      <div className={cn(
        "bg-card border rounded-[16px] overflow-hidden",
        resultaat >= 0 ? "border-emerald-500/30" : "border-red-500/30"
      )}>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/60">
          <ResultCell label="Opbrengsten" value={totaleOmzet} />
          <ResultCell label="− Kosten" value={-totaleKosten} />
          <ResultCell label="= Resultaat" value={resultaat} highlight />
        </div>
        <div className="px-5 py-3 bg-secondary/30 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Info className="w-3.5 h-3.5" />
            <span>BTW-saldo (af te dragen): <strong className={btwSaldo >= 0 ? "text-amber-400" : "text-emerald-400"}>{formatEuro(btwSaldo)}</strong></span>
          </div>
          <span className="text-muted-foreground">
            Marge: <strong className="text-foreground">{marge.toFixed(1)}%</strong>
          </span>
        </div>
      </div>

      {/* Facturen detail */}
      {invoices.length > 0 && (
        <div className="bg-card border border-border rounded-[16px] overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Verkoopfacturen — {label}</h3>
            <span className="text-xs text-muted-foreground">{invoices.length}</span>
          </div>
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-muted-foreground text-[11px] uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Datum</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Referentie</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Contact</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Status</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Excl. btw</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Incl. btw</th>
                </tr>
              </thead>
              <tbody>
                {invoices
                  .slice()
                  .sort((a, b) => (a.invoice_date < b.invoice_date ? 1 : -1))
                  .map((inv) => {
                    const contact =
                      inv.contact?.company_name ||
                      [inv.contact?.firstname, inv.contact?.lastname].filter(Boolean).join(" ") ||
                      "—";
                    return (
                      <tr key={inv.id} className="border-t border-border/40 hover:bg-accent/20">
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(inv.invoice_date).toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })}
                        </td>
                        <td className="px-3 py-2.5 text-[13px] font-mono">
                          {adminId ? (
                            <a
                              href={`https://moneybird.com/${adminId}/sales_invoices/${inv.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-foreground hover:text-primary inline-flex items-center gap-1"
                            >
                              {inv.reference || inv.id.slice(0, 8)}
                              <ExternalLink className="w-3 h-3 opacity-60" />
                            </a>
                          ) : (
                            inv.reference || inv.id.slice(0, 8)
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-[13px] text-foreground truncate max-w-[200px]">{contact}</td>
                        <td className="px-3 py-2.5">
                          <StateBadge state={inv.state} />
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{formatEuro(num(inv.total_price_excl_tax))}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-medium">{formatEuro(num(inv.total_price_incl_tax))}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Subcomponents ─── */

const BigStat = ({
  label, value, sub, icon: Icon, tone, highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: any;
  tone: "positive" | "negative" | "neutral";
  highlight?: boolean;
}) => (
  <div className={cn(
    "bg-card border rounded-[16px] p-5",
    highlight ? "border-primary/40 shadow-[0_0_0_1px] shadow-primary/10" : "border-border"
  )}>
    <div className="flex items-center justify-between mb-3">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</span>
      <Icon className={cn(
        "w-4 h-4",
        tone === "positive" && "text-emerald-400",
        tone === "negative" && "text-red-400",
        tone === "neutral" && "text-muted-foreground"
      )} />
    </div>
    <div className={cn(
      "text-3xl font-bold tabular-nums",
      tone === "positive" && "text-emerald-400",
      tone === "negative" && "text-red-400",
    )}>
      {value}
    </div>
    {sub && <p className="text-[11px] text-muted-foreground mt-1.5">{sub}</p>}
  </div>
);

const Panel = ({ title, subtitle, accent, children }: { title: string; subtitle?: string; accent: "positive" | "negative"; children: any }) => (
  <div className="bg-card border border-border rounded-[16px] overflow-hidden flex flex-col">
    <div className={cn(
      "px-5 py-3 border-b border-border flex items-center justify-between",
      accent === "positive" ? "bg-emerald-500/5" : "bg-red-500/5"
    )}>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {subtitle && <span className="text-[11px] text-muted-foreground">{subtitle}</span>}
    </div>
    <div className="divide-y divide-border/40">{children}</div>
  </div>
);

const PnLLine = ({ label, detail, value, bold, muted, negative }: {
  label: string; detail?: string; value: number; bold?: boolean; muted?: boolean; negative?: boolean;
}) => (
  <div className="px-5 py-2.5 flex items-center justify-between">
    <div>
      <p className={cn("text-sm", bold ? "font-semibold text-foreground" : "text-foreground", muted && "text-muted-foreground")}>
        {label}
      </p>
      {detail && <p className="text-[11px] text-muted-foreground">{detail}</p>}
    </div>
    <span className={cn(
      "tabular-nums text-sm",
      bold && "font-bold text-base",
      muted && "text-muted-foreground",
      !muted && negative && "text-red-400/90",
    )}>
      {negative ? "−" : ""}{formatEuro(Math.abs(value))}
    </span>
  </div>
);

const Divider = () => <div className="h-px bg-border/60" />;

const EmptyLine = ({ text }: { text: string }) => (
  <div className="px-5 py-4 text-xs text-muted-foreground italic">{text}</div>
);

const ResultCell = ({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) => (
  <div className={cn("p-5", highlight && "bg-secondary/30")}>
    <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">{label}</p>
    <p className={cn(
      "tabular-nums font-bold",
      highlight ? "text-3xl" : "text-xl",
      value < 0 ? "text-red-400" : highlight ? "text-emerald-400" : "text-foreground",
    )}>
      {value < 0 ? "−" : ""}{formatEuro(Math.abs(value))}
    </p>
  </div>
);

const StateBadge = ({ state }: { state?: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    paid: { label: "Betaald", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    open: { label: "Open", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    late: { label: "Te laat", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
    pending_payment: { label: "In behandeling", cls: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
    draft: { label: "Concept", cls: "bg-muted text-muted-foreground border-border" },
  };
  const s = map[state || ""] || { label: state || "—", cls: "bg-muted text-muted-foreground border-border" };
  return <span className={cn("inline-block px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border", s.cls)}>{s.label}</span>;
};

export default WinstVerliesTab;

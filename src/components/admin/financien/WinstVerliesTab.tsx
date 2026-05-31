import { useEffect, useMemo, useState } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import {
  useKosten,
  kostBedragInPeriode,
  kostCategorieLabels,
  KostCategorie,
} from "@/hooks/useKosten";
import {
  calcWinst,
  calcKostprijs,
  calcBtwMarge,
  calcNettoMarge,
  isConsignatie,
  formatEuro,
} from "@/types/vehicle";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PeriodType = "maand" | "kwartaal" | "jaar";

const maandNamen = [
  "Januari", "Februari", "Maart", "April", "Mei", "Juni",
  "Juli", "Augustus", "September", "Oktober", "November", "December",
];

function getRange(
  type: PeriodType,
  year: number,
  month: number,
  quarter: number
): { from: Date; to: Date; label: string } {
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

interface Booking {
  id: string;
  datum: string;
  totaal_prijs: number;
  pakket: string;
  voertuig_type: string;
}

const WinstVerliesTab = () => {
  const { vehicles, loading: vehLoading } = useVehicles();
  const { kosten, loading: kostLoading } = useKosten();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const now = new Date();
  const [periodType, setPeriodType] = useState<PeriodType>("maand");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, datum, totaal_prijs, pakket, voertuig_type")
        .order("datum", { ascending: false });
      setBookings((data as Booking[]) || []);
      setBookingsLoading(false);
    })();
  }, []);

  const { from, to, label } = useMemo(
    () => getRange(periodType, year, month, quarter),
    [periodType, year, month, quarter]
  );

  // ─── Omzet voertuigverkopen ───
  const verkochteAutos = useMemo(() => {
    return vehicles
      .filter((v: any) => v.status === "verkocht" && v.verkoopDatum)
      .filter((v: any) => {
        const d = new Date(v.verkoopDatum);
        return d >= from && d <= to;
      });
  }, [vehicles, from, to]);

  const omzetAutos = verkochteAutos.reduce(
    (s: number, v: any) => s + Number(v.verkoopprijs || 0),
    0
  );
  const kostprijsAutos = verkochteAutos.reduce(
    (s: number, v: any) => s + calcKostprijs(v),
    0
  );
  const brutoAutos = verkochteAutos.reduce(
    (s: number, v: any) => s + calcWinst(v),
    0
  );
  const btwAutos = verkochteAutos.reduce(
    (s: number, v: any) => s + calcBtwMarge(v),
    0
  );
  const nettoAutos = verkochteAutos.reduce(
    (s: number, v: any) => s + calcNettoMarge(v),
    0
  );

  // ─── Omzet diensten / poetsbeurten ───
  const dienstenInPeriode = useMemo(() => {
    return bookings.filter((b) => {
      const d = new Date(b.datum);
      return d >= from && d <= to;
    });
  }, [bookings, from, to]);

  const omzetDiensten = dienstenInPeriode.reduce(
    (s, b) => s + Number(b.totaal_prijs || 0),
    0
  );
  const btwDiensten = omzetDiensten * (21 / 121); // incl btw

  // ─── Operationele kosten per categorie ───
  const kostenPerCategorie = useMemo(() => {
    const map: Record<string, number> = {};
    kosten.forEach((k) => {
      const bedrag = kostBedragInPeriode(k, from, to);
      if (bedrag > 0) map[k.categorie] = (map[k.categorie] || 0) + bedrag;
    });
    return map;
  }, [kosten, from, to]);

  const totaalOpex = Object.values(kostenPerCategorie).reduce((s, v) => s + v, 0);

  // ─── Totalen ───
  const totaleOmzet = omzetAutos + omzetDiensten;
  const totaleDirecteKosten = kostprijsAutos;
  const brutoWinst = totaleOmzet - totaleDirecteKosten;
  const resultaatVoorBelasting = brutoWinst - totaalOpex;
  const totaleBtw = btwAutos + btwDiensten;
  const nettoResultaat = resultaatVoorBelasting - totaleBtw;

  const loading = vehLoading || kostLoading || bookingsLoading;

  const navigate = (dir: -1 | 1) => {
    if (periodType === "maand") {
      let m = month + dir;
      let y = year;
      if (m < 0) { m = 11; y -= 1; }
      if (m > 11) { m = 0; y += 1; }
      setMonth(m); setYear(y);
    } else if (periodType === "kwartaal") {
      let q = quarter + dir;
      let y = year;
      if (q < 1) { q = 4; y -= 1; }
      if (q > 4) { q = 1; y += 1; }
      setQuarter(q); setYear(y);
    } else {
      setYear(year + dir);
    }
  };

  return (
    <div className="space-y-5">
      {/* ─── Periode selector ─── */}
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

        <div className="flex items-center gap-1 bg-card border border-border rounded-[12px] p-1">
          {(["maand", "kwartaal", "jaar"] as PeriodType[]).map((t) => (
            <button
              key={t}
              onClick={() => setPeriodType(t)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize",
                periodType === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ─── KPI cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Receipt} label="Totale omzet" value={formatEuro(totaleOmzet)} sub={`${verkochteAutos.length} auto's · ${dienstenInPeriode.length} diensten`} />
        <KpiCard icon={Wallet} label="Brutowinst" value={formatEuro(brutoWinst)} accent={brutoWinst >= 0 ? "positive" : "negative"} sub="omzet − directe kosten" />
        <KpiCard icon={TrendingDown} label="Operationele kosten" value={formatEuro(totaalOpex)} accent="neutral-negative" sub={`${Object.keys(kostenPerCategorie).length} categorieën`} />
        <KpiCard icon={TrendingUp} label="Netto resultaat" value={formatEuro(nettoResultaat)} accent={nettoResultaat >= 0 ? "positive" : "negative"} sub="na BTW & opex" highlight />
      </div>

      {/* ─── P&L Sheet ─── */}
      <div className="bg-card border border-border rounded-[16px] overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Winst & Verlies — {label}</h3>
            <p className="text-[11px] text-muted-foreground">
              Samengevoegd uit voertuigverkopen, diensten en geregistreerde kosten
            </p>
          </div>
          {loading && <span className="text-xs text-muted-foreground">Laden…</span>}
        </div>

        <div className="divide-y divide-border/60 text-sm">
          {/* OMZET */}
          <SectionHeader title="Omzet" />
          <PnLRow label="Voertuigverkopen" detail={`${verkochteAutos.length} verkocht`} value={omzetAutos} />
          <PnLRow label="Diensten & poetsbeurten" detail={`${dienstenInPeriode.length} boekingen`} value={omzetDiensten} />
          <PnLSubtotal label="Totale omzet" value={totaleOmzet} />

          {/* DIRECTE KOSTEN */}
          <SectionHeader title="Directe kosten" />
          <PnLRow label="Kostprijs verkochte voertuigen" detail="inkoop + voertuigkosten" value={-totaleDirecteKosten} />
          <PnLSubtotal label="Brutowinst" value={brutoWinst} accent />

          {/* OPEX */}
          <SectionHeader title="Operationele kosten" />
          {Object.keys(kostenPerCategorie).length === 0 ? (
            <div className="px-5 py-3 text-xs text-muted-foreground italic">
              Geen kosten in deze periode geregistreerd.
            </div>
          ) : (
            Object.entries(kostenPerCategorie)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, bedrag]) => (
                <PnLRow
                  key={cat}
                  label={kostCategorieLabels[cat as KostCategorie] || cat}
                  value={-bedrag}
                />
              ))
          )}
          <PnLSubtotal label="Totale opex" value={-totaalOpex} />

          {/* RESULTAAT */}
          <PnLSubtotal label="Resultaat voor belasting" value={resultaatVoorBelasting} accent />

          {/* BTW */}
          <SectionHeader title="Belasting (geschat)" />
          <PnLRow label="BTW op voertuigmarge" detail="BTW/marge regeling" value={-btwAutos} />
          <PnLRow label="BTW op diensten" detail="21% incl." value={-btwDiensten} />
          <PnLSubtotal label="Totaal BTW" value={-totaleBtw} />

          {/* NETTO */}
          <div className={cn(
            "px-5 py-4 flex items-center justify-between bg-secondary/40 border-t-2",
            nettoResultaat >= 0 ? "border-emerald-500/50" : "border-red-500/50"
          )}>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Netto resultaat</p>
              <p className="text-xs text-muted-foreground mt-0.5">Na alle kosten en belastingen</p>
            </div>
            <span className={cn(
              "text-2xl font-bold tabular-nums",
              nettoResultaat >= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {formatEuro(nettoResultaat)}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Detail: verkochte voertuigen ─── */}
      {verkochteAutos.length > 0 && (
        <div className="bg-card border border-border rounded-[16px] overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Verkochte voertuigen</h3>
            <span className="text-xs text-muted-foreground">{verkochteAutos.length} verkopen</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-muted-foreground text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Datum</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Voertuig</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Verkoop</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Kostprijs</th>
                  <th className="text-right px-3 py-2.5 font-semibold">BTW</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Netto</th>
                </tr>
              </thead>
              <tbody>
                {verkochteAutos.map((v: any) => {
                  const cons = isConsignatie(v);
                  return (
                    <tr key={v.id} className="border-t border-border/40 hover:bg-accent/20">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(v.verkoopDatum).toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-[13px] font-medium text-foreground">{v.merk} {v.model}</div>
                        <div className="text-[11px] text-muted-foreground uppercase font-mono">{v.kenteken || "—"} {cons && "· consignatie"}</div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatEuro(Number(v.verkoopprijs || 0))}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{cons ? "—" : formatEuro(calcKostprijs(v))}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-amber-400/80">{formatEuro(calcBtwMarge(v))}</td>
                      <td className={cn("px-4 py-3 text-right tabular-nums font-semibold", calcNettoMarge(v) >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {formatEuro(calcNettoMarge(v))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Info ─── */}
      <div className="bg-card/50 border border-border/50 rounded-[12px] p-4 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Bronnen:</strong> verkopen komen uit voertuigregistratie, diensten uit boekingen, kosten uit
          de kostenregistratie. BTW is een schatting op basis van marge- en BTW-regeling. Voor exacte boekhoudkundige
          cijfers raadpleeg je Moneybird (zie tab "Beheer").
        </div>
      </div>
    </div>
  );
};

/* ─── Subcomponents ─── */
const KpiCard = ({
  icon: Icon, label, value, sub, accent, highlight,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  accent?: "positive" | "negative" | "neutral-negative";
  highlight?: boolean;
}) => (
  <div className={cn(
    "bg-card border rounded-[16px] p-4",
    highlight ? "border-primary/40 shadow-[0_0_0_1px] shadow-primary/10" : "border-border"
  )}>
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
      <Icon className="w-3.5 h-3.5" />
      <span className="truncate">{label}</span>
    </div>
    <div className={cn(
      "text-2xl font-bold tabular-nums",
      accent === "positive" && "text-emerald-400",
      accent === "negative" && "text-red-400",
      accent === "neutral-negative" && "text-amber-400/90",
      !accent && "text-foreground"
    )}>
      {value}
    </div>
    {sub && <p className="text-[11px] text-muted-foreground mt-1 truncate">{sub}</p>}
  </div>
);

const SectionHeader = ({ title }: { title: string }) => (
  <div className="px-5 py-2 bg-secondary/30 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
    {title}
  </div>
);

const PnLRow = ({ label, detail, value }: { label: string; detail?: string; value: number }) => (
  <div className="px-5 py-2.5 flex items-center justify-between">
    <div>
      <p className="text-sm text-foreground">{label}</p>
      {detail && <p className="text-[11px] text-muted-foreground">{detail}</p>}
    </div>
    <span className={cn(
      "text-sm tabular-nums",
      value < 0 ? "text-red-400/90" : "text-foreground"
    )}>
      {value < 0 ? "−" : ""}{formatEuro(Math.abs(value))}
    </span>
  </div>
);

const PnLSubtotal = ({ label, value, accent }: { label: string; value: number; accent?: boolean }) => (
  <div className={cn(
    "px-5 py-3 flex items-center justify-between",
    accent ? "bg-secondary/40" : "bg-secondary/20"
  )}>
    <p className={cn("text-sm font-semibold uppercase tracking-wider text-[12px]", accent ? "text-foreground" : "text-muted-foreground")}>
      {label}
    </p>
    <span className={cn(
      "tabular-nums font-bold",
      accent ? "text-lg" : "text-sm",
      value < 0 ? "text-red-400" : (accent && value > 0) ? "text-emerald-400" : "text-foreground"
    )}>
      {value < 0 ? "−" : ""}{formatEuro(Math.abs(value))}
    </span>
  </div>
);

export default WinstVerliesTab;

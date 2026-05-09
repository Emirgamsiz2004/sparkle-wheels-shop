import { useMemo, useState } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import {
  calcWinst,
  calcNettoMarge,
  calcKostprijs,
  isConsignatie,
  formatEuro,
} from "@/types/vehicle";
import { Car, TrendingUp, Wallet, Receipt, ChevronLeft, ChevronRight } from "lucide-react";

const maandNamen = [
  "Januari", "Februari", "Maart", "April", "Mei", "Juni",
  "Juli", "Augustus", "September", "Oktober", "November", "December",
];

const MaandOverzichtTab = () => {
  const { vehicles, loading } = useVehicles();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const { from, to } = useMemo(
    () => ({
      from: new Date(year, month, 1),
      to: new Date(year, month + 1, 0, 23, 59, 59),
    }),
    [year, month],
  );

  const verkochtInMaand = useMemo(() => {
    return vehicles
      .filter((v: any) => v.status === "verkocht" && v.verkoopDatum)
      .filter((v: any) => {
        const d = new Date(v.verkoopDatum);
        return d >= from && d <= to;
      })
      .sort(
        (a: any, b: any) =>
          new Date(b.verkoopDatum).getTime() - new Date(a.verkoopDatum).getTime(),
      );
  }, [vehicles, from, to]);

  const stats = useMemo(() => {
    let omzet = 0;
    let kostprijs = 0;
    let brutoWinst = 0;
    let nettoWinst = 0;
    verkochtInMaand.forEach((v: any) => {
      omzet += Number(v.verkoopprijs || 0);
      kostprijs += calcKostprijs(v);
      brutoWinst += calcWinst(v);
      nettoWinst += calcNettoMarge(v);
    });
    return {
      aantal: verkochtInMaand.length,
      omzet,
      kostprijs,
      brutoWinst,
      nettoWinst,
      gemWinst: verkochtInMaand.length > 0 ? nettoWinst / verkochtInMaand.length : 0,
    };
  }, [verkochtInMaand]);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else setMonth(month + 1);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laden…</p>;

  return (
    <div className="space-y-5">
      {/* Maand selector */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-[12px] p-1 w-fit">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Vorige maand"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="bg-transparent text-sm font-medium text-foreground px-2 py-1 outline-none cursor-pointer"
        >
          {maandNamen.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-transparent text-sm font-medium text-foreground px-2 py-1 outline-none cursor-pointer"
        >
          {Array.from({ length: 6 }).map((_, i) => {
            const y = now.getFullYear() - i;
            return <option key={y} value={y}>{y}</option>;
          })}
        </select>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Volgende maand"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={Car}
          label="Verkocht"
          value={String(stats.aantal)}
          sub={stats.aantal === 1 ? "voertuig" : "voertuigen"}
        />
        <KpiCard
          icon={Receipt}
          label="Totale omzet"
          value={formatEuro(stats.omzet)}
        />
        <KpiCard
          icon={Wallet}
          label="Bruto winst"
          value={formatEuro(stats.brutoWinst)}
          accent={stats.brutoWinst >= 0 ? "positive" : "negative"}
          sub="verkoopprijs − kostprijs"
        />
        <KpiCard
          icon={TrendingUp}
          label="Netto winst (na BTW)"
          value={formatEuro(stats.nettoWinst)}
          accent={stats.nettoWinst >= 0 ? "positive" : "negative"}
          sub={
            stats.aantal > 0
              ? `gem. ${formatEuro(stats.gemWinst)} / auto`
              : undefined
          }
        />
      </div>

      {/* Lijst verkochte voertuigen */}
      <div className="bg-card border border-border rounded-[16px] overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Verkochte voertuigen — {maandNamen[month]} {year}
          </h3>
          <span className="text-xs text-muted-foreground">
            {stats.aantal} {stats.aantal === 1 ? "verkoop" : "verkopen"}
          </span>
        </div>
        {verkochtInMaand.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Geen verkopen in deze maand.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Datum</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Voertuig</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Type</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Inkoop</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Kostprijs</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Verkoop</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Netto winst</th>
                </tr>
              </thead>
              <tbody>
                {verkochtInMaand.map((v: any) => {
                  const consignatie = isConsignatie(v);
                  const kostprijs = calcKostprijs(v);
                  const netto = calcNettoMarge(v);
                  return (
                    <tr key={v.id} className="border-t border-border/40 hover:bg-accent/30">
                      <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                        {new Date(v.verkoopDatum).toLocaleDateString("nl-NL", {
                          day: "2-digit", month: "short",
                        })}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-[14px] font-semibold text-foreground leading-tight">
                          {v.merk} {v.model}
                        </div>
                        <div className="text-[11px] text-muted-foreground uppercase font-mono leading-tight mt-0.5">
                          {v.kenteken || "—"}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          consignatie
                            ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                            : "bg-violet-500/10 text-violet-300 border-violet-500/25"
                        }`}>
                          {consignatie ? "Consignatie" : "Eigen"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-[13px] text-foreground/90">
                        {consignatie ? (
                          <span className="text-muted-foreground italic text-[12px]">n.v.t.</span>
                        ) : (
                          formatEuro(Number(v.inkoopprijs || 0))
                        )}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-[13px] text-foreground/90">
                        {consignatie ? (
                          <span className="text-muted-foreground italic text-[12px]">n.v.t.</span>
                        ) : (
                          formatEuro(kostprijs)
                        )}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-[13px] text-foreground">
                        {formatEuro(Number(v.verkoopprijs || 0))}
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums font-semibold text-[14px] ${
                        netto >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {formatEuro(netto)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-secondary/40 border-t border-border">
                  <td colSpan={3} className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Totaal
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-[13px] text-foreground/80">
                    {formatEuro(
                      verkochtInMaand
                        .filter((v: any) => !isConsignatie(v))
                        .reduce((s: number, v: any) => s + Number(v.inkoopprijs || 0), 0),
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-[13px] text-foreground/80">
                    {formatEuro(stats.kostprijs)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-[14px] font-semibold text-foreground">
                    {formatEuro(stats.omzet)}
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums font-bold text-[15px] ${
                    stats.nettoWinst >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {formatEuro(stats.nettoWinst)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const KpiCard = ({
  icon: Icon, label, value, sub, accent,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  accent?: "positive" | "negative";
}) => (
  <div className="bg-card border border-border rounded-[16px] p-4">
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
      <Icon className="w-3.5 h-3.5" />
      <span className="truncate">{label}</span>
    </div>
    <div className={`text-2xl font-bold tabular-nums ${
      accent === "positive" ? "text-emerald-500"
      : accent === "negative" ? "text-red-400"
      : "text-foreground"
    }`}>
      {value}
    </div>
    {sub && <p className="text-[11px] text-muted-foreground mt-1 truncate">{sub}</p>}
  </div>
);

export default MaandOverzichtTab;

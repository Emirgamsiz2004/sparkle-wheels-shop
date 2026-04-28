import { useMemo, useState } from "react";
import { useKosten, kostBedragInPeriode, formatEuro, kostCategorieLabels } from "@/hooks/useKosten";
import { useVehicles } from "@/hooks/useVehicles";
import { useInkoopverklaringen } from "@/hooks/useInkoopverklaringen";
import { ChevronDown, TrendingUp, TrendingDown, Wallet, ShoppingCart, Receipt } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, CartesianGrid, Legend,
  ComposedChart, Line, PieChart, Pie, Cell,
} from "recharts";

type PeriodType = "jaar" | "kwartaal" | "maand";
const maandNamen = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

const FinancienOverzichtTab = () => {
  const { kosten } = useKosten();
  const { vehicles } = useVehicles();
  const { verklaringen } = useInkoopverklaringen();

  const now = new Date();
  const [periodType, setPeriodType] = useState<PeriodType>("maand");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);

  const { from, to } = useMemo(() => {
    if (periodType === "jaar") {
      return { from: new Date(year, 0, 1), to: new Date(year, 11, 31, 23, 59, 59) };
    }
    if (periodType === "kwartaal") {
      const startM = (quarter - 1) * 3;
      return { from: new Date(year, startM, 1), to: new Date(year, startM + 3, 0, 23, 59, 59) };
    }
    return { from: new Date(year, month, 1), to: new Date(year, month + 1, 0, 23, 59, 59) };
  }, [periodType, year, month, quarter]);

  // Omzet uit verkochte vehicles in periode
  const omzet = useMemo(() => {
    return vehicles
      .filter((v: any) => v.status === "verkocht" && v.verkoopDatum)
      .filter((v: any) => {
        const d = new Date(v.verkoopDatum);
        return d >= from && d <= to;
      })
      .reduce((sum: number, v: any) => sum + Number(v.verkoopprijs || 0), 0);
  }, [vehicles, from, to]);

  // Inkoopkosten uit inkoopverklaringen in periode
  const inkoopkosten = useMemo(() => {
    return verklaringen
      .filter((iv) => {
        const d = new Date(iv.datum);
        return d >= from && d <= to;
      })
      .reduce((sum, iv) => sum + Number(iv.inkoopprijs || 0), 0);
  }, [verklaringen, from, to]);

  // Vaste & variabele kosten in periode
  const overigeKosten = useMemo(() => {
    return kosten.reduce((sum, k) => sum + kostBedragInPeriode(k, from, to), 0);
  }, [kosten, from, to]);

  const nettoWinst = omzet - inkoopkosten - overigeKosten;

  // 12 maanden omzet/kosten/winst
  const last12 = useMemo(() => {
    const arr: { label: string; omzet: number; kosten: number; winst: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthFrom = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthTo = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const o = vehicles
        .filter((v: any) => v.status === "verkocht" && v.verkoopDatum)
        .filter((v: any) => {
          const dd = new Date(v.verkoopDatum);
          return dd >= monthFrom && dd <= monthTo;
        })
        .reduce((s: number, v: any) => s + Number(v.verkoopprijs || 0), 0);
      const ik = verklaringen
        .filter((iv) => {
          const dd = new Date(iv.datum);
          return dd >= monthFrom && dd <= monthTo;
        })
        .reduce((s, iv) => s + Number(iv.inkoopprijs || 0), 0);
      const ok = kosten.reduce((s, k) => s + kostBedragInPeriode(k, monthFrom, monthTo), 0);
      const totK = ik + ok;
      arr.push({
        label: `${maandNamen[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`,
        omzet: Math.round(o),
        kosten: Math.round(totK),
        winst: Math.round(o - totK),
      });
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles, verklaringen, kosten]);

  // Kosten breakdown per categorie
  const breakdown = useMemo(() => {
    const map = new Map<string, number>();
    map.set("Inkoop voertuigen", inkoopkosten);
    kosten.forEach((k) => {
      const amt = kostBedragInPeriode(k, from, to);
      if (amt <= 0) return;
      const label = kostCategorieLabels[k.categorie] || "Overig";
      map.set(label, (map.get(label) || 0) + amt);
    });
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    return Array.from(map.entries())
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({
        name,
        value: Math.round(value),
        pct: total > 0 ? (value / total) * 100 : 0,
      }));
  }, [kosten, inkoopkosten, from, to]);

  // Recente transacties
  const recent = useMemo(() => {
    const items: { datum: string; omschrijving: string; categorie: string; bedrag: number; type: "in" | "uit" }[] = [];
    vehicles
      .filter((v: any) => v.status === "verkocht" && v.verkoopDatum)
      .forEach((v: any) =>
        items.push({
          datum: v.verkoopDatum,
          omschrijving: `Verkoop ${v.merk} ${v.model}`,
          categorie: "Omzet",
          bedrag: Number(v.verkoopprijs || 0),
          type: "in",
        })
      );
    verklaringen.forEach((iv) =>
      items.push({
        datum: iv.datum,
        omschrijving: `Inkoop ${iv.merk} ${iv.model}`,
        categorie: "Inkoop",
        bedrag: Number(iv.inkoopprijs || 0),
        type: "uit",
      })
    );
    kosten
      .filter((k) => k.frequentie === "eenmalig")
      .forEach((k) =>
        items.push({
          datum: k.datum,
          omschrijving: k.naam,
          categorie: kostCategorieLabels[k.categorie],
          bedrag: Number(k.bedrag || 0),
          type: "uit",
        })
      );
    return items.sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime()).slice(0, 10);
  }, [vehicles, verklaringen, kosten]);

  const colors = ["#e5e7eb", "#9ca3af", "#6b7280", "#4b5563", "#374151", "#1f2937"];

  return (
    <div className="space-y-6">
      {/* Periode selector */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-0.5 bg-card border border-border rounded-lg p-0.5">
          {(["maand", "kwartaal", "jaar"] as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodType(p)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                periodType === p
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-2.5 py-1.5 text-sm bg-card border border-border rounded-md text-foreground"
        >
          {Array.from({ length: 5 }).map((_, i) => {
            const y = now.getFullYear() - i;
            return <option key={y} value={y}>{y}</option>;
          })}
        </select>
        {periodType === "maand" && (
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-2.5 py-1.5 text-sm bg-card border border-border rounded-md text-foreground"
          >
            {maandNamen.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        )}
        {periodType === "kwartaal" && (
          <div className="flex gap-0.5 bg-card border border-border rounded-lg p-0.5">
            {[1, 2, 3, 4].map((q) => (
              <button
                key={q}
                onClick={() => setQuarter(q)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                  quarter === q ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Q{q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={TrendingUp} label="Omzet" value={formatEuro(omzet)} />
        <KpiCard icon={ShoppingCart} label="Inkoopkosten" value={formatEuro(inkoopkosten)} />
        <KpiCard icon={Receipt} label="Vaste & variabele kosten" value={formatEuro(overigeKosten)} />
        <KpiCard
          icon={nettoWinst >= 0 ? TrendingUp : TrendingDown}
          label="Netto winst"
          value={formatEuro(nettoWinst)}
          accent={nettoWinst >= 0 ? "positive" : "negative"}
        />
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-[16px] p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Omzet vs Kosten — laatste 12 maanden</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={last12}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
              <ReTooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                formatter={(v: any) => formatEuro(Number(v))}
              />
              <Legend />
              <Bar dataKey="omzet" name="Omzet" fill="#e5e7eb" radius={[3, 3, 0, 0]} />
              <Bar dataKey="kosten" name="Kosten" fill="#4b5563" radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="winst" name="Netto winst" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-card border border-border rounded-[16px] p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Kosten uitsplitsing</h3>
        {breakdown.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nog geen kosten in deze periode.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={breakdown} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    {breakdown.map((_, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} stroke="hsl(var(--background))" strokeWidth={2} />
                    ))}
                  </Pie>
                  <ReTooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    formatter={(v: any) => formatEuro(Number(v))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {breakdown.map((b, i) => (
                <div key={b.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ background: colors[i % colors.length] }} />
                    <span className="text-foreground">{b.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground tabular-nums">{b.pct.toFixed(1)}%</span>
                    <span className="text-foreground font-medium tabular-nums">{formatEuro(b.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recente transacties */}
      <div className="bg-card border border-border rounded-[16px] p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Recente transacties</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nog geen transacties.</p>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-muted-foreground tabular-nums w-20 shrink-0">
                    {new Date(t.datum).toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })}
                  </span>
                  <span className="text-foreground truncate">{t.omschrijving}</span>
                  <span className="px-2 py-0.5 rounded-md bg-secondary text-xs text-muted-foreground shrink-0">{t.categorie}</span>
                </div>
                <span className={`tabular-nums font-medium ${t.type === "in" ? "text-emerald-500" : "text-red-400"}`}>
                  {t.type === "in" ? "+" : "−"} {formatEuro(t.bedrag)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const KpiCard = ({
  icon: Icon, label, value, accent,
}: { icon: any; label: string; value: string; accent?: "positive" | "negative" }) => (
  <div className="bg-card border border-border rounded-[16px] p-4">
    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
    <div
      className={`text-xl font-bold tabular-nums ${
        accent === "positive" ? "text-emerald-500" : accent === "negative" ? "text-red-400" : "text-foreground"
      }`}
    >
      {value}
    </div>
  </div>
);

export default FinancienOverzichtTab;

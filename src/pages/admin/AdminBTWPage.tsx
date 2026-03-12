import { useState } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { formatEuroDecimal, calcBtwMarge } from "@/types/vehicle";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Loader2 } from "lucide-react";

const quarters = [
  { q: 1, label: "Q1 — Jan t/m Mrt", deadline: "30 april", months: [0, 1, 2] },
  { q: 2, label: "Q2 — Apr t/m Jun", deadline: "31 juli", months: [3, 4, 5] },
  { q: 3, label: "Q3 — Jul t/m Sep", deadline: "31 oktober", months: [6, 7, 8] },
  { q: 4, label: "Q4 — Okt t/m Dec", deadline: "31 januari volgend jaar", months: [9, 10, 11] },
];

const AdminBTWPage = () => {
  const { vehicles, loading } = useVehicles();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const verkocht = vehicles.filter((v) => {
    if (v.status !== "verkocht" || !v.verkoopDatum) return false;
    return new Date(v.verkoopDatum).getFullYear() === year;
  });

  const getQuarterData = (months: number[]) => {
    const qVehicles = verkocht.filter((v) => months.includes(new Date(v.verkoopDatum!).getMonth()));
    const btwOntvangen = qVehicles.reduce((s, v) => s + calcBtwMarge(v), 0);
    const btwBetaald = qVehicles.reduce((s, v) => {
      return s + v.kosten.reduce((cs, k) => {
        if (k.date) {
          const m = new Date(k.date).getMonth();
          if (months.includes(m) && new Date(k.date).getFullYear() === year) return cs + k.amount * ((k.btwPercentage || 21) / 100);
        }
        return cs;
      }, 0);
    }, 0);
    return { btwOntvangen, btwBetaald, teBetalen: btwOntvangen - btwBetaald, count: qVehicles.length };
  };

  const yearTotal = quarters.reduce((acc, q) => {
    const d = getQuarterData(q.months);
    return { ontvangen: acc.ontvangen + d.btwOntvangen, betaald: acc.betaald + d.btwBetaald, teBetalen: acc.teBetalen + d.teBetalen };
  }, { ontvangen: 0, betaald: 0, teBetalen: 0 });

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">BTW Overzicht</h1>
          <p className="text-sm text-muted-foreground mt-1">Kwartaaloverzicht margeregeling</p>
        </div>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-3 py-2 text-sm bg-card border border-border text-foreground">
          <option value={currentYear}>{currentYear}</option>
          <option value={currentYear - 1}>{currentYear - 1}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quarters.map((q) => {
          const data = getQuarterData(q.months);
          return (
            <Card key={q.q}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">{q.label}</h3>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Deadline: {q.deadline}</span>
                </div>
                <div className="space-y-2">
                  <Row label="BTW Ontvangen (marge)" value={formatEuroDecimal(data.btwOntvangen)} />
                  <Row label="BTW Betaald (kosten)" value={formatEuroDecimal(data.btwBetaald)} />
                  <div className="border-t border-border pt-2">
                    <Row label={data.teBetalen >= 0 ? "Te Betalen" : "Te Ontvangen"} value={formatEuroDecimal(Math.abs(data.teBetalen))} bold color={data.teBetalen < 0} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{data.count} voertuig{data.count !== 1 ? "en" : ""} verkocht</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Year total */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Jaaroverzicht {year}</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">BTW Ontvangen</p>
              <p className="text-lg font-bold text-foreground">{formatEuroDecimal(yearTotal.ontvangen)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">BTW Betaald</p>
              <p className="text-lg font-bold text-foreground">{formatEuroDecimal(yearTotal.betaald)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{yearTotal.teBetalen >= 0 ? "Te Betalen" : "Te Ontvangen"}</p>
              <p className={`text-lg font-bold ${yearTotal.teBetalen >= 0 ? "text-red-500" : "text-emerald-500"}`}>
                {formatEuroDecimal(Math.abs(yearTotal.teBetalen))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 px-4 py-3 bg-secondary rounded-sm border border-border">
        <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Aangifte doen via <strong className="text-foreground">Mijn Belastingdienst Zakelijk</strong> op{" "}
          <a href="https://mbd.belastingdienst.nl" target="_blank" rel="noopener noreferrer" className="underline text-foreground">mbd.belastingdienst.nl</a>
        </p>
      </div>
    </div>
  );
};

const Row = ({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className={`text-sm ${bold ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</span>
    <span className={`text-sm ${bold ? "font-bold" : ""} ${color ? "text-emerald-500" : bold ? "text-foreground" : "text-foreground"}`}>{value}</span>
  </div>
);

export default AdminBTWPage;

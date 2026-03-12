import { Vehicle, formatEuroDecimal, calcKostprijs, calcTotalKosten, calcWinst, calcBtwMarge, calcNettoMarge, calcMarge, costCategories } from "@/types/vehicle";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

interface Props {
  vehicle: Vehicle;
}

const VehicleFinancieelTab = ({ vehicle }: Props) => {
  const totalKosten = calcTotalKosten(vehicle);
  const kostprijs = calcKostprijs(vehicle);
  const brutoWinst = calcWinst(vehicle);
  const btwMarge = calcBtwMarge(vehicle);
  const nettoMarge = calcNettoMarge(vehicle);
  const margePerc = calcMarge(vehicle);

  const categoryBreakdown: Record<string, number> = {};
  vehicle.kosten.forEach((k) => {
    const cat = costCategories[k.category] || k.category;
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + k.amount;
  });

  return (
    <div className="space-y-6 max-w-xl">
      <Card>
        <CardContent className="p-6 space-y-4">
          <Row label="Inkoopprijs" value={formatEuroDecimal(vehicle.inkoopprijs)} />
          {Object.entries(categoryBreakdown).map(([cat, amount]) => (
            <Row key={cat} label={`  └ ${cat}`} value={formatEuroDecimal(amount)} muted />
          ))}
          <Row label="Overige Kosten" value={formatEuroDecimal(totalKosten)} />
          <div className="border-t border-border pt-3">
            <Row label="Totale Kostprijs" value={formatEuroDecimal(kostprijs)} bold />
          </div>
          <Row label="Verkoopprijs" value={vehicle.verkoopprijs > 0 ? formatEuroDecimal(vehicle.verkoopprijs) : "—"} />
          <div className="border-t border-border pt-3">
            <Row label="Brutomarge" value={formatEuroDecimal(brutoWinst)} bold color={brutoWinst >= 0} />
          </div>
          <Row label="BTW Marge (21/121)" value={formatEuroDecimal(btwMarge)} muted />
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-foreground">Nettomarge</span>
              <span className={`text-2xl font-bold ${nettoMarge >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {formatEuroDecimal(nettoMarge)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">Marge Percentage</span>
              <span className={`text-sm font-medium ${nettoMarge >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {margePerc.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 px-4 py-3 bg-secondary rounded-sm border border-border">
        <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">BTW Margeregeling:</strong> als je inkoopt van particulieren, betaal je BTW alleen over de winst (marge × 21/121).
        </p>
      </div>
    </div>
  );
};

const Row = ({ label, value, bold, muted, color }: {
  label: string; value: string; bold?: boolean; muted?: boolean; color?: boolean;
}) => (
  <div className="flex items-center justify-between">
    <span className={`text-sm ${bold ? "font-semibold text-foreground" : muted ? "text-muted-foreground" : "text-muted-foreground"}`}>{label}</span>
    <span className={`text-sm ${bold ? "font-bold text-foreground" : muted ? "text-muted-foreground" : "text-foreground"} ${color !== undefined ? (color ? "text-emerald-500" : "text-red-500") : ""}`}>
      {value}
    </span>
  </div>
);

export default VehicleFinancieelTab;

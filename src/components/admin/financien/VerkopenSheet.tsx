import { Download } from "lucide-react";
import { formatEuroDecimal } from "@/types/vehicle";
import { cn } from "@/lib/utils";

export interface SoldVehicleRow {
  id: string;
  merk: string;
  model: string;
  kenteken: string;
  verkoop_datum: string;
  inkoopprijs: number;
  verkoopprijs: number;
  kostenTotaal: number;
  bouwjaar?: number | null;
  kilometerstand?: number | null;
  brandstof?: string | null;
  verkoop_type?: string | null;
  btw_marge_type?: string | null;
  koper_naam?: string | null;
  inruil_waarde?: number | null;
}

interface Props {
  vehicles: SoldVehicleRow[];
  monthLabel: string;
}

const formatDate = (d?: string) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}-${m}-${y}`;
};

const escapeCsv = (val: string | number) => {
  const s = String(val ?? "");
  if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const VerkopenSheet = ({ vehicles, monthLabel }: Props) => {
  const totals = vehicles.reduce(
    (acc, v) => {
      const totaalKost = v.inkoopprijs + v.kostenTotaal;
      const marge = v.verkoopprijs - totaalKost;
      acc.inkoop += v.inkoopprijs;
      acc.kosten += v.kostenTotaal;
      acc.verkoop += v.verkoopprijs;
      acc.marge += marge;
      acc.inruil += Number(v.inruil_waarde) || 0;
      return acc;
    },
    { inkoop: 0, kosten: 0, verkoop: 0, marge: 0, inruil: 0 }
  );

  const avgMarge = vehicles.length > 0 ? totals.marge / vehicles.length : 0;

  const downloadCsv = () => {
    const headers = [
      "Datum", "Kenteken", "Merk", "Model", "Bouwjaar", "KM",
      "Brandstof", "Type", "BTW/Marge", "Koper",
      "Inkoop", "Kosten", "Inruil", "Verkoop", "Marge",
    ];
    const rows = vehicles.map(v => {
      const marge = v.verkoopprijs - v.inkoopprijs - v.kostenTotaal;
      return [
        formatDate(v.verkoop_datum),
        v.kenteken,
        v.merk,
        v.model,
        v.bouwjaar ?? "",
        v.kilometerstand ?? "",
        v.brandstof ?? "",
        v.verkoop_type ?? "",
        v.btw_marge_type ?? "",
        v.koper_naam ?? "",
        v.inkoopprijs.toFixed(2).replace(".", ","),
        v.kostenTotaal.toFixed(2).replace(".", ","),
        (Number(v.inruil_waarde) || 0).toFixed(2).replace(".", ","),
        v.verkoopprijs.toFixed(2).replace(".", ","),
        marge.toFixed(2).replace(".", ","),
      ];
    });
    const totalsRow = [
      "TOTAAL", "", "", "", "", "", "", "", "", `${vehicles.length} auto's`,
      totals.inkoop.toFixed(2).replace(".", ","),
      totals.kosten.toFixed(2).replace(".", ","),
      totals.inruil.toFixed(2).replace(".", ","),
      totals.verkoop.toFixed(2).replace(".", ","),
      totals.marge.toFixed(2).replace(".", ","),
    ];
    const csv = [headers, ...rows, totalsRow]
      .map(r => r.map(escapeCsv).join(";"))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `verkopen-${monthLabel.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (vehicles.length === 0) {
    return (
      <div className="text-xs text-muted-foreground py-6 text-center border border-border rounded-[3px]">
        Geen voertuigen verkocht in {monthLabel}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          <span className="text-foreground font-semibold tabular-nums">{vehicles.length}</span> voertuig{vehicles.length === 1 ? "" : "en"} verkocht ·
          gemiddelde marge <span className={cn("font-medium tabular-nums", avgMarge >= 0 ? "text-emerald-500" : "text-red-500")}>{avgMarge >= 0 ? "+" : "−"}{formatEuroDecimal(Math.abs(avgMarge))}</span>
        </div>
        <button
          onClick={downloadCsv}
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 border border-border rounded-[3px] hover:bg-muted/40 transition-colors"
        >
          <Download className="h-3 w-3" />
          Excel/CSV
        </button>
      </div>

      <div className="overflow-x-auto border border-border rounded-[3px]">
        <table className="w-full text-xs tabular-nums">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr className="text-left">
              <th className="px-2.5 py-2 font-medium whitespace-nowrap">Datum</th>
              <th className="px-2.5 py-2 font-medium whitespace-nowrap">Kenteken</th>
              <th className="px-2.5 py-2 font-medium">Voertuig</th>
              <th className="px-2.5 py-2 font-medium text-right">Bj.</th>
              <th className="px-2.5 py-2 font-medium text-right">KM</th>
              <th className="px-2.5 py-2 font-medium">Type</th>
              <th className="px-2.5 py-2 font-medium text-right">Inkoop</th>
              <th className="px-2.5 py-2 font-medium text-right">+ Kosten</th>
              <th className="px-2.5 py-2 font-medium text-right">Inruil</th>
              <th className="px-2.5 py-2 font-medium text-right">Verkoop</th>
              <th className="px-2.5 py-2 font-medium text-right">Marge</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {vehicles.map(v => {
              const totaalKost = v.inkoopprijs + v.kostenTotaal;
              const marge = v.verkoopprijs - totaalKost;
              return (
                <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-2.5 py-2 whitespace-nowrap text-muted-foreground">{formatDate(v.verkoop_datum)}</td>
                  <td className="px-2.5 py-2 whitespace-nowrap font-mono uppercase text-foreground">{v.kenteken || "—"}</td>
                  <td className="px-2.5 py-2">
                    <div className="text-foreground font-medium">{v.merk} {v.model}</div>
                    {v.koper_naam && <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">{v.koper_naam}</div>}
                  </td>
                  <td className="px-2.5 py-2 text-right text-muted-foreground">{v.bouwjaar ?? "—"}</td>
                  <td className="px-2.5 py-2 text-right text-muted-foreground">{v.kilometerstand ? v.kilometerstand.toLocaleString("nl-NL") : "—"}</td>
                  <td className="px-2.5 py-2 text-muted-foreground capitalize whitespace-nowrap">
                    {(v.verkoop_type || "regulier").replace(/_/g, " ")}
                    {v.btw_marge_type && <span className="ml-1 text-[10px] uppercase">· {v.btw_marge_type}</span>}
                  </td>
                  <td className="px-2.5 py-2 text-right text-foreground">{formatEuroDecimal(v.inkoopprijs)}</td>
                  <td className="px-2.5 py-2 text-right text-muted-foreground">{formatEuroDecimal(v.kostenTotaal)}</td>
                  <td className="px-2.5 py-2 text-right text-muted-foreground">{v.inruil_waarde ? formatEuroDecimal(Number(v.inruil_waarde)) : "—"}</td>
                  <td className="px-2.5 py-2 text-right text-foreground font-medium">{formatEuroDecimal(v.verkoopprijs)}</td>
                  <td className={cn("px-2.5 py-2 text-right font-semibold", marge >= 0 ? "text-emerald-500" : "text-red-500")}>
                    {marge >= 0 ? "+" : "−"}{formatEuroDecimal(Math.abs(marge))}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-muted/60 font-semibold text-foreground border-t-2 border-border">
              <td className="px-2.5 py-2.5" colSpan={6}>TOTAAL · {vehicles.length} auto{vehicles.length === 1 ? "" : "'s"}</td>
              <td className="px-2.5 py-2.5 text-right">{formatEuroDecimal(totals.inkoop)}</td>
              <td className="px-2.5 py-2.5 text-right">{formatEuroDecimal(totals.kosten)}</td>
              <td className="px-2.5 py-2.5 text-right">{formatEuroDecimal(totals.inruil)}</td>
              <td className="px-2.5 py-2.5 text-right">{formatEuroDecimal(totals.verkoop)}</td>
              <td className={cn("px-2.5 py-2.5 text-right", totals.marge >= 0 ? "text-emerald-500" : "text-red-500")}>
                {totals.marge >= 0 ? "+" : "−"}{formatEuroDecimal(Math.abs(totals.marge))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default VerkopenSheet;

import { useState } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { formatEuroDecimal, calcKostprijs, calcTotalKosten, calcWinst, calcBtwMarge, calcNettoMarge, calcMarge } from "@/types/vehicle";
import { Loader2, Download } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import GoogleDriveIcon from "@/components/admin/GoogleDriveIcon";

const AdminFinancieelPage = () => {
  const { vehicles, loading } = useVehicles();
  const currentYear = new Date().getFullYear();
  const [yearFilter, setYearFilter] = useState<string>("alle");
  const isMobile = useIsMobile();

  const filtered = vehicles.filter((v) => {
    if (v.status !== "verkocht") return false;
    if (yearFilter === "alle") return true;
    const year = v.verkoopDatum ? new Date(v.verkoopDatum).getFullYear() : new Date(v.inkoopDatum).getFullYear();
    return year === Number(yearFilter);
  });

  const totals = filtered.reduce(
    (acc, v) => ({
      inkoop: acc.inkoop + v.inkoopprijs, kosten: acc.kosten + calcTotalKosten(v), kostprijs: acc.kostprijs + calcKostprijs(v),
      verkoop: acc.verkoop + v.verkoopprijs, bruto: acc.bruto + calcWinst(v), btw: acc.btw + calcBtwMarge(v), netto: acc.netto + calcNettoMarge(v),
    }),
    { inkoop: 0, kosten: 0, kostprijs: 0, verkoop: 0, bruto: 0, btw: 0, netto: 0 }
  );

  const exportExcel = () => {
    const headers = ["Voertuig", "Inkoopdatum", "Verkoopdatum", "Inkoopprijs", "Kosten", "Kostprijs", "Verkoopprijs", "Brutomarge", "BTW (marge)", "Nettomarge", "Marge %"];
    const rows = filtered.map((v) => [
      `${v.merk} ${v.model} (${v.bouwjaar})`, v.inkoopDatum, v.verkoopDatum || "", v.inkoopprijs, calcTotalKosten(v), calcKostprijs(v),
      v.verkoopprijs, calcWinst(v), calcBtwMarge(v).toFixed(2), calcNettoMarge(v).toFixed(2), calcMarge(v).toFixed(1) + "%",
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `financieel-overzicht-${yearFilter}.csv`; a.click();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium text-foreground">Financieel overzicht</h1>
          <p className="text-sm text-muted-foreground">Alle verkochte voertuigen</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="px-2.5 py-1.5 text-sm bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="alle">Alle jaren</option>
            <option value={String(currentYear)}>{currentYear}</option>
            <option value={String(currentYear - 1)}>{currentYear - 1}</option>
          </select>
          <button onClick={exportExcel} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      {isMobile && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground mb-1">Totale omzet</p>
            <p className="text-base font-semibold tabular-nums">{formatEuroDecimal(totals.verkoop)}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground mb-1">Netto winst</p>
            <p className={`text-base font-semibold tabular-nums ${totals.netto >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatEuroDecimal(totals.netto)}</p>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">Geen verkochte voertuigen in deze periode.</div>
        ) : isMobile ? (
          <div className="divide-y divide-border">
            {filtered.map((v) => {
              const netto = calcNettoMarge(v);
              return (
                <div key={v.id} className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{v.merk} {v.model} ({v.bouwjaar})</p>
                    <span className={`text-xs font-medium tabular-nums ${netto >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {formatEuroDecimal(netto)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><p className="text-[10px] text-muted-foreground">Inkoop</p><p className="text-xs tabular-nums">{formatEuroDecimal(v.inkoopprijs)}</p></div>
                    <div><p className="text-[10px] text-muted-foreground">Kosten</p><p className="text-xs tabular-nums">{formatEuroDecimal(calcTotalKosten(v))}</p></div>
                    <div><p className="text-[10px] text-muted-foreground">Verkoop</p><p className="text-xs tabular-nums">{formatEuroDecimal(v.verkoopprijs)}</p></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{v.verkoopDatum ? new Date(v.verkoopDatum).toLocaleDateString("nl-NL") : "—"}</span>
                    <span className={`font-medium ${calcMarge(v) >= 0 ? "text-emerald-500" : "text-red-500"}`}>{calcMarge(v).toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
            <div className="p-3 bg-accent/20">
              <p className="text-xs font-medium mb-1.5">Totaal</p>
              <div className="grid grid-cols-3 gap-2">
                <div><p className="text-[10px] text-muted-foreground">Inkoop</p><p className="text-xs font-medium tabular-nums">{formatEuroDecimal(totals.inkoop)}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Kosten</p><p className="text-xs font-medium tabular-nums">{formatEuroDecimal(totals.kosten)}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Verkoop</p><p className="text-xs font-medium tabular-nums">{formatEuroDecimal(totals.verkoop)}</p></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Voertuig", "Inkoopdatum", "Verkoopdatum", "Inkoopprijs", "Kosten", "Kostprijs", "Verkoopprijs", "Brutomarge", "BTW", "Nettomarge", "Marge %", "Drive"].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const netto = calcNettoMarge(v);
                  return (
                    <tr key={v.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                      <td className="px-3 py-2.5 font-medium whitespace-nowrap">{v.merk} {v.model} ({v.bouwjaar})</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{v.inkoopDatum ? new Date(v.inkoopDatum).toLocaleDateString("nl-NL") : "—"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{v.verkoopDatum ? new Date(v.verkoopDatum).toLocaleDateString("nl-NL") : "—"}</td>
                      <td className="px-3 py-2.5 tabular-nums">{formatEuroDecimal(v.inkoopprijs)}</td>
                      <td className="px-3 py-2.5 tabular-nums">{formatEuroDecimal(calcTotalKosten(v))}</td>
                      <td className="px-3 py-2.5 font-medium tabular-nums">{formatEuroDecimal(calcKostprijs(v))}</td>
                      <td className="px-3 py-2.5 tabular-nums">{formatEuroDecimal(v.verkoopprijs)}</td>
                      <td className={`px-3 py-2.5 font-medium tabular-nums ${calcWinst(v) >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatEuroDecimal(calcWinst(v))}</td>
                      <td className="px-3 py-2.5 text-muted-foreground tabular-nums">{formatEuroDecimal(calcBtwMarge(v))}</td>
                      <td className={`px-3 py-2.5 font-medium tabular-nums ${netto >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatEuroDecimal(netto)}</td>
                      <td className={`px-3 py-2.5 tabular-nums ${netto >= 0 ? "text-emerald-500" : "text-red-500"}`}>{calcMarge(v).toFixed(1)}%</td>
                      <td className="px-3 py-2.5"><GoogleDriveIcon linked={!!v.googleDriveFolderId} url={v.googleDriveFolderUrl} /></td>
                    </tr>
                  );
                })}
                <tr className="bg-accent/20 border-t border-border font-medium">
                  <td className="px-3 py-2.5" colSpan={3}>Totaal</td>
                  <td className="px-3 py-2.5 tabular-nums">{formatEuroDecimal(totals.inkoop)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{formatEuroDecimal(totals.kosten)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{formatEuroDecimal(totals.kostprijs)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{formatEuroDecimal(totals.verkoop)}</td>
                  <td className={`px-3 py-2.5 tabular-nums ${totals.bruto >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatEuroDecimal(totals.bruto)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground tabular-nums">{formatEuroDecimal(totals.btw)}</td>
                  <td className={`px-3 py-2.5 tabular-nums ${totals.netto >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatEuroDecimal(totals.netto)}</td>
                  <td className="px-3 py-2.5">—</td>
                  <td className="px-3 py-2.5">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFinancieelPage;

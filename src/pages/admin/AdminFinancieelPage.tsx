import { useState } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { formatEuroDecimal, calcKostprijs, calcTotalKosten, calcWinst, calcBtwMarge, calcNettoMarge, calcMarge } from "@/types/vehicle";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Download } from "lucide-react";
import GoogleDriveIcon from "@/components/admin/GoogleDriveIcon";

const AdminFinancieelPage = () => {
  const { vehicles, loading } = useVehicles();
  const currentYear = new Date().getFullYear();
  const [yearFilter, setYearFilter] = useState<string>("alle");

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

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financieel Overzicht</h1>
          <p className="text-sm text-muted-foreground mt-1">Overzicht van alle verkochte voertuigen</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="px-3 py-2 text-sm bg-card border border-border text-foreground">
            <option value="alle">Alle jaren</option>
            <option value={String(currentYear)}>{currentYear}</option>
            <option value={String(currentYear - 1)}>{currentYear - 1}</option>
          </select>
          <button onClick={exportExcel} className="inline-flex items-center gap-2 px-4 py-2 bg-card text-foreground text-sm font-medium border border-border hover:bg-secondary">
            <Download className="w-4 h-4" /> Exporteer CSV
          </button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-muted-foreground">Nog geen verkochte voertuigen in deze periode.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary border-b border-border">
                     {["Voertuig", "Inkoopdatum", "Verkoopdatum", "Inkoopprijs", "Kosten", "Kostprijs", "Verkoopprijs", "Brutomarge", "BTW", "Nettomarge", "Marge %", "Drive"].map((h) => (
                       <th key={h} className="text-left px-4 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-widest whitespace-nowrap">{h}</th>
                     ))}

                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v) => {
                    const netto = calcNettoMarge(v);
                    return (
                      <tr key={v.id} className="border-b border-border hover:bg-secondary/50">
                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{v.merk} {v.model} ({v.bouwjaar})</td>
                        <td className="px-4 py-3 text-muted-foreground">{v.inkoopDatum ? new Date(v.inkoopDatum).toLocaleDateString("nl-NL") : "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{v.verkoopDatum ? new Date(v.verkoopDatum).toLocaleDateString("nl-NL") : "—"}</td>
                        <td className="px-4 py-3 text-foreground">{formatEuroDecimal(v.inkoopprijs)}</td>
                        <td className="px-4 py-3 text-foreground">{formatEuroDecimal(calcTotalKosten(v))}</td>
                        <td className="px-4 py-3 text-foreground font-medium">{formatEuroDecimal(calcKostprijs(v))}</td>
                        <td className="px-4 py-3 text-foreground">{formatEuroDecimal(v.verkoopprijs)}</td>
                        <td className={`px-4 py-3 font-medium ${calcWinst(v) >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatEuroDecimal(calcWinst(v))}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatEuroDecimal(calcBtwMarge(v))}</td>
                        <td className={`px-4 py-3 font-medium ${netto >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatEuroDecimal(netto)}</td>
                        <td className={`px-4 py-3 ${netto >= 0 ? "text-emerald-500" : "text-red-500"}`}>{calcMarge(v).toFixed(1)}%</td>
                        <td className="px-4 py-3"><GoogleDriveIcon linked={!!v.googleDriveFolderId} url={v.googleDriveFolderUrl} /></td>
                      </tr>
                    );
                  })}
                  <tr className="bg-secondary border-t-2 border-border font-bold">
                    <td className="px-4 py-3 text-foreground" colSpan={3}>Totaal</td>
                    <td className="px-4 py-3 text-foreground">{formatEuroDecimal(totals.inkoop)}</td>
                    <td className="px-4 py-3 text-foreground">{formatEuroDecimal(totals.kosten)}</td>
                    <td className="px-4 py-3 text-foreground">{formatEuroDecimal(totals.kostprijs)}</td>
                    <td className="px-4 py-3 text-foreground">{formatEuroDecimal(totals.verkoop)}</td>
                    <td className={`px-4 py-3 ${totals.bruto >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatEuroDecimal(totals.bruto)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatEuroDecimal(totals.btw)}</td>
                    <td className={`px-4 py-3 ${totals.netto >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatEuroDecimal(totals.netto)}</td>
                     <td className="px-4 py-3">—</td>
                     <td className="px-4 py-3">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFinancieelPage;

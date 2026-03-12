import { useState } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { formatEuroDecimal, calcKostprijs, calcTotalKosten, calcWinst, calcBtwMarge, calcNettoMarge, calcMarge } from "@/types/vehicle";
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
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="px-3 py-2.5 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all">
            <option value="alle">Alle jaren</option>
            <option value={String(currentYear)}>{currentYear}</option>
            <option value={String(currentYear - 1)}>{currentYear - 1}</option>
          </select>
          <button onClick={exportExcel} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-card text-foreground text-xs font-medium border border-border rounded-lg hover:bg-accent/50 transition-colors">
            <Download className="w-3.5 h-3.5" /> Exporteer CSV
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">Nog geen verkochte voertuigen in deze periode.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/20">
                  {["Voertuig", "Inkoopdatum", "Verkoopdatum", "Inkoopprijs", "Kosten", "Kostprijs", "Verkoopprijs", "Brutomarge", "BTW", "Nettomarge", "Marge %", "Drive"].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-[10px] font-medium text-muted-foreground uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const netto = calcNettoMarge(v);
                  return (
                    <tr key={v.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-foreground whitespace-nowrap">{v.merk} {v.model} ({v.bouwjaar})</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{v.inkoopDatum ? new Date(v.inkoopDatum).toLocaleDateString("nl-NL") : "—"}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{v.verkoopDatum ? new Date(v.verkoopDatum).toLocaleDateString("nl-NL") : "—"}</td>
                      <td className="px-4 py-3.5 text-foreground">{formatEuroDecimal(v.inkoopprijs)}</td>
                      <td className="px-4 py-3.5 text-foreground">{formatEuroDecimal(calcTotalKosten(v))}</td>
                      <td className="px-4 py-3.5 text-foreground font-medium">{formatEuroDecimal(calcKostprijs(v))}</td>
                      <td className="px-4 py-3.5 text-foreground">{formatEuroDecimal(v.verkoopprijs)}</td>
                      <td className={`px-4 py-3.5 font-medium ${calcWinst(v) >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatEuroDecimal(calcWinst(v))}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{formatEuroDecimal(calcBtwMarge(v))}</td>
                      <td className={`px-4 py-3.5 font-medium ${netto >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatEuroDecimal(netto)}</td>
                      <td className={`px-4 py-3.5 ${netto >= 0 ? "text-emerald-400" : "text-red-400"}`}>{calcMarge(v).toFixed(1)}%</td>
                      <td className="px-4 py-3.5"><GoogleDriveIcon linked={!!v.googleDriveFolderId} url={v.googleDriveFolderUrl} /></td>
                    </tr>
                  );
                })}
                <tr className="bg-accent/30 border-t-2 border-border font-bold">
                  <td className="px-4 py-3.5 text-foreground" colSpan={3}>Totaal</td>
                  <td className="px-4 py-3.5 text-foreground">{formatEuroDecimal(totals.inkoop)}</td>
                  <td className="px-4 py-3.5 text-foreground">{formatEuroDecimal(totals.kosten)}</td>
                  <td className="px-4 py-3.5 text-foreground">{formatEuroDecimal(totals.kostprijs)}</td>
                  <td className="px-4 py-3.5 text-foreground">{formatEuroDecimal(totals.verkoop)}</td>
                  <td className={`px-4 py-3.5 ${totals.bruto >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatEuroDecimal(totals.bruto)}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{formatEuroDecimal(totals.btw)}</td>
                  <td className={`px-4 py-3.5 ${totals.netto >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatEuroDecimal(totals.netto)}</td>
                  <td className="px-4 py-3.5">—</td>
                  <td className="px-4 py-3.5">—</td>
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

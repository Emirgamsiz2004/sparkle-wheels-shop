import { useVehicles } from "@/hooks/useVehicles";
import { Car, TrendingUp, Wallet, CheckCircle, Plus, Receipt, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatEuro, calcKostprijs, calcWinst, statusLabels, statusColors } from "@/types/vehicle";

const AdminDashboardPage = () => {
  const { vehicles, loading } = useVehicles();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const actief = vehicles.filter((v) => v.status !== "verkocht");
  const verkocht = vehicles.filter((v) => v.status === "verkocht");
  const totaleOmzet = verkocht.reduce((s, v) => s + v.verkoopprijs, 0);
  const totaleKostprijs = verkocht.reduce((s, v) => s + calcKostprijs(v), 0);
  const totaleWinst = totaleOmzet - totaleKostprijs;
  const recent = vehicles.slice(0, 5);

  const kpis = [
    { label: "In voorraad", value: String(actief.length), icon: Car },
    { label: "Totale omzet", value: formatEuro(totaleOmzet), icon: TrendingUp },
    { label: "Totale kostprijs", value: formatEuro(totaleKostprijs), icon: Wallet },
    { label: "Totale winst", value: formatEuro(totaleWinst), icon: CheckCircle, profit: totaleWinst >= 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Overzicht van je bedrijf</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
              <kpi.icon className="w-4 h-4 text-muted-foreground/50" />
            </div>
            <p className={`text-xl font-semibold tabular-nums ${'profit' in kpi ? (kpi.profit ? "text-emerald-500" : "text-red-500") : "text-foreground"}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link to="/admin/voertuigen/nieuw" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors">
          <Plus className="w-3.5 h-3.5" /> Nieuwe auto
        </Link>
        <Link to="/admin/financieel" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors">
          <Wallet className="w-3.5 h-3.5" /> Kosten
        </Link>
        <Link to="/admin/btw" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors">
          <Receipt className="w-3.5 h-3.5" /> BTW
        </Link>
      </div>

      {/* Recent Vehicles */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-medium text-foreground">Recent toegevoegd</h2>
        </div>
        {recent.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            Nog geen voertuigen.{" "}
            <Link to="/admin/voertuigen/nieuw" className="text-foreground hover:underline">Voeg toe</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Voertuig</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Kenteken</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Marge</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((v) => {
                  const winst = calcWinst(v);
                  return (
                    <tr key={v.id} className="border-t border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-2.5">
                        <Link to={`/admin/voertuigen/${v.id}`} className="text-foreground hover:underline">
                          {v.merk} {v.model} <span className="text-muted-foreground">({v.bouwjaar})</span>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs font-mono uppercase hidden sm:table-cell">{v.kenteken || "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex whitespace-nowrap px-2 py-0.5 text-[11px] font-medium rounded border ${statusColors[v.status]}`}>
                          {statusLabels[v.status]}
                        </span>
                      </td>
                      <td className={`px-4 py-2.5 text-right text-sm tabular-nums ${winst >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {v.verkoopprijs > 0 ? formatEuro(winst) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;

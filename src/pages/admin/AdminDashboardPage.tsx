import { useVehicles } from "@/hooks/useVehicles";
import { Car, TrendingUp, Wallet, CheckCircle, Plus, Receipt, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatEuro, calcKostprijs, calcWinst, statusLabels, statusColors } from "@/types/vehicle";

const AdminDashboardPage = () => {
  const { vehicles, loading } = useVehicles();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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
    { label: "Auto's in Voorraad", value: String(actief.length), icon: Car, color: "text-foreground" },
    { label: "Totale Omzet", value: formatEuro(totaleOmzet), icon: TrendingUp, color: "text-emerald-400" },
    { label: "Totale Kostprijs", value: formatEuro(totaleKostprijs), icon: Wallet, color: "text-amber-400" },
    { label: "Totale Winst", value: formatEuro(totaleWinst), icon: CheckCircle, color: totaleWinst >= 0 ? "text-emerald-400" : "text-red-400" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overzicht van je bedrijf</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-card rounded-xl border border-border p-5 hover:border-primary/20 transition-colors duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{kpi.label}</span>
              <div className="w-9 h-9 rounded-lg bg-accent/50 flex items-center justify-center">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${kpi.color}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/admin/voertuigen/nieuw"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nieuwe Auto Toevoegen
        </Link>
        <Link
          to="/admin/financieel"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-card text-foreground text-sm font-medium border border-border rounded-lg hover:bg-accent/50 transition-colors"
        >
          <Wallet className="w-4 h-4" /> Kosten Overzicht
        </Link>
        <Link
          to="/admin/btw"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-card text-foreground text-sm font-medium border border-border rounded-lg hover:bg-accent/50 transition-colors"
        >
          <Receipt className="w-4 h-4" /> BTW Overzicht
        </Link>
      </div>

      {/* Recent Vehicles */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Recent Toegevoegd</h2>
        </div>
        {recent.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            Nog geen auto's toegevoegd.{" "}
            <Link to="/admin/voertuigen/nieuw" className="text-primary hover:underline">
              Voeg je eerste voertuig toe →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Voertuig</th>
                  <th className="text-left px-6 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Kenteken</th>
                  <th className="text-left px-6 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Status</th>
                  <th className="text-right px-6 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Marge</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((v) => {
                  const winst = calcWinst(v);
                  return (
                    <tr key={v.id} className="border-t border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="px-6 py-3 font-medium text-foreground">
                        <Link to={`/admin/voertuigen/${v.id}`} className="hover:text-primary transition-colors">
                          {v.merk} {v.model} <span className="text-muted-foreground">({v.bouwjaar})</span>
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground uppercase tracking-wider text-xs">{v.kenteken || "—"}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2.5 py-1 text-[11px] font-medium rounded-md border ${statusColors[v.status]}`}>
                          {statusLabels[v.status]}
                        </span>
                      </td>
                      <td className={`px-6 py-3 text-right font-medium ${winst >= 0 ? "text-emerald-400" : "text-red-400"}`}>
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

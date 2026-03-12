import { useVehicles } from "@/hooks/useVehicles";
import { Car, TrendingUp, Wallet, CheckCircle, Plus, Receipt, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatEuro, calcKostprijs, calcWinst, statusLabels, statusColors } from "@/types/vehicle";
import { Card, CardContent } from "@/components/ui/card";

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
    { label: "Totale Omzet", value: formatEuro(totaleOmzet), icon: TrendingUp, color: "text-emerald-500" },
    { label: "Totale Kostprijs", value: formatEuro(totaleKostprijs), icon: Wallet, color: "text-amber-500" },
    { label: "Totale Winst", value: formatEuro(totaleWinst), icon: CheckCircle, color: totaleWinst >= 0 ? "text-emerald-500" : "text-red-500" },
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
          <Card key={kpi.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{kpi.label}</span>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className={`text-2xl font-bold ${kpi.color}`}>
                {kpi.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/admin/voertuigen/nieuw"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nieuwe Auto Toevoegen
        </Link>
        <Link
          to="/admin/financieel"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-card text-foreground text-sm font-medium border border-border hover:bg-secondary transition-colors"
        >
          <Wallet className="w-4 h-4" /> Kosten Overzicht
        </Link>
        <Link
          to="/admin/btw"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-card text-foreground text-sm font-medium border border-border hover:bg-secondary transition-colors"
        >
          <Receipt className="w-4 h-4" /> BTW Overzicht
        </Link>
      </div>

      {/* Recent Vehicles */}
      <Card>
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Recent Toegevoegd</h2>
        </div>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              Nog geen auto's toegevoegd.{" "}
              <Link to="/admin/voertuigen/nieuw" className="text-foreground hover:underline">
                Voeg je eerste voertuig toe →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-border">
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
                      <tr key={v.id} className="border-t border-border hover:bg-secondary/50">
                        <td className="px-6 py-3 font-medium text-foreground">
                          <Link to={`/admin/voertuigen/${v.id}`} className="hover:text-muted-foreground transition-colors">
                            {v.merk} {v.model} <span className="text-muted-foreground">({v.bouwjaar})</span>
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground uppercase tracking-wider text-xs">{v.kenteken || "—"}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded border ${statusColors[v.status]}`}>
                            {statusLabels[v.status]}
                          </span>
                        </td>
                        <td className={`px-6 py-3 text-right font-medium ${winst >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {v.verkoopprijs > 0 ? formatEuro(winst) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardPage;

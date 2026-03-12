import { useState } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { Link } from "react-router-dom";
import { Plus, Search, Loader2, Eye } from "lucide-react";
import { formatEuro, calcWinst, calcMarge, statusLabels, statusColors } from "@/types/vehicle";
import GoogleDriveIcon from "@/components/admin/GoogleDriveIcon";

const tabs: { label: string; value: string }[] = [
  { label: "Alle", value: "alle" },
  { label: "Inkoop", value: "inkoop" },
  { label: "In behandeling", value: "in_behandeling" },
  { label: "Te koop", value: "te_koop" },
  { label: "Verkocht", value: "verkocht" },
];

const AdminVoertuigenPage = () => {
  const { vehicles, loading } = useVehicles();
  const [filter, setFilter] = useState("alle");
  const [search, setSearch] = useState("");

  const filtered = vehicles.filter((v) => {
    if (filter !== "alle" && v.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return v.merk.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) || v.kenteken?.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Voertuigen</h1>
          <p className="text-sm text-muted-foreground mt-1">{vehicles.length} voertuig{vehicles.length !== 1 ? "en" : ""}</p>
        </div>
        <Link to="/admin/voertuigen/nieuw" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Nieuw Voertuig
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                filter === t.value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Zoek op merk, model, kenteken..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-foreground placeholder:text-muted-foreground transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            {vehicles.length === 0 ? (
              <>Nog geen auto's toegevoegd. <Link to="/admin/voertuigen/nieuw" className="text-primary hover:underline">Voeg je eerste voertuig toe →</Link></>
            ) : "Geen voertuigen gevonden voor deze filters."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/20">
                  {["Voertuig", "Kenteken", "Inkoopprijs", "Verkoopprijs", "Marge", "Status", "Drive", ""].map((h, i) => (
                    <th key={h || i} className={`${i >= 2 && i <= 4 ? "text-right" : i >= 5 ? "text-center" : "text-left"} px-5 py-3.5 text-[10px] font-medium text-muted-foreground uppercase tracking-widest`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const winst = calcWinst(v);
                  const marge = calcMarge(v);
                  return (
                    <tr key={v.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link to={`/admin/voertuigen/${v.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                          {v.merk} {v.model} <span className="text-muted-foreground font-normal">({v.bouwjaar})</span>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground uppercase tracking-wider text-xs font-mono">{v.kenteken || "—"}</td>
                      <td className="px-5 py-3.5 text-right text-foreground">{formatEuro(v.inkoopprijs)}</td>
                      <td className="px-5 py-3.5 text-right text-foreground">{v.verkoopprijs > 0 ? formatEuro(v.verkoopprijs) : "—"}</td>
                      <td className={`px-5 py-3.5 text-right font-medium ${winst >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {v.verkoopprijs > 0 ? <>{formatEuro(winst)} <span className="text-xs font-normal opacity-70">({marge.toFixed(0)}%)</span></> : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex px-2.5 py-1 text-[11px] font-medium rounded-md border ${statusColors[v.status]}`}>{statusLabels[v.status]}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <GoogleDriveIcon linked={!!v.googleDriveFolderId} url={v.googleDriveFolderUrl} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Link to={`/admin/voertuigen/${v.id}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-primary/10">
                          <Eye className="w-3.5 h-3.5" /> Bekijk
                        </Link>
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

export default AdminVoertuigenPage;

import { useState, useMemo } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { Link } from "react-router-dom";
import { Plus, Search, Loader2, Eye, ChevronRight, RefreshCw, AlertTriangle } from "lucide-react";
import { formatEuro, calcWinst, calcMarge, isConsignatie, statusLabels, statusColors } from "@/types/vehicle";
import { useIsMobile } from "@/hooks/use-mobile";
import GoogleDriveIcon from "@/components/admin/GoogleDriveIcon";
import { getApkStatus } from "@/components/admin/detail/VehicleOverzichtTab";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const tabs = [
  { label: "Voorraad", value: "voorraad" },
  { label: "Te koop", value: "te_koop" },
  { label: "Consignatie", value: "consignatie" },
  { label: "In behandeling", value: "in_behandeling" },
  { label: "Inkoop", value: "inkoop" },
  { label: "Verkocht", value: "verkocht" },
];

const AdminVoertuigenPage = () => {
  const { vehicles, loading, refetch } = useVehicles();
  const [filter, setFilter] = useState("alle");
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const isMobile = useIsMobile();

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-voorraad");
      if (error) throw error;
      toast.success(`Sync klaar: ${data.created} nieuw, ${data.updated} bijgewerkt, ${data.skipped} ongewijzigd, ${data.removed || 0} verwijderd`);
      refetch();
    } catch (err: any) {
      console.error("Sync error:", err);
      toast.error("Sync mislukt");
    }
    setSyncing(false);
  };

  const filtered = vehicles.filter((v) => {
    if (filter !== "alle" && v.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return v.merk.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) || v.kenteken?.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-medium text-foreground">Voertuigen</h1>
          <p className="text-sm text-muted-foreground">{vehicles.length} voertuig{vehicles.length !== 1 ? "en" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
          <Link to="/admin/voertuigen/nieuw" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors">
            <Plus className="w-3.5 h-3.5" /> Nieuw
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                filter === t.value
                  ? "border-border bg-accent text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Zoek op merk, model, kenteken..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-xs pl-8 pr-3 py-1.5 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="bg-card rounded-lg border border-border px-4 py-12 text-center text-sm text-muted-foreground">
          {vehicles.length === 0 ? (
            <>Nog geen voertuigen. <Link to="/admin/voertuigen/nieuw" className="text-foreground hover:underline">Voeg toe</Link></>
          ) : "Geen voertuigen gevonden."}
        </div>
      ) : isMobile ? (
        <div className="space-y-1.5">
          {filtered.map((v) => {
            const winst = calcWinst(v);
            return (
              <Link
                key={v.id}
                to={`/admin/voertuigen/${v.id}`}
                className="flex items-center justify-between gap-3 bg-card border border-border rounded-lg p-3 active:bg-accent/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{v.merk} {v.model}</p>
                    <span className="text-xs text-muted-foreground">({v.bouwjaar})</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded border ${statusColors[v.status]}`}>
                      {statusLabels[v.status]}
                    </span>
                    {v.kenteken && <span className="text-[10px] font-mono text-muted-foreground uppercase">{v.kenteken}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-muted-foreground">
                      {isConsignatie(v) ? `${v.consignatieCommissiePerc || 10}% commissie` : formatEuro(v.inkoopprijs)}
                    </span>
                    {v.verkoopprijs > 0 && (
                      <span className={`text-xs font-medium tabular-nums ${winst >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {formatEuro(winst)}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Voertuig", "Kenteken", "Inkoopprijs", "Verkoopprijs", "Marge", "Status", "Drive", ""].map((h, i) => (
                    <th key={h || i} className={`${i >= 2 && i <= 4 ? "text-right" : i >= 5 ? "text-center" : "text-left"} px-4 py-2.5 text-xs font-medium text-muted-foreground`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const winst = calcWinst(v);
                  const marge = calcMarge(v);
                  return (
                    <tr key={v.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-2.5">
                        <Link to={`/admin/voertuigen/${v.id}`} className="text-foreground hover:underline">
                          {v.merk} {v.model} <span className="text-muted-foreground">({v.bouwjaar})</span>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs font-mono uppercase">{v.kenteken || "—"}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {isConsignatie(v) ? <span className="text-muted-foreground text-xs">{v.consignatieCommissiePerc || 10}%</span> : formatEuro(v.inkoopprijs)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{v.verkoopprijs > 0 ? formatEuro(v.verkoopprijs) : "—"}</td>
                      <td className={`px-4 py-2.5 text-right font-medium tabular-nums ${winst >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {v.verkoopprijs > 0 ? <>{formatEuro(winst)} <span className="text-xs font-normal opacity-60">({marge.toFixed(0)}%)</span></> : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded border ${statusColors[v.status]}`}>{statusLabels[v.status]}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <GoogleDriveIcon linked={!!v.googleDriveFolderId} url={v.googleDriveFolderUrl} />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <Link to={`/admin/voertuigen/${v.id}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVoertuigenPage;

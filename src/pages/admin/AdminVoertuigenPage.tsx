import { useState, useMemo, useEffect } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { Link } from "react-router-dom";
import { Plus, Search, Loader2, Eye, ChevronRight, RefreshCw, AlertTriangle, FileWarning } from "lucide-react";
import { formatEuro, calcWinst, calcMarge, isConsignatie, statusLabels, statusColors } from "@/types/vehicle";
import { useIsMobile } from "@/hooks/use-mobile";
import GoogleDriveIcon from "@/components/admin/GoogleDriveIcon";
import { getApkStatus } from "@/components/admin/detail/VehicleOverzichtTab";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SlidingTabs from "@/components/admin/SlidingTabs";

const BASE_TABS = [
  { label: "Voorraad", value: "voorraad" },
  { label: "Nieuw", value: "nieuw" },
  { label: "Te koop", value: "te_koop" },
  { label: "Consignatie", value: "consignatie" },
  { label: "In behandeling", value: "in_behandeling" },
  { label: "Inkoop", value: "inkoop" },
];

const AdminVoertuigenPage = () => {
  const { vehicles, loading, refetch } = useVehicles();
  const [filter, setFilter] = useState("voorraad");
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const isMobile = useIsMobile();
  const [consignatieWarningCount, setConsignatieWarningCount] = useState(0);

  // Check consignatie vehicles without overeenkomst
  const consignatieVehicles = useMemo(() => vehicles.filter(v => v.status === "consignatie"), [vehicles]);

  useEffect(() => {
    if (consignatieVehicles.length === 0) { setConsignatieWarningCount(0); return; }
    const checkDocs = async () => {
      const ids = consignatieVehicles.map(v => v.id);
      const { data } = await supabase
        .from("vehicle_documents")
        .select("vehicle_id")
        .in("vehicle_id", ids)
        .eq("type", "Consignatieovereenkomst");
      const idsWithDoc = new Set((data || []).map((d: any) => d.vehicle_id));
      setConsignatieWarningCount(consignatieVehicles.filter(v => !idsWithDoc.has(v.id)).length);
    };
    checkDocs();
  }, [consignatieVehicles]);

  // APK warning: vehicles expiring within 4 weeks or already expired (only non-sold)
  const apkWarningVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (v.status === "verkocht") return false;
      const status = getApkStatus(v.apkVervaldatum);
      if (status.level === 'red') return true;
      if (status.level === 'orange') {
        // Check if within 4 weeks
        if (!v.apkVervaldatum) return false;
        const today = new Date(); today.setHours(0,0,0,0);
        const apk = new Date(v.apkVervaldatum);
        const diffDays = Math.ceil((apk.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 28;
      }
      return false;
    });
  }, [vehicles]);

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

  const threeDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const nieuwCount = useMemo(() => vehicles.filter(v => {
    if (v.status === "verkocht") return false;
    return new Date(v.createdAt || "") >= threeDaysAgo;
  }).length, [vehicles, threeDaysAgo]);

  const tabs = useMemo(() => BASE_TABS.map(t =>
    t.value === "nieuw" && nieuwCount > 0
      ? { ...t, label: `Nieuw (${nieuwCount})` }
      : t
  ), [nieuwCount]);

  const filtered = vehicles.filter((v) => {
    if (v.status === "verkocht") return false;
    if (filter === "nieuw") {
      const createdAt = new Date(v.createdAt || "");
      if (createdAt < threeDaysAgo) return false;
    } else if (filter !== "voorraad" && v.status !== filter) {
      return false;
    }
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
      {/* APK Warning bar */}
      {apkWarningVehicles.length > 0 && (
        <button
          onClick={() => { setFilter("voorraad"); setSearch(""); }}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium bg-amber-500/10 border border-amber-500/25 rounded-md text-amber-400 hover:bg-amber-500/15 transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{apkWarningVehicles.length} voertuig{apkWarningVehicles.length !== 1 ? "en" : ""} met APK die binnenkort verloopt of al verlopen is</span>
        </button>
      )}

      {/* Consignatie warning bar */}
      {consignatieWarningCount > 0 && (
        <button
          onClick={() => { setFilter("consignatie"); setSearch(""); }}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium bg-amber-500/10 border border-amber-500/25 rounded-md text-amber-400 hover:bg-amber-500/15 transition-colors"
        >
          <FileWarning className="w-3.5 h-3.5 shrink-0" />
          <span>{consignatieWarningCount} consignatievoertuig{consignatieWarningCount !== 1 ? "en" : ""} zonder consignatieovereenkomst</span>
        </button>
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-medium text-foreground">Voertuigen</h1>
          <p className="text-sm text-muted-foreground">{vehicles.filter(v => v.status !== "verkocht").length} voertuig{vehicles.filter(v => v.status !== "verkocht").length !== 1 ? "en" : ""}</p>
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
      <div className="space-y-3 overflow-hidden">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          <SlidingTabs
            tabs={tabs}
            value={filter}
            onChange={setFilter}
            className="min-w-max"
          />
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Zoek op merk, model, kenteken..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-xs pl-8 pr-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
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
                    <ApkBadge apkVervaldatum={v.apkVervaldatum} />
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
                  {["Voertuig", "Kenteken", "APK", "Inkoopprijs", "Verkoopprijs", "Marge", "Status", "Drive", ""].map((h, i) => (
                    <th key={h || i} className={`${i >= 3 && i <= 5 ? "text-right" : i >= 6 ? "text-center" : "text-left"} px-4 py-2.5 text-xs font-medium text-muted-foreground`}>{h}</th>
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
                      <td className="px-4 py-2.5">
                        <span className="text-muted-foreground text-xs font-mono uppercase whitespace-nowrap">{v.kenteken || "—"}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <ApkBadge apkVervaldatum={v.apkVervaldatum} />
                      </td>
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

const ApkBadge = ({ apkVervaldatum }: { apkVervaldatum?: string }) => {
  const status = getApkStatus(apkVervaldatum);
  if (status.level === 'green' || status.level === 'none') {
    if (status.level === 'none') return <span className="text-[10px] text-muted-foreground/50">—</span>;
    const apk = new Date(apkVervaldatum!);
    const formatted = apk.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
    return <span className="text-[10px] text-muted-foreground">Tot {formatted}</span>;
  }
  const isRed = status.level === 'red';
  const apk = new Date(apkVervaldatum!);
  const today = new Date(); today.setHours(0,0,0,0);
  const isExpired = apk.getTime() < today.getTime();
  const formatted = apk.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
  return (
    <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap border ${
      isRed
        ? "bg-red-500/10 text-red-400 border-red-500/25"
        : "bg-amber-500/10 text-amber-400 border-amber-500/25"
    }`}>
      {isExpired ? `Verlopen ${formatted}` : `Verloopt ${formatted}`}
    </span>
  );
};

export default AdminVoertuigenPage;

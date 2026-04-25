import { useState, useMemo, useEffect } from "react";
import { useVehicles } from "@/hooks/useVehicles";

import { useNavigate, Link } from "react-router-dom";
import { Plus, Search, Loader2, ChevronRight, RefreshCw, AlertTriangle, FileWarning, ShieldCheck } from "lucide-react";
import { BADGE_BASE } from "@/components/admin/StatusBadge";
import { formatEuro, calcWinst, calcMarge, isConsignatie, statusLabels, statusColors, Vehicle } from "@/types/vehicle";
import { useIsMobile } from "@/hooks/use-mobile";
import GoogleDriveIcon from "@/components/admin/GoogleDriveIcon";
import { getApkStatus } from "@/components/admin/detail/VehicleOverzichtTab";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { recheckApk } from "@/lib/apkRecheck";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "alle", label: "Alle statussen" },
  { value: "inkoop", label: "Inkoop" },
  { value: "in_behandeling", label: "In behandeling" },
  { value: "te_koop", label: "Te koop" },
  { value: "consignatie", label: "Consignatie" },
  { value: "gereserveerd", label: "Gereserveerd" },
  { value: "reparatie_onderhoud", label: "Reparatie/Onderhoud" },
  { value: "verkocht", label: "Verkocht" },
];

const AdminVoertuigenPage = () => {
  const { vehicles, loading, refetch } = useVehicles();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("alle");
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [apkRefreshing, setApkRefreshing] = useState(false);
  const [apkProgress, setApkProgress] = useState({ done: 0, total: 0 });
  const isMobile = useIsMobile();
  const [consignatieWarningCount, setConsignatieWarningCount] = useState(0);

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

  const apkWarningVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (v.status === "verkocht") return false;
      const status = getApkStatus(v.apkVervaldatum);
      if (status.level === 'red') return true;
      if (status.level === 'orange') {
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

  const handleApkRefresh = async () => {
    const targets = vehicles.filter((v) => v.status !== "verkocht" && !!v.kenteken);
    if (targets.length === 0) {
      toast.info("Geen voertuigen om te vernieuwen");
      return;
    }
    setApkRefreshing(true);
    setApkProgress({ done: 0, total: targets.length });
    let updated = 0;
    for (let i = 0; i < targets.length; i++) {
      const v = targets[i];
      try {
        const result = await recheckApk(v.id, v.kenteken, v.apkVervaldatum);
        if (result) updated++;
      } catch { /* skip */ }
      setApkProgress({ done: i + 1, total: targets.length });
    }
    setApkRefreshing(false);
    toast.success(`APK vernieuwd: ${updated} voertuig${updated !== 1 ? "en" : ""} bijgewerkt`);
    if (updated > 0) refetch();
  };

  const filtered = vehicles.filter((v) => {
    if (statusFilter !== "alle" && v.status !== statusFilter) return false;
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
      {apkWarningVehicles.length > 0 && (
        <button
          onClick={() => { setStatusFilter("alle"); setSearch(""); }}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium bg-amber-500/10 border border-amber-500/25 rounded-md text-amber-400 hover:bg-amber-500/15 transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{apkWarningVehicles.length} voertuig{apkWarningVehicles.length !== 1 ? "en" : ""} met APK die binnenkort verloopt of al verlopen is</span>
        </button>
      )}

      {consignatieWarningCount > 0 && (
        <button
          onClick={() => { setStatusFilter("consignatie"); setSearch(""); }}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium bg-amber-500/10 border border-amber-500/25 rounded-md text-amber-400 hover:bg-amber-500/15 transition-colors"
        >
          <FileWarning className="w-3.5 h-3.5 shrink-0" />
          <span>{consignatieWarningCount} consignatievoertuig{consignatieWarningCount !== 1 ? "en" : ""} zonder consignatieovereenkomst</span>
        </button>
      )}
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

      {/* Search + status filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Zoek op merk, model, kenteken..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

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
                    <span className={`${BADGE_BASE} ${statusColors[v.status]}`}>
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
                  {["Voertuig", "Kenteken", "APK", "Inkoopprijs", "Verkoopprijs", "Marge", "Status", "Drive"].map((h, i) => (
                    <th key={h || i} className={`${i >= 3 && i <= 5 ? "text-right" : i >= 6 ? "text-center" : "text-left"} px-3 py-2 text-[11px] font-medium text-muted-foreground`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const winst = calcWinst(v);
                  const marge = calcMarge(v);
                  return (
                    <tr
                      key={v.id}
                      onClick={() => navigate(`/admin/voertuigen/${v.id}`)}
                      className="border-b border-border/50 hover:bg-muted/70 transition-colors cursor-pointer"
                    >
                      <td className="px-3 py-2.5 text-foreground">
                        {v.merk} {v.model} <span className="text-muted-foreground text-xs">({v.bouwjaar})</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-muted-foreground text-[11px] font-mono uppercase whitespace-nowrap">{v.kenteken || "—"}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <ApkBadge apkVervaldatum={v.apkVervaldatum} />
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-xs">
                        {isConsignatie(v) ? <span className="text-muted-foreground">{v.consignatieCommissiePerc || 10}%</span> : formatEuro(v.inkoopprijs)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-xs">{v.verkoopprijs > 0 ? formatEuro(v.verkoopprijs) : "—"}</td>
                      <td className={`px-3 py-2.5 text-right font-medium tabular-nums text-xs ${winst >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {v.verkoopprijs > 0 ? <>{formatEuro(winst)} <span className="text-[10px] font-normal opacity-60">({marge.toFixed(0)}%)</span></> : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`${BADGE_BASE} ${statusColors[v.status]}`}>{statusLabels[v.status]}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <GoogleDriveIcon linked={!!v.googleDriveFolderId} url={v.googleDriveFolderUrl} />
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
    <span className={`${BADGE_BASE} ${
      isRed
        ? "bg-red-500/10 text-red-400 border-red-500/25"
        : "bg-amber-500/10 text-amber-400 border-amber-500/25"
    }`}>
      {isExpired ? `Verlopen ${formatted}` : `Verloopt ${formatted}`}
    </span>
  );
};

export default AdminVoertuigenPage;

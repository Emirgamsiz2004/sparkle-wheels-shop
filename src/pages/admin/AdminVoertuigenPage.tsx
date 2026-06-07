import { useState, useMemo, useEffect, useRef } from "react";
import { useVehicles } from "@/hooks/useVehicles";

import { useNavigate, Link } from "react-router-dom";
import { Plus, Search, Loader2, ChevronRight, RefreshCw, AlertTriangle, FileWarning, ShieldCheck, Trash2 } from "lucide-react";
import { BADGE_BASE } from "@/components/admin/StatusBadge";
import { formatEuro, calcWinst, calcMarge, isConsignatie, statusLabels, statusColors, Vehicle } from "@/types/vehicle";
import { useIsMobile } from "@/hooks/use-mobile";
import GoogleDriveIcon from "@/components/admin/GoogleDriveIcon";
import { getApkStatus } from "@/components/admin/detail/VehicleOverzichtTab";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { recheckApk } from "@/lib/apkRecheck";
import ConfirmPopover from "@/components/admin/ConfirmPopover";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "alle", label: "Alle statussen" },
  { value: "inkoop", label: "Inkoop" },
  { value: "in_behandeling", label: "In behandeling" },
  { value: "te_koop", label: "Te koop" },
  { value: "consignatie", label: "Consignatie" },
  { value: "gereserveerd", label: "Gereserveerd" },
  { value: "reparatie_onderhoud", label: "Reparatie/Onderhoud" },
];

const AdminVoertuigenPage = () => {
  const { vehicles, loading, refetch, deleteVehicle } = useVehicles();
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; label: string; rect: DOMRect | null } | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, v: Vehicle) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setConfirmDelete({
      id: v.id,
      label: `${v.merk} ${v.model}${v.kenteken ? ` (${v.kenteken})` : ""}`,
      rect,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    await deleteVehicle(confirmDelete.id);
    setConfirmDelete(null);
  };
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("alle");
  const [herkomstFilter, setHerkomstFilter] = useState<"alle" | "inruil">("alle");
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

  // Verkochte voertuigen worden volledig verborgen uit de voorraadlijst.
  // Ze blijven beschikbaar via de verkopenmodule.
  const visibleVehicles = useMemo(
    () => vehicles.filter((v) => v.status !== "verkocht"),
    [vehicles]
  );

  const normalizePlate = (s: string) => s.replace(/[-\s]/g, "").toUpperCase();

  const filtered = visibleVehicles.filter((v) => {
    if (statusFilter !== "alle" && v.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const qPlate = normalizePlate(search);
      const plateMatch = v.kenteken ? normalizePlate(v.kenteken).includes(qPlate) : false;
      return v.merk.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) || plateMatch;
    }
    return true;
  });

  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    return filtered.slice(0, 5);
  }, [search, filtered]);

  const [showSuggestions, setShowSuggestions] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowSuggestions(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
          <p className="text-sm text-muted-foreground">{visibleVehicles.length} voertuig{visibleVehicles.length !== 1 ? "en" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/verkopen"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors text-muted-foreground"
            title="Verkochte voertuigen bekijken"
          >
            Verkochte voertuigen
          </Link>
          <button
            onClick={handleApkRefresh}
            disabled={apkRefreshing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
            title="APK data vernieuwen via RDW"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${apkRefreshing ? "animate-pulse" : ""}`} />
            <span className="hidden sm:inline">
              {apkRefreshing ? `APK ${apkProgress.done}/${apkProgress.total}` : "APK vernieuwen"}
            </span>
          </button>
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
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Zoek op merk, model, kenteken..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="w-full pl-7 pr-2 h-9 text-[13px] sm:text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-card border border-border rounded-md shadow-lg overflow-hidden">
              {suggestions.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); navigate(`/admin/voertuigen/${v.id}`); setShowSuggestions(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-accent/40 transition-colors border-b border-border last:border-b-0"
                >
                  <span className="font-mono text-foreground">{v.kenteken || "—"}</span>
                  <span className="text-muted-foreground truncate">{v.merk} {v.model}{v.bouwjaar ? ` · ${v.bouwjaar}` : ""}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-2 h-9 text-[13px] sm:text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
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
        <div className="flex flex-col gap-2">
          {filtered.map((v) => {
            const consignatie = isConsignatie(v);
            const apkInfo = getMobileApkInfo(v.apkVervaldatum);
            return (
              <Link
                key={v.id}
                to={`/admin/voertuigen/${v.id}`}
                className="block bg-card border border-border rounded-[12px] active:bg-accent/30 transition-colors"
                style={{ padding: "10px 12px" }}
              >
                {/* Rij 1: merk model bouwjaar | delete */}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14px] font-semibold text-foreground truncate leading-tight min-w-0">
                    {v.merk} {v.model}
                    <span className="ml-1.5 text-[12px] font-normal text-muted-foreground tabular-nums">
                      {v.bouwjaar}
                    </span>
                  </p>
                  <button
                    onClick={(e) => handleDeleteClick(e, v)}
                    className="-mr-1.5 p-1.5 rounded-md text-muted-foreground/70 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                    title="Verwijderen"
                    aria-label="Verwijderen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Rij 2: kenteken | APK datum */}
                {(v.kenteken || apkInfo) && (
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-[11px] font-mono uppercase text-foreground/80 tracking-wide">
                      {v.kenteken || ""}
                    </span>
                    {apkInfo && (
                      <span className={`text-[10px] tabular-nums ${apkInfo.expired ? "text-amber-400" : "text-muted-foreground"}`}>
                        {apkInfo.label}
                      </span>
                    )}
                  </div>
                )}

                {/* Rij 3: inkoop/consignatie | verkoopprijs + tags */}
                <div className="flex items-center justify-between gap-2 mt-1.5">
                  <span className="text-[11px] text-muted-foreground/80 tabular-nums truncate">
                    {consignatie
                      ? "Consignatie"
                      : v.inkoopprijs > 0
                        ? `Inkoop ${formatEuro(v.inkoopprijs)}`
                        : ""}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {apkInfo?.warn && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded border ${
                        apkInfo.expired
                          ? "bg-red-500/10 text-red-400 border-red-500/25"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                      }`}>
                        APK
                      </span>
                    )}
                    {statusLabels[v.status] && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded border ${statusColors[v.status]}`}>
                        {statusLabels[v.status]}
                      </span>
                    )}
                    {v.verkoopprijs > 0 && (
                      <span className="text-[13px] font-semibold tabular-nums text-foreground ml-1">
                        {formatEuro(v.verkoopprijs)}
                      </span>
                    )}
                  </div>
                </div>
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
                      <td className="px-2 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleDeleteClick(e, v)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Voertuig verwijderen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmPopover
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
        anchorRect={confirmDelete?.rect ?? null}
        title="Voertuig verwijderen?"
        message={confirmDelete ? `${confirmDelete.label} en alle bijbehorende gegevens worden permanent verwijderd. Dit kan niet ongedaan worden gemaakt.` : ""}
        confirmLabel="Verwijderen"
        destructive
        onConfirm={handleDeleteConfirm}
      />
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

// Mobiele APK-info: korte datumweergave + warn-flag (binnen 60 dagen of verlopen)
const getMobileApkInfo = (apkVervaldatum?: string) => {
  if (!apkVervaldatum) return null;
  const apk = new Date(apkVervaldatum);
  if (isNaN(apk.getTime())) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((apk.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const expired = diffDays < 0;
  const warn = expired || diffDays <= 60;
  const formatted = apk.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
  const label = expired ? `Verlopen ${formatted}` : `APK tot ${formatted}`;
  return { label, expired, warn };
};

export default AdminVoertuigenPage;

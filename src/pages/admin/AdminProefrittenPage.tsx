import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTestDrives, TestDrive } from "@/hooks/useTestDrives";
import { useAppointments, typeColors, typeLabels } from "@/hooks/useAppointments";
import { Loader2, Search, ChevronRight, CheckCircle2, Clock, XCircle, Car, StopCircle, Plus, Play, CalendarDays } from "lucide-react";
import { format, isSameDay, isFuture, intervalToDuration } from "date-fns";
import { nl } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import ProefritDetailDialog from "@/components/admin/proefrit/ProefritDetailDialog";
import EindProefritDialog from "@/components/admin/proefrit/EindProefritDialog";
import NieuweProefritDialog from "@/components/admin/proefrit/NieuweProefritDialog";
import ProefritCountdown from "@/components/admin/proefrit/ProefritCountdown";
import SlidingTabs from "@/components/admin/SlidingTabs";

function getElapsedTime(td: TestDrive): string | null {
  if (td.status !== "actief") return null;
  const startStr = (td as any).vertrek_tijd || td.formulier_ingevuld_op || td.start_tijd;
  if (!startStr) return null;
  const start = new Date(startStr);
  const dur = intervalToDuration({ start, end: new Date() });
  const parts: string[] = [];
  if (dur.hours) parts.push(`${dur.hours}u`);
  if (dur.minutes != null) parts.push(`${dur.minutes}m`);
  if (!parts.length) parts.push("0m");
  return parts.join(" ");
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  wacht_op_klant: { label: "Wacht op klant", icon: Clock, color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  actief: { label: "Actief", icon: Car, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  afgesloten: { label: "Afgesloten", icon: CheckCircle2, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  onvolledig: { label: "Onvolledig", icon: XCircle, color: "text-red-400 bg-red-400/10 border-red-400/20" },
};

const tabs = [
  { label: "Actief", value: "actief" },
  { label: "Afgesloten", value: "afgesloten" },
  { label: "Onvolledig", value: "onvolledig" },
];

const AdminProefrittenPage = () => {
  const { testDrives, loading, refetch } = useTestDrives();
  const { appointments } = useAppointments();
  const [filter, setFilter] = useState("actief");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<TestDrive | null>(null);
  const [ending, setEnding] = useState<TestDrive | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newAnchor, setNewAnchor] = useState<DOMRect | null>(null);
  const newBtnRef = useRef<HTMLButtonElement>(null);
  const openNew = (el?: HTMLElement | null) => {
    setNewAnchor((el ?? newBtnRef.current)?.getBoundingClientRect() ?? null);
    setNewOpen(true);
  };
  const [startFromAppointment, setStartFromAppointment] = useState<{ id: string; merk: string; model: string; kenteken?: string; bouwjaar?: number; kilometerstand?: number } | null>(null);

  // URL params: ?new=1 opens nieuwe-proefrit, ?afsluiten=<id> opens eind-dialog
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      openNew();
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
    const afsluitenId = searchParams.get("afsluiten");
    if (afsluitenId) {
      const td = testDrives.find((t) => t.id === afsluitenId);
      if (td) setEnding(td);
      searchParams.delete("afsluiten");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, testDrives]);

  // Upcoming proefrit appointments (scheduled, future or today)
  const scheduledProefritten = useMemo(() => {
    return appointments
      .filter((a) => a.type === "proefrit" && a.status === "gepland" && (isFuture(new Date(a.datum_tijd)) || isSameDay(new Date(a.datum_tijd), new Date())))
      .sort((a, b) => new Date(a.datum_tijd).getTime() - new Date(b.datum_tijd).getTime());
  }, [appointments]);

  const filtered = testDrives.filter((td) => {
    if (td.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = `${td.customer?.voornaam || ""} ${td.customer?.achternaam || ""}`.toLowerCase();
      const vehicle = `${td.voertuig_merk || ""} ${td.voertuig_model || ""}`.toLowerCase();
      return name.includes(q) || vehicle.includes(q) || td.voertuig_kenteken?.toLowerCase().includes(q);
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
          <h1 className="text-lg font-medium text-foreground">Proefritten</h1>
          <p className="text-sm text-muted-foreground">{testDrives.length} proefrit{testDrives.length !== 1 ? "ten" : ""}</p>
        </div>
        <button
          ref={newBtnRef}
          onClick={() => openNew()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors active:scale-[0.97] shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Proefrit</span>
        </button>
      </div>

      {/* Scheduled proefrit appointments */}
      {scheduledProefritten.length > 0 && (
        <div className="bg-card border border-border rounded-md p-3">
          <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
            Ingeplande proefriten
          </h3>
          <div className="space-y-1.5">
            {scheduledProefritten.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 bg-muted/30 border border-border rounded-md px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">
                      {format(new Date(a.datum_tijd), "EEE d MMM · HH:mm", { locale: nl })}
                    </span>
                    <Badge className={`${typeColors.proefrit} border text-[10px]`}>Proefrit</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {a.customer && <span className="text-xs text-muted-foreground truncate">{a.customer.voornaam} {a.customer.achternaam}</span>}
                    {a.vehicle && <span className="text-xs text-muted-foreground truncate">· {a.vehicle.merk} {a.vehicle.model}</span>}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (a.vehicle) {
                      setStartFromAppointment({
                        id: a.vehicle.id,
                        merk: a.vehicle.merk,
                        model: a.vehicle.model,
                        kenteken: a.vehicle.kenteken || undefined,
                      });
                    } else {
                      setNewOpen(true);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-md hover:bg-emerald-500/25 transition-colors active:scale-[0.97] shrink-0"
                >
                  <Play className="w-3 h-3" /> Starten
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          <SlidingTabs tabs={tabs} value={filter} onChange={setFilter} className="min-w-max" />
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Zoek op klant, voertuig, kenteken..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-xs pl-8 pr-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-md border border-border px-4 py-12 text-center text-sm text-muted-foreground">
          Geen proefriten gevonden.
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((td) => {
            const sc = statusConfig[td.status] || statusConfig.wacht_op_klant;
            const Icon = sc.icon;
            return (
              <button
                key={td.id}
                onClick={() => setSelected(td)}
                className="w-full flex items-center justify-between gap-3 bg-card border border-border rounded-md p-3 hover:bg-accent/20 active:bg-accent/30 transition-colors text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {td.voertuig_merk} {td.voertuig_model}
                    </p>
                    {td.voertuig_kenteken && (
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">{td.voertuig_kenteken}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded border ${sc.color}`}>
                      <Icon className="w-3 h-3" />
                      {sc.label}
                    </span>
                    {td.status === "actief" && (
                      <span className="text-[10px] text-blue-400 font-medium">
                        {getElapsedTime(td)}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground truncate">
                      {td.customer ? `${td.customer.voornaam} ${td.customer.achternaam}` : "Klant nog niet ingevuld"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">
                    {format(new Date(td.start_tijd), "d MMM yyyy, HH:mm", { locale: nl })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {td.status === "actief" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setEnding(td); }}
                      className="inline-flex items-center justify-center w-9 h-9 text-amber-400 hover:bg-amber-400/10 rounded-md transition-colors"
                      title="Proefrit beëindigen"
                    >
                      <StopCircle className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* New test drive dialog */}
      <NieuweProefritDialog
        open={newOpen}
        onClose={() => { setNewOpen(false); refetch(); }}
        anchorRect={newAnchor}
      />

      {/* Start from scheduled appointment */}
      {startFromAppointment && (
        <NieuweProefritDialog
          open={!!startFromAppointment}
          onClose={() => { setStartFromAppointment(null); refetch(); }}
          preselectedVehicle={startFromAppointment}
        />
      )}

      {selected && (
        <ProefritDetailDialog
          testDrive={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
          onDeleted={() => { setSelected(null); refetch(); }}
        />
      )}

      {ending && (
        <EindProefritDialog
          testDrive={ending}
          open={!!ending}
          onClose={() => { setEnding(null); refetch(); }}
        />
      )}
    </div>
  );
};

export default AdminProefrittenPage;

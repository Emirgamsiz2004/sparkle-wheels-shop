import { useState } from "react";
import { useTestDrives, TestDrive } from "@/hooks/useTestDrives";
import { Loader2, Search, ChevronRight, CheckCircle2, Clock, AlertCircle, XCircle, Car, StopCircle } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import ProefritDetailDialog from "@/components/admin/proefrit/ProefritDetailDialog";
import EindProefritDialog from "@/components/admin/proefrit/EindProefritDialog";

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  wacht_op_klant: { label: "Wacht op klant", icon: Clock, color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  actief: { label: "Actief", icon: Car, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  afgesloten: { label: "Afgesloten", icon: CheckCircle2, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  onvolledig: { label: "Onvolledig", icon: XCircle, color: "text-red-400 bg-red-400/10 border-red-400/20" },
};

const tabs = [
  { label: "Alle", value: "alle" },
  { label: "Wacht op klant", value: "wacht_op_klant" },
  { label: "Actief", value: "actief" },
  { label: "Afgesloten", value: "afgesloten" },
  { label: "Onvolledig", value: "onvolledig" },
];

const AdminProefrittenPage = () => {
  const { testDrives, loading } = useTestDrives();
  const [filter, setFilter] = useState("alle");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<TestDrive | null>(null);
  const [ending, setEnding] = useState<TestDrive | null>(null);
  const isMobile = useIsMobile();

  const filtered = testDrives.filter((td) => {
    if (filter !== "alle" && td.status !== filter) return false;
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
        <div>
          <h1 className="text-lg font-medium text-foreground">Proefriten</h1>
          <p className="text-sm text-muted-foreground">{testDrives.length} proefrit{testDrives.length !== 1 ? "ten" : ""}</p>
        </div>
      </div>

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
            placeholder="Zoek op klant, voertuig, kenteken..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-xs pl-8 pr-3 py-1.5 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-lg border border-border px-4 py-12 text-center text-sm text-muted-foreground">
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
                className="w-full flex items-center justify-between gap-3 bg-card border border-border rounded-lg p-3 hover:bg-accent/20 transition-colors text-left"
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
                    <span className="text-xs text-muted-foreground">
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
                      className="p-1.5 text-amber-400 hover:bg-amber-400/10 rounded-md transition-colors"
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

      {selected && (
        <ProefritDetailDialog
          testDrive={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
          onDeleted={() => { setSelected(null); }}
        />
      )}

      {ending && (
        <EindProefritDialog
          testDrive={ending}
          open={!!ending}
          onClose={() => setEnding(null)}
        />
      )}
    </div>
  );
};

export default AdminProefrittenPage;

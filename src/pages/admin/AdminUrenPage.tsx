import { useState, useMemo, useEffect } from "react";
import { useTimeEntries, TimeEntry, categoryLabels, formatDuration } from "@/hooks/useTimeEntries";
import { useVehicles } from "@/hooks/useVehicles";
import { useCustomers } from "@/hooks/useCustomers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Loader2, Play, Pause, CheckCircle, Download, Clock, Search, Plus, Timer, Square } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import StopTimerDialog from "@/components/admin/StopTimerDialog";

interface VehicleTask {
  id: string;
  vehicle_id: string;
  omschrijving: string;
  prioriteit: string;
  deadline: string | null;
  voltooid: boolean;
  created_at: string;
  vehicle?: { merk: string; model: string; kenteken: string | null };
}

const prioriteitOrder: Record<string, number> = { hoog: 0, normaal: 1, laag: 2 };
const prioriteitColors: Record<string, string> = {
  hoog: "bg-red-500/15 text-red-400 border-red-500/30",
  normaal: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  laag: "bg-muted text-muted-foreground border-border",
};

const AdminUrenPage = () => {
  const { user } = useAuth();
  const { entries, activeTimer, loading: entriesLoading, startTimer, stopTimer, fetchEntries } = useTimeEntries();
  const { vehicles } = useVehicles();
  const { customers } = useCustomers();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<VehicleTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [confirmSwitch, setConfirmSwitch] = useState<VehicleTask | null>(null);
  const [quickTimerOpen, setQuickTimerOpen] = useState(false);
  const [quickDesc, setQuickDesc] = useState("");
  const [quickCategory, setQuickCategory] = useState("overig");
  const [quickStarting, setQuickStarting] = useState(false);
  const [stopTimerDialogOpen, setStopTimerDialogOpen] = useState(false);

  // History filters
  const [historySearch, setHistorySearch] = useState("");
  const [historyPeriod, setHistoryPeriod] = useState("week");

  // Fetch open tasks from all vehicles
  const fetchTasks = async () => {
    const { data } = await supabase
      .from("vehicle_tasks")
      .select("*, vehicles:vehicle_id(merk, model, kenteken)")
      .eq("voltooid", false)
      .order("created_at", { ascending: false });

    if (data) {
      setTasks(data.map((t: any) => ({
        ...t,
        vehicle: t.vehicles || undefined,
      })));
    }
    setTasksLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  // Active timer elapsed
  useEffect(() => {
    if (!activeTimer) { setElapsed(0); return; }
    const calc = () => Math.floor((Date.now() - new Date(activeTimer.start_time).getTime()) / 1000);
    setElapsed(calc());
    const iv = setInterval(() => setElapsed(calc()), 1000);
    return () => clearInterval(iv);
  }, [activeTimer]);

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // Sort tasks by priority then deadline
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const pa = prioriteitOrder[a.prioriteit] ?? 1;
      const pb = prioriteitOrder[b.prioriteit] ?? 1;
      if (pa !== pb) return pa - pb;
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    });
  }, [tasks]);

  // Today's entries
  const todayEntries = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return entries.filter(e => e.start_time.startsWith(todayStr));
  }, [entries]);

  const todayTotalMinutes = todayEntries.reduce((s, e) => s + (e.duration_minutes || 0), 0);

  // History entries (completed only)
  const historyEntries = useMemo(() => {
    const now = new Date();
    let start: Date;
    if (historyPeriod === "today") start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (historyPeriod === "week") { const d = now.getDay() || 7; start = new Date(now); start.setDate(now.getDate() - d + 1); start.setHours(0, 0, 0, 0); }
    else if (historyPeriod === "month") start = new Date(now.getFullYear(), now.getMonth(), 1);
    else start = new Date(0);

    return entries.filter(e => {
      if (!e.end_time) return false;
      if (new Date(e.start_time) < start) return false;
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const vName = e.vehicles ? `${e.vehicles.merk} ${e.vehicles.model}` : "";
        if (!e.description.toLowerCase().includes(q) && !vName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [entries, historyPeriod, historySearch]);

  // Start task timer
  const handleStartTask = async (task: VehicleTask) => {
    if (activeTimer) {
      setConfirmSwitch(task);
      return;
    }
    await startTimer({
      vehicle_id: task.vehicle_id,
      description: task.omschrijving,
      category: "onderhoud",
    });
  };

  // Pause = stop timer but don't mark task as done
  const handlePauseTask = async () => {
    if (!activeTimer) return;
    await stopTimer(activeTimer.id, "Gepauzeerd");
  };

  // End = stop timer + mark task as voltooid
  const handleEndTask = async (task: VehicleTask) => {
    if (activeTimer && activeTimer.description === task.omschrijving) {
      await stopTimer(activeTimer.id, "Afgerond");
    }
    await supabase.from("vehicle_tasks").update({
      voltooid: true,
      voltooid_op: new Date().toISOString(),
    } as any).eq("id", task.id);
    toast.success("Taak afgerond");
    fetchTasks();
  };

  // Confirm switch: pause current, start new
  const handleConfirmSwitch = async () => {
    if (!confirmSwitch || !activeTimer) return;
    await stopTimer(activeTimer.id, "Gepauzeerd — gewisseld naar andere taak");
    await startTimer({
      vehicle_id: confirmSwitch.vehicle_id,
      description: confirmSwitch.omschrijving,
      category: "onderhoud",
    });
    setConfirmSwitch(null);
  };

  // Quick timer start
  const handleQuickStart = async () => {
    if (!quickDesc.trim()) { toast.error("Vul een omschrijving in"); return; }
    setQuickStarting(true);
    await startTimer({ description: quickDesc.trim(), category: quickCategory });
    setQuickStarting(false);
    setQuickTimerOpen(false);
    setQuickDesc("");
    setQuickCategory("overig");
  };

  // CSV export
  const exportCSV = () => {
    const rows = [["Datum", "Voertuig", "Omschrijving", "Duur (min)"]];
    historyEntries.forEach(e => {
      const vName = e.vehicles ? `${e.vehicles.merk} ${e.vehicles.model}` : "—";
      rows.push([
        new Date(e.start_time).toLocaleDateString("nl-NL"),
        vName,
        e.description,
        String(e.duration_minutes || 0),
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "uren-export.csv"; a.click();
  };

  const isLoading = entriesLoading || tasksLoading;

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium text-foreground">Uren & Taken</h1>
        {!activeTimer && (
          <button
            onClick={() => setQuickTimerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors"
          >
            <Timer className="w-3.5 h-3.5" /> Timer starten
          </button>
        )}
      </div>

      {/* Top: Taken + Vandaag */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Taken */}
        <div className="bg-card border border-border rounded-md p-4">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Openstaande taken</h2>
          {sortedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Geen openstaande taken</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {sortedTasks.map(task => {
                const isActive = activeTimer?.description === task.omschrijving && activeTimer?.vehicle_id === task.vehicle_id;
                return (
                  <div key={task.id} className={`border rounded-md p-3 space-y-2 ${isActive ? "border-emerald-500/40 bg-emerald-500/5" : "border-border"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{task.omschrijving}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.vehicle ? `${task.vehicle.merk} ${task.vehicle.model}` : ""}
                          {task.vehicle?.kenteken ? ` · ${task.vehicle.kenteken.toUpperCase()}` : ""}
                        </p>
                      </div>
                      <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded border shrink-0 ${prioriteitColors[task.prioriteit] || prioriteitColors.normaal}`}>
                        {task.prioriteit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-muted-foreground">
                        {task.deadline ? `Deadline: ${new Date(task.deadline).toLocaleDateString("nl-NL")}` : "Geen deadline"}
                      </div>
                      <div className="flex items-center gap-1">
                        {isActive ? (
                          <>
                            <span className="text-xs font-mono text-emerald-400 tabular-nums mr-1">{formatElapsed(elapsed)}</span>
                            <button onClick={handlePauseTask} className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded transition-colors" title="Pauzeren">
                              <Pause className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handleStartTask(task)} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors" title="Starten">
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => handleEndTask(task)} className="p-1.5 text-foreground hover:bg-accent rounded transition-colors" title="Beëindigen">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Vandaag */}
        <div className="bg-card border border-border rounded-md p-4">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Vandaag</h2>
          {todayEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nog geen uren vandaag</p>
          ) : (
            <div className="space-y-1">
              {todayEntries.map(e => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground truncate">{e.description}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {e.vehicles ? `${e.vehicles.merk} ${e.vehicles.model}` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums text-foreground ml-3">
                    {e.end_time ? formatDuration(e.duration_minutes) : <span className="text-emerald-400 animate-pulse text-xs">Loopt...</span>}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 mt-1 border-t border-border">
                <span className="text-xs font-medium text-muted-foreground">Totaal vandaag</span>
                <span className="text-sm font-bold tabular-nums text-foreground">{formatDuration(todayTotalMinutes)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div className="bg-card border border-border rounded-md p-4">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Geschiedenis</h2>
          <div className="flex items-center gap-2">
            <select value={historyPeriod} onChange={e => setHistoryPeriod(e.target.value)} className="px-2 py-1 text-xs bg-secondary/50 border border-border rounded-md focus:outline-none">
              <option value="today">Vandaag</option>
              <option value="week">Deze week</option>
              <option value="month">Deze maand</option>
              <option value="all">Alles</option>
            </select>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={historySearch} onChange={e => setHistorySearch(e.target.value)} placeholder="Zoek..." className="pl-7 pr-3 py-1 text-xs bg-secondary/50 border border-border rounded-md w-40 focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <button onClick={exportCSV} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors">
              <Download className="w-3 h-3" /> CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Datum</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Voertuig</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Omschrijving</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Duur</th>
              </tr>
            </thead>
            <tbody>
              {historyEntries.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-8 text-center text-muted-foreground text-sm">Geen uren gevonden</td></tr>
              ) : historyEntries.map(e => (
                <tr key={e.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap text-xs">
                    {new Date(e.start_time).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {e.vehicles ? (
                      <button onClick={() => navigate(`/admin/voertuigen/${e.vehicle_id}`)} className="text-foreground hover:underline">
                        {e.vehicles.merk} {e.vehicles.model}
                      </button>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2 text-foreground max-w-[200px] truncate text-xs">{e.description}</td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums text-xs">{formatDuration(e.duration_minutes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm switch dialog */}
      <Dialog open={!!confirmSwitch} onOpenChange={() => setConfirmSwitch(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">Taak wisselen?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Er loopt al een timer voor "{activeTimer?.description}". Wil je die pauzeren en "{confirmSwitch?.omschrijving}" starten?
          </p>
          <div className="flex gap-2 mt-2">
            <button onClick={() => setConfirmSwitch(null)} className="flex-1 py-2 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors">
              Annuleren
            </button>
            <button onClick={handleConfirmSwitch} className="flex-1 py-2 text-xs font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
              Wissel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick timer start dialog */}
      <Dialog open={quickTimerOpen} onOpenChange={setQuickTimerOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">Timer starten</DialogTitle>
          </DialogHeader>
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Waar ga je aan werken? *</label>
                <input
                  value={quickDesc}
                  onChange={(e) => setQuickDesc(e.target.value)}
                  placeholder="bijv. Auto wassen, Admin werk..."
                  className="w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground placeholder:text-muted-foreground transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Categorie</label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(categoryLabels).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setQuickCategory(val)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                        quickCategory === val
                          ? "bg-foreground text-background border-foreground"
                          : "bg-secondary/50 text-muted-foreground border-border hover:bg-accent"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleQuickStart}
                disabled={quickStarting || !quickDesc.trim()}
                className="w-full py-2.5 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50"
              >
                {quickStarting ? "Bezig..." : "Start timer"}
              </button>
            </motion.div>
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUrenPage;

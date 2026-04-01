import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Check, Loader2, Clock, AlertTriangle, Circle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Task {
  id: string;
  omschrijving: string;
  prioriteit: string;
  deadline: string | null;
  voltooid: boolean;
  voltooid_op: string | null;
  created_at: string;
}

interface Activity {
  id: string;
  actie_type: string;
  beschrijving: string;
  metadata: any;
  created_at: string;
}

const prioriteitConfig: Record<string, { label: string; color: string; icon: any }> = {
  hoog: { label: "Hoog", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: AlertTriangle },
  normaal: { label: "Normaal", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: Circle },
  laag: { label: "Laag", color: "bg-secondary text-muted-foreground border-border", icon: Clock },
};

const actieIcons: Record<string, { color: string; label: string }> = {
  status_gewijzigd: { color: "bg-amber-500", label: "Status" },
  voertuig_bewerkt: { color: "bg-blue-500", label: "Bewerkt" },
  financieel_bewerkt: { color: "bg-emerald-500", label: "Financieel" },
  kosten_toegevoegd: { color: "bg-orange-500", label: "Kosten" },
  taak_voltooid: { color: "bg-emerald-500", label: "Taak" },
  taak_aangemaakt: { color: "bg-blue-500", label: "Taak" },
  document_gegenereerd: { color: "bg-purple-500", label: "Document" },
  proefrit: { color: "bg-cyan-500", label: "Proefrit" },
  notitie: { color: "bg-secondary", label: "Notitie" },
  url_gewijzigd: { color: "bg-secondary", label: "URL" },
};

const VehicleTakenTab = ({ vehicleId }: { vehicleId: string }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ omschrijving: "", prioriteit: "normaal", deadline: "" });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const [tRes, aRes] = await Promise.all([
      supabase.from("vehicle_tasks").select("*").eq("vehicle_id", vehicleId).order("created_at", { ascending: false }),
      supabase.from("vehicle_activity_log").select("*").eq("vehicle_id", vehicleId).order("created_at", { ascending: false }).limit(20),
    ]);
    setTasks((tRes.data as Task[]) || []);
    setActivities((aRes.data as Activity[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [vehicleId]);

  const handleAddTask = async () => {
    if (!form.omschrijving) return;
    setSaving(true);
    const { error } = await supabase.from("vehicle_tasks").insert({
      vehicle_id: vehicleId,
      omschrijving: form.omschrijving,
      prioriteit: form.prioriteit,
      deadline: form.deadline || null,
    } as any);
    if (error) { toast.error("Taak toevoegen mislukt"); } else {
      toast.success("Taak toegevoegd");
      await supabase.from("vehicle_activity_log").insert({ vehicle_id: vehicleId, actie_type: "taak_aangemaakt", beschrijving: `Taak: ${form.omschrijving}` } as any);
    }
    setSaving(false);
    setDialogOpen(false);
    setForm({ omschrijving: "", prioriteit: "normaal", deadline: "" });
    fetchData();
  };

  const handleToggleTask = async (task: Task) => {
    const now = new Date().toISOString();
    await supabase.from("vehicle_tasks").update({
      voltooid: !task.voltooid,
      voltooid_op: !task.voltooid ? now : null,
    } as any).eq("id", task.id);
    if (!task.voltooid) {
      await supabase.from("vehicle_activity_log").insert({ vehicle_id: vehicleId, actie_type: "taak_voltooid", beschrijving: `Taak afgerond: ${task.omschrijving}` } as any);
    }
    fetchData();
  };

  const inputCls = "w-full px-2.5 py-1.5 text-sm bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

  const openTasks = tasks.filter(t => !t.voltooid);
  const completedTasks = tasks.filter(t => t.voltooid);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* Open tasks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Openstaande taken ({openTasks.length})
          </h3>
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors">
            <Plus className="w-3.5 h-3.5" /> Taak
          </button>
        </div>

        {openTasks.length === 0 ? (
          <div className="bg-card border border-border rounded-lg px-4 py-8 text-center text-sm text-muted-foreground">
            Geen openstaande taken
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {openTasks.map((task) => {
              const config = prioriteitConfig[task.prioriteit] || prioriteitConfig.normaal;
              const isOverdue = task.deadline && new Date(task.deadline) < new Date();
              return (
                <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => handleToggleTask(task)} className="shrink-0 w-5 h-5 rounded border border-border hover:border-foreground flex items-center justify-center transition-colors" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{task.omschrijving}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded border ${config.color}`}>{config.label}</span>
                      {task.deadline && (
                        <span className={`text-[10px] ${isOverdue ? "text-red-400" : "text-muted-foreground"}`}>
                          {new Date(task.deadline).toLocaleDateString("nl-NL")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {completedTasks.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Voltooid ({completedTasks.length})</p>
            <div className="bg-card border border-border rounded-lg divide-y divide-border">
              {completedTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center gap-3 px-4 py-2 opacity-60">
                  <button onClick={() => handleToggleTask(task)} className="shrink-0 w-5 h-5 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-500" />
                  </button>
                  <p className="text-sm text-muted-foreground line-through">{task.omschrijving}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Activity timeline */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Activiteitentijdlijn</h3>
        {activities.length === 0 ? (
          <div className="bg-card border border-border rounded-lg px-4 py-8 text-center text-sm text-muted-foreground">
            Nog geen activiteit geregistreerd
          </div>
        ) : (
          <div className="space-y-0">
            {activities.map((act, i) => {
              const config = actieIcons[act.actie_type] || { color: "bg-secondary", label: act.actie_type };
              return (
                <div key={act.id} className="flex gap-3 pb-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${config.color} shrink-0 mt-1.5`} />
                    {i < activities.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{act.beschrijving}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(act.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add task dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border-border bg-card p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-base font-semibold tracking-tight">Taak toevoegen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 pb-6">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Omschrijving</label>
              <input value={form.omschrijving} onChange={(e) => setForm(f => ({ ...f, omschrijving: e.target.value }))} className={inputCls} placeholder="Wat moet er gedaan worden?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Prioriteit</label>
                <select value={form.prioriteit} onChange={(e) => setForm(f => ({ ...f, prioriteit: e.target.value }))} className={inputCls}>
                  <option value="laag">Laag</option>
                  <option value="normaal">Normaal</option>
                  <option value="hoog">Hoog</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Deadline (optioneel)</label>
                <input type="date" value={form.deadline} onChange={(e) => setForm(f => ({ ...f, deadline: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <button onClick={handleAddTask} disabled={saving || !form.omschrijving} className="w-full py-2.5 bg-foreground text-background text-sm font-semibold rounded-xl hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Toevoegen
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleTakenTab;

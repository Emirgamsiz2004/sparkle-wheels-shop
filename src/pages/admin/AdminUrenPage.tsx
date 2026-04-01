import { useState, useMemo, useEffect, useRef } from "react";
import { useTimeEntries, TimeEntry, categoryLabels, categoryColors, formatDuration } from "@/hooks/useTimeEntries";
import { useVehicles } from "@/hooks/useVehicles";
import { useCustomers } from "@/hooks/useCustomers";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Loader2, List, CalendarDays, Play, Square, Clock, Download, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const categories = Object.keys(categoryLabels);

const AdminUrenPage = () => {
  const { entries, activeTimer, loading, startTimer, stopTimer, addManualEntry, deleteEntry } = useTimeEntries();
  const { vehicles } = useVehicles();
  const { customers } = useCustomers();
  const navigate = useNavigate();

  const [view, setView] = useState<"week" | "list">("list");
  const [startOpen, setStartOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);
  const [filterCat, setFilterCat] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("week");
  const [search, setSearch] = useState("");

  // Timer display
  const [elapsed, setElapsed] = useState(0);
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

  // Period filter
  const filteredEntries = useMemo(() => {
    const now = new Date();
    let start: Date;
    if (filterPeriod === "today") { start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); }
    else if (filterPeriod === "week") { const d = now.getDay() || 7; start = new Date(now); start.setDate(now.getDate() - d + 1); start.setHours(0, 0, 0, 0); }
    else if (filterPeriod === "month") { start = new Date(now.getFullYear(), now.getMonth(), 1); }
    else { start = new Date(0); }

    return entries.filter(e => {
      if (new Date(e.start_time) < start) return false;
      if (filterCat && e.category !== filterCat) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!e.description.toLowerCase().includes(q) &&
            !`${e.vehicles?.merk} ${e.vehicles?.model}`.toLowerCase().includes(q) &&
            !`${e.customers?.voornaam} ${e.customers?.achternaam}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [entries, filterPeriod, filterCat, search]);

  // Week stats
  const weekEntries = useMemo(() => {
    const now = new Date();
    const d = now.getDay() || 7;
    const start = new Date(now); start.setDate(now.getDate() - d + 1); start.setHours(0, 0, 0, 0);
    return entries.filter(e => new Date(e.start_time) >= start && e.duration_minutes);
  }, [entries]);

  const totalWeekMinutes = weekEntries.reduce((s, e) => s + (e.duration_minutes || 0), 0);
  const vehicleEntries = weekEntries.filter(e => e.vehicle_id);
  const avgPerVehicle = vehicleEntries.length > 0
    ? Math.round(vehicleEntries.reduce((s, e) => s + (e.duration_minutes || 0), 0) / new Set(vehicleEntries.map(e => e.vehicle_id)).size)
    : 0;

  // Week view data
  const weekDays = useMemo(() => {
    const now = new Date();
    const d = now.getDay() || 7;
    const monday = new Date(now); monday.setDate(now.getDate() - d + 1); monday.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday); day.setDate(monday.getDate() + i);
      return day;
    });
  }, []);

  const exportCSV = () => {
    const rows = [["Datum", "Medewerker", "Voertuig/Klant", "Omschrijving", "Categorie", "Duur (min)"]];
    filteredEntries.forEach(e => {
      const target = e.vehicles ? `${e.vehicles.merk} ${e.vehicles.model}` : e.customers ? `${e.customers.voornaam} ${e.customers.achternaam}` : "—";
      rows.push([
        new Date(e.start_time).toLocaleDateString("nl-NL"),
        (e as any).profiles?.display_name || "—",
        target,
        e.description,
        categoryLabels[e.category] || e.category,
        String(e.duration_minutes || 0),
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "uren-export.csv"; a.click();
  };

  const inputCls = "w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-ring";
  const selectCls = `${inputCls} appearance-none`;
  const teKoopVehicles = vehicles.filter(v => !["verkocht", "gearchiveerd"].includes(v.status));

  return (
    <div className="space-y-5">
      {/* Active timer bar */}
      {activeTimer ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
            <div>
              <p className="text-sm font-medium text-foreground">{activeTimer.description}</p>
              <p className="text-xs text-muted-foreground">
                {activeTimer.vehicles ? `${activeTimer.vehicles.merk} ${activeTimer.vehicles.model}` : activeTimer.customers ? `${activeTimer.customers.voornaam} ${activeTimer.customers.achternaam}` : ""}
                {" · "}{categoryLabels[activeTimer.category]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">{formatElapsed(elapsed)}</span>
            <button onClick={() => setStopOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all active:scale-[0.97]">
              <Square className="w-4 h-4" /> Stop
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setStartOpen(true)} className="w-full py-4 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all active:scale-[0.97] flex items-center justify-center gap-2">
          <Play className="w-5 h-5" /> Start timer
        </button>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-lg font-medium text-foreground">Urenregistratie</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-secondary/50 border border-border rounded-lg p-0.5">
            <button onClick={() => setView("week")} className={`p-1.5 rounded ${view === "week" ? "bg-accent text-foreground" : "text-muted-foreground"}`}>
              <CalendarDays className="w-4 h-4" />
            </button>
            <button onClick={() => setView("list")} className={`p-1.5 rounded ${view === "list" ? "bg-accent text-foreground" : "text-muted-foreground"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setManualOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-border rounded-xl hover:bg-accent transition-all active:scale-[0.97]">
            <Plus className="w-3.5 h-3.5" /> Uren invoeren
          </button>
          <button onClick={exportCSV} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-border rounded-xl hover:bg-accent transition-all active:scale-[0.97]">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} className="px-3 py-1.5 text-xs bg-secondary/50 border border-border rounded-xl focus:outline-none appearance-none">
          <option value="today">Vandaag</option>
          <option value="week">Deze week</option>
          <option value="month">Deze maand</option>
          <option value="all">Alles</option>
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-3 py-1.5 text-xs bg-secondary/50 border border-border rounded-xl focus:outline-none appearance-none">
          <option value="">Alle categorieën</option>
          {categories.map(c => <option key={c} value={c}>{categoryLabels[c]}</option>)}
        </select>
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek..." className="w-full pl-9 pr-3 py-1.5 text-sm bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : view === "week" ? (
        <WeekView weekDays={weekDays} entries={filteredEntries} navigate={navigate} />
      ) : (
        <ListView entries={filteredEntries} navigate={navigate} onDelete={deleteEntry} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Uren deze week" value={formatDuration(totalWeekMinutes)} icon={<Clock className="w-4 h-4 text-muted-foreground" />} />
        <StatCard label="Gem. uren per voertuig" value={formatDuration(avgPerVehicle)} icon={<Clock className="w-4 h-4 text-muted-foreground" />} />
        <StatCard label="Meeste uren deze week" value={getMostActiveUser(weekEntries)} icon={<Clock className="w-4 h-4 text-muted-foreground" />} />
      </div>

      {/* Start Timer Dialog */}
      <StartTimerDialog open={startOpen} onClose={() => setStartOpen(false)} vehicles={teKoopVehicles} customers={customers} onStart={startTimer} />
      {/* Manual Entry Dialog */}
      <ManualEntryDialog open={manualOpen} onClose={() => setManualOpen(false)} vehicles={teKoopVehicles} customers={customers} onSave={addManualEntry} />
      {/* Stop Timer Dialog */}
      <StopTimerDialog open={stopOpen} onClose={() => setStopOpen(false)} activeTimer={activeTimer} onStop={stopTimer} elapsed={formatElapsed(elapsed)} />
    </div>
  );
};

const getMostActiveUser = (entries: TimeEntry[]) => {
  const map: Record<string, number> = {};
  entries.forEach(e => {
    const name = (e as any).profiles?.display_name || "Medewerker";
    map[name] = (map[name] || 0) + (e.duration_minutes || 0);
  });
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return "—";
  return `${sorted[0][0]} (${formatDuration(sorted[0][1])})`;
};

const StatCard = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
    {icon}
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  </div>
);

/* ── Week View ── */
const WeekView = ({ weekDays, entries, navigate }: { weekDays: Date[]; entries: TimeEntry[]; navigate: any }) => {
  const dayNames = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDays.map((day, i) => {
        const dayStr = day.toISOString().split("T")[0];
        const dayEntries = entries.filter(e => e.start_time.startsWith(dayStr));
        const isToday = new Date().toISOString().split("T")[0] === dayStr;
        return (
          <div key={i} className={`bg-card border rounded-xl p-2 min-h-[120px] ${isToday ? "border-emerald-500/40" : "border-border"}`}>
            <p className={`text-[10px] font-medium mb-1.5 ${isToday ? "text-emerald-400" : "text-muted-foreground"}`}>
              {dayNames[i]} {day.getDate()}
            </p>
            <div className="space-y-1">
              {dayEntries.map(e => (
                <div
                  key={e.id}
                  onClick={() => e.vehicle_id && navigate(`/admin/voertuigen/${e.vehicle_id}`)}
                  className={`px-1.5 py-1 rounded-lg text-[10px] border cursor-pointer hover:opacity-80 ${categoryColors[e.category]}`}
                >
                  <p className="truncate font-medium">{e.description}</p>
                  <p className="truncate text-[9px] opacity-70">{formatDuration(e.duration_minutes)}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ── List View ── */
const ListView = ({ entries, navigate, onDelete }: { entries: TimeEntry[]; navigate: any; onDelete: (id: string) => void }) => (
  <div className="border border-border rounded-xl overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-secondary/30 border-b border-border">
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Datum</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Voertuig / Klant</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Omschrijving</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Categorie</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Duur</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">Geen uren gevonden</td></tr>
          )}
          {entries.map(e => (
            <tr key={e.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(e.start_time).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</td>
              <td className="px-4 py-3">
                {e.vehicles ? (
                  <button onClick={() => navigate(`/admin/voertuigen/${e.vehicle_id}`)} className="text-foreground hover:underline">{e.vehicles.merk} {e.vehicles.model}</button>
                ) : e.customers ? (
                  <button onClick={() => navigate(`/admin/klanten/${e.customer_id}`)} className="text-foreground hover:underline">{e.customers.voornaam} {e.customers.achternaam}</button>
                ) : <span className="text-muted-foreground">—</span>}
              </td>
              <td className="px-4 py-3 text-foreground max-w-[200px] truncate">{e.description}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded border whitespace-nowrap ${categoryColors[e.category]}`}>
                  {categoryLabels[e.category] || e.category}
                </span>
              </td>
              <td className="px-4 py-3 text-foreground font-medium whitespace-nowrap">
                {e.end_time ? formatDuration(e.duration_minutes) : <span className="text-emerald-400 animate-pulse">Loopt...</span>}
              </td>
              <td className="px-2 py-3">
                <button onClick={() => onDelete(e.id)} className="p-1 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/* ── Start Timer Dialog ── */
const StartTimerDialog = ({ open, onClose, vehicles, customers, onStart }: any) => {
  const [form, setForm] = useState({ vehicle_id: "", customer_id: "", description: "", category: "overig" });
  const [saving, setSaving] = useState(false);
  const [linkType, setLinkType] = useState<"vehicle" | "customer">("vehicle");

  const handleStart = async () => {
    if (!form.description.trim()) return;
    setSaving(true);
    try {
      await onStart({
        vehicle_id: linkType === "vehicle" ? form.vehicle_id : undefined,
        customer_id: linkType === "customer" ? form.customer_id : undefined,
        description: form.description,
        category: form.category,
      });
      setForm({ vehicle_id: "", customer_id: "", description: "", category: "overig" });
      onClose();
    } catch {}
    setSaving(false);
  };

  const inputCls = "w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader><DialogTitle className="text-base font-medium">Timer starten</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Omschrijving *</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls} placeholder="Wat ga je doen?" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Categorie</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={`${inputCls} appearance-none`}>
              {categories.map(c => <option key={c} value={c}>{categoryLabels[c]}</option>)}
            </select>
          </div>
          <div className="flex gap-0.5 bg-secondary/50 border border-border rounded-md p-0.5">
            <button onClick={() => setLinkType("vehicle")} className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${linkType === "vehicle" ? "bg-accent text-foreground" : "text-muted-foreground"}`}>Voertuig</button>
            <button onClick={() => setLinkType("customer")} className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${linkType === "customer" ? "bg-accent text-foreground" : "text-muted-foreground"}`}>Klant</button>
          </div>
          {linkType === "vehicle" ? (
            <select value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })} className={`${inputCls} appearance-none`}>
              <option value="">Geen voertuig</option>
              {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.merk} {v.model} {v.kenteken ? `(${v.kenteken})` : ""}</option>)}
            </select>
          ) : (
            <select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })} className={`${inputCls} appearance-none`}>
              <option value="">Geen klant</option>
              {customers.map((c: any) => <option key={c.id} value={c.id}>{c.voornaam} {c.achternaam}</option>)}
            </select>
          )}
          <button onClick={handleStart} disabled={saving || !form.description.trim()} className="w-full py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
            <Play className="w-4 h-4" /> {saving ? "Starten..." : "Start timer"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ── Manual Entry Dialog ── */
const ManualEntryDialog = ({ open, onClose, vehicles, customers, onSave }: any) => {
  const [form, setForm] = useState({ vehicle_id: "", customer_id: "", description: "", category: "overig", date: new Date().toISOString().split("T")[0], start_hour: "09:00", end_hour: "10:00" });
  const [saving, setSaving] = useState(false);
  const [linkType, setLinkType] = useState<"vehicle" | "customer">("vehicle");

  const handleSave = async () => {
    if (!form.description.trim()) return;
    setSaving(true);
    try {
      await onSave({
        vehicle_id: linkType === "vehicle" ? form.vehicle_id : undefined,
        customer_id: linkType === "customer" ? form.customer_id : undefined,
        description: form.description,
        category: form.category,
        date: form.date,
        start_hour: form.start_hour,
        end_hour: form.end_hour,
      });
      onClose();
    } catch {}
    setSaving(false);
  };

  const inputCls = "w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader><DialogTitle className="text-base font-medium">Uren handmatig invoeren</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Datum</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Starttijd</label>
              <input type="time" value={form.start_hour} onChange={e => setForm({ ...form, start_hour: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Eindtijd</label>
              <input type="time" value={form.end_hour} onChange={e => setForm({ ...form, end_hour: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Omschrijving *</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls} placeholder="Wat heb je gedaan?" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Categorie</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={`${inputCls} appearance-none`}>
              {categories.map(c => <option key={c} value={c}>{categoryLabels[c]}</option>)}
            </select>
          </div>
          <div className="flex gap-0.5 bg-secondary/50 border border-border rounded-md p-0.5">
            <button onClick={() => setLinkType("vehicle")} className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${linkType === "vehicle" ? "bg-accent text-foreground" : "text-muted-foreground"}`}>Voertuig</button>
            <button onClick={() => setLinkType("customer")} className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${linkType === "customer" ? "bg-accent text-foreground" : "text-muted-foreground"}`}>Klant</button>
          </div>
          {linkType === "vehicle" ? (
            <select value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })} className={`${inputCls} appearance-none`}>
              <option value="">Geen voertuig</option>
              {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.merk} {v.model} {v.kenteken ? `(${v.kenteken})` : ""}</option>)}
            </select>
          ) : (
            <select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })} className={`${inputCls} appearance-none`}>
              <option value="">Geen klant</option>
              {customers.map((c: any) => <option key={c.id} value={c.id}>{c.voornaam} {c.achternaam}</option>)}
            </select>
          )}
          <button onClick={handleSave} disabled={saving || !form.description.trim()} className="w-full py-2.5 text-sm font-medium bg-foreground text-background rounded-xl hover:bg-foreground/90 transition-all active:scale-[0.98] disabled:opacity-50">
            {saving ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ── Stop Timer Dialog ── */
const StopTimerDialog = ({ open, onClose, activeTimer, onStop, elapsed }: any) => {
  const [endNote, setEndNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleStop = async () => {
    if (!activeTimer) return;
    setSaving(true);
    try {
      await onStop(activeTimer.id, endNote);
      setEndNote("");
      onClose();
    } catch {}
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader><DialogTitle className="text-base font-medium">Timer stoppen</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="text-center">
            <p className="text-3xl font-mono font-bold text-foreground tabular-nums">{elapsed}</p>
            <p className="text-xs text-muted-foreground mt-1">{activeTimer?.description}</p>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Eindnotitie (optioneel)</label>
            <textarea value={endNote} onChange={e => setEndNote(e.target.value)} className="w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-ring resize-none" rows={2} placeholder="Wat heb je afgerond?" />
          </div>
          <button onClick={handleStop} disabled={saving} className="w-full py-2.5 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
            <Square className="w-4 h-4" /> {saving ? "Stoppen..." : "Stop & opslaan"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminUrenPage;

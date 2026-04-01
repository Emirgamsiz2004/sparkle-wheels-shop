import { useState, useMemo, useEffect } from "react";
import { useLeads, Lead, leadStatusLabels, leadStatusColors, bronOptions, verlorenRedenen } from "@/hooks/useLeads";
import { useCustomers } from "@/hooks/useCustomers";
import { useVehicles } from "@/hooks/useVehicles";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Loader2, List, LayoutGrid, AlertTriangle, Phone, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const kanbanStatuses = ["nieuw", "in_gesprek", "offerte", "beslissing"] as const;

const AdminLeadsPage = () => {
  const { leads, loading, addLead, updateLeadStatus, overdueCount } = useLeads();
  const { customers } = useCustomers();
  const { vehicles } = useVehicles();
  const navigate = useNavigate();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [addOpen, setAddOpen] = useState(false);
  const [verlorenTab, setVerlorenTab] = useState(false);
  const [search, setSearch] = useState("");

  // Form state
  const [form, setForm] = useState({ customer_id: "", vehicle_id: "", bron: "website", volgende_actie: "", volgende_actie_datum: "", notitie: "" });
  const [saving, setSaving] = useState(false);

  // Drag state
  const [dragId, setDragId] = useState<string | null>(null);

  const activeLeads = useMemo(() => leads.filter(l => l.status !== "verloren" && l.status !== "gewonnen"), [leads]);
  const verlorenLeads = useMemo(() => leads.filter(l => l.status === "verloren"), [leads]);

  const filteredLeads = useMemo(() => {
    let list = verlorenTab ? verlorenLeads : activeLeads;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        `${l.customer?.voornaam} ${l.customer?.achternaam}`.toLowerCase().includes(q) ||
        `${l.vehicle?.merk} ${l.vehicle?.model}`.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeLeads, verlorenLeads, verlorenTab, search]);

  const handleAdd = async () => {
    if (!form.customer_id) { toast.error("Selecteer een klant"); return; }
    setSaving(true);
    try {
      const notities_log = form.notitie ? [{ tekst: form.notitie, datum: new Date().toISOString() }] : [];
      await addLead({
        customer_id: form.customer_id,
        vehicle_id: form.vehicle_id || undefined,
        bron: form.bron,
        volgende_actie: form.volgende_actie || undefined,
        volgende_actie_datum: form.volgende_actie_datum || undefined,
        notities_log,
      });
      setForm({ customer_id: "", vehicle_id: "", bron: "website", volgende_actie: "", volgende_actie_datum: "", notitie: "" });
      setAddOpen(false);
    } catch {}
    setSaving(false);
  };

  const handleDrop = async (status: string) => {
    if (!dragId) return;
    await updateLeadStatus(dragId, status);
    setDragId(null);
  };

  const isOverdue = (l: Lead) => l.volgende_actie_datum && new Date(l.volgende_actie_datum) < new Date();
  const isStale = (l: Lead) => {
    const diff = Date.now() - new Date(l.laatste_activiteit).getTime();
    return diff > 14 * 24 * 60 * 60 * 1000;
  };

  const inputCls = "w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-ring";
  const selectCls = "w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-ring appearance-none";

  const teKoopVehicles = vehicles.filter(v => ["te_koop", "consignatie", "in_behandeling"].includes(v.status));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium text-foreground">Leads</h1>
          {overdueCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
              <AlertTriangle className="w-3 h-3" /> {overdueCount} actie vereist
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-secondary/50 border border-border rounded-lg p-0.5">
            <button onClick={() => setView("kanban")} className={`p-1.5 rounded ${view === "kanban" ? "bg-accent text-foreground" : "text-muted-foreground"}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setView("list")} className={`p-1.5 rounded ${view === "list" ? "bg-accent text-foreground" : "text-muted-foreground"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-foreground text-background rounded-xl hover:bg-foreground/90 transition-all active:scale-[0.97]"
          >
            <Plus className="w-3.5 h-3.5" /> Nieuwe lead
          </button>
        </div>
      </div>

      {/* Tabs: Active / Verloren */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-0.5 bg-secondary/50 border border-border rounded-md p-0.5">
          <button onClick={() => setVerlorenTab(false)} className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${!verlorenTab ? "bg-accent text-foreground" : "text-muted-foreground"}`}>
            Actief ({activeLeads.length})
          </button>
          <button onClick={() => setVerlorenTab(true)} className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${verlorenTab ? "bg-accent text-foreground" : "text-muted-foreground"}`}>
            Verloren ({verlorenLeads.length})
          </button>
        </div>
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Zoek..." className="w-full pl-9 pr-3 py-1.5 text-sm bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : verlorenTab || view === "list" ? (
        <ListView leads={filteredLeads} navigate={navigate} isOverdue={isOverdue} isStale={isStale} />
      ) : (
        <KanbanView leads={filteredLeads} navigate={navigate} isOverdue={isOverdue} isStale={isStale} dragId={dragId} setDragId={setDragId} onDrop={handleDrop} />
      )}

      {/* Add Lead Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">Nieuwe lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Klant</label>
              <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} className={selectCls}>
                <option value="">Selecteer klant...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.voornaam} {c.achternaam}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Interesse in voertuig</label>
              <select value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} className={selectCls}>
                <option value="">Geen specifiek voertuig</option>
                {teKoopVehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.merk} {v.model} {v.bouwjaar} {v.kenteken ? `(${v.kenteken})` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Bron</label>
              <select value={form.bron} onChange={(e) => setForm({ ...form, bron: e.target.value })} className={selectCls}>
                {bronOptions.map((b) => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Volgende actie</label>
                <input value={form.volgende_actie} onChange={(e) => setForm({ ...form, volgende_actie: e.target.value })} className={inputCls} placeholder="Bv. Nabellen" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Actie datum</label>
                <input type="date" value={form.volgende_actie_datum} onChange={(e) => setForm({ ...form, volgende_actie_datum: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Notitie</label>
              <textarea value={form.notitie} onChange={(e) => setForm({ ...form, notitie: e.target.value })} className={`${inputCls} resize-none`} rows={2} placeholder="Eerste notitie..." />
            </div>
            <button onClick={handleAdd} disabled={saving} className="w-full py-2.5 text-sm font-medium bg-foreground text-background rounded-xl hover:bg-foreground/90 transition-all active:scale-[0.98] disabled:opacity-50">
              {saving ? "Opslaan..." : "Lead aanmaken"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ── Kanban ── */
const KanbanView = ({ leads, navigate, isOverdue, isStale, dragId, setDragId, onDrop }: any) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {kanbanStatuses.map((status) => {
      const col = leads.filter((l: Lead) => l.status === status);
      return (
        <div
          key={status}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => onDrop(status)}
          className="bg-secondary/20 border border-border rounded-xl p-3 min-h-[200px]"
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded border ${leadStatusColors[status]}`}>
              {leadStatusLabels[status]}
            </span>
            <span className="text-xs text-muted-foreground">{col.length}</span>
          </div>
          <div className="space-y-2">
            {col.map((l: Lead) => (
              <LeadCard key={l.id} lead={l} navigate={navigate} isOverdue={isOverdue(l)} isStale={isStale(l)} onDragStart={() => setDragId(l.id)} />
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

const LeadCard = ({ lead, navigate, isOverdue, isStale, onDragStart }: { lead: Lead; navigate: any; isOverdue: boolean; isStale: boolean; onDragStart: () => void }) => (
  <div
    draggable
    onDragStart={onDragStart}
    onClick={() => navigate(`/admin/leads/${lead.id}`)}
    className={`bg-card border rounded-xl p-3 cursor-pointer hover:bg-accent/20 transition-colors ${
      isOverdue ? "border-red-500/50" : isStale ? "border-orange-500/40" : "border-border"
    }`}
  >
    <p className="text-sm font-medium text-foreground truncate">{lead.customer?.voornaam} {lead.customer?.achternaam}</p>
    {lead.vehicle && <p className="text-xs text-muted-foreground truncate">{lead.vehicle.merk} {lead.vehicle.model}</p>}
    <div className="flex items-center justify-between mt-2">
      <span className="text-[10px] text-muted-foreground">
        {new Date(lead.laatste_activiteit).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
      </span>
      {lead.volgende_actie && (
        <span className={`text-[10px] truncate max-w-[60%] text-right ${isOverdue ? "text-red-400 font-medium" : "text-muted-foreground"}`}>
          {lead.volgende_actie}
        </span>
      )}
    </div>
  </div>
);

/* ── List view ── */
const ListView = ({ leads, navigate, isOverdue, isStale }: any) => (
  <div className="border border-border rounded-xl overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-secondary/30 border-b border-border">
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Klant</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Voertuig</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Bron</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Volgende actie</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l: Lead) => (
            <tr
              key={l.id}
              onClick={() => navigate(`/admin/leads/${l.id}`)}
              className={`border-b border-border/50 hover:bg-accent/30 cursor-pointer transition-colors ${isOverdue(l) ? "bg-red-500/5" : isStale(l) ? "bg-orange-500/5" : ""}`}
            >
              <td className="px-4 py-3 font-medium text-foreground">{l.customer?.voornaam} {l.customer?.achternaam}</td>
              <td className="px-4 py-3 text-muted-foreground">{l.vehicle ? `${l.vehicle.merk} ${l.vehicle.model}` : "—"}</td>
              <td className="px-4 py-3 text-muted-foreground capitalize">{l.bron}</td>
              <td className="px-4 py-3">
                {l.volgende_actie ? (
                  <span className={isOverdue(l) ? "text-red-400" : "text-muted-foreground"}>{l.volgende_actie} {l.volgende_actie_datum ? `(${new Date(l.volgende_actie_datum).toLocaleDateString("nl-NL")})` : ""}</span>
                ) : "—"}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded border whitespace-nowrap ${leadStatusColors[l.status]}`}>
                  {leadStatusLabels[l.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default AdminLeadsPage;

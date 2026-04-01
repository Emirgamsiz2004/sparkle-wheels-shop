import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLeads, Lead, leadStatusLabels, leadStatusColors, verlorenRedenen } from "@/hooks/useLeads";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Phone, MessageCircle, ChevronDown, Loader2, XCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const activeStatuses = ["nieuw", "in_gesprek", "offerte", "beslissing"] as const;

const AdminLeadDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { leads, loading, updateLead, updateLeadStatus, addNote } = useLeads();
  const [activeTab, setActiveTab] = useState("detail");
  const [verlorenOpen, setVerlorenOpen] = useState(false);
  const [verlorenReden, setVerlorenReden] = useState("");

  const lead = leads.find(l => l.id === id);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  if (!lead) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground text-sm mb-4">Lead niet gevonden</p>
      <button onClick={() => navigate("/admin/leads")} className="text-sm hover:underline">Terug</button>
    </div>
  );

  const isOverdue = lead.volgende_actie_datum && new Date(lead.volgende_actie_datum) < new Date();
  const phone = lead.customer?.telefoon;

  const handleVerloren = async () => {
    await updateLeadStatus(lead.id, "verloren", `Verloren: ${verlorenReden || "Geen reden"}`);
    await updateLead(lead.id, { verloren_reden: verlorenReden } as any);
    setVerlorenOpen(false);
    toast.success("Lead als verloren gemarkeerd");
  };

  return (
    <div className="space-y-5">
      <button onClick={() => navigate("/admin/leads")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Terug
      </button>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-lg font-medium text-foreground">{lead.customer?.voornaam} {lead.customer?.achternaam}</h1>
          <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded border whitespace-nowrap ${leadStatusColors[lead.status]}`}>
            {leadStatusLabels[lead.status]}
          </span>
        </div>
        {lead.vehicle && (
          <p className="text-sm text-muted-foreground">
            Interesse: <button onClick={() => navigate(`/admin/voertuigen/${lead.vehicle?.id}`)} className="hover:underline">{lead.vehicle.merk} {lead.vehicle.model} {lead.vehicle.kenteken && `(${lead.vehicle.kenteken})`}</button>
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {phone && (
            <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-xl hover:bg-accent transition-all active:scale-[0.97]">
              <Phone className="w-3.5 h-3.5" /> Bellen
            </a>
          )}
          {phone && (
            <a href={`https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "31")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-emerald-500/30 text-emerald-400 rounded-xl hover:bg-emerald-500/10 transition-all active:scale-[0.97]">
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
          )}

          {lead.status !== "verloren" && lead.status !== "gewonnen" && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-xl hover:bg-accent transition-all active:scale-[0.97]">
                    Status wijzigen <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="rounded-xl p-1">
                  {activeStatuses.map((s) => (
                    <DropdownMenuItem key={s} onClick={() => updateLeadStatus(lead.id, s)} className={`rounded-lg ${lead.status === s ? "bg-accent" : ""}`}>
                      <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-lg border mr-2 ${leadStatusColors[s]}`}>
                        {leadStatusLabels[s]}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <button onClick={() => setVerlorenOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 transition-all active:scale-[0.97]">
                <XCircle className="w-3.5 h-3.5" /> Verloren markeren
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-secondary/50 border border-border rounded-md p-0.5">
        {[{ key: "detail", label: "Detail" }, { key: "geschiedenis", label: "Geschiedenis" }].map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${activeTab === t.key ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "detail" && <DetailTab lead={lead} onUpdate={updateLead} onAddNote={addNote} isOverdue={!!isOverdue} />}
      {activeTab === "geschiedenis" && <GeschiedenisTab leadId={lead.id} />}

      {/* Verloren dialog */}
      <Dialog open={verlorenOpen} onOpenChange={setVerlorenOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="text-base font-medium">Lead als verloren markeren</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Reden</label>
              <select value={verlorenReden} onChange={(e) => setVerlorenReden(e.target.value)} className="w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">Selecteer reden...</option>
                {verlorenRedenen.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button onClick={handleVerloren} className="w-full py-2.5 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all active:scale-[0.98]">
              Bevestigen
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ── Detail Tab ── */
const DetailTab = ({ lead, onUpdate, onAddNote, isOverdue }: { lead: Lead; onUpdate: (id: string, u: Partial<Lead>) => Promise<void>; onAddNote: (id: string, t: string) => Promise<void>; isOverdue: boolean }) => {
  const [actie, setActie] = useState(lead.volgende_actie || "");
  const [actieDatum, setActieDatum] = useState(lead.volgende_actie_datum || "");
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSaveActie = async () => {
    await onUpdate(lead.id, { volgende_actie: actie, volgende_actie_datum: actieDatum || null } as any);
    toast.success("Actie opgeslagen");
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    await onAddNote(lead.id, newNote.trim());
    setNewNote("");
    setSaving(false);
  };

  const inputCls = "w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="space-y-4">
      {/* Lead info */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lead informatie</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-xs text-muted-foreground">Bron</span><p className="text-foreground capitalize">{lead.bron}</p></div>
          <div><span className="text-xs text-muted-foreground">Aangemaakt</span><p className="text-foreground">{new Date(lead.created_at).toLocaleDateString("nl-NL")}</p></div>
          <div><span className="text-xs text-muted-foreground">Laatste activiteit</span><p className="text-foreground">{new Date(lead.laatste_activiteit).toLocaleDateString("nl-NL")}</p></div>
          {lead.verloren_reden && <div><span className="text-xs text-muted-foreground">Verloren reden</span><p className="text-red-400">{lead.verloren_reden}</p></div>}
        </div>
      </div>

      {/* Volgende actie */}
      <div className={`bg-card border rounded-xl p-4 space-y-3 ${isOverdue ? "border-red-500/50" : "border-border"}`}>
        <h3 className={`text-xs font-medium uppercase tracking-wider ${isOverdue ? "text-red-400" : "text-muted-foreground"}`}>
          Volgende actie {isOverdue && "— VERLOPEN"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Actie</label>
            <input value={actie} onChange={(e) => setActie(e.target.value)} className={inputCls} placeholder="Bv. Nabellen" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Datum</label>
            <input type="date" value={actieDatum} onChange={(e) => setActieDatum(e.target.value)} className={inputCls} />
          </div>
        </div>
        <button onClick={handleSaveActie} className="px-3 py-1.5 text-xs font-medium border border-border rounded-xl hover:bg-accent transition-colors">Opslaan</button>
      </div>

      {/* Notities log */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gesprekslog</h3>
        <div className="flex gap-2">
          <input value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddNote()} className={`${inputCls} flex-1`} placeholder="Notitie toevoegen..." />
          <button onClick={handleAddNote} disabled={saving} className="px-3 py-2 text-xs font-medium bg-foreground text-background rounded-xl hover:bg-foreground/90 transition-all disabled:opacity-50">
            Toevoegen
          </button>
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {[...(lead.notities_log || [])].reverse().map((n, i) => (
            <div key={i} className="flex gap-3 py-2 border-b border-border/50 last:border-0">
              <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5">
                {new Date(n.datum).toLocaleDateString("nl-NL")} {new Date(n.datum).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <p className="text-sm text-foreground">{n.tekst}</p>
            </div>
          ))}
          {(!lead.notities_log || lead.notities_log.length === 0) && (
            <p className="text-xs text-muted-foreground">Nog geen notities</p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Geschiedenis Tab ── */
const GeschiedenisTab = ({ leadId }: { leadId: string }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("lead_history").select("*").eq("lead_id", leadId).order("created_at", { ascending: false });
      setHistory(data || []);
      setLoading(false);
    };
    load();
  }, [leadId]);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  if (history.length === 0) return <p className="text-sm text-muted-foreground text-center py-10">Nog geen geschiedenis</p>;

  return (
    <div className="space-y-1">
      {history.map((h) => (
        <div key={h.id} className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl">
          <div className="w-2 h-2 rounded-full bg-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">{h.beschrijving}</p>
            {h.oude_status && h.nieuwe_status && (
              <p className="text-xs text-muted-foreground">
                {leadStatusLabels[h.oude_status] || h.oude_status} → {leadStatusLabels[h.nieuwe_status] || h.nieuwe_status}
              </p>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {new Date(h.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
          </span>
        </div>
      ))}
    </div>
  );
};

export default AdminLeadDetailPage;

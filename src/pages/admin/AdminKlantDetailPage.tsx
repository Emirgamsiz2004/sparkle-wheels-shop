import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Customer, statusLabels, statusColors, useCustomers } from "@/hooks/useCustomers";
import { ArrowLeft, Phone, MessageCircle, Loader2, ChevronDown, FileText, Download, Trash2, Plus, ExternalLink } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import ConfirmPopover from "@/components/admin/ConfirmPopover";
import SearchSelectPopover, { SearchOption } from "@/components/admin/SearchSelectPopover";
import { deleteCustomerSafely } from "@/lib/customerDelete";

const allStatuses: Customer["status"][] = ["prospect", "klant", "inactief"];

const AdminKlantDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, loading, updateCustomer } = useCustomers();
  const [activeTab, setActiveTab] = useState("profiel");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteAnchor, setDeleteAnchor] = useState<DOMRect | null>(null);
  const deleteBtnRef = useRef<HTMLButtonElement>(null);

  const customer = customers.find((c) => c.id === id);

  const openDelete = () => {
    setDeleteAnchor(deleteBtnRef.current?.getBoundingClientRect() ?? null);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!customer) return;
    const ok = await deleteCustomerSafely(customer.id);
    if (ok) navigate("/admin/klanten");
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  if (!customer) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground text-sm mb-4">Klant niet gevonden</p>
      <button onClick={() => navigate("/admin/klanten")} className="text-sm hover:underline">Terug</button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Back */}
      <button onClick={() => navigate("/admin/klanten")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Terug
      </button>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-lg font-medium text-foreground">{customer.voornaam} {customer.achternaam}</h1>
          <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded border whitespace-nowrap ${statusColors[customer.status]}`}>
            {statusLabels[customer.status]}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {customer.telefoon && <span>{customer.telefoon}</span>}
          <span>{customer.email}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {customer.telefoon && (
            <a href={`tel:${customer.telefoon}`} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-xl hover:bg-accent hover:border-accent transition-all active:scale-[0.97]">
              <Phone className="w-3.5 h-3.5" /> Bellen
            </a>
          )}
          {customer.telefoon && (
            <a href={`https://wa.me/${customer.telefoon.replace(/\D/g, "").replace(/^0/, "31")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-emerald-500/30 text-emerald-400 rounded-xl hover:bg-emerald-500/10 transition-all active:scale-[0.97]">
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-xl hover:bg-accent hover:border-accent transition-all active:scale-[0.97]">
                Status wijzigen <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="rounded-xl p-1">
              {allStatuses.map((s) => (
                <DropdownMenuItem key={s} onClick={() => updateCustomer(customer.id, { status: s })} className={`rounded-lg ${customer.status === s ? "bg-accent" : ""}`}>
                  <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-lg border mr-2 ${statusColors[s]}`}>
                    {statusLabels[s]}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-secondary/50 border border-border rounded-md p-0.5">
        {[{ key: "profiel", label: "Profiel" }, { key: "geschiedenis", label: "Geschiedenis" }, { key: "documenten", label: "Documenten" }].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === t.key ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "profiel" && <ProfielTab customer={customer} onUpdate={updateCustomer} />}
      {activeTab === "geschiedenis" && <GeschiedenisTab customerId={customer.id} customerEmail={customer.email} />}
      {activeTab === "documenten" && <DocumentenTab customerEmail={customer.email} customerNaam={`${customer.voornaam} ${customer.achternaam}`} />}
    </div>
  );
};

/* ── Profiel Tab ── */
const ProfielTab = ({ customer, onUpdate }: { customer: Customer; onUpdate: (id: string, u: Partial<Customer>) => Promise<void> }) => {
  const [form, setForm] = useState({ ...customer });
  const [notes, setNotes] = useState(customer.notities || "");
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveField = async (field: string, value: any) => {
    await onUpdate(customer.id, { [field]: value } as any);
  };

  const handleNotesChange = (val: string) => {
    setNotes(val);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(async () => {
      await onUpdate(customer.id, { notities: val });
    }, 2000);
  };

  useEffect(() => {
    return () => { if (notesTimer.current) clearTimeout(notesTimer.current); };
  }, []);

  const inputCls = "w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contactgegevens</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EditField label="Voornaam" value={form.voornaam} onChange={(v) => setForm({ ...form, voornaam: v })} onBlur={() => saveField("voornaam", form.voornaam)} inputCls={inputCls} />
          <EditField label="Achternaam" value={form.achternaam} onChange={(v) => setForm({ ...form, achternaam: v })} onBlur={() => saveField("achternaam", form.achternaam)} inputCls={inputCls} />
          <EditField label="Telefoonnummer" value={form.telefoon} onChange={(v) => setForm({ ...form, telefoon: v })} onBlur={() => saveField("telefoon", form.telefoon)} inputCls={inputCls} />
          <EditField label="E-mailadres" value={form.email} onChange={(v) => setForm({ ...form, email: v })} onBlur={() => saveField("email", form.email)} inputCls={inputCls} />
          <EditField label="Adres" value={form.adres || ""} onChange={(v) => setForm({ ...form, adres: v })} onBlur={() => saveField("adres", form.adres)} inputCls={inputCls} />
          <EditField label="Postcode" value={form.postcode || ""} onChange={(v) => setForm({ ...form, postcode: v })} onBlur={() => saveField("postcode", form.postcode)} inputCls={inputCls} />
          <EditField label="Plaats" value={form.plaats || ""} onChange={(v) => setForm({ ...form, plaats: v })} onBlur={() => saveField("plaats", form.plaats)} inputCls={inputCls} />
          <EditField label="Geboortedatum" value={form.geboortedatum || ""} onChange={(v) => setForm({ ...form, geboortedatum: v })} onBlur={() => saveField("geboortedatum", form.geboortedatum)} inputCls={inputCls} type="date" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Interne notities</h3>
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Notities over deze klant..."
          rows={5}
          className="w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-ring resize-none placeholder:text-muted-foreground/50"
        />
        <p className="text-[10px] text-muted-foreground">Wordt automatisch opgeslagen na 2 seconden</p>
      </div>
    </div>
  );
};

const EditField = ({ label, value, onChange, onBlur, inputCls, type = "text" }: { label: string; value: string; onChange: (v: string) => void; onBlur: () => void; inputCls: string; type?: string }) => (
  <div>
    <label className="block text-xs text-muted-foreground mb-1">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} className={inputCls} />
  </div>
);

/* ── Geschiedenis Tab ── */
const GeschiedenisTab = ({ customerId, customerEmail }: { customerId: string; customerEmail: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ proefriten: 0, aankopen: 0, eersteContact: "", laatsteContact: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const timeline: any[] = [];

      // Proefritten via test_drive_customers email match
      const { data: tdCustomers } = await supabase.from("test_drive_customers").select("id").eq("email", customerEmail);
      const customerIds = tdCustomers?.map((c: any) => c.id) || [];

      if (customerIds.length > 0) {
        const { data: drives } = await supabase.from("test_drives").select("*").in("customer_id", customerIds).order("start_tijd", { ascending: false });
        (drives || []).forEach((d: any) => {
          timeline.push({
            type: "proefrit",
            date: d.start_tijd,
            label: `Proefrit — ${d.voertuig_merk || ""} ${d.voertuig_model || ""}`,
            sub: d.voertuig_kenteken ? `Kenteken: ${d.voertuig_kenteken}` : "",
            link: `/admin/proefriten`,
            id: d.id,
          });
        });
      }

      // Verkopen via vehicles.koper_email
      const { data: vehicles } = await supabase.from("vehicles").select("*").eq("koper_email", customerEmail);
      (vehicles || []).forEach((v: any) => {
        timeline.push({
          type: "verkoop",
          date: v.verkoop_datum || v.created_at,
          label: `Gekocht — ${v.merk} ${v.model} ${v.bouwjaar || ""}`,
          sub: v.kenteken ? `Kenteken: ${v.kenteken}` : "",
          link: `/admin/voertuigen/${v.id}`,
          id: v.id,
        });
      });

      timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setItems(timeline);

      const proefritCount = timeline.filter((t) => t.type === "proefrit").length;
      const aankoopCount = timeline.filter((t) => t.type === "verkoop").length;
      const dates = timeline.map((t) => new Date(t.date).getTime()).filter(Boolean);

      setStats({
        proefriten: proefritCount,
        aankopen: aankoopCount,
        eersteContact: dates.length ? new Date(Math.min(...dates)).toLocaleDateString("nl-NL") : "—",
        laatsteContact: dates.length ? new Date(Math.max(...dates)).toLocaleDateString("nl-NL") : "—",
      });
      setLoading(false);
    };
    load();
  }, [customerId, customerEmail]);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Proefritten" value={String(stats.proefriten)} />
        <StatCard label="Aankopen" value={String(stats.aankopen)} />
        <StatCard label="Eerste contact" value={stats.eersteContact} />
        <StatCard label="Laatste contact" value={stats.laatsteContact} />
      </div>

      {/* Timeline */}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">Nog geen geschiedenis</p>
      ) : (
        <div className="space-y-1">
          {items.map((item, i) => (
            <div
              key={i}
              onClick={() => item.link && navigate(item.link)}
              className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:bg-accent/30 cursor-pointer transition-colors"
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.type === "proefrit" ? "bg-blue-400" : "bg-emerald-400"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                {item.sub && <p className="text-xs text-muted-foreground">{item.sub}</p>}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(item.date).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-card border border-border rounded-xl p-3">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="text-base font-semibold text-foreground tabular-nums">{value}</p>
  </div>
);

/* ── Documenten Tab ── */
const DocumentenTab = ({ customerEmail, customerNaam }: { customerEmail: string; customerNaam: string }) => {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("document_archive")
        .select("*")
        .or(`klant_naam.ilike.%${customerNaam}%`)
        .order("created_at", { ascending: false });
      setDocs(data || []);
      setLoading(false);
    };
    load();
  }, [customerEmail, customerNaam]);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  if (docs.length === 0) return <p className="text-sm text-muted-foreground text-center py-10">Geen documenten gevonden</p>;

  const handleDownload = async (doc: any) => {
    if (!doc.file_path) return;
    const bucket = doc.storage_bucket || "vehicle-documents";
    const { data } = await supabase.storage.from(bucket).createSignedUrl(doc.file_path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-1">
      {docs.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{doc.document_type}</p>
              <p className="text-xs text-muted-foreground">{doc.kenteken || "—"} · {new Date(doc.created_at).toLocaleDateString("nl-NL")}</p>
            </div>
          </div>
          {doc.file_path && (
            <button onClick={() => handleDownload(doc)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminKlantDetailPage;

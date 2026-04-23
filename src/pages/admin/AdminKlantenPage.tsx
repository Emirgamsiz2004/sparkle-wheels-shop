import { useState, useMemo } from "react";
import { useCustomers, Customer, statusLabels, statusColors } from "@/hooks/useCustomers";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Loader2, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import SlidingTabs from "@/components/admin/SlidingTabs";
import { BADGE_BASE } from "@/components/admin/StatusBadge";

const allStatuses: Customer["status"][] = ["prospect", "klant", "inactief"];

const statusTabs = [
  { label: "Alle", value: "alle" },
  ...allStatuses.map((s) => ({ label: statusLabels[s], value: s })),
];

const AdminKlantenPage = () => {
  const { customers, loading, addCustomer } = useCustomers();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("alle");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ voornaam: "", achternaam: "", email: "", telefoon: "" });
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    let list = customers;
    if (statusFilter !== "alle") list = list.filter((c) => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          `${c.voornaam} ${c.achternaam}`.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.telefoon.includes(q)
      );
    }
    return list;
  }, [customers, search, statusFilter]);

  const handleAdd = async () => {
    if (!form.voornaam || !form.achternaam || !form.email) {
      toast.error("Vul naam en e-mail in");
      return;
    }
    setSaving(true);
    try {
      await addCustomer({ ...form, status: "prospect" } as any);
      setForm({ voornaam: "", achternaam: "", email: "", telefoon: "" });
      setAddOpen(false);
    } catch {}
    setSaving(false);
  };

  const formatDate = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-medium text-foreground">Klanten</h1>
          <p className="text-sm text-muted-foreground">{customers.length} klant{customers.length !== 1 ? "en" : ""}</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors active:scale-[0.97] shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Nieuw
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          <SlidingTabs tabs={statusTabs} value={statusFilter} onChange={setStatusFilter} className="min-w-max" />
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam, e-mail of telefoon..."
            className="w-full sm:max-w-xs pl-8 pr-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-md py-12 text-center text-sm text-muted-foreground">
          {customers.length === 0 ? "Nog geen klanten" : "Geen klanten gevonden"}
        </div>
      ) : isMobile ? (
        /* Mobile: card list */
        <div className="space-y-1.5">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/admin/klanten/${c.id}`)}
              className="w-full text-left flex items-center justify-between gap-3 bg-card border border-border rounded-md p-3 active:bg-accent/30 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{c.voornaam} {c.achternaam}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`${BADGE_BASE} ${statusColors[c.status]}`}>
                    {statusLabels[c.status]}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">{c.email}</span>
                </div>
                {c.telefoon && <p className="text-xs text-muted-foreground mt-0.5">{c.telefoon}</p>}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        /* Desktop: table */
        <div className="border border-border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/20 border-b border-border">
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-muted-foreground">Naam</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-muted-foreground">Telefoon</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-muted-foreground">E-mail</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-muted-foreground">Laatste contact</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/admin/klanten/${c.id}`)}
                    className="border-b border-border/50 hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2.5 text-foreground">{c.voornaam} {c.achternaam}</td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">{c.telefoon || "—"}</td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">{c.email}</td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">{formatDate(c.laatste_contact)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`${BADGE_BASE} ${statusColors[c.status]}`}>
                        {statusLabels[c.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">Klant toevoegen</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Voornaam</label>
                <input value={form.voornaam} onChange={(e) => setForm({ ...form, voornaam: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Achternaam</label>
                <input value={form.achternaam} onChange={(e) => setForm({ ...form, achternaam: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">E-mailadres</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Telefoonnummer</label>
              <input value={form.telefoon} onChange={(e) => setForm({ ...form, telefoon: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <button
              onClick={handleAdd}
              disabled={saving}
              className="w-full py-2.5 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? "Opslaan..." : "Klant toevoegen"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminKlantenPage;

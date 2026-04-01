import { useState, useMemo } from "react";
import { useCustomers, Customer, statusLabels, statusColors } from "@/hooks/useCustomers";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const allStatuses: Customer["status"][] = ["prospect", "geinteresseerd", "actief", "klant", "inactief"];

const AdminKlantenPage = () => {
  const { customers, loading, addCustomer } = useCustomers();
  const navigate = useNavigate();
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
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-lg font-medium text-foreground">Klanten</h1>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-foreground text-background rounded-xl hover:bg-foreground/90 transition-all active:scale-[0.97]"
        >
          <Plus className="w-3.5 h-3.5" /> Klant toevoegen
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam, e-mail of telefoon..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <FilterBtn label="Alle" active={statusFilter === "alle"} onClick={() => setStatusFilter("alle")} />
          {allStatuses.map((s) => (
            <FilterBtn key={s} label={statusLabels[s]} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-sm text-muted-foreground">
          {customers.length === 0 ? "Nog geen klanten" : "Geen klanten gevonden"}
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/30 border-b border-border">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Naam</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Telefoon</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">E-mail</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Laatste contact</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/admin/klanten/${c.id}`)}
                    className="border-b border-border/50 hover:bg-accent/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{c.voornaam} {c.achternaam}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.telefoon || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(c.laatste_contact)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded border whitespace-nowrap ${statusColors[c.status]}`}>
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
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">Klant toevoegen</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Voornaam</label>
                <input value={form.voornaam} onChange={(e) => setForm({ ...form, voornaam: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Achternaam</label>
                <input value={form.achternaam} onChange={(e) => setForm({ ...form, achternaam: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">E-mailadres</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Telefoonnummer</label>
              <input value={form.telefoon} onChange={(e) => setForm({ ...form, telefoon: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <button
              onClick={handleAdd}
              disabled={saving}
              className="w-full py-2.5 text-sm font-medium bg-foreground text-background rounded-xl hover:bg-foreground/90 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? "Opslaan..." : "Klant toevoegen"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const FilterBtn = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
      active ? "bg-accent text-foreground border-accent" : "text-muted-foreground border-border hover:text-foreground hover:bg-accent/50"
    }`}
  >
    {label}
  </button>
);

export default AdminKlantenPage;

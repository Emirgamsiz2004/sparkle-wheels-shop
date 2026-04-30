import { useState, useMemo, useRef } from "react";
import { useCustomers, Customer, statusLabels, statusColors } from "@/hooks/useCustomers";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Loader2, ChevronRight, Trash2 } from "lucide-react";
import AddCustomerPopover from "@/components/admin/customers/AddCustomerPopover";
import ConfirmPopover from "@/components/admin/ConfirmPopover";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import SlidingTabs from "@/components/admin/SlidingTabs";
import { BADGE_BASE } from "@/components/admin/StatusBadge";
import { deleteCustomerSafely } from "@/lib/customerDelete";

const allStatuses: Customer["status"][] = ["prospect", "klant", "inactief"];

const statusTabs = [
  { label: "Alle", value: "alle" },
  ...allStatuses.map((s) => ({ label: statusLabels[s], value: s })),
];

const AdminKlantenPage = () => {
  const { customers, loading, addCustomer, fetchCustomers } = useCustomers();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("alle");
  const [addOpen, setAddOpen] = useState(false);
  const [addAnchor, setAddAnchor] = useState<DOMRect | null>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleteAnchor, setDeleteAnchor] = useState<DOMRect | null>(null);

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

  const handleAdd = async (data: { voornaam: string; achternaam: string; email: string; telefoon: string }) => {
    await addCustomer({ ...data, status: "prospect" } as any);
  };

  const openAdd = () => {
    setAddAnchor(addBtnRef.current?.getBoundingClientRect() ?? null);
    setAddOpen(true);
  };

  const formatDate = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
  };

  const requestDelete = (e: React.MouseEvent, c: Customer) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteAnchor((e.currentTarget as HTMLElement).getBoundingClientRect());
    setDeleteTarget(c);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteCustomerSafely(deleteTarget.id);
    if (ok) await fetchCustomers();
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-medium text-foreground">Klanten</h1>
          <p className="text-sm text-muted-foreground">{customers.length} klant{customers.length !== 1 ? "en" : ""}</p>
        </div>
        <button
          ref={addBtnRef}
          onClick={openAdd}
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
                    className="border-b border-border/50 hover:bg-muted/70 cursor-pointer transition-colors"
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

      {/* Add popover */}
      <AddCustomerPopover
        open={addOpen}
        onOpenChange={setAddOpen}
        anchorRect={addAnchor}
        onSubmit={handleAdd}
      />
    </div>
  );
};

export default AdminKlantenPage;

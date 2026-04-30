import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Customer, statusLabels, statusColors, useCustomers } from "@/hooks/useCustomers";
import { ArrowLeft, Phone, MessageCircle, Loader2, ChevronDown, FileText, Download, Trash2, Plus, ExternalLink, X } from "lucide-react";
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
          <button
            ref={deleteBtnRef}
            onClick={openDelete}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 transition-all active:scale-[0.97] ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" /> Verwijder klant
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-secondary/50 border border-border rounded-md p-0.5">
        {[{ key: "profiel", label: "Profiel" }, { key: "verkopen", label: "Verkopen" }, { key: "geschiedenis", label: "Geschiedenis" }, { key: "documenten", label: "Documenten" }].map((t) => (
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
      {activeTab === "verkopen" && <GekoppeldeVerkopenSection customer={customer} />}
      {activeTab === "geschiedenis" && <GeschiedenisTab customerId={customer.id} customerEmail={customer.email} />}
      {activeTab === "documenten" && <DocumentenTab customerEmail={customer.email} customerNaam={`${customer.voornaam} ${customer.achternaam}`} />}

      <ConfirmPopover
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        anchorRect={deleteAnchor}
        title="Klant verwijderen"
        message={`Weet je zeker dat je ${customer.voornaam} ${customer.achternaam} wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`}
        confirmLabel="Verwijderen"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
};

/* ── Gekoppelde verkopen Section (used on Profiel + Verkopen tab) ── */
interface VerkoopRow {
  id: string;
  source: "verkopen" | "vehicle_sales" | "vehicles";
  vehicle_id: string | null;
  verkoopprijs: number | null;
  contract_getekend_datum: string | null;
  verkoop_datum?: string | null;
  created_at: string;
  stap11_afgerond: boolean | null;
  wizard_status: string | null;
  customer_id?: string | null;
  vehicle?: { merk: string; model: string; kenteken: string | null; verkoop_datum?: string | null } | null;
}

const splitSaleOptionId = (id: string): { source: VerkoopRow["source"]; id: string } => {
  const [source, saleId] = id.split(":");
  return {
    source: source === "vehicle_sales" || source === "vehicles" ? source : "verkopen",
    id: saleId || id,
  };
};

const GekoppeldeVerkopenSection = ({ customer }: { customer: Customer }) => {
  const customerId = customer.id;
  const customerEmail = customer.email?.trim();
  const [verkopen, setVerkopen] = useState<VerkoopRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkAnchor, setLinkAnchor] = useState<DOMRect | null>(null);
  const [available, setAvailable] = useState<SearchOption[]>([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [unlinkConfirm, setUnlinkConfirm] = useState<{ open: boolean; verkoopId: string | null; anchor: DOMRect | null; naam: string }>({ open: false, verkoopId: null, anchor: null, naam: "" });
  const [overwriteConfirm, setOverwriteConfirm] = useState<{ open: boolean; verkoopId: string | null; bestaandeNaam: string }>({ open: false, verkoopId: null, bestaandeNaam: "" });
  const linkBtnRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    const [wizardRes, legacyRes, vehicleCustomerRes, vehicleEmailRes] = await Promise.all([
      supabase
        .from("verkopen" as any)
        .select("id, vehicle_id, verkoopprijs, contract_getekend_datum, created_at, stap11_afgerond, wizard_status, customer_id")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false }),
      supabase
        .from("vehicle_sales" as any)
        .select("id, vehicle_id, customer_id, verkoopprijs, verkoop_datum, afleverdatum, created_at, status")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false }),
      supabase
        .from("vehicles" as any)
        .select("id, merk, model, kenteken, status, verkoop_datum, created_at, verkoopprijs, customer_id, koper_email")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false }),
      customerEmail
        ? supabase
            .from("vehicles" as any)
            .select("id, merk, model, kenteken, status, verkoop_datum, created_at, verkoopprijs, customer_id, koper_email")
            .ilike("koper_email", customerEmail)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as any[], error: null }),
    ]);
    if (wizardRes.error || legacyRes.error || vehicleCustomerRes.error || vehicleEmailRes.error) { toast.error("Kon verkopen niet laden"); setLoading(false); return; }

    const wizardRows: VerkoopRow[] = ((wizardRes.data as any[]) || []).map(r => ({ ...r, source: "verkopen" as const }));
    const legacyRows: VerkoopRow[] = ((legacyRes.data as any[]) || []).map(r => ({
      id: r.id,
      source: "vehicle_sales" as const,
      vehicle_id: r.vehicle_id,
      verkoopprijs: r.verkoopprijs,
      contract_getekend_datum: r.verkoop_datum || r.afleverdatum,
      verkoop_datum: r.verkoop_datum || r.afleverdatum,
      created_at: r.created_at,
      stap11_afgerond: r.status === "voltooid",
      wizard_status: r.status,
      customer_id: r.customer_id,
    }));
    const usedVehicleIds = new Set([...wizardRows, ...legacyRows].map(r => r.vehicle_id).filter(Boolean));
    const directVehicleMap = new Map<string, any>();
    [...((vehicleCustomerRes.data as any[]) || []), ...((vehicleEmailRes.data as any[]) || [])].forEach(v => {
      if (v.id && !usedVehicleIds.has(v.id)) directVehicleMap.set(v.id, v);
    });
    const directVehicleRows: VerkoopRow[] = Array.from(directVehicleMap.values()).map(v => ({
      id: v.id,
      source: "vehicles" as const,
      vehicle_id: v.id,
      verkoopprijs: v.verkoopprijs,
      contract_getekend_datum: v.verkoop_datum,
      verkoop_datum: v.verkoop_datum,
      created_at: v.verkoop_datum || v.created_at,
      stap11_afgerond: true,
      wizard_status: "verkocht",
      customer_id: v.customer_id,
      vehicle: { merk: v.merk, model: v.model, kenteken: v.kenteken, verkoop_datum: v.verkoop_datum },
    }));
    const rows = [...wizardRows, ...legacyRows, ...directVehicleRows].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    const vehicleIds = Array.from(new Set(rows.map(r => r.vehicle_id).filter(Boolean)));
    let vehicleMap: Record<string, any> = {};
    if (vehicleIds.length > 0) {
      const { data: vs } = await supabase
        .from("vehicles")
        .select("id, merk, model, kenteken, verkoop_datum")
        .in("id", vehicleIds);
      (vs || []).forEach((v: any) => { vehicleMap[v.id] = v; });
    }
    setVerkopen(rows.map(r => ({ ...r, vehicle: r.vehicle_id ? vehicleMap[r.vehicle_id] : null })));
    setLoading(false);
  }, [customerId, customerEmail]);

  useEffect(() => { load(); }, [load]);

  const openLink = async () => {
    setLinkAnchor(linkBtnRef.current?.getBoundingClientRect() ?? null);
    setLinkOpen(true);
    setAvailLoading(true);

    // ALLE verkopen uit beide verkoopregistraties — inclusief al gekoppelde verkopen
    const [wizardRes, legacyRes, vehiclesRes] = await Promise.all([
      supabase
        .from("verkopen" as any)
        .select("id, vehicle_id, customer_id, created_at, contract_getekend_datum, verkoopprijs")
        .order("created_at", { ascending: false }),
      supabase
        .from("vehicle_sales" as any)
        .select("id, vehicle_id, customer_id, created_at, verkoop_datum, afleverdatum, verkoopprijs, status")
        .order("created_at", { ascending: false }),
      supabase
        .from("vehicles" as any)
        .select("id, merk, model, kenteken, status, verkoop_datum, created_at, verkoopprijs, customer_id, koper_naam, koper_email")
        .order("created_at", { ascending: false }),
    ]);
    const registeredVehicleIds = new Set([
      ...(((wizardRes.data as any[]) || []).map(r => r.vehicle_id).filter(Boolean)),
      ...(((legacyRes.data as any[]) || []).map(r => r.vehicle_id).filter(Boolean)),
    ]);
    const rows = [
      ...(((wizardRes.data as any[]) || []).map(r => ({ ...r, source: "verkopen" as const, datum: r.contract_getekend_datum || r.created_at }))),
      ...(((legacyRes.data as any[]) || []).map(r => ({ ...r, source: "vehicle_sales" as const, datum: r.verkoop_datum || r.afleverdatum || r.created_at }))),
      ...(((vehiclesRes.data as any[]) || [])
        .filter(v => !registeredVehicleIds.has(v.id))
        .filter(v => v.status === "verkocht" || v.verkoop_datum || v.customer_id || v.koper_email)
        .map(v => ({ ...v, source: "vehicles" as const, vehicle_id: v.id, datum: v.verkoop_datum || v.created_at }))),
    ].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

    const vehicleIds = Array.from(new Set(rows.map(r => r.vehicle_id).filter(Boolean)));
    const customerIds = Array.from(new Set(rows.map(r => r.customer_id).filter(Boolean)));

    const [vsRes, csRes] = await Promise.all([
      vehicleIds.length > 0
        ? supabase.from("vehicles").select("id, merk, model, kenteken").in("id", vehicleIds)
        : Promise.resolve({ data: [] as any[] }),
      customerIds.length > 0
        ? supabase.from("customers").select("id, voornaam, achternaam, bedrijfsnaam").in("id", customerIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const vMap: Record<string, any> = {};
    (vsRes.data || []).forEach((v: any) => { vMap[v.id] = v; });
    const cMap: Record<string, any> = {};
    (csRes.data || []).forEach((c: any) => { cMap[c.id] = c; });

    const opts: SearchOption[] = rows.map((r: any) => {
      const v = r.vehicle_id ? vMap[r.vehicle_id] : null;
      const naam = v ? `${v.merk || ""} ${v.model || ""}`.trim() : "Verkoop zonder voertuig";
      const kenteken = v?.kenteken ? v.kenteken.toUpperCase() : "—";
      const datum = r.datum || r.created_at;
      const datumStr = datum ? new Date(datum).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }) : "";
      const prijsStr = r.verkoopprijs ? `€ ${Number(r.verkoopprijs).toLocaleString("nl-NL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "";
      const c = r.customer_id ? cMap[r.customer_id] : null;
      const huidige = c ? (c.bedrijfsnaam || `${c.voornaam || ""} ${c.achternaam || ""}`.trim() || "Onbekende klant") : r.koper_naam || null;
      const isCurrent = r.customer_id === customerId;
      return {
        id: `${r.source}:${r.id}`,
        label: naam,
        sublabel: [kenteken, datumStr, prijsStr].filter(Boolean).join(" · "),
        meta: isCurrent ? "Al gekoppeld" : undefined,
        warning: huidige && !isCurrent ? `Al gekoppeld aan ${huidige}` : undefined,
        searchText: `${naam} ${kenteken} ${datumStr} ${prijsStr} ${huidige || ""}`,
      };
    });
    setAvailable(opts);
    setAvailLoading(false);
  };

  const persistLink = async (optionId: string) => {
    const target = splitSaleOptionId(optionId);
    const { error } = await supabase.from(target.source as any).update({ customer_id: customerId }).eq("id", target.id);
    if (error) { toast.error("Koppelen mislukt"); return; }
    toast.success("Verkoop gekoppeld");
    await load();
  };

  const handleLink = async (verkoopId: string) => {
    const opt = available.find(o => o.id === verkoopId);
    if (opt?.warning) {
      const bestaande = opt.warning.replace(/^Al gekoppeld aan\s*/i, "");
      setOverwriteConfirm({ open: true, verkoopId, bestaandeNaam: bestaande });
      return;
    }
    await persistLink(verkoopId);
  };

  const confirmOverwrite = async () => {
    if (!overwriteConfirm.verkoopId) return;
    await persistLink(overwriteConfirm.verkoopId);
    setOverwriteConfirm({ open: false, verkoopId: null, bestaandeNaam: "" });
  };

  const requestUnlink = (e: React.MouseEvent<HTMLButtonElement>, row: VerkoopRow) => {
    e.stopPropagation();
    const naam = row.vehicle ? `${row.vehicle.merk || ""} ${row.vehicle.model || ""}`.trim() : "deze verkoop";
    setUnlinkConfirm({
      open: true,
      verkoopId: `${row.source}:${row.id}`,
      anchor: e.currentTarget.getBoundingClientRect(),
      naam,
    });
  };

  const handleUnlink = async () => {
    if (!unlinkConfirm.verkoopId) return;
    const target = splitSaleOptionId(unlinkConfirm.verkoopId);
    const { error } = await supabase.from(target.source as any).update({ customer_id: null }).eq("id", target.id);
    if (error) { toast.error("Ontkoppelen mislukt"); return; }
    toast.success("Verkoop ontkoppeld");
    setUnlinkConfirm({ open: false, verkoopId: null, anchor: null, naam: "" });
    await load();
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gekoppelde verkopen</h3>
        <button
          ref={linkBtnRef}
          onClick={openLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-xl hover:bg-accent transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Koppel aan verkoop
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : verkopen.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nog geen verkopen gekoppeld aan deze klant.</p>
      ) : (
        <div className="space-y-1.5">
          {verkopen.map((r) => {
            const v = r.vehicle;
            const naam = v ? `${v.merk || ""} ${v.model || ""}`.trim() : "Verkoop";
            const datum = r.contract_getekend_datum || r.verkoop_datum || v?.verkoop_datum || r.created_at;
            return (
              <div
                key={`${r.source}:${r.id}`}
                onClick={() => v && navigate(`/admin/voertuigen/${r.vehicle_id}`)}
                className="flex items-center justify-between gap-3 px-3 py-2.5 bg-secondary/30 border border-border rounded-xl hover:bg-accent/30 cursor-pointer transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground truncate">{naam}</p>
                    {v?.kenteken && <span className="text-[10px] font-mono uppercase text-muted-foreground">{v.kenteken}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {datum ? new Date(datum).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    {r.verkoopprijs ? ` · € ${Number(r.verkoopprijs).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
                  </p>
                </div>
                <button
                  onClick={(e) => requestUnlink(e, r)}
                  className="p-1.5 text-muted-foreground/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  aria-label="Ontkoppelen"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <SearchSelectPopover
        open={linkOpen}
        onOpenChange={setLinkOpen}
        anchorRect={linkAnchor}
        title="Koppel aan verkoop"
        placeholder="Zoek op voertuig of kenteken..."
        options={available}
        loading={availLoading}
        emptyMessage="Geen verkopen gevonden"
        onSelect={handleLink}
      />

      <ConfirmPopover
        open={overwriteConfirm.open}
        onOpenChange={(o) => !o && setOverwriteConfirm({ open: false, verkoopId: null, bestaandeNaam: "" })}
        anchorRect={null}
        title="Bestaande koppeling overschrijven?"
        message={`Deze verkoop is al gekoppeld aan ${overwriteConfirm.bestaandeNaam}. Weet je zeker dat je dit wilt overschrijven?`}
        confirmLabel="Bevestigen"
        onConfirm={confirmOverwrite}
      />

      <ConfirmPopover
        open={unlinkConfirm.open}
        onOpenChange={(o) => !o && setUnlinkConfirm({ open: false, verkoopId: null, anchor: null, naam: "" })}
        anchorRect={unlinkConfirm.anchor}
        title="Verkoop ontkoppelen?"
        message={`Weet je zeker dat je ${unlinkConfirm.naam} wilt ontkoppelen van deze klant?`}
        confirmLabel="Ontkoppelen"
        destructive
        onConfirm={handleUnlink}
      />
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

      <GekoppeldeVerkopenSection customer={customer} />
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

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, X, Phone, Mail } from "lucide-react";
import SearchSelectPopover, { SearchOption } from "@/components/admin/SearchSelectPopover";
import ConfirmPopover from "@/components/admin/ConfirmPopover";

interface Props {
  vehicleId: string;
}

interface CustomerLite {
  id: string;
  voornaam: string;
  achternaam: string;
  email: string;
  telefoon: string;
  bedrijfsnaam: string | null;
}

/**
 * Toont en beheert de koppeling tussen de verkoop (op basis van vehicle_id)
 * en een klant (customers tabel) via verkopen.customer_id.
 */
const KoppelKlantBlock = ({ vehicleId }: Props) => {
  const [verkoopId, setVerkoopId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerLite | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkAnchor, setLinkAnchor] = useState<DOMRect | null>(null);
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const [unlinkAnchor, setUnlinkAnchor] = useState<DOMRect | null>(null);
  const [allCustomers, setAllCustomers] = useState<SearchOption[]>([]);
  const [custLoading, setCustLoading] = useState(false);
  const linkBtnRef = useRef<HTMLButtonElement>(null);
  const editBtnRef = useRef<HTMLButtonElement>(null);
  const unlinkBtnRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: vk } = await supabase
      .from("verkopen" as any)
      .select("id, customer_id")
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const row = vk as any;
    setVerkoopId(row?.id || null);

    if (row?.customer_id) {
      const { data: c } = await supabase
        .from("customers")
        .select("id, voornaam, achternaam, email, telefoon, bedrijfsnaam")
        .eq("id", row.customer_id)
        .maybeSingle();
      setCustomer((c as any) || null);
    } else {
      setCustomer(null);
    }
    setLoading(false);
  }, [vehicleId]);

  useEffect(() => { load(); }, [load]);

  const loadCustomers = async () => {
    setCustLoading(true);
    const { data } = await supabase
      .from("customers")
      .select("id, voornaam, achternaam, email, telefoon, bedrijfsnaam")
      .order("updated_at", { ascending: false });
    const opts: SearchOption[] = ((data as any[]) || []).map((c) => {
      const naam = c.bedrijfsnaam?.trim() || `${c.voornaam || ""} ${c.achternaam || ""}`.trim() || c.email;
      return {
        id: c.id,
        label: naam,
        sublabel: [c.telefoon, c.email].filter(Boolean).join(" · "),
        searchText: `${naam} ${c.email || ""} ${c.telefoon || ""}`,
      };
    });
    setAllCustomers(opts);
    setCustLoading(false);
  };

  const ensureVerkoop = async (): Promise<string | null> => {
    if (verkoopId) return verkoopId;
    // Create minimale verkoop-rij voor dit voertuig
    const { data, error } = await supabase
      .from("verkopen" as any)
      .insert({ vehicle_id: vehicleId } as any)
      .select("id")
      .single();
    if (error) { toast.error("Kon verkoop niet aanmaken"); return null; }
    const id = (data as any).id;
    setVerkoopId(id);
    return id;
  };

  const openLink = async () => {
    setLinkAnchor((linkBtnRef.current || editBtnRef.current)?.getBoundingClientRect() ?? null);
    setLinkOpen(true);
    await loadCustomers();
  };

  const handlePick = async (custId: string) => {
    const vId = await ensureVerkoop();
    if (!vId) return;
    const { error } = await supabase.from("verkopen" as any).update({ customer_id: custId }).eq("id", vId);
    if (error) { toast.error("Koppelen mislukt"); return; }
    toast.success("Klant gekoppeld");
    await load();
  };

  const openUnlink = () => {
    setUnlinkAnchor(unlinkBtnRef.current?.getBoundingClientRect() ?? null);
    setUnlinkOpen(true);
  };

  const handleUnlink = async () => {
    if (!verkoopId) return;
    const { error } = await supabase.from("verkopen" as any).update({ customer_id: null }).eq("id", verkoopId);
    if (error) { toast.error("Ontkoppelen mislukt"); return; }
    toast.success("Klant ontkoppeld");
    await load();
  };

  if (loading) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gekoppelde klant</h3>
        {customer ? (
          <div className="flex items-center gap-1">
            <button
              ref={editBtnRef}
              onClick={openLink}
              aria-label="Wijzig klant"
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              ref={unlinkBtnRef}
              onClick={openUnlink}
              aria-label="Ontkoppel klant"
              className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      {customer ? (
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {customer.bedrijfsnaam?.trim() || `${customer.voornaam} ${customer.achternaam}`.trim()}
          </p>
          <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
            {customer.telefoon && (
              <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.telefoon}</span>
            )}
            {customer.email && (
              <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email}</span>
            )}
          </div>
        </div>
      ) : (
        <button
          ref={linkBtnRef}
          onClick={openLink}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-dashed border-border rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-3.5 h-3.5" /> Koppel klant
        </button>
      )}

      <SearchSelectPopover
        open={linkOpen}
        onOpenChange={setLinkOpen}
        anchorRect={linkAnchor}
        title={customer ? "Wijzig gekoppelde klant" : "Koppel klant"}
        placeholder="Zoek op naam, e-mail of telefoon..."
        options={allCustomers}
        loading={custLoading}
        emptyMessage="Geen klanten gevonden"
        onSelect={handlePick}
      />

      <ConfirmPopover
        open={unlinkOpen}
        onOpenChange={setUnlinkOpen}
        anchorRect={unlinkAnchor}
        title="Klant ontkoppelen"
        message="Weet je zeker dat je deze klant wilt ontkoppelen van de verkoop?"
        confirmLabel="Ontkoppelen"
        destructive
        onConfirm={handleUnlink}
      />
    </div>
  );
};

export default KoppelKlantBlock;

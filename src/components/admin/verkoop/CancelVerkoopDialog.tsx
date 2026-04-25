import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useMoneybird } from "@/hooks/useMoneybird";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verkoopId: string | null;
  vehicleId: string;
  kenteken: string;
  merk: string;
  model: string;
  bouwjaar?: number | null;
}

export default function CancelVerkoopDialog({
  open,
  onOpenChange,
  verkoopId,
  vehicleId,
  kenteken,
  merk,
  model,
  bouwjaar,
}: Props) {
  const navigate = useNavigate();
  const { invoke: invokeMoneybird } = useMoneybird();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [moneybirdInvoiceId, setMoneybirdInvoiceId] = useState<string | null>(null);
  const [documentenAanwezig, setDocumentenAanwezig] = useState<boolean>(false);

  const normalize = (s: string) => s.replace(/[\s-]/g, "").toUpperCase();
  const matches = kenteken.length > 0 && normalize(input) === normalize(kenteken);

  // Laad info zodra dialog opent: factuur + documenten
  useEffect(() => {
    if (!open || !verkoopId) {
      setMoneybirdInvoiceId(null);
      setDocumentenAanwezig(false);
      return;
    }
    (async () => {
      const { data: verkoop } = await supabase
        .from("verkopen")
        .select("moneybird_factuur_id")
        .eq("id", verkoopId)
        .maybeSingle();
      setMoneybirdInvoiceId((verkoop as any)?.moneybird_factuur_id || null);

      const { count } = await supabase
        .from("verkoop_documenten")
        .select("id", { count: "exact", head: true })
        .eq("verkoop_id", verkoopId);
      setDocumentenAanwezig((count || 0) > 0);
    })();
  }, [open, verkoopId]);

  const handleClose = (next: boolean) => {
    if (loading) return;
    if (!next) setInput("");
    onOpenChange(next);
  };

  // Moneybird factuur opruimen — altijd verwijderen, niet crediteren
  const cleanupMoneybird = async (): Promise<void> => {
    if (!moneybirdInvoiceId) return;
    try {
      await invokeMoneybird("delete_sales_invoice", { invoice_id: moneybirdInvoiceId });
    } catch (err) {
      console.error("Moneybird cleanup mislukt:", err);
      toast.warning(
        "Factuur kon niet automatisch worden verwijderd in Moneybird. Verwijder deze handmatig.",
      );
    }
  };

  // Documenten + storage opruimen
  const cleanupDocumenten = async (): Promise<void> => {
    if (!verkoopId) return;
    try {
      // Lijst alle bestanden in verkopen/{verkoopId}/ in vehicle-documents
      const folder = `verkopen/${verkoopId}`;
      const { data: files } = await supabase.storage
        .from("vehicle-documents")
        .list(folder, { limit: 1000 });

      if (files && files.length > 0) {
        const paths = files.map((f) => `${folder}/${f.name}`);
        await supabase.storage.from("vehicle-documents").remove(paths);
      }

      await supabase.from("verkoop_documenten").delete().eq("verkoop_id", verkoopId);
    } catch (err) {
      console.error("Documenten verwijderen mislukt:", err);
      toast.warning("Niet alle gegenereerde documenten konden worden verwijderd.");
    }
  };

  const handleConfirm = async () => {
    if (!matches) return;
    setLoading(true);
    try {
      // 1. Moneybird factuur opruimen (best-effort)
      await cleanupMoneybird();

      // 2. Documenten + storage opruimen (best-effort)
      await cleanupDocumenten();

      // 3. Verkoop record verwijderen
      if (verkoopId) {
        const { error: delErr } = await supabase.from("verkopen").delete().eq("id", verkoopId);
        if (delErr) throw delErr;
      }

      // 4. Voertuig terug naar beschikbaar
      const { error: vErr } = await supabase
        .from("vehicles")
        .update({ status: "beschikbaar" })
        .eq("id", vehicleId);
      if (vErr) throw vErr;

      toast.success("Verkoop geannuleerd — voertuig is weer beschikbaar");
      onOpenChange(false);
      navigate("/admin/voertuigen");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Annuleren mislukt");
    } finally {
      setLoading(false);
    }
  };

  const showWaarschuwingen = !!moneybirdInvoiceId || documentenAanwezig;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Verkoop annuleren
          </DialogTitle>
          <DialogDescription>
            Weet je zeker dat je deze verkoop wilt annuleren? Alle ingevoerde gegevens worden
            verwijderd. Het voertuig wordt teruggezet naar beschikbaar.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
            Voertuig
          </div>
          <div className="font-medium">
            <span className="font-mono uppercase">{kenteken || "—"}</span>{" "}
            <span>
              {merk} {model}
              {bouwjaar ? ` (${bouwjaar})` : ""}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-kenteken">Typ het kenteken ter bevestiging</Label>
          <Input
            id="confirm-kenteken"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder={kenteken}
            className="font-mono uppercase"
            autoComplete="off"
            disabled={loading}
          />
        </div>

        {showWaarschuwingen && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm space-y-1.5">
            {moneybirdInvoiceId && (
              <div className="text-foreground">
                ⚠️ De Moneybird factuur wordt verwijderd of gecrediteerd.
              </div>
            )}
            {documentenAanwezig && (
              <div className="text-foreground">
                ⚠️ Alle gegenereerde documenten worden verwijderd.
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
            Terug
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!matches || loading}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Annuleren bevestigen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

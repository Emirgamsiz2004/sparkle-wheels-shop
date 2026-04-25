import { useState } from "react";
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
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const normalize = (s: string) => s.replace(/[\s-]/g, "").toUpperCase();
  const matches = kenteken.length > 0 && normalize(input) === normalize(kenteken);

  const handleClose = (next: boolean) => {
    if (loading) return;
    if (!next) setInput("");
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    if (!matches) return;
    setLoading(true);
    try {
      if (verkoopId) {
        const { error: delErr } = await supabase.from("verkopen").delete().eq("id", verkoopId);
        if (delErr) throw delErr;
      }
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

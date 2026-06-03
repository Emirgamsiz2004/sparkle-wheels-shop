import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { fetchRdwData } from "@/lib/rdw";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  defaultDate?: string; // yyyy-mm-dd
}

const emptyForm = {
  verkoop_datum: new Date().toISOString().slice(0, 10),
  kenteken: "",
  merk: "",
  model: "",
  bouwjaar: "" as string | number,
  kilometerstand: "" as string | number,
  brandstof: "",
  inkoopprijs: "" as string | number,
  verkoopprijs: "" as string | number,
  koper_naam: "",
  notitie: "",
};

const HandmatigeVerkoopDialog = ({ open, onOpenChange, onSaved, defaultDate }: Props) => {
  const [form, setForm] = useState({ ...emptyForm, verkoop_datum: defaultDate || emptyForm.verkoop_datum });
  const [loadingRdw, setLoadingRdw] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleRdw = async () => {
    if (!form.kenteken || form.kenteken.length < 5) return;
    setLoadingRdw(true);
    const data = await fetchRdwData(form.kenteken);
    setLoadingRdw(false);
    if (!data) return;
    setForm(f => ({
      ...f,
      merk: data.merk || f.merk,
      model: data.model || f.model,
      bouwjaar: data.bouwjaar || f.bouwjaar,
      brandstof: data.brandstof || f.brandstof,
    }));
  };

  const handleSave = async () => {
    if (!form.merk || !form.model) {
      toast.error("Merk en model zijn verplicht");
      return;
    }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("handmatige_verkopen" as any).insert({
      verkoop_datum: form.verkoop_datum,
      kenteken: form.kenteken || null,
      merk: form.merk,
      model: form.model,
      bouwjaar: form.bouwjaar ? Number(form.bouwjaar) : null,
      kilometerstand: form.kilometerstand ? Number(form.kilometerstand) : null,
      brandstof: form.brandstof || null,
      inkoopprijs: Number(form.inkoopprijs) || 0,
      verkoopprijs: Number(form.verkoopprijs) || 0,
      koper_naam: form.koper_naam || null,
      notitie: form.notitie || null,
      user_id: userData.user?.id || null,
    });
    setSaving(false);
    if (error) {
      toast.error("Opslaan mislukt: " + error.message);
      return;
    }
    toast.success("Verkoop toegevoegd");
    setForm({ ...emptyForm, verkoop_datum: defaultDate || emptyForm.verkoop_datum });
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Verkoop handmatig toevoegen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Verkoopdatum</Label>
              <Input
                type="date"
                value={form.verkoop_datum}
                onChange={e => set("verkoop_datum", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Kenteken</Label>
              <div className="flex gap-2">
                <Input
                  value={form.kenteken}
                  onChange={e => set("kenteken", e.target.value.toUpperCase())}
                  onBlur={handleRdw}
                  placeholder="XX-123-X"
                  className="font-mono uppercase"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRdw}
                  disabled={loadingRdw || form.kenteken.length < 5}
                >
                  {loadingRdw ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "RDW"}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Merk *</Label>
              <Input value={form.merk} onChange={e => set("merk", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Model *</Label>
              <Input value={form.model} onChange={e => set("model", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Bouwjaar</Label>
              <Input
                type="number"
                value={form.bouwjaar}
                onChange={e => set("bouwjaar", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Km-stand</Label>
              <Input
                type="number"
                value={form.kilometerstand}
                onChange={e => set("kilometerstand", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Brandstof</Label>
              <Input value={form.brandstof} onChange={e => set("brandstof", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Inkoopprijs (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.inkoopprijs}
                onChange={e => set("inkoopprijs", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Verkoopprijs (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.verkoopprijs}
                onChange={e => set("verkoopprijs", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Koper (optioneel)</Label>
            <Input value={form.koper_naam} onChange={e => set("koper_naam", e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HandmatigeVerkoopDialog;

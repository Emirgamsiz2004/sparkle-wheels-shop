import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Camera, Check, Loader2, Search, Trash2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { fetchRdwData } from "@/lib/rdw";
import { formatKenteken } from "@/lib/kenteken";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const MAX_FILES = 6;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const formSchema = z.object({
  kenteken: z.string().trim().regex(/^[A-Za-z0-9-]{4,12}$/, "Vul een geldig kenteken in."),
  kmStand: z.coerce.number().int().min(0).max(5_000_000),
  gewenstePrijs: z.coerce.number().min(0).max(10_000_000),
  naam: z.string().trim().min(2, "Vul uw naam in.").max(200),
  telefoon: z.string().trim().min(5, "Vul uw telefoonnummer in.").max(50),
  email: z.string().trim().email("Vul een geldig e-mailadres in.").max(255),
});

interface TradeInRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interestedVehicleId?: string;
  interestedVehicle: string;
}

interface PreviewFile {
  file: File;
  url: string;
}

export default function TradeInRequestModal({
  open,
  onOpenChange,
  interestedVehicleId,
  interestedVehicle,
}: TradeInRequestModalProps) {
  const [form, setForm] = useState({ kenteken: "", kmStand: "", gewenstePrijs: "", naam: "", telefoon: "", email: "" });
  const [rdwVehicle, setRdwVehicle] = useState<{ merk: string; model: string; bouwjaar: number } | null>(null);
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [lookingUp, setLookingUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => () => files.forEach(({ url }) => URL.revokeObjectURL(url)), [files]);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const lookupKenteken = async () => {
    const clean = form.kenteken.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (clean.length < 5) { setError("Vul eerst een geldig kenteken in."); return; }
    setError("");
    setLookingUp(true);
    const result = await fetchRdwData(clean);
    if (result) {
      setRdwVehicle({ merk: result.merk, model: result.model, bouwjaar: result.bouwjaar });
      update("kenteken", formatKenteken(clean));
    }
    setLookingUp(false);
  };

  const chooseFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length + selected.length > MAX_FILES) { setError(`U kunt maximaal ${MAX_FILES} foto's toevoegen.`); return; }
    const invalid = selected.find((file) => !ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_BYTES);
    if (invalid) { setError("Gebruik alleen JPG, PNG of WEBP-afbeeldingen van maximaal 8 MB."); return; }
    setError("");
    setFiles((current) => [...current, ...selected.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  };

  const removeFile = (index: number) => {
    setFiles((current) => {
      URL.revokeObjectURL(current[index].url);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Controleer uw gegevens."); return; }
    setSubmitting(true);

    try {
      const requestId = crypto.randomUUID();
      const photoPaths = files.map(({ file }, index) => {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        return `${requestId}/${index + 1}-${crypto.randomUUID()}.${extension}`;
      });
      const { error: insertError } = await supabase.from("inruil_aanmeldingen").insert({
        id: requestId,
        naam: parsed.data.naam,
        telefoon: parsed.data.telefoon,
        email: parsed.data.email,
        kenteken: parsed.data.kenteken.replace(/[^a-zA-Z0-9]/g, "").toUpperCase(),
        merk: rdwVehicle?.merk || null,
        model: rdwVehicle?.model || null,
        bouwjaar: rdwVehicle?.bouwjaar ? String(rdwVehicle.bouwjaar) : null,
        km_stand: parsed.data.kmStand,
        gewenste_prijs: parsed.data.gewenstePrijs,
        interesse_voertuig_id: interestedVehicleId || null,
        interesse_voertuig: interestedVehicle,
        foto_paths: [],
      });
      if (insertError) throw insertError;

      for (let index = 0; index < files.length; index += 1) {
        const { error: uploadError } = await supabase.storage.from("inruil-fotos").upload(photoPaths[index], files[index].file, {
          contentType: files[index].file.type,
          upsert: false,
        });
        if (uploadError) throw uploadError;
      }

      await supabase.functions.invoke("process-trade-in-lead", { body: { requestId } });
      setDone(true);
    } catch {
      setError("Verzenden is niet gelukt. Probeer het opnieuw of neem telefonisch contact op.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-border bg-background sm:max-w-xl">
        {done ? (
          <div className="py-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-primary text-primary"><Check /></span>
            <DialogTitle className="mt-5 font-display text-xl text-foreground">Aanvraag ontvangen</DialogTitle>
            <DialogDescription className="mx-auto mt-3 max-w-sm leading-relaxed">
              Bedankt. U ontvangt binnen 24 uur een vrijblijvend inruilvoorstel.
            </DialogDescription>
            <Button className="mt-7" variant="primary" onClick={() => onOpenChange(false)}>Sluiten</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-foreground">Inruilvoorstel aanvragen</DialogTitle>
              <DialogDescription>Interesse in {interestedVehicle}. Vul uw auto in en ontvang binnen 24 uur een voorstel.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="mt-4 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="trade-kenteken">Kenteken</Label>
                <div className="flex gap-2">
                  <Input id="trade-kenteken" value={form.kenteken} onChange={(e) => { update("kenteken", e.target.value.toUpperCase()); setRdwVehicle(null); }} maxLength={12} placeholder="12-AB-34" required />
                  <Button type="button" aria-label="Kenteken opzoeken" onClick={lookupKenteken} disabled={lookingUp}>
                    {lookingUp ? <Loader2 className="animate-spin" /> : <Search />}
                  </Button>
                </div>
                {rdwVehicle && <p className="text-sm text-primary">{rdwVehicle.merk} {rdwVehicle.model} · {rdwVehicle.bouwjaar}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="trade-km">Kilometerstand</Label><Input id="trade-km" type="number" min="0" max="5000000" inputMode="numeric" value={form.kmStand} onChange={(e) => update("kmStand", e.target.value)} placeholder="Bijv. 125000" required /></div>
                <div className="space-y-2"><Label htmlFor="trade-price">Gewenste prijs</Label><Input id="trade-price" type="number" min="0" max="10000000" inputMode="numeric" value={form.gewenstePrijs} onChange={(e) => update("gewenstePrijs", e.target.value)} placeholder="€" required /></div>
              </div>
              <div className="space-y-2">
                <Label>Foto's <span className="font-normal text-muted-foreground">(optioneel, maximaal 6)</span></Label>
                <label className="flex min-h-20 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
                  <Camera className="h-4 w-4" /> Foto's toevoegen
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={chooseFiles} />
                </label>
                {files.length > 0 && <div className="grid grid-cols-3 gap-2">{files.map(({ file, url }, index) => <div key={`${file.name}-${index}`} className="group relative aspect-square overflow-hidden rounded-[8px] border border-border"><img src={url} alt={`Inruilfoto ${index + 1}`} className="h-full w-full object-cover" /><Button type="button" size="icon" variant="destructive" aria-label="Foto verwijderen" onClick={() => removeFile(index)} className="absolute right-1 top-1 h-7 w-7 bg-background/90"><Trash2 /></Button></div>)}</div>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="trade-name">Naam</Label><Input id="trade-name" autoComplete="name" maxLength={200} value={form.naam} onChange={(e) => update("naam", e.target.value)} required /></div>
                <div className="space-y-2"><Label htmlFor="trade-phone">Telefoonnummer</Label><Input id="trade-phone" type="tel" autoComplete="tel" maxLength={50} value={form.telefoon} onChange={(e) => update("telefoon", e.target.value)} required /></div>
                <div className="space-y-2"><Label htmlFor="trade-email">E-mailadres</Label><Input id="trade-email" type="email" autoComplete="email" maxLength={255} value={form.email} onChange={(e) => update("email", e.target.value)} required /></div>
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting}>
                {submitting ? <><Loader2 className="animate-spin" /> Aanvraag verzenden…</> : "Ontvang mijn inruilvoorstel"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
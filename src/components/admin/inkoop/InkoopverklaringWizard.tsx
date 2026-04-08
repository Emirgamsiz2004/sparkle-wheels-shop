import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { fetchRdwData } from "@/lib/rdw";
import { buildInkoopverklaringPdf } from "@/lib/inkoopverklaringPdf";
import { useInkoopverklaringen, Inkoopverklaring } from "@/hooks/useInkoopverklaringen";
import { useVehicles } from "@/hooks/useVehicles";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Download, Link2, Check, CreditCard, IdCard, Car } from "lucide-react";
import SignaturePad from "signature_pad";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onComplete?: () => void;
}

const STEPS = ["Verkoper", "Voertuig", "Transactie"];

const legTypes = [
  { key: "paspoort", label: "Paspoort", icon: IdCard },
  { key: "id_kaart", label: "ID-kaart", icon: CreditCard },
  { key: "rijbewijs", label: "Rijbewijs", icon: Car },
] as const;

export default function InkoopverklaringWizard({ open, onOpenChange, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [rdwLoading, setRdwLoading] = useState(false);
  const { addVerklaring } = useInkoopverklaringen();
  const { vehicles } = useVehicles();
  const [linkVehicleId, setLinkVehicleId] = useState<string>("");

  // Form state
  const [verkoper, setVerkoper] = useState({ naam: "", email: "", telefoon: "", adres: "", woonplaats: "" });
  const [voertuig, setVoertuig] = useState({ kenteken: "", merk: "", model: "", bouwjaar: "", kilometerstand: "", chassisnummer: "" });
  const [legType, setLegType] = useState<string>("paspoort");
  const [legNummer, setLegNummer] = useState("");
  const [transactie, setTransactie] = useState({ inkoopprijs: "", datum: new Date().toISOString().split("T")[0] });

  // Signature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sigPadRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    if (step === 2 && canvasRef.current && !sigPadRef.current) {
      const canvas = canvasRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      sigPadRef.current = new SignaturePad(canvas, { backgroundColor: "rgb(255,255,255)" });
    }
  }, [step]);

  const resetAll = useCallback(() => {
    setStep(0);
    setDone(false);
    setPdfBlob(null);
    setSavedId(null);
    setVerkoper({ naam: "", email: "", telefoon: "", adres: "", woonplaats: "" });
    setVoertuig({ kenteken: "", merk: "", model: "", bouwjaar: "", kilometerstand: "", chassisnummer: "" });
    setLegType("paspoort");
    setLegNummer("");
    setTransactie({ inkoopprijs: "", datum: new Date().toISOString().split("T")[0] });
    setLinkVehicleId("");
    if (sigPadRef.current) { sigPadRef.current.clear(); sigPadRef.current = null; }
  }, []);

  const handleClose = (v: boolean) => {
    if (!v) resetAll();
    onOpenChange(v);
  };

  const handleRdwLookup = async () => {
    if (voertuig.kenteken.replace(/[-\s]/g, "").length < 5) return;
    setRdwLoading(true);
    const data = await fetchRdwData(voertuig.kenteken);
    if (data) {
      setVoertuig(prev => ({
        ...prev,
        merk: data.merk || prev.merk,
        model: data.model || prev.model,
        bouwjaar: data.bouwjaar ? String(data.bouwjaar) : prev.bouwjaar,
      }));
    }
    setRdwLoading(false);
  };

  const canNext = () => {
    if (step === 0) return verkoper.naam && verkoper.telefoon && verkoper.adres && verkoper.woonplaats;
    if (step === 1) return voertuig.merk && voertuig.model && voertuig.kilometerstand && legNummer;
    if (step === 2) return transactie.inkoopprijs && transactie.datum && sigPadRef.current && !sigPadRef.current.isEmpty();
    return false;
  };

  const handleGenerate = async () => {
    if (!canNext()) return;
    setSaving(true);

    const sigData = sigPadRef.current?.toDataURL("image/png") || "";
    const kenteken = voertuig.kenteken.replace(/[-\s]/g, "").toUpperCase();
    const docNaam = `IKV_${voertuig.merk}_${voertuig.model}_${voertuig.bouwjaar || "0000"}_${kenteken || "GEEN"}`.replace(/\s+/g, "");

    const pdfData = {
      verkoper: { naam: verkoper.naam, email: verkoper.email, telefoon: verkoper.telefoon, adres: verkoper.adres, woonplaats: verkoper.woonplaats },
      voertuig: { kenteken, merk: voertuig.merk, model: voertuig.model, bouwjaar: voertuig.bouwjaar ? Number(voertuig.bouwjaar) : undefined, kilometerstand: voertuig.kilometerstand ? Number(voertuig.kilometerstand) : undefined, chassisnummer: voertuig.chassisnummer || undefined },
      legitimatie: { type: legTypes.find(l => l.key === legType)?.label || legType, nummer: legNummer },
      inkoopprijs: Number(transactie.inkoopprijs),
      datum: transactie.datum,
      handtekeningDataUrl: sigData,
      documentNaam: docNaam,
    };

    const doc = buildInkoopverklaringPdf(pdfData);
    const blob = doc.output("blob");
    setPdfBlob(blob);

    // Upload PDF to storage
    const filePath = `inkoopverklaringen/${docNaam}.pdf`;
    const { error: uploadError } = await supabase.storage.from("vehicle-documents").upload(filePath, blob, { contentType: "application/pdf", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
    }

    // Save to database
    const result = await addVerklaring({
      documentNaam: docNaam,
      verkoperNaam: verkoper.naam,
      verkoperEmail: verkoper.email || undefined,
      verkoperTelefoon: verkoper.telefoon,
      verkoperAdres: verkoper.adres,
      verkoperWoonplaats: verkoper.woonplaats,
      kenteken: kenteken || undefined,
      merk: voertuig.merk,
      model: voertuig.model,
      bouwjaar: voertuig.bouwjaar ? Number(voertuig.bouwjaar) : undefined,
      kilometerstand: voertuig.kilometerstand ? Number(voertuig.kilometerstand) : undefined,
      chassisnummer: voertuig.chassisnummer || undefined,
      legitimatieType: legType,
      legitimatieNummer: legNummer,
      inkoopprijs: Number(transactie.inkoopprijs),
      datum: transactie.datum,
      handtekeningData: sigData,
      pdfPath: filePath,
      status: "ondertekend",
    });

    if (result) {
      setSavedId(result.id);
      toast.success("Inkoopverklaring opgeslagen");
    }

    setSaving(false);
    setDone(true);
  };

  const handleDownload = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    const kenteken = voertuig.kenteken.replace(/[-\s]/g, "").toUpperCase();
    a.download = `IKV_${voertuig.merk}_${voertuig.model}_${voertuig.bouwjaar || "0000"}_${kenteken || "GEEN"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const { linkToVehicle } = useInkoopverklaringen();

  const handleLink = async () => {
    if (!savedId || !linkVehicleId) return;
    await linkToVehicle(savedId, linkVehicleId);
    onComplete?.();
  };

  const availableVehicles = vehicles.filter(v => v.status !== "verkocht" && v.status !== "gearchiveerd");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nieuwe inkoopverklaring</DialogTitle>
        </DialogHeader>

        {!done ? (
          <div className="space-y-5">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                {STEPS.map((s, i) => (
                  <span key={s} className={cn(i === step && "text-foreground font-medium")}>{s}</span>
                ))}
              </div>
              <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5" />
            </div>

            {/* Step 1: Verkoper */}
            {step === 0 && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Volledige naam verkoper *</Label>
                  <Input value={verkoper.naam} onChange={e => setVerkoper(p => ({ ...p, naam: e.target.value }))} placeholder="Jan Jansen" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Telefoonnummer *</Label>
                  <Input value={verkoper.telefoon} onChange={e => setVerkoper(p => ({ ...p, telefoon: e.target.value }))} placeholder="06-12345678" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">E-mailadres</Label>
                  <Input value={verkoper.email} onChange={e => setVerkoper(p => ({ ...p, email: e.target.value }))} placeholder="jan@email.nl" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Adres *</Label>
                  <Input value={verkoper.adres} onChange={e => setVerkoper(p => ({ ...p, adres: e.target.value }))} placeholder="Straatnaam 1" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Woonplaats *</Label>
                  <Input value={verkoper.woonplaats} onChange={e => setVerkoper(p => ({ ...p, woonplaats: e.target.value }))} placeholder="Amsterdam" className="mt-1" />
                </div>
              </div>
            )}

            {/* Step 2: Voertuig */}
            {step === 1 && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Kenteken</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={voertuig.kenteken}
                      onChange={e => setVoertuig(p => ({ ...p, kenteken: e.target.value.toUpperCase() }))}
                      placeholder="AB-123-C"
                      className="flex-1"
                      onBlur={handleRdwLookup}
                    />
                    <Button variant="outline" size="sm" onClick={handleRdwLookup} disabled={rdwLoading} className="shrink-0">
                      {rdwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "RDW"}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Merk *</Label>
                    <Input value={voertuig.merk} onChange={e => setVoertuig(p => ({ ...p, merk: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Model *</Label>
                    <Input value={voertuig.model} onChange={e => setVoertuig(p => ({ ...p, model: e.target.value }))} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Bouwjaar</Label>
                    <Input value={voertuig.bouwjaar} onChange={e => setVoertuig(p => ({ ...p, bouwjaar: e.target.value }))} className="mt-1" type="number" />
                  </div>
                  <div>
                    <Label className="text-xs">Kilometerstand *</Label>
                    <Input value={voertuig.kilometerstand} onChange={e => setVoertuig(p => ({ ...p, kilometerstand: e.target.value }))} className="mt-1" type="number" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Chassisnummer (VIN)</Label>
                  <Input value={voertuig.chassisnummer} onChange={e => setVoertuig(p => ({ ...p, chassisnummer: e.target.value }))} className="mt-1" />
                </div>

                {/* Legitimatie */}
                <div className="pt-2">
                  <Label className="text-xs mb-2 block">Legitimatie *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {legTypes.map(lt => {
                      const Icon = lt.icon;
                      return (
                        <button
                          key={lt.key}
                          type="button"
                          onClick={() => setLegType(lt.key)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all text-xs font-medium",
                            legType === lt.key
                              ? "border-foreground bg-foreground/5 text-foreground"
                              : "border-border text-muted-foreground hover:border-foreground/30"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          {lt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Documentnummer *</Label>
                  <Input value={legNummer} onChange={e => setLegNummer(e.target.value)} placeholder="Documentnummer" className="mt-1" />
                </div>
              </div>
            )}

            {/* Step 3: Transactie */}
            {step === 2 && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Inkoopprijs (€) *</Label>
                  <Input value={transactie.inkoopprijs} onChange={e => setTransactie(p => ({ ...p, inkoopprijs: e.target.value }))} type="number" className="mt-1" placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs">Datum</Label>
                  <Input value={transactie.datum} onChange={e => setTransactie(p => ({ ...p, datum: e.target.value }))} type="date" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs mb-2 block">Handtekening verkoper *</Label>
                  <div className="border border-border rounded-lg overflow-hidden bg-white">
                    <canvas ref={canvasRef} className="w-full" style={{ height: 150, touchAction: "none" }} />
                  </div>
                  <Button variant="ghost" size="sm" className="mt-1 text-xs text-muted-foreground" onClick={() => sigPadRef.current?.clear()}>
                    Wissen
                  </Button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-2">
              <Button variant="outline" size="sm" onClick={() => step > 0 ? setStep(step - 1) : handleClose(false)}>
                {step === 0 ? "Annuleren" : "Vorige"}
              </Button>
              {step < 2 ? (
                <Button size="sm" onClick={() => setStep(step + 1)} disabled={!canNext()}>Volgende</Button>
              ) : (
                <Button size="sm" onClick={handleGenerate} disabled={!canNext() || saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Inkoopverklaring genereren
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Done screen */
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="font-semibold">Inkoopverklaring opgeslagen</p>
              <p className="text-sm text-muted-foreground mt-1">{voertuig.merk} {voertuig.model} — {verkoper.naam}</p>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={handleDownload} className="gap-2">
                <Download className="w-4 h-4" /> PDF downloaden
              </Button>

              <div className="space-y-2 pt-2">
                <Label className="text-xs text-muted-foreground">Koppelen aan voertuig</Label>
                <Select value={linkVehicleId} onValueChange={setLinkVehicleId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecteer voertuig..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {availableVehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.kenteken || "—"} — {v.merk} {v.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleLink} disabled={!linkVehicleId} className="gap-2 w-full">
                  <Link2 className="w-4 h-4" /> Koppelen aan voertuig
                </Button>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={() => handleClose(false)} className="text-muted-foreground">
              Sluiten
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

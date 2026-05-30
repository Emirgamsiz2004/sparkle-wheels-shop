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
import VehicleSearchSelect from "@/components/admin/VehicleSearchSelect";
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
  const { addVerklaring, sendToMoneybird } = useInkoopverklaringen();
  const { vehicles } = useVehicles();
  const [linkVehicleId, setLinkVehicleId] = useState<string>("");

  // Form state — gepersisteerd naar localStorage zodat data niet verloren gaat op mobiel
  const STORAGE_KEY = "ikv-wizard-draft";
  const loadDraft = () => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
  };
  const draft = loadDraft();

  const [verkoper, setVerkoper] = useState(draft?.verkoper ?? { naam: "", email: "", telefoon: "", adres: "", woonplaats: "" });
  const [voertuig, setVoertuig] = useState(draft?.voertuig ?? { kenteken: "", merk: "", model: "", bouwjaar: "", kilometerstand: "", chassisnummer: "" });
  const [legType, setLegType] = useState<string>(draft?.legType ?? "paspoort");
  const [legNummer, setLegNummer] = useState<string>(draft?.legNummer ?? "");
  const [transactie, setTransactie] = useState(draft?.transactie ?? { inkoopprijs: "", datum: new Date().toISOString().split("T")[0] });

  useEffect(() => {
    if (done) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ verkoper, voertuig, legType, legNummer, transactie }));
    } catch {}
  }, [verkoper, voertuig, legType, legNummer, transactie, done]);

  // Signature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sigPadRef = useRef<SignaturePad | null>(null);

  // Robuuste init + resize: behoudt bestaande tekening bij viewport/keyboard wijzigingen
  useEffect(() => {
    if (step !== 2 || !canvasRef.current) return;
    const canvas = canvasRef.current;

    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const data = sigPadRef.current?.toData();
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(ratio, ratio);
        ctx.fillStyle = "rgb(255,255,255)";
        ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      }
      if (!sigPadRef.current) {
        sigPadRef.current = new SignaturePad(canvas, { backgroundColor: "rgb(255,255,255)" });
      }
      if (data && data.length) sigPadRef.current.fromData(data);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.visualViewport?.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.visualViewport?.removeEventListener("resize", resizeCanvas);
    };
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
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  // Sluit dialog zonder data te wissen — gebruiker kan verder waar hij gebleven was
  const handleClose = (v: boolean) => {
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
      // Automatisch doorsturen naar Moneybird boekhouding
      sendToMoneybird({
        id: result.id,
        documentNaam: docNaam,
        verkoperNaam: verkoper.naam,
        verkoperTelefoon: verkoper.telefoon,
        verkoperAdres: verkoper.adres,
        verkoperWoonplaats: verkoper.woonplaats,
        kenteken: kenteken || undefined,
        merk: voertuig.merk,
        model: voertuig.model,
        inkoopprijs: Number(transactie.inkoopprijs),
        datum: transactie.datum,
        pdfPath: filePath,
        legitimatieType: legType,
        legitimatieNummer: legNummer,
        status: "ondertekend",
        createdAt: new Date().toISOString(),
      } as any);
    }

    setSaving(false);
    setDone(true);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
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

  const availableVehicles = vehicles.filter(v => v.status !== "verkocht");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="p-0 gap-0 max-sm:w-screen max-sm:h-[100dvh] max-sm:max-w-none max-sm:max-h-none max-sm:rounded-none max-sm:border-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:left-0 max-sm:top-0 sm:max-w-lg sm:max-h-[90dvh] flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/50 shrink-0">
          <DialogTitle className="text-base font-semibold">Nieuwe inkoopverklaring</DialogTitle>
          {!done && (
            <div className="space-y-2 pt-3">
              <div className="flex justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
                {STEPS.map((s, i) => (
                  <span key={s} className={cn(i === step && "text-foreground font-medium")}>{s}</span>
                ))}
              </div>
              <Progress value={((step + 1) / STEPS.length) * 100} className="h-1" />
            </div>
          )}
        </DialogHeader>

        {!done ? (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

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
                  <div
                    className="border border-border rounded-lg overflow-hidden bg-white"
                    style={{ touchAction: "none" }}
                    onTouchMove={(e) => e.preventDefault()}
                  >
                    <canvas
                      ref={canvasRef}
                      className="w-full block"
                      style={{ height: 200, touchAction: "none" }}
                    />
                  </div>
                  <Button variant="ghost" size="sm" className="mt-1 text-xs text-muted-foreground" onClick={() => sigPadRef.current?.clear()}>
                    Wissen
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {!done ? (
          <div className="shrink-0 flex justify-between gap-2 px-5 py-3 border-t border-border/50 bg-background">
            <Button variant="outline" size="sm" onClick={() => step > 0 ? setStep(step - 1) : handleClose(false)}>
              {step === 0 ? "Annuleren" : "Vorige"}
            </Button>
            {step < 2 ? (
              <Button size="sm" onClick={() => setStep(step + 1)} disabled={!canNext()}>Volgende</Button>
            ) : (
              <Button size="sm" onClick={handleGenerate} disabled={!canNext() || saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Genereren
              </Button>
            )}
          </div>
        ) : (
          /* Done screen */
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="font-semibold">Inkoopverklaring opgeslagen</p>
              <p className="text-sm text-muted-foreground mt-1">{voertuig.merk} {voertuig.model} — {verkoper.naam}</p>
            </div>

            <div className="flex flex-col gap-2 text-left">
              <Button onClick={handleDownload} className="gap-2 w-full">
                <Download className="w-4 h-4" /> PDF downloaden
              </Button>

              <div className="space-y-2 pt-2">
                <Label className="text-xs text-muted-foreground">Koppelen aan voertuig</Label>
                <VehicleSearchSelect
                  vehicles={availableVehicles.map(v => ({ id: v.id, kenteken: v.kenteken, merk: v.merk, model: v.model }))}
                  value={linkVehicleId}
                  onValueChange={setLinkVehicleId}
                  placeholder="Zoek voertuig..."
                />
                <Button variant="outline" onClick={handleLink} disabled={!linkVehicleId} className="gap-2 w-full">
                  <Link2 className="w-4 h-4" /> Koppelen aan voertuig
                </Button>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={() => handleClose(false)} className="text-muted-foreground w-full">
              Sluiten
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

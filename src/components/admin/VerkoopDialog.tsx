import { useState, useEffect } from "react";
import { Vehicle, formatEuroDecimal, calcKostprijs, calcTotalKosten, calcWinst, calcMarge } from "@/types/vehicle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  vehicle: Vehicle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface ChecklistItem {
  naam: string;
  verplicht: boolean;
  voltooid: boolean;
  documentId?: string;
}

const requiredDocs = ["Inkoopverklaring", "Kentekenbewijs", "Koopovereenkomst", "Overschrijvingsbewijs"];

const VerkoopDialog = ({ vehicle, open, onOpenChange, onComplete }: Props) => {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const [form, setForm] = useState({
    verkoopprijs: vehicle.verkoopprijs || 0,
    verkoopDatum: new Date().toISOString().split("T")[0],
    koperNaam: vehicle.koperNaam || "",
    koperEmail: vehicle.koperEmail || "",
    koperTelefoon: vehicle.koperTelefoon || "",
    betaalmethode: "overboeking",
  });

  // Load checklist from existing documents
  useEffect(() => {
    if (!open) return;
    const loadChecklist = async () => {
      const { data: docs } = await supabase
        .from("vehicle_documents")
        .select("id, type")
        .eq("vehicle_id", vehicle.id);

      const items: ChecklistItem[] = requiredDocs.map((naam) => {
        const found = (docs || []).find((d: any) => d.type === naam);
        return { naam, verplicht: true, voltooid: !!found, documentId: found?.id };
      });
      setChecklist(items);
    };
    loadChecklist();
    setStep(1);
    setConfirmed(false);
  }, [open, vehicle.id]);

  const completedCount = checklist.filter((c) => c.voltooid).length;

  const handleUploadDoc = async (docNaam: string, file: File) => {
    setUploading(docNaam);
    const ext = file.name.split(".").pop();
    const path = `${vehicle.id}/${Date.now()}.${ext}`;
    const { error: storageErr } = await supabase.storage.from("vehicle-documents").upload(path, file);
    if (storageErr) { toast.error("Upload mislukt"); setUploading(null); return; }

    const { data, error } = await supabase.from("vehicle_documents").insert({
      vehicle_id: vehicle.id,
      naam: docNaam,
      type: docNaam,
      file_path: path,
      file_size: file.size,
      mime_type: file.type,
    } as any).select("id").single();

    if (error) { toast.error("Opslaan mislukt"); setUploading(null); return; }

    setChecklist((prev) =>
      prev.map((c) => c.naam === docNaam ? { ...c, voltooid: true, documentId: data?.id } : c)
    );
    toast.success(`${docNaam} geüpload`);
    setUploading(null);
  };

  const handleFinalize = async () => {
    setSaving(true);

    // Update vehicle
    const { error } = await supabase.from("vehicles").update({
      status: "verkocht",
      verkoop_datum: form.verkoopDatum,
      verkoopprijs: form.verkoopprijs,
      koper_naam: form.koperNaam,
      koper_email: form.koperEmail || null,
      koper_telefoon: form.koperTelefoon || null,
      betaalmethode: form.betaalmethode,
    } as any).eq("id", vehicle.id);

    if (error) { toast.error("Fout bij afronden verkoop"); setSaving(false); return; }

    // Insert make_event
    const totalKosten = calcTotalKosten(vehicle);
    const kostprijs = calcKostprijs(vehicle);
    await supabase.from("make_events").insert({
      event_type: "vehicle.sold",
      payload: {
        vehicle_id: vehicle.id,
        kenteken: vehicle.kenteken,
        merk: vehicle.merk,
        model: vehicle.model,
        bouwjaar: vehicle.bouwjaar,
        inkoopprijs: vehicle.inkoopprijs,
        totale_kosten: totalKosten,
        kostprijs: kostprijs,
        verkoopprijs: form.verkoopprijs,
        winst: form.verkoopprijs - kostprijs,
        verkoop_datum: form.verkoopDatum,
        koper_naam: form.koperNaam,
        koper_email: form.koperEmail,
        koper_telefoon: form.koperTelefoon,
        betaalmethode: form.betaalmethode,
      },
    } as any);

    setSaving(false);
    onOpenChange(false);
    toast.success("✅ Verkoop afgerond! Moneybird en Google Drive worden automatisch bijgewerkt.");
    onComplete();
  };

  // Computed financials for step 3
  const totalKosten = calcTotalKosten(vehicle);
  const kostprijs = calcKostprijs(vehicle);
  const winstCalc = form.verkoopprijs - kostprijs;
  const margeCalc = kostprijs > 0 ? (winstCalc / kostprijs) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Verkoopgegevens"}
            {step === 2 && "Controleer je dossier"}
            {step === 3 && "Bevestiging"}
          </DialogTitle>
          <div className="flex gap-1 mt-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
        </DialogHeader>

        {/* Step 1: Verkoopgegevens */}
        {step === 1 && (
          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Verkoopprijs (€) *</label>
              <input type="number" step="0.01" value={form.verkoopprijs} onChange={(e) => setForm(f => ({ ...f, verkoopprijs: Number(e.target.value) }))} className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Verkoopdatum *</label>
              <input type="date" value={form.verkoopDatum} onChange={(e) => setForm(f => ({ ...f, verkoopDatum: e.target.value }))} className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Koper naam *</label>
              <input value={form.koperNaam} onChange={(e) => setForm(f => ({ ...f, koperNaam: e.target.value }))} className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Koper e-mail</label>
                <input value={form.koperEmail} onChange={(e) => setForm(f => ({ ...f, koperEmail: e.target.value }))} className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Koper telefoon</label>
                <input value={form.koperTelefoon} onChange={(e) => setForm(f => ({ ...f, koperTelefoon: e.target.value }))} className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Betaalmethode</label>
              <select value={form.betaalmethode} onChange={(e) => setForm(f => ({ ...f, betaalmethode: e.target.value }))} className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="contant">Contant</option>
                <option value="overboeking">Overboeking</option>
                <option value="ideal">iDEAL</option>
                <option value="anders">Anders</option>
              </select>
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!form.verkoopprijs || !form.verkoopDatum || !form.koperNaam}
              className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              Volgende →
            </button>
          </div>
        )}

        {/* Step 2: Document Checklist */}
        {step === 2 && (
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">{completedCount} van de {checklist.length} documenten aanwezig</p>
            <div className="space-y-2">
              {checklist.map((item) => (
                <div key={item.naam} className="flex items-center justify-between px-4 py-3 bg-secondary/50 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    {item.voltooid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-sm text-foreground">{item.naam}</span>
                  </div>
                  {!item.voltooid && (
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-md cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      {uploading === item.naam ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Uploaden"}
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadDoc(item.naam, f);
                      }} />
                    </label>
                  )}
                </div>
              ))}
            </div>

            {completedCount < checklist.length && (
              <div className="flex items-start gap-2 px-4 py-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-400">
                  Let op: je dossier is nog niet volledig. Je kunt de verkoop afronden, maar zorg dat je de documenten zo snel mogelijk uploadt.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg hover:bg-secondary/80 transition-colors">
                ← Terug
              </button>
              <button onClick={() => setStep(3)} className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                Volgende →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="space-y-4 mt-2">
            <Card>
              <CardContent className="p-4 space-y-3">
                <Row label="Inkoopprijs" value={formatEuroDecimal(vehicle.inkoopprijs)} />
                <Row label="Kosten" value={formatEuroDecimal(totalKosten)} />
                <Row label="Kostprijs" value={formatEuroDecimal(kostprijs)} bold />
                <div className="border-t border-border pt-3">
                  <Row label="Verkoopprijs" value={formatEuroDecimal(form.verkoopprijs)} />
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-foreground">Marge</span>
                    <span className={`text-2xl font-bold ${winstCalc >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {formatEuroDecimal(winstCalc)} <span className="text-sm font-medium">({margeCalc.toFixed(1)}%)</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <label className="flex items-center gap-3 cursor-pointer px-4 py-3 bg-secondary/50 rounded-lg border border-border">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
              <span className="text-sm text-foreground">Ik bevestig dat de betaling is ontvangen</span>
            </label>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-2.5 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg hover:bg-secondary/80 transition-colors">
                ← Terug
              </button>
              <button
                onClick={handleFinalize}
                disabled={!confirmed || saving}
                className="flex-1 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Verkoop Afronden
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className={`text-sm ${bold ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</span>
    <span className={`text-sm ${bold ? "font-bold text-foreground" : "text-foreground"}`}>{value}</span>
  </div>
);

export default VerkoopDialog;

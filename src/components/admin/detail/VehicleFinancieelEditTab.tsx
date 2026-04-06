import { useState } from "react";
import { Vehicle, CostItem, formatEuroDecimal, calcKostprijs, calcWinst, calcBtwMarge, calcNettoMarge, calcMarge, calcConsignatieCommissie, isConsignatie, costCategories } from "@/types/vehicle";
import { Loader2, Info, Trash2, Paperclip } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  vehicle: Vehicle;
  onSave: (v: Vehicle) => Promise<void>;
  onAddCost: (vehicleId: string, cost: Omit<CostItem, "id">) => Promise<void>;
  onRemoveCost: (costId: string, vehicleId?: string) => Promise<void>;
  onLogActivity: (type: string, beschrijving: string) => void;
}

const VehicleFinancieelEditTab = ({ vehicle, onSave, onAddCost, onRemoveCost, onLogActivity }: Props) => {
  const autoKostprijs = vehicle.inkoopprijs + vehicle.kosten.reduce((s, k) => s + k.amount, 0);
  const [form, setForm] = useState({
    inkoopprijs: vehicle.inkoopprijs ? String(vehicle.inkoopprijs) : "",
    verkoopprijs: vehicle.verkoopprijs ? String(vehicle.verkoopprijs) : "",
    inkoopDatum: vehicle.inkoopDatum,
    verkoopDatum: vehicle.verkoopDatum || "",
    verkoopType: vehicle.verkoopType,
    consignatieCommissiePerc: vehicle.consignatieCommissiePerc ? String(vehicle.consignatieCommissiePerc) : "10",
    consignatieEigenaarNaam: vehicle.consignatieEigenaarNaam || "",
    consignatieEigenaarTelefoon: vehicle.consignatieEigenaarTelefoon || "",
    consignatieEigenaarEmail: vehicle.consignatieEigenaarEmail || "",
  });
  const [saving, setSaving] = useState(false);

  const isConsig = form.verkoopType === "consignatie";

  const toggleConsignatie = (checked: boolean) => {
    setForm((f) => ({ ...f, verkoopType: checked ? "consignatie" : "regulier" }));
  };

  const handleSave = async () => {
    setSaving(true);
    const kostprijsVal = form.inkoopprijs + vehicle.kosten.reduce((s, k) => s + k.amount, 0);
    await onSave({
      ...vehicle,
      inkoopprijs: form.inkoopprijs,
      verkoopprijs: form.verkoopprijs,
      inkoopDatum: form.inkoopDatum,
      verkoopDatum: form.verkoopDatum || undefined,
      verkoopType: form.verkoopType,
      status: isConsig ? "consignatie" : vehicle.status === "consignatie" ? "te_koop" : vehicle.status,
      consignatieCommissiePerc: form.consignatieCommissiePerc,
      consignatieEigenaarNaam: form.consignatieEigenaarNaam || undefined,
      consignatieEigenaarTelefoon: form.consignatieEigenaarTelefoon || undefined,
      consignatieEigenaarEmail: form.consignatieEigenaarEmail || undefined,
      kostprijsCalc: kostprijsVal,
    });
    onLogActivity("financieel_bewerkt", "Financiële gegevens bijgewerkt");
    setSaving(false);
  };

  const handleFileDownload = async (cost: CostItem) => {
    if (!cost.filePath) return;
    const { data, error } = await supabase.storage.from("vehicle-documents").createSignedUrl(cost.filePath, 300);
    if (error || !data?.signedUrl) { toast.error("Download link kon niet worden aangemaakt"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const inputCls = "w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all";

  const totalKosten = vehicle.kosten.reduce((s, k) => s + k.amount, 0);
  const kostprijs = calcKostprijs(vehicle);
  const brutoWinst = calcWinst(vehicle);
  const nettoMarge = calcNettoMarge(vehicle);

  return (
    <div className="space-y-5">
      {/* Editable financial fields */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Financiële gegevens</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {!isConsig && (
            <>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Inkoopprijs (€)</label>
                <input type="number" value={form.inkoopprijs} onChange={(e) => setForm(f => ({ ...f, inkoopprijs: Number(e.target.value) }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Inkoopdatum</label>
                <input type="date" value={form.inkoopDatum} onChange={(e) => setForm(f => ({ ...f, inkoopDatum: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kostprijs (€)</label>
                <div className="px-3 py-2.5 text-sm bg-secondary/30 border border-border rounded-xl text-foreground tabular-nums">
                  {formatEuroDecimal(autoKostprijs)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Automatisch berekend: inkoopprijs + kosten</p>
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Verkoopprijs (€)</label>
            <input type="number" value={form.verkoopprijs} onChange={(e) => setForm(f => ({ ...f, verkoopprijs: Number(e.target.value) }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Verkoopdatum</label>
            <input type="date" value={form.verkoopDatum} onChange={(e) => setForm(f => ({ ...f, verkoopDatum: e.target.value }))} className={inputCls} />
          </div>
        </div>

        {/* Consignatie toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <p className="text-sm font-medium text-foreground">Consignatie</p>
            <p className="text-xs text-muted-foreground">Dit voertuig wordt verkocht in consignatie</p>
          </div>
          <Switch checked={isConsig} onCheckedChange={toggleConsignatie} />
        </div>

        {isConsig && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Eigenaar naam</label>
              <input value={form.consignatieEigenaarNaam} onChange={(e) => setForm(f => ({ ...f, consignatieEigenaarNaam: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Commissie %</label>
              <input type="number" min={0} max={50} step={0.5} value={form.consignatieCommissiePerc} onChange={(e) => setForm(f => ({ ...f, consignatieCommissiePerc: Number(e.target.value) }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Eigenaar telefoon</label>
              <input value={form.consignatieEigenaarTelefoon} onChange={(e) => setForm(f => ({ ...f, consignatieEigenaarTelefoon: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Eigenaar e-mail</label>
              <input value={form.consignatieEigenaarEmail} onChange={(e) => setForm(f => ({ ...f, consignatieEigenaarEmail: e.target.value }))} className={inputCls} />
            </div>
          </div>
        )}

        <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-sm font-semibold rounded-xl hover:bg-foreground/90 disabled:opacity-40 transition-all active:scale-[0.98]">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Opslaan
        </button>
      </div>

      {/* Kosten lijst */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kosten ({vehicle.kosten.length})</h3>
        </div>
        {vehicle.kosten.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">Nog geen kosten toegevoegd.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/10">
                  <th className="text-left px-4 py-2 text-[10px] font-medium text-muted-foreground uppercase">Datum</th>
                  <th className="text-left px-4 py-2 text-[10px] font-medium text-muted-foreground uppercase">Categorie</th>
                  <th className="text-left px-4 py-2 text-[10px] font-medium text-muted-foreground uppercase">Omschrijving</th>
                  <th className="text-right px-4 py-2 text-[10px] font-medium text-muted-foreground uppercase">Bedrag</th>
                  <th className="px-4 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {vehicle.kosten.map((k) => (
                  <tr key={k.id} className="border-b border-border/50 hover:bg-accent/10">
                    <td className="px-4 py-2 text-muted-foreground">{k.date ? new Date(k.date).toLocaleDateString("nl-NL") : "—"}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded border bg-secondary text-secondary-foreground border-border">
                        {costCategories[k.category] || k.category}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-foreground">{k.description}</td>
                    <td className="px-4 py-2 text-right font-medium text-foreground">{formatEuroDecimal(k.amount)}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        {k.filePath && (
                          <button onClick={() => handleFileDownload(k)} className="text-primary hover:text-primary/80"><Paperclip className="w-3.5 h-3.5" /></button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="text-red-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Kosten verwijderen?</AlertDialogTitle>
                              <AlertDialogDescription>Weet je zeker dat je deze kosten wilt verwijderen?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuleren</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onRemoveCost(k.id, vehicle.id)} className="bg-red-600 hover:bg-red-700">Verwijderen</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td colSpan={3} className="px-4 py-2 text-sm font-medium text-foreground">Totaal kosten</td>
                  <td className="px-4 py-2 text-right font-bold text-foreground">{formatEuroDecimal(totalKosten)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* BTW info */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-secondary/50 rounded-md border border-border">
        <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground font-medium">BTW Margeregeling:</strong> bij inkoop van particulieren betaal je BTW alleen over de winst (marge × 21/121).
        </p>
      </div>
    </div>
  );
};

export default VehicleFinancieelEditTab;

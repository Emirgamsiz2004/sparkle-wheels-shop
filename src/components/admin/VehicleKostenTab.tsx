import { useState } from "react";
import { Vehicle, CostItem, formatEuroDecimal, calcKostprijs, calcWinst, calcMarge, costCategories } from "@/types/vehicle";
import { Plus, Trash2, Loader2, Paperclip } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  vehicle: Vehicle;
  onAddCost: (vehicleId: string, cost: Omit<CostItem, "id">) => Promise<void>;
  onRemoveCost: (costId: string, vehicleId?: string) => Promise<void>;
}

const VehicleKostenTab = ({ vehicle, onAddCost, onRemoveCost }: Props) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    category: "overig" as CostItem["category"],
    description: "",
    leverancier: "",
    amount: 0,
    btwPercentage: 21,
    date: new Date().toISOString().split("T")[0],
  });

  const totalKosten = vehicle.kosten.reduce((s, k) => s + k.amount, 0);
  const kostprijs = calcKostprijs(vehicle);
  const winst = calcWinst(vehicle);
  const marge = calcMarge(vehicle);

  const handleAdd = async () => {
    setSaving(true);
    let filePath: string | undefined;
    let fileName: string | undefined;

    // Upload file if selected
    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${vehicle.id}/kosten/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("vehicle-documents").upload(path, file);
      if (uploadErr) {
        toast.error("Factuur upload mislukt");
        setSaving(false);
        return;
      }
      filePath = path;
      fileName = file.name;

      // Also create a vehicle_documents row
      await supabase.from("vehicle_documents").insert({
        vehicle_id: vehicle.id,
        naam: file.name,
        type: "Factuur",
        file_path: path,
        file_size: file.size,
        mime_type: file.type,
      } as any);
    }

    await onAddCost(vehicle.id, {
      ...form,
      description: form.description,
      amount: form.amount,
      leverancier: form.leverancier || undefined,
      filePath,
      fileName,
    });
    setSaving(false);
    setOpen(false);
    setFile(null);
    setForm({ category: "overig", description: "", leverancier: "", amount: 0, btwPercentage: 21, date: new Date().toISOString().split("T")[0] });
  };

  const handleFileDownload = async (cost: CostItem) => {
    if (!cost.filePath) return;
    const { data, error } = await supabase.storage.from("vehicle-documents").createSignedUrl(cost.filePath, 300);
    if (error || !data?.signedUrl) { toast.error("Download link kon niet worden aangemaakt"); return; }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Inkoopprijs", value: formatEuroDecimal(vehicle.inkoopprijs) },
          { label: "Kosten", value: formatEuroDecimal(totalKosten) },
          { label: "Kostprijs", value: formatEuroDecimal(kostprijs), bold: true },
          ...(vehicle.verkoopprijs > 0
            ? [{ label: "Marge", value: `${formatEuroDecimal(winst)} (${marge.toFixed(1)}%)`, color: winst >= 0 ? "text-emerald-500" : "text-red-500" }]
            : []),
        ].map((item: any) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
              <p className={`text-xl ${item.bold ? "font-bold" : "font-semibold"} ${item.color || "text-foreground"}`}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Cost */}
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Kosten Toevoegen
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Kosten Toevoegen</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Categorie</label>
                <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value as CostItem["category"] }))} className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                  {Object.entries(costCategories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Omschrijving</label>
                <input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Leverancier (optioneel)</label>
                <input value={form.leverancier} onChange={(e) => setForm(f => ({ ...f, leverancier: e.target.value }))} className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Bedrag excl. BTW (€)</label>
                  <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: Number(e.target.value) }))} className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">BTW %</label>
                  <select value={form.btwPercentage} onChange={(e) => setForm(f => ({ ...f, btwPercentage: Number(e.target.value) }))} className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                    <option value={0}>0%</option>
                    <option value={9}>9%</option>
                    <option value={21}>21%</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Datum</label>
                <input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Factuur uploaden</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-foreground" />
                {file && <p className="text-xs text-muted-foreground mt-1">📎 {file.name}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">Upload de factuur direct mee om dubbel werk te voorkomen</p>
              </div>
              <button onClick={handleAdd} disabled={saving || !form.description} className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Toevoegen
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cost Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {vehicle.kosten.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              Nog geen kosten toegevoegd. Voeg de eerste kostenpost toe.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-accent/20">
                    {["Datum", "Categorie", "Omschrijving", "Leverancier", "Factuur", "Bedrag excl.", "BTW", "Totaal", ""].map((h) => (
                      <th key={h} className={`${h === "Bedrag excl." || h === "BTW" || h === "Totaal" ? "text-right" : "text-left"} px-5 py-3.5 text-[10px] font-medium text-muted-foreground uppercase tracking-widest`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vehicle.kosten.map((k) => {
                    const btw = k.amount * ((k.btwPercentage || 21) / 100);
                    return (
                      <tr key={k.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                        <td className="px-5 py-3 text-muted-foreground">{k.date ? new Date(k.date).toLocaleDateString("nl-NL") : "—"}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-md border bg-secondary text-secondary-foreground border-border">
                            {costCategories[k.category] || k.category}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-foreground">{k.description}</td>
                        <td className="px-5 py-3 text-muted-foreground">{k.leverancier || "—"}</td>
                        <td className="px-5 py-3">
                          {k.filePath ? (
                            <button onClick={() => handleFileDownload(k)} className="text-primary hover:text-primary/80 transition-colors">
                              <Paperclip className="w-4 h-4" />
                            </button>
                          ) : null}
                        </td>
                        <td className="px-5 py-3 text-right text-foreground">{formatEuroDecimal(k.amount)}</td>
                        <td className="px-5 py-3 text-right text-muted-foreground">{formatEuroDecimal(btw)}</td>
                        <td className="px-5 py-3 text-right font-medium text-foreground">{formatEuroDecimal(k.amount + btw)}</td>
                        <td className="px-5 py-3">
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleKostenTab;

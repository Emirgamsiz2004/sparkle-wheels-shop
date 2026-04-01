import { useState } from "react";
import { CostItem, costCategories } from "@/types/vehicle";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  onAddCost: (vehicleId: string, cost: Omit<CostItem, "id">) => Promise<void>;
}

const AddCostDialog = ({ open, onClose, vehicleId, onAddCost }: Props) => {
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    category: "overig" as CostItem["category"],
    description: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
  });

  const handleAdd = async () => {
    if (!form.description) return;
    setSaving(true);
    let filePath: string | undefined;
    let fileName: string | undefined;

    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${vehicleId}/kosten/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("vehicle-documents").upload(path, file);
      if (uploadErr) { toast.error("Upload mislukt"); setSaving(false); return; }
      filePath = path;
      fileName = file.name;
    }

    await onAddCost(vehicleId, { ...form, filePath, fileName });
    setSaving(false);
    onClose();
    setFile(null);
    setForm({ category: "overig", description: "", amount: 0, date: new Date().toISOString().split("T")[0] });
  };

  const inputCls = "w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-2xl border-border bg-card p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-base font-semibold tracking-tight">Kosten toevoegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-6 pb-6">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Categorie</label>
            <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value as CostItem["category"] }))} className={inputCls}>
              {Object.entries(costCategories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Omschrijving</label>
            <input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} placeholder="Bijv. APK keuring" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bedrag (€)</label>
              <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: Number(e.target.value) }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Datum</label>
              <input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Factuur (optioneel)</label>
            <div className="relative">
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-secondary file:text-foreground hover:file:bg-accent file:cursor-pointer file:transition-colors" />
            </div>
          </div>
          <button onClick={handleAdd} disabled={saving || !form.description} className="w-full py-2.5 bg-foreground text-background text-sm font-semibold rounded-xl hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Toevoegen
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCostDialog;

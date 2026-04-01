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

  const inputCls = "w-full px-2.5 py-1.5 text-sm bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[calc(100vw-2rem)]">
        <DialogHeader><DialogTitle>Kosten toevoegen</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Categorie</label>
            <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value as CostItem["category"] }))} className={inputCls}>
              {Object.entries(costCategories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Omschrijving</label>
            <input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Bedrag (€)</label>
              <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: Number(e.target.value) }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Datum</label>
              <input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Factuur (optioneel)</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-foreground" />
          </div>
          <button onClick={handleAdd} disabled={saving || !form.description} className="w-full py-2 border border-border text-sm font-medium rounded-md hover:bg-accent disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Toevoegen
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCostDialog;

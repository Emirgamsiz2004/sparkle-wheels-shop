import { useState } from "react";
import { Vehicle, CostItem, formatEuroDecimal, calcKostprijs, calcWinst, calcMarge, costCategories } from "@/types/vehicle";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  vehicle: Vehicle;
  onAddCost: (vehicleId: string, cost: Omit<CostItem, "id">) => Promise<void>;
  onRemoveCost: (costId: string) => Promise<void>;
}

const VehicleKostenTab = ({ vehicle, onAddCost, onRemoveCost }: Props) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category: "overig" as CostItem["category"],
    description: "",
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
    await onAddCost(vehicle.id, form);
    setSaving(false);
    setOpen(false);
    setForm({ category: "overig", description: "", amount: 0, btwPercentage: 21, date: new Date().toISOString().split("T")[0] });
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Totale Kosten</p>
            <p className="text-xl font-bold text-gray-900">{formatEuroDecimal(totalKosten)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Kostprijs</p>
            <p className="text-xl font-bold text-gray-900">{formatEuroDecimal(kostprijs)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Marge</p>
            <p className={`text-xl font-bold ${winst >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatEuroDecimal(winst)} <span className="text-sm font-normal">({marge.toFixed(1)}%)</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Cost */}
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#1F3864] text-white text-sm font-medium rounded-lg hover:bg-[#172d52]">
              <Plus className="w-4 h-4" /> Kosten Toevoegen
            </button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Kosten Toevoegen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Categorie</label>
                <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value as CostItem["category"] }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                  {Object.entries(costCategories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Omschrijving</label>
                <input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Bedrag excl. BTW (€)</label>
                  <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: Number(e.target.value) }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">BTW %</label>
                  <input type="number" value={form.btwPercentage} onChange={(e) => setForm(f => ({ ...f, btwPercentage: Number(e.target.value) }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Datum</label>
                <input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              </div>
              <button onClick={handleAdd} disabled={saving || !form.description} className="w-full py-2.5 bg-[#1F3864] text-white text-sm font-medium rounded-lg hover:bg-[#172d52] disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Toevoegen
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cost Table */}
      <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {vehicle.kosten.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">Nog geen kosten geregistreerd.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Datum</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Categorie</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Omschrijving</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Bedrag excl.</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">BTW</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Totaal</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {vehicle.kosten.map((k) => {
                    const btw = k.amount * ((k.btwPercentage || 21) / 100);
                    return (
                      <tr key={k.id} className="border-b border-gray-100">
                        <td className="px-5 py-3 text-gray-500">{k.date ? new Date(k.date).toLocaleDateString("nl-NL") : "—"}</td>
                        <td className="px-5 py-3 text-gray-700">{costCategories[k.category] || k.category}</td>
                        <td className="px-5 py-3 text-gray-700">{k.description}</td>
                        <td className="px-5 py-3 text-right text-gray-700">{formatEuroDecimal(k.amount)}</td>
                        <td className="px-5 py-3 text-right text-gray-500">{formatEuroDecimal(btw)}</td>
                        <td className="px-5 py-3 text-right font-medium text-gray-900">{formatEuroDecimal(k.amount + btw)}</td>
                        <td className="px-5 py-3">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Kosten verwijderen?</AlertDialogTitle>
                                <AlertDialogDescription>Weet je zeker dat je deze kosten wilt verwijderen?</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onRemoveCost(k.id)} className="bg-red-600 hover:bg-red-700">Verwijderen</AlertDialogAction>
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

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Plus, Trash2, ChevronUp, ChevronDown, Pencil, Check, X, Loader2 } from "lucide-react";
import { useDiensten, dienstCategorieLabels, DienstCategorie, Dienst } from "@/hooks/useDiensten";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const categorieOptions: DienstCategorie[] = ["detailing", "onderhoud", "reparatie", "overig"];

const DienstenBeheer = () => {
  const { diensten, loading, create, update, remove, reorder } = useDiensten(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Dienst>>({});
  const [adding, setAdding] = useState(false);
  const [newDienst, setNewDienst] = useState<Partial<Dienst>>({ naam: "", categorie: "overig", duur_minuten: 60 });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const startEdit = (d: Dienst) => {
    setEditingId(d.id);
    setDraft({ naam: d.naam, categorie: d.categorie, duur_minuten: d.duur_minuten });
  };

  const saveEdit = async (id: string) => {
    setBusy(true);
    try {
      await update(id, draft);
      setEditingId(null);
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = async () => {
    if (!newDienst.naam?.trim()) return;
    setBusy(true);
    try {
      await create({
        naam: newDienst.naam.trim(),
        categorie: newDienst.categorie as DienstCategorie,
        duur_minuten: Number(newDienst.duur_minuten) || 60,
        volgorde: (diensten[diensten.length - 1]?.volgorde ?? 0) + 10,
      });
      setNewDienst({ naam: "", categorie: "overig", duur_minuten: 60 });
      setAdding(false);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setBusy(true);
    try {
      await remove(deleteId);
      setDeleteId(null);
    } finally {
      setBusy(false);
    }
  };

  // group by category
  const grouped = categorieOptions
    .map((c) => ({ cat: c, items: diensten.filter((d) => d.categorie === c) }))
    .filter((g) => g.items.length > 0);

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md flex items-center justify-center bg-primary/10">
              <Wrench className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground font-['Poppins']">Diensten</h2>
              <p className="text-xs text-muted-foreground">Diensten die in afspraken (onderhoud, poetsbeurt, anders) gebruikt worden</p>
            </div>
          </div>
          <button
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-[3px] hover:bg-accent transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nieuwe dienst
          </button>
        </div>

        {adding && (
          <div className="grid grid-cols-12 gap-2 items-center bg-secondary/30 p-3 rounded-[3px]">
            <input
              placeholder="Naam dienst"
              value={newDienst.naam || ""}
              onChange={(e) => setNewDienst({ ...newDienst, naam: e.target.value })}
              className="col-span-5 px-2 py-1.5 text-sm bg-card border border-border text-foreground rounded-[3px]"
              autoFocus
            />
            <select
              value={newDienst.categorie || "overig"}
              onChange={(e) => setNewDienst({ ...newDienst, categorie: e.target.value as DienstCategorie })}
              className="col-span-3 px-2 py-1.5 text-sm bg-card border border-border text-foreground rounded-[3px]"
            >
              {categorieOptions.map((c) => (
                <option key={c} value={c}>{dienstCategorieLabels[c]}</option>
              ))}
            </select>
            <div className="col-span-2 flex items-center gap-1">
              <input
                type="number"
                min={5}
                step={5}
                value={newDienst.duur_minuten || 60}
                onChange={(e) => setNewDienst({ ...newDienst, duur_minuten: Number(e.target.value) })}
                className="w-full px-2 py-1.5 text-sm bg-card border border-border text-foreground rounded-[3px]"
              />
              <span className="text-[10px] text-muted-foreground">min</span>
            </div>
            <div className="col-span-2 flex items-center justify-end gap-1">
              <button onClick={handleAdd} disabled={busy || !newDienst.naam?.trim()} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-[3px] disabled:opacity-40">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => { setAdding(false); setNewDienst({ naam: "", categorie: "overig", duur_minuten: 60 }); }} className="p-1.5 text-muted-foreground hover:bg-accent rounded-[3px]">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : diensten.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nog geen diensten toegevoegd</p>
        ) : (
          <div className="space-y-5">
            {grouped.map(({ cat, items }) => (
              <div key={cat}>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2">
                  {dienstCategorieLabels[cat]}
                </p>
                <div className="space-y-1">
                  {items.map((d, idx) => {
                    const isEditing = editingId === d.id;
                    return (
                      <div key={d.id} className="grid grid-cols-12 gap-2 items-center py-2 px-3 bg-secondary/30 rounded-[3px]">
                        {isEditing ? (
                          <>
                            <input
                              value={draft.naam || ""}
                              onChange={(e) => setDraft({ ...draft, naam: e.target.value })}
                              className="col-span-5 px-2 py-1 text-sm bg-card border border-border text-foreground rounded-[3px]"
                            />
                            <select
                              value={draft.categorie || "overig"}
                              onChange={(e) => setDraft({ ...draft, categorie: e.target.value as DienstCategorie })}
                              className="col-span-3 px-2 py-1 text-sm bg-card border border-border text-foreground rounded-[3px]"
                            >
                              {categorieOptions.map((c) => (
                                <option key={c} value={c}>{dienstCategorieLabels[c]}</option>
                              ))}
                            </select>
                            <div className="col-span-2 flex items-center gap-1">
                              <input
                                type="number"
                                min={5}
                                step={5}
                                value={draft.duur_minuten || 0}
                                onChange={(e) => setDraft({ ...draft, duur_minuten: Number(e.target.value) })}
                                className="w-full px-2 py-1 text-sm bg-card border border-border text-foreground rounded-[3px]"
                              />
                              <span className="text-[10px] text-muted-foreground">min</span>
                            </div>
                            <div className="col-span-2 flex items-center justify-end gap-1">
                              <button onClick={() => saveEdit(d.id)} disabled={busy} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-[3px]">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 text-muted-foreground hover:bg-accent rounded-[3px]">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="col-span-6 text-sm text-foreground truncate">{d.naam}</div>
                            <div className="col-span-2 text-xs text-muted-foreground">{d.duur_minuten} min</div>
                            <div className="col-span-4 flex items-center justify-end gap-0.5">
                              <button
                                onClick={() => reorder(d.id, "up")}
                                disabled={idx === 0}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-[3px] disabled:opacity-30"
                                title="Omhoog"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => reorder(d.id, "down")}
                                disabled={idx === items.length - 1}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-[3px] disabled:opacity-30"
                                title="Omlaag"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => startEdit(d)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-[3px]" title="Bewerken">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setDeleteId(d.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-[3px]" title="Verwijderen">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Dienst verwijderen?</AlertDialogTitle>
              <AlertDialogDescription>
                Deze dienst wordt permanent verwijderd. Bestaande afspraken behouden hun gegevens.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuleren</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={busy} className="bg-red-600 hover:bg-red-700">
                Verwijderen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default DienstenBeheer;

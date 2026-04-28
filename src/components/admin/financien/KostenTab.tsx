import { useMemo, useState } from "react";
import {
  useKosten, Kost, KostCategorie, KostFrequentie,
  kostCategorieLabels, kostFrequentieLabels, formatEuro,
} from "@/hooks/useKosten";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

const KostenTab = () => {
  const { kosten, loading, create, update, remove } = useKosten();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<KostCategorie | "all">("all");
  const [filterFreq, setFilterFreq] = useState<KostFrequentie | "all">("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Kost | null>(null);

  const filtered = useMemo(() => {
    return kosten.filter((k) => {
      if (filterCat !== "all" && k.categorie !== filterCat) return false;
      if (filterFreq !== "all" && k.frequentie !== filterFreq) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !k.naam.toLowerCase().includes(q) &&
          !(k.leverancier || "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [kosten, search, filterCat, filterFreq]);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (k: Kost) => {
    setEditing(k);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Zoek naam of leverancier"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value as any)}
          className="h-9 px-2.5 text-sm bg-card border border-border rounded-md text-foreground"
        >
          <option value="all">Alle categorieën</option>
          {Object.entries(kostCategorieLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={filterFreq}
          onChange={(e) => setFilterFreq(e.target.value as any)}
          className="h-9 px-2.5 text-sm bg-card border border-border rounded-md text-foreground"
        >
          <option value="all">Alle frequenties</option>
          {Object.entries(kostFrequentieLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button
          onClick={openNew}
          className="h-9 px-3 inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nieuwe kost
        </button>
      </div>

      {/* Lijst */}
      <div className="bg-card border border-border rounded-[16px] overflow-hidden">
        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Laden…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground mb-3">Nog geen kosten</p>
            <button
              onClick={openNew}
              className="inline-flex items-center gap-1.5 px-3 h-9 bg-primary text-primary-foreground rounded-md text-sm"
            >
              <Plus className="w-4 h-4" />
              Eerste kost toevoegen
            </button>
          </div>
        ) : (
          <table className="w-full text-sm border-separate" style={{ borderSpacing: 0 }}>
            <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold border-b border-border">Naam</th>
                <th className="text-left px-3 py-2.5 font-semibold border-b border-border">Categorie</th>
                <th className="text-left px-3 py-2.5 font-semibold border-b border-border">Leverancier</th>
                <th className="text-right px-3 py-2.5 font-semibold border-b border-border">Bedrag</th>
                <th className="text-left px-3 py-2.5 font-semibold border-b border-border">Frequentie</th>
                <th className="text-left px-3 py-2.5 font-semibold border-b border-border">Datum</th>
                <th className="px-2 w-10 border-b border-border" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((k, idx) => {
                const catColor = getCategorieColor(k.categorie);
                const freqColor = getFrequentieColor(k.frequentie);
                const zebra = idx % 2 === 1 ? "bg-card/40" : "";
                return (
                  <tr
                    key={k.id}
                    onClick={() => openEdit(k)}
                    className={`hover:bg-accent/40 cursor-pointer transition-colors ${zebra}`}
                  >
                    <td className={`px-4 py-3 text-foreground font-medium border-b border-border/40 border-l-[3px] ${catColor.bar}`}>
                      {k.naam}
                    </td>
                    <td className="px-3 py-3 border-b border-border/40">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium border ${catColor.pill}`}>
                        {kostCategorieLabels[k.categorie]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground text-[13px] border-b border-border/40">{k.leverancier || "—"}</td>
                    <td className="px-3 py-3 text-right text-foreground font-semibold tabular-nums text-[14px] border-b border-border/40">
                      {formatEuro(Number(k.bedrag))}
                    </td>
                    <td className="px-3 py-3 border-b border-border/40">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium border ${freqColor}`}>
                        {kostFrequentieLabels[k.frequentie]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground tabular-nums text-[12px] border-b border-border/40">
                      {new Date(k.datum).toLocaleDateString("nl-NL")}
                    </td>
                    <td className="px-2 text-right border-b border-border/40">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground inline-block" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn("overflow-y-auto", isMobile ? "h-[90vh] rounded-t-[16px]" : "w-full sm:max-w-md")}
        >
          <SheetHeader>
            <SheetTitle>{editing ? "Kost bewerken" : "Nieuwe kost"}</SheetTitle>
          </SheetHeader>
          <KostForm
            initial={editing}
            onSubmit={async (data) => {
              if (editing) await update(editing.id, data);
              else await create(data);
              setOpen(false);
            }}
            onDelete={
              editing
                ? async () => {
                    if (confirm("Deze kost verwijderen?")) {
                      await remove(editing.id);
                      setOpen(false);
                    }
                  }
                : undefined
            }
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

const KostForm = ({
  initial, onSubmit, onDelete,
}: {
  initial: Kost | null;
  onSubmit: (data: Partial<Kost>) => Promise<void>;
  onDelete?: () => Promise<void>;
}) => {
  const [naam, setNaam] = useState(initial?.naam || "");
  const [categorie, setCategorie] = useState<KostCategorie>(initial?.categorie || "vaste_kosten");
  const [bedrag, setBedrag] = useState<string>(initial ? String(initial.bedrag) : "");
  const [frequentie, setFrequentie] = useState<KostFrequentie>(initial?.frequentie || "maandelijks");
  const [datum, setDatum] = useState(initial?.datum || new Date().toISOString().slice(0, 10));
  const [leverancier, setLeverancier] = useState(initial?.leverancier || "");
  const [notities, setNotities] = useState(initial?.notities || "");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naam || !bedrag) return;
    setBusy(true);
    try {
      await onSubmit({
        naam,
        categorie,
        bedrag: Number(bedrag),
        frequentie,
        datum,
        leverancier: leverancier || null,
        notities: notities || null,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 mt-4">
      <Field label="Naam *">
        <input
          required
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          className="input"
        />
      </Field>
      <Field label="Categorie">
        <select value={categorie} onChange={(e) => setCategorie(e.target.value as KostCategorie)} className="input">
          {Object.entries(kostCategorieLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </Field>
      <Field label="Leverancier">
        <input value={leverancier} onChange={(e) => setLeverancier(e.target.value)} className="input" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Bedrag *">
          <input
            required
            type="number"
            step="0.01"
            placeholder="0"
            value={bedrag}
            onChange={(e) => setBedrag(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Frequentie">
          <select value={frequentie} onChange={(e) => setFrequentie(e.target.value as KostFrequentie)} className="input">
            {Object.entries(kostFrequentieLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Datum *">
        <input type="date" required value={datum} onChange={(e) => setDatum(e.target.value)} className="input" />
      </Field>
      <Field label="Notities">
        <textarea
          rows={3}
          value={notities}
          onChange={(e) => setNotities(e.target.value)}
          className="input resize-none"
        />
      </Field>

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 px-3 h-9 text-sm text-red-400 hover:bg-red-500/10 rounded-md"
          >
            <Trash2 className="w-4 h-4" />
            Verwijderen
          </button>
        ) : <span />}
        <button
          type="submit"
          disabled={busy}
          className="px-4 h-9 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Opslaan…" : "Opslaan"}
        </button>
      </div>

      <style>{`
        .input { width: 100%; height: 36px; padding: 0 10px; background: hsl(var(--card)); border: 1px solid hsl(var(--border)); border-radius: 6px; color: hsl(var(--foreground)); font-size: 14px; outline: none; }
        .input:focus { border-color: hsl(var(--ring)); }
        textarea.input { height: auto; padding: 8px 10px; }
      `}</style>
    </form>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="block text-xs text-muted-foreground mb-1">{label}</span>
    {children}
  </label>
);

export default KostenTab;

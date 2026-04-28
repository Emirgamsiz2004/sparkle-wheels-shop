import { useMemo, useState } from "react";
import {
  useKosten, Kost, KostFrequentie, kostCategorieLabels, kostFrequentieLabels, formatEuro,
} from "@/hooks/useKosten";
import { Pencil, Trash2, Plus, Power } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const STANDAARD = [
  { naam: "Marktplaats", leverancier: "Marktplaats", categorie: "advertentiekosten" },
  { naam: "AutoScout24", leverancier: "AutoScout24", categorie: "advertentiekosten" },
  { naam: "VWE portaal", leverancier: "VWE", categorie: "abonnementen" },
  { naam: "Autotrust", leverancier: "Autotrust", categorie: "abonnementen" },
  { naam: "Lovable", leverancier: "Lovable", categorie: "abonnementen" },
  { naam: "Moneybird", leverancier: "Moneybird", categorie: "abonnementen" },
];

const perMaand = (k: Kost): number => {
  const b = Number(k.bedrag);
  if (k.frequentie === "maandelijks") return b;
  if (k.frequentie === "kwartaal") return b / 3;
  if (k.frequentie === "jaarlijks") return b / 12;
  return 0;
};

const volgendeBetaaldatum = (k: Kost): Date => {
  const d = new Date(k.datum);
  const now = new Date();
  const stepMonths = k.frequentie === "maandelijks" ? 1 : k.frequentie === "kwartaal" ? 3 : 12;
  const next = new Date(d);
  while (next < now) next.setMonth(next.getMonth() + stepMonths);
  return next;
};

const AbonnementenTab = () => {
  const { kosten, loading, create, update, remove } = useKosten();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Kost | null>(null);

  const abos = useMemo(
    () => kosten.filter((k) => k.frequentie !== "eenmalig"),
    [kosten]
  );

  const totaalPerMaand = abos.filter((k) => k.actief).reduce((s, k) => s + perMaand(k), 0);
  const totaalPerJaar = totaalPerMaand * 12;

  const ontbreekt = STANDAARD.filter(
    (s) => !abos.some((a) => a.naam.toLowerCase() === s.naam.toLowerCase())
  );

  const addStandaard = async (s: typeof STANDAARD[0]) => {
    await create({
      naam: s.naam,
      leverancier: s.leverancier,
      categorie: s.categorie as any,
      bedrag: 0,
      frequentie: "maandelijks",
      datum: new Date().toISOString().slice(0, 10),
      actief: true,
    });
  };

  return (
    <div className="space-y-5">
      {/* Samenvatting */}
      <div className="bg-card border border-border rounded-[16px] p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Totaal per maand</p>
          <p className="text-2xl font-bold text-foreground tabular-nums">{formatEuro(totaalPerMaand)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Totaal per jaar</p>
          <p className="text-2xl font-bold text-foreground tabular-nums">{formatEuro(totaalPerJaar)}</p>
        </div>
        <button
          onClick={() => { setEditing(null); setOpen(true); }}
          className="inline-flex items-center gap-1.5 h-9 px-3 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nieuw abonnement
        </button>
      </div>

      {ontbreekt.length > 0 && (
        <div className="bg-card border border-border rounded-[16px] p-4">
          <p className="text-xs text-muted-foreground mb-2">Snel toevoegen</p>
          <div className="flex flex-wrap gap-2">
            {ontbreekt.map((s) => (
              <button
                key={s.naam}
                onClick={() => addStandaard(s)}
                className="px-3 h-8 text-xs bg-secondary hover:bg-accent text-foreground rounded-md transition-colors"
              >
                + {s.naam}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Laden…</p>
      ) : abos.length === 0 ? (
        <div className="bg-card border border-border rounded-[16px] p-12 text-center">
          <p className="text-sm text-muted-foreground">Nog geen terugkerende abonnementen.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {abos.map((k) => (
            <div
              key={k.id}
              className={cn(
                "bg-card border border-border rounded-[16px] p-4 space-y-3",
                !k.actief && "opacity-60"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{k.naam}</p>
                  <p className="text-xs text-muted-foreground truncate">{k.leverancier || "—"}</p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] text-muted-foreground whitespace-nowrap">
                  {kostCategorieLabels[k.categorie]}
                </span>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground tabular-nums">{formatEuro(perMaand(k))}<span className="text-xs font-normal text-muted-foreground"> /mnd</span></p>
                <p className="text-[11px] text-muted-foreground">
                  {kostFrequentieLabels[k.frequentie]} · {formatEuro(Number(k.bedrag))}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Volgende: {volgendeBetaaldatum(k).toLocaleDateString("nl-NL")}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <button
                  onClick={() => update(k.id, { actief: !k.actief })}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs px-2 h-7 rounded-md transition-colors",
                    k.actief ? "text-emerald-500 hover:bg-emerald-500/10" : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  <Power className="w-3 h-3" />
                  {k.actief ? "Actief" : "Gepauzeerd"}
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditing(k); setOpen(true); }}
                    className="p-1.5 hover:bg-accent rounded-md text-muted-foreground"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { if (confirm("Verwijderen?")) remove(k.id); }}
                    className="p-1.5 hover:bg-red-500/10 rounded-md text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn("overflow-y-auto", isMobile ? "h-[90vh] rounded-t-[16px]" : "w-full sm:max-w-md")}
        >
          <SheetHeader>
            <SheetTitle>{editing ? "Abonnement bewerken" : "Nieuw abonnement"}</SheetTitle>
          </SheetHeader>
          <AbonnementForm
            initial={editing}
            onSubmit={async (d) => {
              if (editing) await update(editing.id, d);
              else await create(d);
              setOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

const AbonnementForm = ({
  initial, onSubmit,
}: { initial: Kost | null; onSubmit: (d: Partial<Kost>) => Promise<void> }) => {
  const [naam, setNaam] = useState(initial?.naam || "");
  const [leverancier, setLeverancier] = useState(initial?.leverancier || "");
  const [bedrag, setBedrag] = useState(initial ? String(initial.bedrag) : "");
  const [frequentie, setFrequentie] = useState<KostFrequentie>(
    initial?.frequentie === "eenmalig" ? "maandelijks" : (initial?.frequentie || "maandelijks")
  );
  const [datum, setDatum] = useState(initial?.datum || new Date().toISOString().slice(0, 10));
  const [categorie, setCategorie] = useState(initial?.categorie || "abonnementen");
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!naam || !bedrag) return;
        setBusy(true);
        try {
          await onSubmit({
            naam, leverancier: leverancier || null, bedrag: Number(bedrag),
            frequentie, datum, categorie,
          });
        } finally { setBusy(false); }
      }}
      className="space-y-4 mt-4"
    >
      <label className="block">
        <span className="block text-xs text-muted-foreground mb-1">Naam *</span>
        <input required value={naam} onChange={(e) => setNaam(e.target.value)} className="input" />
      </label>
      <label className="block">
        <span className="block text-xs text-muted-foreground mb-1">Leverancier</span>
        <input value={leverancier} onChange={(e) => setLeverancier(e.target.value)} className="input" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs text-muted-foreground mb-1">Bedrag *</span>
          <input required type="number" step="0.01" placeholder="0" value={bedrag} onChange={(e) => setBedrag(e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="block text-xs text-muted-foreground mb-1">Frequentie</span>
          <select value={frequentie} onChange={(e) => setFrequentie(e.target.value as KostFrequentie)} className="input">
            <option value="maandelijks">Maandelijks</option>
            <option value="kwartaal">Per kwartaal</option>
            <option value="jaarlijks">Jaarlijks</option>
          </select>
        </label>
      </div>
      <label className="block">
        <span className="block text-xs text-muted-foreground mb-1">Categorie</span>
        <select value={categorie} onChange={(e) => setCategorie(e.target.value as any)} className="input">
          {Object.entries(kostCategorieLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-xs text-muted-foreground mb-1">Startdatum *</span>
        <input type="date" required value={datum} onChange={(e) => setDatum(e.target.value)} className="input" />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="w-full h-10 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
      >
        {busy ? "Opslaan…" : "Opslaan"}
      </button>
      <style>{`
        .input { width: 100%; height: 36px; padding: 0 10px; background: hsl(var(--card)); border: 1px solid hsl(var(--border)); border-radius: 6px; color: hsl(var(--foreground)); font-size: 14px; outline: none; }
        .input:focus { border-color: hsl(var(--ring)); }
      `}</style>
    </form>
  );
};

export default AbonnementenTab;

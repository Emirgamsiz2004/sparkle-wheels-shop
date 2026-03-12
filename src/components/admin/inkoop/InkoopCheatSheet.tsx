import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, Pencil, Check, Car, Euro, Search, AlertTriangle, Plus, X, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelItem {
  naam: string;
  voorkeur?: boolean;
}

interface MerkModellen {
  merk: string;
  modellen: ModelItem[];
}

interface ProfielData {
  merkenModellen: MerkModellen[];
  bouwjaarVan: string;
  bouwjaarTot: string;
  maxKm: string;
  brandstof: string;
  margeMin: string;
  minInkoop: string;
  maxInkoop: string;
  checkpunten: string;
  afwijzen: string;
  overig: string;
}

const defaultProfiel: ProfielData = {
  merkenModellen: [
    { merk: 'Volkswagen', modellen: [{ naam: 'Polo', voorkeur: true }, { naam: 'Up!' }, { naam: 'Golf' }] },
    { merk: 'Toyota', modellen: [{ naam: 'Aygo', voorkeur: true }, { naam: 'Yaris' }] },
    { merk: 'Kia', modellen: [{ naam: 'Picanto' }, { naam: 'Rio' }] },
    { merk: 'Hyundai', modellen: [{ naam: 'i10' }, { naam: 'i20' }] },
    { merk: 'Opel', modellen: [{ naam: 'Corsa' }, { naam: 'Karl' }] },
    { merk: 'Suzuki', modellen: [{ naam: 'Swift' }, { naam: 'Celerio' }] },
  ],
  bouwjaarVan: '2008',
  bouwjaarTot: '2016',
  maxKm: '180.000',
  brandstof: 'Benzine',
  margeMin: '800',
  minInkoop: '3.000',
  maxInkoop: '7.000',
  checkpunten: 'Onderhoudsboekjes aanwezig\nAantal eigenaren (liefst ≤ 2)\nRoestvorming (wielkasten, dorpels)\nNAP-check / tellerrapport\nSchadevrij verleden\nAPK-status & vervaldatum\nBandenconditie',
  afwijzen: 'Meer dan 200.000 km\nGeen APK of bijna verlopen\nGrote schadehistorie\nVraagprijs te hoog t.o.v. marktwaarde\nImportauto zonder juiste documenten',
  overig: '',
};

const STORAGE_KEY = 'inkoop-profiel-v3';

const migrateModellen = (mm: any): MerkModellen => ({
  merk: mm.merk,
  modellen: (mm.modellen || []).map((m: any) =>
    typeof m === 'string' ? { naam: m, voorkeur: false } : m
  ),
});

const loadProfiel = (): ProfielData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.merkenModellen) {
        return { ...parsed, merkenModellen: parsed.merkenModellen.map(migrateModellen) };
      }
    }
    return defaultProfiel;
  } catch {
    return defaultProfiel;
  }
};

export const InkoopCheatSheet = () => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profiel, setProfiel] = useState<ProfielData>(loadProfiel);
  const [draft, setDraft] = useState<ProfielData>(profiel);
  const [newMerk, setNewMerk] = useState('');
  const [addingMerk, setAddingMerk] = useState(false);
  const [newModelInputs, setNewModelInputs] = useState<Record<number, string>>({});
  const [addingModelFor, setAddingModelFor] = useState<number | null>(null);
  const [dropdownModel, setDropdownModel] = useState<{ merkIdx: number; modelIdx: number } | null>(null);

  const save = () => {
    setProfiel(draft);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setEditing(false);
  };

  const cancel = () => {
    setDraft(profiel);
    setEditing(false);
    setNewMerk('');
    setAddingMerk(false);
    setNewModelInputs({});
    setAddingModelFor(null);
  };

  const updateDraft = (key: keyof Omit<ProfielData, 'merkenModellen'>, value: string) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const addMerk = () => {
    if (!newMerk.trim()) return;
    setDraft(prev => ({ ...prev, merkenModellen: [...prev.merkenModellen, { merk: newMerk.trim(), modellen: [] }] }));
    setNewMerk('');
    setAddingMerk(false);
  };

  const removeMerk = (idx: number) => {
    setDraft(prev => ({ ...prev, merkenModellen: prev.merkenModellen.filter((_, i) => i !== idx) }));
  };

  const addModel = (merkIdx: number) => {
    const val = newModelInputs[merkIdx]?.trim();
    if (!val) return;
    setDraft(prev => ({
      ...prev,
      merkenModellen: prev.merkenModellen.map((mm, i) =>
        i === merkIdx ? { ...mm, modellen: [...mm.modellen, { naam: val }] } : mm
      ),
    }));
    setNewModelInputs(prev => ({ ...prev, [merkIdx]: '' }));
  };

  const toggleModelVoorkeur = (merkIdx: number, modelIdx: number) => {
    setDraft(prev => ({
      ...prev,
      merkenModellen: prev.merkenModellen.map((mm, i) =>
        i === merkIdx ? {
          ...mm,
          modellen: mm.modellen.map((m, j) =>
            j === modelIdx ? { ...m, voorkeur: !m.voorkeur } : m
          ),
        } : mm
      ),
    }));
    setDropdownModel(null);
  };

  const removeModel = (merkIdx: number, modelIdx: number) => {
    setDraft(prev => ({
      ...prev,
      merkenModellen: prev.merkenModellen.map((mm, i) =>
        i === merkIdx ? { ...mm, modellen: mm.modellen.filter((_, j) => j !== modelIdx) } : mm
      ),
    }));
  };

  const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-foreground/10">
        <Icon className="w-3.5 h-3.5 text-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">{title}</h3>
    </div>
  );

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || '—'}</p>
    </div>
  );

  const ListField = ({ value }: { value: string }) => (
    <ul className="space-y-1">
      {value.split('\n').filter(Boolean).map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 mt-1.5 shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );

  const data = editing ? draft : profiel;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) cancel(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9">
          <ClipboardCheck className="w-4 h-4" />
          Inkoopprofiel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[85vh] overflow-y-auto w-[calc(100vw-2rem)] rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6">
            Inkoopprofiel
            {!editing ? (
              <Button variant="ghost" size="sm" onClick={() => { setDraft(profiel); setEditing(true); }} className="gap-1.5 text-xs h-7">
                <Pencil className="w-3 h-3" /> Bewerken
              </Button>
            ) : (
              <div className="flex gap-1.5">
                <Button variant="ghost" size="sm" onClick={cancel} className="text-xs h-7">Annuleren</Button>
                <Button size="sm" onClick={save} className="gap-1 text-xs h-7">
                  <Check className="w-3 h-3" /> Opslaan
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Merken & modellen */}
          <div className="rounded-xl border border-border bg-secondary/10 p-4">
            <SectionHeader icon={Car} title="Merken & Modellen" />
            {editing ? (
              <div className="space-y-2.5">
                {data.merkenModellen.map((mm, i) => (
                  <div key={i} className="rounded-lg border bg-card px-3.5 py-3 space-y-2 border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">{mm.merk}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setAddingModelFor(addingModelFor === i ? null : i)} className={cn("flex items-center justify-center w-6 h-6 rounded-md transition-all duration-150", addingModelFor === i ? "bg-foreground/15 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-foreground/10")} title="Model toevoegen">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeMerk(i)} className="flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150" title="Merk verwijderen">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {mm.modellen.map((m, j) => (
                        <div key={j} className="relative">
                          <Badge
                            className={cn("text-xs font-medium pr-1 cursor-pointer transition-colors", m.voorkeur ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/40 hover:bg-yellow-500/30" : "bg-foreground/10 text-foreground border-foreground/20 hover:bg-foreground/15")}
                            onClick={() => setDropdownModel(dropdownModel?.merkIdx === i && dropdownModel?.modelIdx === j ? null : { merkIdx: i, modelIdx: j })}
                          >
                            {m.naam}
                            <button onClick={(e) => { e.stopPropagation(); removeModel(i, j); }} className="ml-1 hover:text-destructive transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                          {dropdownModel?.merkIdx === i && dropdownModel?.modelIdx === j && (
                            <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
                              <button onClick={() => toggleModelVoorkeur(i, j)} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent transition-colors text-left">
                                <Star className={cn("w-3.5 h-3.5", m.voorkeur ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                                {m.voorkeur ? 'Voorkeur verwijderen' : 'Markeer als voorkeur'}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {mm.modellen.length === 0 && <span className="text-xs text-muted-foreground italic">Geen modellen</span>}
                    </div>
                    <div className="grid transition-all duration-200 ease-in-out" style={{ gridTemplateRows: addingModelFor === i ? '1fr' : '0fr', opacity: addingModelFor === i ? 1 : 0 }}>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2 pt-1.5">
                          <Input value={newModelInputs[i] || ''} onChange={e => setNewModelInputs(prev => ({ ...prev, [i]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addModel(i); } if (e.key === 'Escape') setAddingModelFor(null); }} placeholder="Model naam…" className="h-8 flex-1 text-xs bg-background border-border rounded-md" autoFocus={addingModelFor === i} />
                          <Button variant="ghost" size="sm" onClick={() => addModel(i)} className="h-8 px-2.5 text-xs shrink-0"><Check className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {!addingMerk ? (
                  <button onClick={() => setAddingMerk(true)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground border border-dashed border-border/50 rounded-lg hover:border-foreground/20 hover:text-foreground hover:bg-secondary/30 transition-all duration-200">
                    <Plus className="w-4 h-4" /><span>Nieuw merk toevoegen</span>
                  </button>
                ) : (
                  <div className="border border-foreground/10 bg-secondary/20 rounded-lg px-3 py-2.5 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <Input value={newMerk} onChange={e => setNewMerk(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMerk(); } if (e.key === 'Escape') { setAddingMerk(false); setNewMerk(''); } }} placeholder="Merk naam…" className="h-8 flex-1 text-xs bg-background border-border/50" autoFocus />
                      <Button size="sm" variant="ghost" onClick={() => { setAddingMerk(false); setNewMerk(''); }} className="h-7 px-2 text-xs text-muted-foreground"><X className="w-3 h-3" /></Button>
                      <Button size="sm" onClick={addMerk} disabled={!newMerk.trim()} className="h-7 px-3 gap-1 text-xs font-semibold"><Check className="w-3 h-3" /> Toevoegen</Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {data.merkenModellen.map((mm, i) => (
                  <div key={i} className="flex items-start gap-2.5 min-h-[28px]">
                    <div className="flex items-center gap-1.5 min-w-[80px] sm:min-w-[100px] pt-0.5">
                      <span className="text-sm font-semibold text-foreground">{mm.merk}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {mm.modellen.map((m, j) => (
                        <Badge key={j} className={cn("text-xs font-medium", m.voorkeur ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/40" : "bg-foreground/10 text-foreground border-foreground/20")}>{m.naam}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overige criteria */}
          <div className="rounded-xl border border-border bg-secondary/10 p-4">
            <SectionHeader icon={Search} title="Overige criteria" />
            {editing ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Bouwjaar van', key: 'bouwjaarVan' as const },
                  { label: 'Bouwjaar tot', key: 'bouwjaarTot' as const },
                  { label: 'Max km-stand', key: 'maxKm' as const },
                  { label: 'Brandstof', key: 'brandstof' as const },
                ].map(f => (
                  <div key={f.key} className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground/70 block">{f.label}</label>
                    <Input value={draft[f.key]} onChange={e => updateDraft(f.key, e.target.value)} className="h-9 text-sm bg-background border-border rounded-md" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Field label="Bouwjaar van" value={profiel.bouwjaarVan} />
                <Field label="Bouwjaar tot" value={profiel.bouwjaarTot} />
                <Field label="Max km-stand" value={profiel.maxKm} />
                <Field label="Brandstof" value={profiel.brandstof} />
              </div>
            )}
          </div>

          {/* Financieel */}
          <div className="rounded-xl border border-border bg-secondary/10 p-4">
            <SectionHeader icon={Euro} title="Financieel" />
            {editing ? (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Min. marge (€)', key: 'margeMin' as const },
                  { label: 'Min. inkoop (€)', key: 'minInkoop' as const },
                  { label: 'Max. inkoop (€)', key: 'maxInkoop' as const },
                ].map(f => (
                  <div key={f.key} className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground/70 block">{f.label}</label>
                    <Input value={draft[f.key]} onChange={e => updateDraft(f.key, e.target.value)} className="h-9 text-sm bg-background border-border rounded-md" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <Field label="Min. marge" value={`€${profiel.margeMin}`} />
                <Field label="Min. inkoop" value={`€${profiel.minInkoop}`} />
                <Field label="Max. inkoop" value={`€${profiel.maxInkoop}`} />
              </div>
            )}
          </div>

          {/* Checkpunten */}
          <div className="rounded-xl border border-border bg-secondary/10 p-4">
            <SectionHeader icon={ClipboardCheck} title="Checkpunten bij bezichtiging" />
            {editing ? (
              <Textarea value={draft.checkpunten} onChange={e => updateDraft('checkpunten', e.target.value)} className="bg-background border-border text-sm resize-none min-h-[120px]" />
            ) : (
              <ListField value={profiel.checkpunten} />
            )}
          </div>

          {/* Afwijzen */}
          <div className="rounded-xl border border-border bg-secondary/10 p-4">
            <SectionHeader icon={AlertTriangle} title="Direct afwijzen als" />
            {editing ? (
              <Textarea value={draft.afwijzen} onChange={e => updateDraft('afwijzen', e.target.value)} className="bg-background border-border text-sm resize-none min-h-[100px]" />
            ) : (
              <ListField value={profiel.afwijzen} />
            )}
          </div>

          {/* Overig */}
          {(editing || profiel.overig) && (
            <div className="rounded-xl border border-border bg-secondary/10 p-4">
              <SectionHeader icon={ClipboardCheck} title="Overige notities" />
              {editing ? (
                <Textarea value={draft.overig} onChange={e => updateDraft('overig', e.target.value)} placeholder="Extra notities..." className="bg-background border-border text-sm resize-none min-h-[80px]" />
              ) : (
                <p className="text-sm text-foreground whitespace-pre-wrap">{profiel.overig}</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

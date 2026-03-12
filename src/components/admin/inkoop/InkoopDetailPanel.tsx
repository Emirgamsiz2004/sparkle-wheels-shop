import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  InkoopCandidate,
  bronLabels,
  interesseLabels,
  interesseColors,
  voorkeurMerken,
  voorkeurModellen,
  formatEuro,
  calcInkoopKostprijs,
  calcInkoopWinst,
  calcInkoopMarge,
} from '@/types/vehicle';
import { cn } from '@/lib/utils';
import { ExternalLink, Trash2, AlertTriangle } from 'lucide-react';

interface InkoopDetailPanelProps {
  candidate: InkoopCandidate | null;
  onClose: () => void;
  onUpdate: (updated: InkoopCandidate) => void;
  onDelete: (id: string) => void;
}

export const InkoopDetailPanel = ({ candidate, onClose, onUpdate, onDelete }: InkoopDetailPanelProps) => {
  const [form, setForm] = useState<InkoopCandidate | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setForm(candidate ? { ...candidate } : null);
  }, [candidate]);

  if (!form) return null;

  const set = (key: keyof InkoopCandidate, value: string | number) => {
    setForm(f => f ? { ...f, [key]: value } : f);
  };

  const handleSave = () => {
    if (form) onUpdate(form);
  };

  const kostprijs = calcInkoopKostprijs(form);
  const winst = calcInkoopWinst(form);
  const marge = calcInkoopMarge(form);
  const isProfit = winst >= 0;

  const kmWaarschuwing = form.kilometerstand > 180000;
  const margeWaarschuwing = winst < 800;
  const modellen = voorkeurModellen[form.merk] || [];

  return (
    <Sheet open={!!candidate} onOpenChange={() => onClose()}>
      <SheetContent
        className="bg-card border-border w-full sm:max-w-md overflow-y-auto p-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div ref={contentRef} className="p-6 space-y-5">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-lg font-bold pr-10">
              {form.merk} {form.model}
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              {form.bouwjaar} · {form.kilometerstand.toLocaleString('nl-NL')} km
            </p>
          </SheetHeader>

          {/* Waarschuwingen */}
          {(kmWaarschuwing || margeWaarschuwing) && (
            <div className="space-y-1.5">
              {kmWaarschuwing && (
                <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Km-stand boven 180.000 — buiten inkoopprofiel</span>
                </div>
              )}
              {margeWaarschuwing && (
                <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Geschatte winst onder €800 minimummarge</span>
                </div>
              )}
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(interesseLabels) as [InkoopCandidate['interesseStatus'], string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => set('interesseStatus', key)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 font-medium',
                    form.interesseStatus === key
                      ? interesseColors[key]
                      : 'border-border text-muted-foreground hover:border-foreground/20'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Bron & Advertentie */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Bron & Advertentie</Label>
            <div className="mt-2 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Bron</Label>
                  <Select value={form.bron} onValueChange={v => set('bron', v)}>
                    <SelectTrigger className="h-9 bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {Object.entries(bronLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Datum toegevoegd</Label>
                  <Input value={form.datumToegevoegd} disabled className="h-9 bg-secondary border-border text-sm opacity-60" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Advertentie link</Label>
                <div className="flex gap-2">
                  <Input value={form.bronLink || ''} onChange={e => set('bronLink', e.target.value)} placeholder="https://marktplaats.nl/..." className="h-9 bg-secondary border-border text-sm flex-1" />
                  {form.bronLink && (
                    <a href={form.bronLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-9 w-9 rounded-md border border-border hover:bg-secondary text-foreground transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Voertuig gegevens */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Voertuig</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Merk</Label>
                <Select value={form.merk} onValueChange={v => { set('merk', v); if (v !== form.merk) set('model', ''); }}>
                  <SelectTrigger className="h-9 bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {voorkeurMerken.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    <SelectItem value="overig">Anders…</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Model</Label>
                {modellen.length > 0 ? (
                  <Select value={form.model} onValueChange={v => set('model', v)}>
                    <SelectTrigger className="h-9 bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {modellen.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      <SelectItem value="anders">Anders…</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={form.model} onChange={e => set('model', e.target.value)} className="h-9 bg-secondary border-border" />
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Bouwjaar</Label>
                <Input type="number" value={form.bouwjaar} onChange={e => set('bouwjaar', parseInt(e.target.value))} className="h-9 bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Km-stand</Label>
                <Input type="number" value={form.kilometerstand} onChange={e => set('kilometerstand', parseInt(e.target.value))} className={cn("h-9 bg-secondary border-border", kmWaarschuwing && "border-amber-500/50")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Kleur</Label>
                <Select value={form.kleur || ''} onValueChange={v => set('kleur', v)}>
                  <SelectTrigger className="h-9 bg-secondary border-border"><SelectValue placeholder="Kies kleur" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {['Zwart', 'Wit', 'Grijs', 'Zilver', 'Blauw', 'Rood', 'Overig'].map(k => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Transmissie</Label>
                <Select value={form.transmissie || 'handgeschakeld'} onValueChange={v => set('transmissie', v)}>
                  <SelectTrigger className="h-9 bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="handgeschakeld">Handgeschakeld</SelectItem>
                    <SelectItem value="automaat">Automaat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs">Kenteken</Label>
                <Input value={form.kenteken || ''} onChange={e => set('kenteken', e.target.value.toUpperCase())} placeholder="XX-123-YY" className="h-9 bg-secondary border-border uppercase font-mono" />
              </div>
            </div>
          </div>

          {/* Financieel */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Financieel</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Vraagprijs</Label>
                <Input type="number" value={form.vraagprijs} onChange={e => set('vraagprijs', parseFloat(e.target.value) || 0)} className="h-9 bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Bod / Inkoopprijs</Label>
                <Input type="number" value={form.geschatteInkoopprijs} onChange={e => set('geschatteInkoopprijs', parseFloat(e.target.value) || 0)} className="h-9 bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Geschatte kosten</Label>
                <Input type="number" value={form.geschatteKosten} onChange={e => set('geschatteKosten', parseFloat(e.target.value) || 0)} className="h-9 bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Geschatte verkoop</Label>
                <Input type="number" value={form.geschatteVerkoopprijs} onChange={e => set('geschatteVerkoopprijs', parseFloat(e.target.value) || 0)} className="h-9 bg-secondary border-border" />
              </div>
            </div>

            {/* Auto-berekening */}
            <div className={cn(
              "mt-3 rounded-lg border p-3 grid grid-cols-2 gap-3 text-center transition-colors duration-200",
              isProfit ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"
            )}>
              <div>
                <p className="text-xs text-muted-foreground">Kostprijs</p>
                <p className="font-semibold text-sm">{formatEuro(kostprijs)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Verw. verkoop</p>
                <p className="font-semibold text-sm">{formatEuro(form.geschatteVerkoopprijs)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Winst</p>
                <p className={cn("font-semibold text-sm", isProfit ? "text-emerald-400" : "text-red-400")}>{formatEuro(winst)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Marge</p>
                <p className={cn("font-semibold text-sm", isProfit ? "text-emerald-400" : "text-red-400")}>{marge.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Opmerkingen */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Opmerkingen</Label>
            <Textarea value={form.opmerkingen || ''} onChange={e => set('opmerkingen', e.target.value)} placeholder="Notities over staat, onderhoudshistorie..." className="bg-secondary border-border resize-none text-sm" rows={3} />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:text-destructive hover:bg-destructive/10 gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" /> Verwijderen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Dit voertuig wordt permanent verwijderd. Deze actie kan niet ongedaan worden gemaakt.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border">Annuleren</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(form.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Verwijderen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>Annuleren</Button>
              <Button size="sm" onClick={handleSave} className="font-semibold">Opslaan</Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

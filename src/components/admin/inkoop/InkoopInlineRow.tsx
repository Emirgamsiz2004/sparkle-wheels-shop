import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { InkoopCandidate, voorkeurMerken, voorkeurModellen, formatEuro } from '@/types/vehicle';
import { Plus, CornerDownLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface InkoopInlineRowProps {
  onAdd: (data: Omit<InkoopCandidate, 'id'>) => void;
}

const bouwjaarOptions = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i);

type BronType = 'inkoop' | 'import' | 'veiling';

const bronOptions: { value: BronType; label: string }[] = [
  { value: 'inkoop', label: 'Inkoop' },
  { value: 'import', label: 'Import' },
  { value: 'veiling', label: 'Veiling' },
];

export const InkoopInlineRow = ({ onAdd }: InkoopInlineRowProps) => {
  const [active, setActive] = useState(false);
  const [bronType, setBronType] = useState<BronType>('inkoop');
  const [merk, setMerk] = useState('');
  const [model, setModel] = useState('');
  const [bouwjaar, setBouwjaar] = useState('2014');
  const [km, setKm] = useState<number | ''>('');
  const [link, setLink] = useState('');
  const [vraagprijs, setVraagprijs] = useState<number | ''>('');
  const [inkoopprijs, setInkoopprijs] = useState<number | ''>('');
  const [verkoopprijs, setVerkoopprijs] = useState<number | ''>('');
  const [bodGedaan, setBodGedaan] = useState(false);
  const [landVanHerkomst, setLandVanHerkomst] = useState('');
  const [bpmBedrag, setBpmBedrag] = useState<number | ''>('');
  const [transportKosten, setTransportKosten] = useState<number | ''>('');
  const [veilingNaam, setVeilingNaam] = useState('');
  const [veilingKosten, setVeilingKosten] = useState<number | ''>('');
  const isMobile = useIsMobile();

  const linkRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (active) setTimeout(() => linkRef.current?.focus(), 50);
  }, [active]);

  const reset = () => {
    setMerk(''); setModel(''); setBouwjaar('2014'); setKm('');
    setLink(''); setVraagprijs(''); setInkoopprijs(''); setVerkoopprijs('');
    setBodGedaan(false);
    setLandVanHerkomst(''); setBpmBedrag(''); setTransportKosten('');
    setVeilingNaam(''); setVeilingKosten('');
  };

  const modellen = merk ? (voorkeurModellen[merk] || []) : [];

  const extraKosten = (Number(bpmBedrag) || 0) + (Number(transportKosten) || 0) + (Number(veilingKosten) || 0);
  const winst = (Number(verkoopprijs) || 0) - (Number(inkoopprijs) || 0) - extraKosten;
  const isValid = merk && model;

  const handleSubmit = () => {
    if (!isValid) return;
    const bronMap: Record<BronType, InkoopCandidate['bron']> = {
      inkoop: 'marktplaats',
      import: 'overig',
      veiling: 'veiling',
    };
    onAdd({
      bron: bronMap[bronType],
      bronLink: link || undefined,
      merk,
      model,
      bouwjaar: parseInt(bouwjaar) || 2014,
      brandstof: 'benzine',
      kilometerstand: Number(km) || 0,
      interesseStatus: bodGedaan ? 'bod_gedaan' : 'nieuw',
      vraagprijs: Number(vraagprijs) || 0,
      geschatteInkoopprijs: Number(inkoopprijs) || 0,
      geschatteKosten: extraKosten,
      geschatteVerkoopprijs: Number(verkoopprijs) || 0,
      datumToegevoegd: new Date().toISOString().split('T')[0],
      opmerkingen: bronType === 'import'
        ? `Import uit ${landVanHerkomst || '?'}. BPM: €${bpmBedrag || 0}, Transport: €${transportKosten || 0}`
        : bronType === 'veiling'
        ? `Veiling: ${veilingNaam || '?'}. Veilingkosten: €${veilingKosten || 0}`
        : undefined,
    });
    reset();
    linkRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
    if (e.key === 'Escape') { reset(); setActive(false); }
  };

  if (!active) {
    return (
      <button
        onClick={() => setActive(true)}
        className="w-full flex items-center gap-2 px-4 py-3.5 text-sm text-muted-foreground border border-dashed border-border/50 rounded-lg hover:border-foreground/20 hover:text-foreground hover:bg-secondary/30 transition-all duration-200"
      >
        <Plus className="w-4 h-4" />
        <span>Auto toevoegen</span>
      </button>
    );
  }

  const inputClass = "h-8 text-sm bg-secondary/50 border-border/50 focus:border-foreground/30";
  const selectClass = "h-8 text-sm bg-secondary/50 border-border/50";

  return (
    <div className="border border-foreground/10 bg-secondary/20 rounded-xl px-3 md:px-4 py-3 animate-fade-in space-y-2.5" onKeyDown={handleKeyDown}>
      {/* Bron pill toggle */}
      <div className="flex items-center gap-1 bg-secondary/30 rounded-lg p-0.5 w-fit">
        {bronOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setBronType(opt.value)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-all duration-200",
              bronType === opt.value
                ? "bg-accent text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Link field */}
      <Input
        ref={linkRef}
        value={link}
        onChange={e => setLink(e.target.value)}
        placeholder={
          bronType === 'import' ? 'Link naar advertentie (optioneel)'
          : bronType === 'veiling' ? 'Link naar veilingkavel (optioneel)'
          : 'Advertentie link (optioneel)'
        }
        className={`${inputClass} w-full`}
      />

      {/* Voertuig velden */}
      {isMobile ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Select value={merk} onValueChange={v => { setMerk(v); setModel(''); }}>
              <SelectTrigger className={selectClass}><SelectValue placeholder="Merk" /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {voorkeurMerken.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                <SelectItem value="overig">Anders…</SelectItem>
              </SelectContent>
            </Select>
            {merk === 'overig' ? (
              <Input value={model} onChange={e => setModel(e.target.value)} placeholder="Merk + Model" className={inputClass} />
            ) : modellen.length > 0 ? (
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className={selectClass}><SelectValue placeholder="Model" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {modellen.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  <SelectItem value="anders">Anders…</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input value={model} onChange={e => setModel(e.target.value)} placeholder="Model" className={inputClass} />
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={bouwjaar} onValueChange={setBouwjaar}>
              <SelectTrigger className={selectClass}><SelectValue placeholder="Jaar" /></SelectTrigger>
              <SelectContent className="bg-card border-border max-h-[200px] overflow-y-auto">
                {bouwjaarOptions.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" value={km} onChange={e => setKm(e.target.value ? parseInt(e.target.value) : '')} placeholder="Km-stand" className={inputClass} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input type="number" value={vraagprijs} onChange={e => setVraagprijs(e.target.value ? parseFloat(e.target.value) : '')} placeholder="Vraag €" className={inputClass} />
            <Input type="number" value={inkoopprijs} onChange={e => setInkoopprijs(e.target.value ? parseFloat(e.target.value) : '')} placeholder={bodGedaan ? "Bod €" : "Inkoop €"} className={cn(inputClass, bodGedaan && "border-foreground/30 bg-foreground/5")} />
            <Input type="number" value={verkoopprijs} onChange={e => setVerkoopprijs(e.target.value ? parseFloat(e.target.value) : '')} placeholder="Verkoop €" className={inputClass} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">Bod gedaan</span>
              <Switch checked={bodGedaan} onCheckedChange={setBodGedaan} className="scale-75" />
            </div>
            {(Number(inkoopprijs) > 0 && Number(verkoopprijs) > 0) && (
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded", winst >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>
                {formatEuro(winst)}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={merk} onValueChange={v => { setMerk(v); setModel(''); }}>
            <SelectTrigger className={`${selectClass} w-[140px]`}><SelectValue placeholder="Merk" /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              {voorkeurMerken.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              <SelectItem value="overig">Anders…</SelectItem>
            </SelectContent>
          </Select>
          {merk === 'overig' ? (
            <Input value={model} onChange={e => setModel(e.target.value)} placeholder="Merk + Model" className={`${inputClass} w-[140px]`} />
          ) : modellen.length > 0 ? (
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className={`${selectClass} w-[140px]`}><SelectValue placeholder="Model" /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {modellen.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                <SelectItem value="anders">Anders…</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input value={model} onChange={e => setModel(e.target.value)} placeholder="Model" className={`${inputClass} w-[140px]`} />
          )}
          <Select value={bouwjaar} onValueChange={setBouwjaar}>
            <SelectTrigger className={`${selectClass} w-[85px]`}><SelectValue placeholder="Jaar" /></SelectTrigger>
            <SelectContent className="bg-card border-border max-h-[200px] overflow-y-auto">
              {bouwjaarOptions.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" value={km} onChange={e => setKm(e.target.value ? parseInt(e.target.value) : '')} placeholder="Km" className={`${inputClass} w-[100px]`} />
          <div className="w-px h-5 bg-border/50 mx-1" />
          <Input type="number" value={vraagprijs} onChange={e => setVraagprijs(e.target.value ? parseFloat(e.target.value) : '')} placeholder="Vraagprijs €" className={`${inputClass} w-[110px]`} />
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">Bod</span>
            <Switch checked={bodGedaan} onCheckedChange={setBodGedaan} className="scale-75" />
          </div>
          <Input type="number" value={inkoopprijs} onChange={e => setInkoopprijs(e.target.value ? parseFloat(e.target.value) : '')} placeholder={bodGedaan ? "Bod €" : "Verw. inkoop €"} className={cn(inputClass, "w-[110px]", bodGedaan && "border-foreground/30 bg-foreground/5")} />
          <Input type="number" value={verkoopprijs} onChange={e => setVerkoopprijs(e.target.value ? parseFloat(e.target.value) : '')} placeholder="Verkoop €" className={`${inputClass} w-[110px]`} />
          {(Number(inkoopprijs) > 0 && Number(verkoopprijs) > 0) && (
            <span className={cn("text-xs font-semibold whitespace-nowrap px-2 py-0.5 rounded min-w-[60px] text-center", winst >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>
              {formatEuro(winst)}
            </span>
          )}
        </div>
      )}

      {/* Bron-specifieke extra velden */}
      <div
        className="grid transition-all duration-200 ease-in-out"
        style={{
          gridTemplateRows: bronType !== 'inkoop' ? '1fr' : '0fr',
          opacity: bronType !== 'inkoop' ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          {bronType === 'import' && (
            <div className={cn("flex items-center gap-3 pt-1 pb-0.5 border-t border-border/30 mt-0.5", isMobile && "flex-col items-start gap-2")}>
              <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium shrink-0">Import</span>
              <div className={cn("flex items-center gap-2", isMobile ? "w-full grid grid-cols-3 gap-2" : "flex-wrap")}>
                <Input value={landVanHerkomst} onChange={e => setLandVanHerkomst(e.target.value)} placeholder="Land" className={cn(inputClass, !isMobile && "w-[110px]")} />
                <Input type="number" value={bpmBedrag} onChange={e => setBpmBedrag(e.target.value ? parseFloat(e.target.value) : '')} placeholder="BPM €" className={cn(inputClass, !isMobile && "w-[100px]")} />
                <Input type="number" value={transportKosten} onChange={e => setTransportKosten(e.target.value ? parseFloat(e.target.value) : '')} placeholder="Transport €" className={cn(inputClass, !isMobile && "w-[110px]")} />
              </div>
            </div>
          )}
          {bronType === 'veiling' && (
            <div className={cn("flex items-center gap-3 pt-1 pb-0.5 border-t border-border/30 mt-0.5", isMobile && "flex-col items-start gap-2")}>
              <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium shrink-0">Veiling</span>
              <div className={cn("flex items-center gap-2", isMobile ? "w-full grid grid-cols-2 gap-2" : "flex-wrap")}>
                <Input value={veilingNaam} onChange={e => setVeilingNaam(e.target.value)} placeholder="Naam veiling" className={cn(inputClass, !isMobile && "w-[140px]")} />
                <Input type="number" value={veilingKosten} onChange={e => setVeilingKosten(e.target.value ? parseFloat(e.target.value) : '')} placeholder="Kosten €" className={cn(inputClass, !isMobile && "w-[100px]")} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => { reset(); setActive(false); }} className="h-7 px-2 text-xs text-muted-foreground">
          <X className="w-3 h-3" />
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!isValid} className="h-7 px-3 gap-1 text-xs font-semibold">
          <CornerDownLeft className="w-3 h-3" /> Toevoegen
        </Button>
      </div>
    </div>
  );
};

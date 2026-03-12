import { useState, useEffect } from 'react';
import {
  InkoopCandidate,
  formatEuro,
  calcInkoopKostprijs,
  calcInkoopWinst,
  calcInkoopMarge,
  bronLabels,
  interesseLabels,
  interesseColors,
} from '@/types/vehicle';
import { InkoopInlineRow } from '@/components/admin/inkoop/InkoopInlineRow';
import { InkoopDetailPanel } from '@/components/admin/inkoop/InkoopDetailPanel';
import { InkoopCheatSheet } from '@/components/admin/inkoop/InkoopCheatSheet';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ShoppingCart, ExternalLink, Download, FileSpreadsheet, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInkoopCandidates } from '@/hooks/useInkoopCandidates';

export default function AdminInkoopPage() {
  const {
    candidates,
    loading,
    addCandidate: addCandidateDb,
    updateCandidate: updateCandidateDb,
    removeCandidate,
  } = useInkoopCandidates();

  const [selected, setSelected] = useState<InkoopCandidate | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<InkoopCandidate['interesseStatus'] | 'alle'>('alle');
  const isMobile = useIsMobile();

  const currentSelected = selected ? candidates.find(c => c.id === selected.id) || null : null;

  const filtered = candidates.filter(c => {
    const matchSearch = !search || [c.merk, c.model, c.kenteken, c.kleur, bronLabels[c.bron]].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === 'alle' || c.interesseStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const addCandidate = (data: Omit<InkoopCandidate, 'id'>) => {
    void addCandidateDb(data);
  };

  const updateCandidate = (updated: InkoopCandidate) => {
    const { id, ...payload } = updated;
    void updateCandidateDb(id, payload);
  };

  const updateStatus = (id: string, status: InkoopCandidate['interesseStatus']) => {
    const existing = candidates.find(c => c.id === id);
    if (!existing) return;
    const { id: candidateId, ...payload } = { ...existing, interesseStatus: status };
    void updateCandidateDb(candidateId, payload);
  };

  const exportToCsv = () => {
    const headers = ['Merk', 'Model', 'Bouwjaar', 'Km', 'Vraagprijs', 'Bod', 'Verkoop', 'Winst', 'Marge %', 'Status', 'Bron', 'Link', 'Datum'];
    const rows = candidates.map(c => [
      c.merk, c.model, c.bouwjaar, c.kilometerstand,
      c.vraagprijs, c.geschatteInkoopprijs, c.geschatteVerkoopprijs,
      calcInkoopWinst(c), calcInkoopMarge(c).toFixed(1),
      interesseLabels[c.interesseStatus], bronLabels[c.bron],
      c.bronLink || '', c.datumToegevoegd,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(';')).join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inkoop-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold">Inkoop</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-0.5">Potentiële aankopen bijhouden</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <InkoopCheatSheet />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem onClick={exportToCsv} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="w-4 h-4" />
                Excel / Google Sheets (.csv)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <InkoopInlineRow onAdd={addCandidate} />

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek op merk, model..." className="pl-9 h-9 bg-card border-border text-sm" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['alle', 'nieuw', 'interessant', 'bod_gedaan', 'afgewezen', 'ingekocht'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 font-medium',
                filterStatus === s
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
              )}
            >
              {s === 'alle' ? 'Alle' : interesseLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: Card view */}
      {isMobile ? (
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p>Geen inkoop kandidaten gevonden</p>
            </div>
          )}
          {filtered.map((c, i) => {
            const winst = calcInkoopWinst(c);
            const marge = calcInkoopMarge(c);
            const isProfit = winst >= 0;
            const isImport = c.bron === 'overig';
            const isVeiling = c.bron === 'veiling';
            return (
              <div
                key={c.id}
                onClick={() => setSelected(c)}
                className={cn(
                  'bg-card border border-border rounded-xl p-3.5 active:bg-secondary/30 transition-all duration-150 cursor-pointer',
                  currentSelected?.id === c.id && 'border-foreground/20 bg-foreground/5'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-sm">{c.merk} {c.model}</p>
                      {isImport && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 uppercase tracking-wider leading-none">Import</span>}
                      {isVeiling && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30 uppercase tracking-wider leading-none">Veiling</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.bouwjaar} · {c.kilometerstand.toLocaleString('nl-NL')} km</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={cn('text-[10px] border whitespace-nowrap', interesseColors[c.interesseStatus])}>
                      {interesseLabels[c.interesseStatus]}
                    </Badge>
                    {c.bronLink && (
                      <a href={c.bronLink} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="inline-flex items-center justify-center w-7 h-7 rounded-md text-foreground hover:bg-foreground/10 border border-border hover:border-foreground/20 transition-all duration-150" title="Open advertentie">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Inkoop</p>
                      <p className="text-xs font-medium">{formatEuro(c.geschatteInkoopprijs)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Verkoop</p>
                      <p className="text-xs font-medium">{formatEuro(c.geschatteVerkoopprijs)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-semibold', isProfit ? 'text-emerald-400' : 'text-red-400')}>{formatEuro(winst)}</span>
                    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', isProfit ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400')}>{marge.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop: Table view */
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Voertuig</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-8"></th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vraagprijs</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Totaal inkoop</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Verkoop</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Winst</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Marge</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p>Geen inkoop kandidaten gevonden</p>
                  </td>
                </tr>
              )}
              {filtered.map((c, i) => {
                const totaalInkoop = calcInkoopKostprijs(c);
                const winst = calcInkoopWinst(c);
                const marge = calcInkoopMarge(c);
                const isProfit = winst >= 0;
                const isImport = c.bron === 'overig';
                const isVeiling = c.bron === 'veiling';
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={cn(
                      'hover:bg-secondary/30 transition-all duration-150 cursor-pointer',
                      currentSelected?.id === c.id && 'bg-foreground/5'
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-semibold">{c.merk} {c.model}</p>
                          <p className="text-xs text-muted-foreground">{c.bouwjaar} · {c.kilometerstand.toLocaleString('nl-NL')} km</p>
                        </div>
                        {isImport && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 uppercase tracking-wider leading-none">Import</span>}
                        {isVeiling && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30 uppercase tracking-wider leading-none">Veiling</span>}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      {c.bronLink && (
                        <a href={c.bronLink} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="inline-flex items-center justify-center w-7 h-7 rounded-md text-foreground hover:bg-foreground/10 border border-transparent hover:border-foreground/20 transition-all duration-150" title="Open advertentie">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatEuro(c.vraagprijs)}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatEuro(totaalInkoop)}
                      {c.geschatteKosten > 0 && (
                        <p className="text-[10px] text-muted-foreground/70">incl. €{c.geschatteKosten.toLocaleString('nl-NL')} kosten</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatEuro(c.geschatteVerkoopprijs)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn('font-semibold', isProfit ? 'text-emerald-400' : 'text-red-400')}>{formatEuro(winst)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded', isProfit ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400')}>{marge.toFixed(1)}%</span>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <Select value={c.interesseStatus} onValueChange={(v) => updateStatus(c.id, v as InkoopCandidate['interesseStatus'])}>
                        <SelectTrigger className="h-7 w-auto border-0 bg-transparent p-0 gap-0 shadow-none focus:ring-0 [&>svg]:hidden">
                          <Badge className={cn('text-xs border whitespace-nowrap transition-all duration-200 cursor-pointer hover:opacity-80', interesseColors[c.interesseStatus])}>
                            {interesseLabels[c.interesseStatus]}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border min-w-[140px]">
                          {(['nieuw', 'interessant', 'bod_gedaan', 'afgewezen', 'ingekocht'] as const).map(s => (
                            <SelectItem key={s} value={s} className="text-xs">
                              <span className={cn('inline-block w-2 h-2 rounded-full mr-2', interesseColors[s].split(' ')[0])} />
                              {interesseLabels[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <InkoopDetailPanel
        candidate={currentSelected}
        onClose={() => setSelected(null)}
        onUpdate={updateCandidate}
        onDelete={removeCandidate}
      />
    </div>
  );
}

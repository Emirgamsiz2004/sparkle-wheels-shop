import { useState } from "react";
import { useInkoopverklaringen, Inkoopverklaring } from "@/hooks/useInkoopverklaringen";
import { useVehicles } from "@/hooks/useVehicles";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Search, Plus, FileText, Download, Link2, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import InkoopverklaringWizard from "./InkoopverklaringWizard";
import { formatEuro } from "@/types/vehicle";

export default function InkoopverklaringenTab() {
  const { verklaringen, loading, linkToVehicle, refetch } = useInkoopverklaringen();
  const { vehicles } = useVehicles();
  const [search, setSearch] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Inkoopverklaring | null>(null);
  const [linkVehicleId, setLinkVehicleId] = useState("");
  const isMobile = useIsMobile();

  const filtered = verklaringen.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [v.documentNaam, v.verkoperNaam, v.kenteken, v.merk, v.model].some(f => f?.toLowerCase().includes(q));
  });

  const handleDownload = async (v: Inkoopverklaring) => {
    if (!v.pdfPath) { toast.error("Geen PDF beschikbaar"); return; }
    const { data } = await supabase.storage.from("vehicle-documents").createSignedUrl(v.pdfPath, 60);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    } else {
      toast.error("Kon PDF niet openen");
    }
  };

  const handleLink = async () => {
    if (!selected || !linkVehicleId) return;
    await linkToVehicle(selected.id, linkVehicleId);
    setSelected({ ...selected, vehicleId: linkVehicleId });
    setLinkVehicleId("");
  };

  const openDetail = (v: Inkoopverklaring) => {
    setSelected(v);
    setDetailOpen(true);
  };

  const availableVehicles = vehicles.filter(v => v.status !== "verkocht");

  const formatDate = (d: string) => {
    if (!d) return "";
    const parts = d.split("-");
    if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return d;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek op naam, kenteken..." className="pl-9 h-9 bg-card border-border text-sm" />
        </div>
        <Button size="sm" onClick={() => setWizardOpen(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nieuwe inkoopverklaring</span>
        </Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p>Geen inkoopverklaringen gevonden</p>
        </div>
      ) : isMobile ? (
        <div className="space-y-2">
          {filtered.map(v => (
            <div key={v.id} onClick={() => openDetail(v)} className="bg-card border border-border rounded-xl p-3.5 cursor-pointer active:bg-secondary/30 transition-all">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{v.documentNaam}</p>
                  <p className="text-xs text-muted-foreground">{v.verkoperNaam}</p>
                </div>
                <Badge className={cn("text-[10px] border whitespace-nowrap shrink-0", v.status === "ondertekend" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-orange-500/15 text-orange-400 border-orange-500/30")}>
                  {v.status === "ondertekend" ? "Ondertekend" : "Concept"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{v.kenteken || "—"} · {v.merk} {v.model}</span>
                <span>{formatEuro(v.inkoopprijs)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Document</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Verkoper</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kenteken</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Voertuig</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inkoopprijs</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datum</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(v => (
                <tr key={v.id} onClick={() => openDetail(v)} className="hover:bg-secondary/30 transition-all cursor-pointer">
                  <td className="px-4 py-3 font-medium">{v.documentNaam}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.verkoperNaam}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.kenteken || "—"}</td>
                  <td className="px-4 py-3">{v.merk} {v.model}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatEuro(v.inkoopprijs)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(v.datum)}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn("text-xs border", v.status === "ondertekend" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-orange-500/15 text-orange-400 border-orange-500/30")}>
                      {v.status === "ondertekend" ? "Ondertekend" : "Concept"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Wizard */}
      <InkoopverklaringWizard open={wizardOpen} onOpenChange={setWizardOpen} onComplete={refetch} />

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(v) => { setDetailOpen(v); if (!v) setSelected(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">{selected.documentNaam}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-xs border", selected.status === "ondertekend" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-orange-500/15 text-orange-400 border-orange-500/30")}>
                    {selected.status === "ondertekend" ? "Ondertekend" : "Concept"}
                  </Badge>
                  {selected.vehicleId && <Badge variant="outline" className="text-xs">Gekoppeld aan voertuig</Badge>}
                </div>

                {/* Verkoper */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Verkoper</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="text-muted-foreground">Naam</span><span>{selected.verkoperNaam}</span>
                    <span className="text-muted-foreground">Telefoon</span><span>{selected.verkoperTelefoon}</span>
                    {selected.verkoperEmail && <><span className="text-muted-foreground">E-mail</span><span>{selected.verkoperEmail}</span></>}
                    <span className="text-muted-foreground">Adres</span><span>{selected.verkoperAdres}</span>
                    <span className="text-muted-foreground">Woonplaats</span><span>{selected.verkoperWoonplaats}</span>
                  </div>
                </div>

                {/* Voertuig */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Voertuig</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="text-muted-foreground">Merk</span><span>{selected.merk}</span>
                    <span className="text-muted-foreground">Model</span><span>{selected.model}</span>
                    {selected.bouwjaar && <><span className="text-muted-foreground">Bouwjaar</span><span>{selected.bouwjaar}</span></>}
                    {selected.kenteken && <><span className="text-muted-foreground">Kenteken</span><span>{selected.kenteken}</span></>}
                    {selected.kilometerstand && <><span className="text-muted-foreground">Km-stand</span><span>{selected.kilometerstand?.toLocaleString("nl-NL")} km</span></>}
                    {selected.chassisnummer && <><span className="text-muted-foreground">VIN</span><span>{selected.chassisnummer}</span></>}
                  </div>
                </div>

                {/* Legitimatie & Transactie */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Transactie</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="text-muted-foreground">Legitimatie</span><span className="capitalize">{selected.legitimatieType.replace("_", "-")}</span>
                    <span className="text-muted-foreground">Doc.nr</span><span>{selected.legitimatieNummer}</span>
                    <span className="text-muted-foreground">Inkoopprijs</span><span className="font-semibold">{formatEuro(selected.inkoopprijs)}</span>
                    <span className="text-muted-foreground">Datum</span><span>{formatDate(selected.datum)}</span>
                  </div>
                </div>

                {/* Handtekening */}
                {selected.handtekeningData && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Handtekening</p>
                    <div className="border border-border rounded-lg p-2 bg-white inline-block">
                      <img src={selected.handtekeningData} alt="Handtekening" className="h-16 object-contain" />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-2">
                  <Button onClick={() => handleDownload(selected)} className="gap-2">
                    <Download className="w-4 h-4" /> PDF downloaden
                  </Button>

                  {!selected.vehicleId && (
                    <div className="space-y-2">
                      <Select value={linkVehicleId} onValueChange={setLinkVehicleId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Koppel aan voertuig..." />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {availableVehicles.map(v => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.kenteken || "—"} — {v.merk} {v.model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={handleLink} disabled={!linkVehicleId} className="gap-2 w-full">
                        <Link2 className="w-4 h-4" /> Koppelen
                      </Button>
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                  Aangemaakt op {new Date(selected.createdAt).toLocaleString("nl-NL")}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

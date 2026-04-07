import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus, Download, Trash2, FileText, Loader2, ExternalLink,
  CheckCircle2, Circle, Upload, Filter, FolderOpen, Camera
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Doc {
  id: string; naam: string; type: string | null; file_path: string; file_size: number | null; mime_type: string | null; created_at: string;
  google_drive_file_id: string | null; google_drive_url: string | null; synced_from_drive: boolean | null;
}

const docCategories = [
  { key: "inkoop", label: "Inkoop", types: ["Inkoopverklaring", "Taxatierapport", "RDW Check"] },
  { key: "verkoop", label: "Verkoop", types: ["Verkoopovereenkomst", "Afleverbon", "Garantiebewijs"] },
  { key: "voertuig", label: "Voertuig", types: ["Kentekenbewijs", "Carpass", "APK Rapport", "Onderhoudsboekje"] },
  { key: "financieel", label: "Financieel", types: ["Factuur", "Creditnota", "Betalingsbewijs"] },
  { key: "overig", label: "Overig", types: ["Overig"] },
];

const allDocTypes = docCategories.flatMap(c => c.types);

const VehicleDocumentenTab = ({ vehicleId }: { vehicleId: string }) => {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ naam: "", type: "Overig", file: null as File | null });
  const [filterCat, setFilterCat] = useState("alle");

  const fetchDocs = async () => {
    const { data } = await supabase.from("vehicle_documents").select("*").eq("vehicle_id", vehicleId).order("created_at", { ascending: false });
    setDocs((data as Doc[]) || []); setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, [vehicleId]);

  const handleUpload = async () => {
    if (!form.file || !form.naam) return;
    setUploading(true);
    const ext = form.file.name.split(".").pop();
    const path = `${vehicleId}/${Date.now()}.${ext}`;
    const { error: storageError } = await supabase.storage.from("vehicle-documents").upload(path, form.file);
    if (storageError) { toast.error("Upload mislukt"); setUploading(false); return; }
    const { error } = await supabase.from("vehicle_documents").insert({ vehicle_id: vehicleId, naam: form.naam, type: form.type, file_path: path, file_size: form.file.size, mime_type: form.file.type } as any);
    if (error) { toast.error("Opslaan mislukt"); } else { toast.success("Document geüpload!"); }
    setUploading(false); setOpen(false); setForm({ naam: "", type: "Overig", file: null }); fetchDocs();
  };

  const handleDownload = async (doc: Doc) => {
    const { data, error } = await supabase.storage.from("vehicle-documents").createSignedUrl(doc.file_path, 300);
    if (error || !data?.signedUrl) { toast.error("Download link kon niet worden aangemaakt"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async (doc: Doc) => {
    await supabase.storage.from("vehicle-documents").remove([doc.file_path]);
    await supabase.from("vehicle_documents").delete().eq("id", doc.id);
    toast.success("Document verwijderd"); fetchDocs();
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // Group docs by category
  const groupedDocs = useMemo(() => {
    const map: Record<string, Doc[]> = {};
    docCategories.forEach(c => { map[c.key] = []; });
    docs.forEach(doc => {
      const cat = docCategories.find(c => c.types.includes(doc.type || "")) || docCategories[docCategories.length - 1];
      map[cat.key].push(doc);
    });
    return map;
  }, [docs]);

  // Completeness stats
  const totalDocs = docs.length;
  const essentialTypes = ["Inkoopverklaring", "Kentekenbewijs"];
  const essentialComplete = essentialTypes.filter(t => docs.some(d => d.type === t)).length;

  const filteredCategories = filterCat === "alle"
    ? docCategories
    : docCategories.filter(c => c.key === filterCat);

  return (
    <div className="space-y-5">
      {/* Dossier header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-3.5 text-center">
          <p className="text-2xl font-bold text-foreground">{totalDocs}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Documenten</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3.5 text-center">
          <p className="text-2xl font-bold text-foreground">{essentialComplete}/{essentialTypes.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Essentieel</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3.5 text-center">
          <p className="text-2xl font-bold text-foreground">{docs.filter(d => d.google_drive_url).length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">In Drive</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3.5 text-center">
          <p className={`text-2xl font-bold ${essentialComplete === essentialTypes.length ? "text-emerald-400" : "text-amber-400"}`}>
            {essentialComplete === essentialTypes.length ? "✓" : "…"}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Status</p>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between gap-3">
        {/* Category filter */}
        <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
          <div className="flex gap-1 bg-card border border-border rounded-lg p-1 min-w-max">
            <button
              onClick={() => setFilterCat("alle")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                filterCat === "alle" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              Alle
            </button>
            {docCategories.map(c => (
              <button
                key={c.key}
                onClick={() => setFilterCat(c.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                  filterCat === c.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {c.label}
                {groupedDocs[c.key]?.length > 0 && (
                  <span className="ml-1.5 text-[10px] opacity-70">({groupedDocs[c.key].length})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors shrink-0">
              <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Uploaden</span><span className="sm:hidden">+</span>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100vw-2rem)]">
            <DialogHeader><DialogTitle>Document Uploaden</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Bestand</label>
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center gap-2 px-3 py-2 text-sm bg-card border border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                    <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground truncate">{form.file ? form.file.name : "Bestand kiezen"}</span>
                    <input type="file" accept=".pdf,.docx,.jpg,.jpeg,.png,.xlsx,.xls" onChange={(e) => setForm(f => ({ ...f, file: e.target.files?.[0] || null }))} className="hidden" />
                  </label>
                  <label className="flex items-center gap-1.5 px-3 py-2 text-sm bg-card border border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors shrink-0">
                    <Camera className="w-4 h-4 text-muted-foreground" />
                    <span className="hidden sm:inline text-foreground">Scan</span>
                    <input type="file" accept="image/*" capture="environment" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const { convertImageToScanPdf } = await import("@/lib/scanToPdf");
                        const pdfFile = await convertImageToScanPdf(file);
                        setForm(f => ({ ...f, file: pdfFile }));
                      } catch {
                        setForm(f => ({ ...f, file }));
                      }
                    }} className="hidden" />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, JPG, PNG, Excel — max 20MB</p>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Naam</label>
                <input value={form.naam} onChange={(e) => setForm(f => ({ ...f, naam: e.target.value }))} placeholder="bijv. Verkoopovereenkomst Jan de Vries" className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Type document</label>
                <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground">
                  {docCategories.map(cat => (
                    <optgroup key={cat.key} label={cat.label}>
                      {cat.types.map(t => <option key={t} value={t}>{t}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <button onClick={handleUpload} disabled={uploading || !form.file || !form.naam} className="w-full py-2.5 border border-border text-sm font-medium rounded-lg hover:bg-accent disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Uploaden
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Documents per category */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : docs.length === 0 ? (
        <Card>
          <CardContent className="px-6 py-16 text-center">
            <FolderOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nog geen documenten in dit dossier.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Upload documenten om het dossier op te bouwen.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCategories.map(cat => {
            const catDocs = groupedDocs[cat.key];
            if (filterCat !== "alle" && catDocs.length === 0) {
              return (
                <Card key={cat.key}>
                  <CardContent className="px-6 py-10 text-center">
                    <p className="text-sm text-muted-foreground">Geen {cat.label.toLowerCase()} documenten.</p>
                  </CardContent>
                </Card>
              );
            }
            if (catDocs.length === 0) return null;

            return (
              <div key={cat.key}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest">{cat.label}</h3>
                  <span className="text-[10px] text-muted-foreground bg-accent/50 px-1.5 py-0.5 rounded">{catDocs.length}</span>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {catDocs.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between px-4 md:px-5 py-3 gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{doc.naam}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                {doc.type && <span className="px-1.5 py-0.5 bg-secondary text-muted-foreground rounded text-[10px] font-medium">{doc.type}</span>}
                                <span>{formatSize(doc.file_size)}</span>
                                <span>{new Date(doc.created_at).toLocaleDateString("nl-NL")}</span>
                                {doc.google_drive_url ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: "rgba(25, 103, 210, 0.1)", color: "#1967D2" }}>
                                    ✅ Drive
                                  </span>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-secondary text-muted-foreground rounded text-[10px] font-medium">⏳ Sync...</span>
                                    </TooltipTrigger>
                                    <TooltipContent>Wordt automatisch gesynchroniseerd via Make.com</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {doc.google_drive_url && (
                              <a href={doc.google_drive_url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:opacity-80" style={{ color: "#1967D2" }} title="Bekijk in Drive">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            {!doc.synced_from_drive && (
                              <button onClick={() => handleDownload(doc)} className="p-1.5 text-muted-foreground hover:text-foreground" title="Download">
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button className="p-1.5 text-muted-foreground hover:text-red-500" title="Verwijderen"><Trash2 className="w-4 h-4" /></button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="max-w-[calc(100vw-2rem)]">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Document verwijderen?</AlertDialogTitle>
                                  <AlertDialogDescription>Dit verwijdert "{doc.naam}" permanent.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(doc)} className="bg-red-600 hover:bg-red-700">Verwijderen</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Essential checklist */}
      <div>
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-2">Checklist essentiële documenten</h3>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {["Inkoopverklaring", "Kentekenbewijs", "Verkoopovereenkomst", "Factuur", "APK Rapport"].map(type => {
                const has = docs.some(d => d.type === type);
                return (
                  <div key={type} className="flex items-center gap-3 px-4 md:px-5 py-3">
                    {has ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={`text-sm ${has ? "text-foreground" : "text-muted-foreground"}`}>{type}</span>
                    {has && <span className="text-[10px] text-emerald-400 ml-auto">Aanwezig</span>}
                    {!has && (
                      <button
                        onClick={() => { setForm({ naam: type, type, file: null }); setOpen(true); }}
                        className="text-[10px] text-primary hover:underline ml-auto"
                      >
                        Uploaden
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VehicleDocumentenTab;

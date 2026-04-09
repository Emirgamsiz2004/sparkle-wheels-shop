import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, Loader2, Upload, Camera, CheckCircle2, Circle, Plus, ExternalLink, Trash2, AlertTriangle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import VehicleFotosTab from "@/components/admin/VehicleFotosTab";
import VehicleDocumentenTab from "@/components/admin/VehicleDocumentenTab";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ArchiveDoc {
  id: string;
  document_type: string;
  klant_naam: string | null;
  kenteken: string | null;
  created_at: string;
  file_path: string | null;
  storage_bucket: string | null;
  test_drive_id: string | null;
}

interface TestDrive {
  id: string;
  status: string;
  start_tijd: string;
  voertuig_kenteken: string | null;
  customer_id: string | null;
}

interface Aanbetaling {
  id: string;
  klant_voornaam: string;
  klant_achternaam: string;
  aanbetalingsbedrag: number;
  datum: string;
  pdf_path: string | null;
}

// Required documents when vehicle is sold
const VERKOOP_DOCUMENTEN = [
  { type: "Koopovereenkomst", label: "Koopovereenkomst" },
  { type: "Verkoopfactuur", label: "Verkoopfactuur" },
  { type: "Vrijwaringsbewijs", label: "Vrijwaringsbewijs" },
];

// Inkoop documents (regulier) — only 1 of 2 needed
const INKOOP_DOCUMENTEN = [
  { type: "Inkoopverklaring", label: "Inkoopverklaring (particulier)" },
  { type: "Inkoopfactuur", label: "Inkoopfactuur (bedrijf)" },
];

// Inkoop documents (consignatie)
const CONSIGNATIE_DOCUMENTEN = [
  { type: "Consignatieovereenkomst", label: "Consignatieovereenkomst" },
];

// Required data fields when vehicle is sold
const VERKOOP_GEGEVENS = [
  { key: "koperNaam", label: "Koper naam" },
  { key: "koperEmail", label: "Koper e-mail" },
  { key: "koperTelefoon", label: "Koper telefoon" },
  { key: "verkoopDatum", label: "Verkoopdatum" },
  { key: "verkoopprijs", label: "Verkoopprijs" },
];

interface VehicleDossierTabProps {
  vehicleId: string;
  vehicleStatus?: string;
  verkoopType?: string;
  koperNaam?: string | null;
  koperEmail?: string | null;
  koperTelefoon?: string | null;
  verkoopDatum?: string | null;
  verkoopprijs?: number | null;
  merk?: string;
  model?: string;
  bouwjaar?: number | null;
  kenteken?: string | null;
}

const VehicleDossierTab = ({ vehicleId, vehicleStatus, verkoopType, koperNaam, koperEmail, koperTelefoon, verkoopDatum, verkoopprijs, merk, model, bouwjaar, kenteken }: VehicleDossierTabProps) => {
  const [archiveDocs, setArchiveDocs] = useState<ArchiveDoc[]>([]);
  const [testDrives, setTestDrives] = useState<TestDrive[]>([]);
  const [aanbetalingen, setAanbetalingen] = useState<Aanbetaling[]>([]);
  const [verkoopDocs, setVerkoopDocs] = useState<{ id: string; type: string; naam: string; file_path: string }[]>([]);
  const [inkoopverklaringen, setInkoopverklaringen] = useState<{ id: string; document_naam: string; verkoper_naam: string; datum: string; pdf_path: string | null; inkoopprijs: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAll = async () => {
      const [archRes, tdRes, abRes, docRes, ikvRes] = await Promise.all([
        supabase.from("document_archive").select("*").eq("vehicle_id", vehicleId).order("created_at", { ascending: false }),
        supabase.from("test_drives").select("*").eq("vehicle_id", vehicleId).order("start_tijd", { ascending: false }),
        supabase.from("aanbetalingen").select("*").eq("vehicle_id", vehicleId).order("datum", { ascending: false }),
        supabase.from("vehicle_documents").select("id, type, naam, file_path").eq("vehicle_id", vehicleId),
        supabase.from("inkoopverklaringen").select("id, document_naam, verkoper_naam, datum, pdf_path, inkoopprijs").eq("vehicle_id", vehicleId).order("datum", { ascending: false }),
      ]);
      setArchiveDocs((archRes.data as ArchiveDoc[]) || []);
      setTestDrives((tdRes.data as TestDrive[]) || []);
      setAanbetalingen((abRes.data as Aanbetaling[]) || []);
      setVerkoopDocs((docRes.data as any[]) || []);
      setInkoopverklaringen((ikvRes.data as any[]) || []);
      setLoading(false);
    };
    fetchAll();
  }, [vehicleId]);

  const handleDownload = async (filePath: string | null, bucket: string | null) => {
    if (!filePath || !bucket) return;
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(filePath, 300);
    if (error || !data?.signedUrl) { toast.error("Download mislukt"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const makeDocName = (docType: string, ext: string) => {
    const cleanKenteken = (kenteken || "GEEN").replace(/[-\s]/g, "");
    const prefix = (verkoopType === "consignatie" || vehicleStatus === "consignatie") ? "Consignatie" : "";
    const base = `${prefix ? prefix + "-" : ""}${merk || "Onbekend"}-${model || "Onbekend"}-${bouwjaar || "0000"}-${cleanKenteken}-${docType}`;
    return `${base}.${ext}`;
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !uploadType) return;
    setUploading(true);
    const ext = file.name.split(".").pop() || "pdf";
    const docName = makeDocName(uploadType, ext);
    const path = `${vehicleId}/${Date.now()}-${docName}`;
    const { error: storageError } = await supabase.storage.from("vehicle-documents").upload(path, file);
    if (storageError) { toast.error("Upload mislukt"); setUploading(false); return; }
    const { error } = await supabase.from("vehicle_documents").insert({
      vehicle_id: vehicleId,
      naam: docName,
      type: uploadType,
      file_path: path,
      file_size: file.size,
      mime_type: file.type,
    } as any);
    if (error) { toast.error("Opslaan mislukt"); } else {
      toast.success(`${uploadType} geüpload!`);
      setVerkoopDocs(prev => [...prev, { type: uploadType, naam: docName, file_path: path, id: Date.now().toString() }]);
    }
    setUploading(false);
    setUploadOpen(false);
    setUploadType("");
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const statusLabels: Record<string, string> = {
    wacht_op_klant: "Wacht op klant",
    actief: "Actief",
    voltooid: "Voltooid",
    geannuleerd: "Geannuleerd",
  };

  const statusColors: Record<string, string> = {
    wacht_op_klant: "bg-amber-500/15 text-amber-400",
    actief: "bg-blue-500/15 text-blue-400",
    voltooid: "bg-emerald-500/15 text-emerald-400",
    geannuleerd: "bg-red-500/15 text-red-400",
  };

  const isVerkocht = vehicleStatus === "verkocht";
  const isConsignatie = verkoopType === "consignatie" || vehicleStatus === "consignatie";
  // When sold, show both consignatie AND inkoop sections if it was a consignatie vehicle
  const showConsignatieSection = isConsignatie;
  const showInkoopSection = !isConsignatie;

  const hasDocument = (type: string) => verkoopDocs.some(d => d.type === type);
  const getDoc = (type: string) => verkoopDocs.find(d => d.type === type);
  const getDocFilePath = (type: string) => verkoopDocs.find(d => d.type === type)?.file_path;

  const handleOpenDocument = async (filePath: string) => {
    const { data, error } = await supabase.storage.from("vehicle-documents").createSignedUrl(filePath, 300);
    if (error || !data?.signedUrl) { toast.error("Openen mislukt"); return; }
    window.open(data.signedUrl, "_blank");
  };

  // Inkoop completeness — either Inkoopverklaring (particulier) OR Inkoopfactuur (bedrijf) is sufficient
  const hasInkoopverklaringDoc = inkoopverklaringen.length > 0 || hasDocument("Inkoopverklaring");
  const hasInkoopfactuurDoc = hasDocument("Inkoopfactuur");
  const hasInkoopDocument = hasInkoopverklaringDoc || hasInkoopfactuurDoc;
  const inkoopComplete = hasInkoopDocument;
  const inkoopMissing: string[] = [];
  if (!hasInkoopDocument) inkoopMissing.push("Inkoopverklaring of Inkoopfactuur");

  // Consignatie completeness
  const consignatieComplete = hasDocument("Consignatieovereenkomst");
  const consignatieMissing: string[] = [];
  if (!consignatieComplete) consignatieMissing.push("Consignatieovereenkomst");

  const inkoopExtraDocs = verkoopDocs.filter(d => d.type === "Overig-inkoop");
  const consignatieExtraDocs = verkoopDocs.filter(d => d.type === "Overig-consignatie");

  // Check which data fields are filled
  const vehicleData: Record<string, any> = { koperNaam, koperEmail, koperTelefoon, verkoopDatum, verkoopprijs };
  const hasData = (key: string) => {
    const val = vehicleData[key];
    if (val === null || val === undefined || val === "") return false;
    if (typeof val === "number" && val === 0) return false;
    return true;
  };

  const docsComplete = VERKOOP_DOCUMENTEN.filter(d => hasDocument(d.type)).length;
  const dataComplete = VERKOOP_GEGEVENS.filter(d => hasData(d.key)).length;
  const totalComplete = docsComplete + dataComplete;
  const totalRequired = VERKOOP_DOCUMENTEN.length + VERKOOP_GEGEVENS.length;

  return (
    <div className="space-y-6">
      {/* Verkoop dossier checklist */}
      {isVerkocht && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Verkoopdossier</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              totalComplete === totalRequired 
                ? "bg-emerald-500/15 text-emerald-400" 
                : "bg-amber-500/15 text-amber-400"
            }`}>
              {totalComplete}/{totalRequired} compleet
            </span>
          </div>

          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {/* Data fields */}
            <div className="px-4 py-2.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Gegevens</p>
              <div className="space-y-1.5">
                {VERKOOP_GEGEVENS.map(field => {
                  const filled = hasData(field.key);
                  return (
                    <div key={field.key} className="flex items-center gap-2.5">
                      {filled ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={`text-sm ${filled ? "text-foreground" : "text-muted-foreground"}`}>{field.label}</span>
                      {filled && (
                        <span className="text-xs text-muted-foreground ml-auto truncate max-w-[140px]">
                          {field.key === "verkoopprijs" ? `€ ${Number(vehicleData[field.key]).toLocaleString("nl-NL")}` : String(vehicleData[field.key])}
                        </span>
                      )}
                      {!filled && <span className="text-[10px] text-amber-400 ml-auto">Ontbreekt</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Document upload slots */}
            <div className="px-4 py-2.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Documenten</p>
              <div className="space-y-1.5">
                {VERKOOP_DOCUMENTEN.map(doc => {
                  const present = hasDocument(doc.type);
                  return (
                    <div key={doc.type} className="flex items-center gap-2.5">
                      {present ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={`text-sm flex-1 ${present ? "text-foreground" : "text-muted-foreground"}`}>{doc.label}</span>
                      {present ? (
                        <button
                          onClick={() => { const fp = getDocFilePath(doc.type); if (fp) handleOpenDocument(fp); }}
                          className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> Openen
                        </button>
                      ) : (
                        <button
                          onClick={() => { setUploadType(doc.type); setUploadOpen(true); }}
                          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                        >
                          <Upload className="w-3 h-3" /> Uploaden
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consignatiedossier - show for consignatie vehicles (also when sold) */}
      {showConsignatieSection && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Consignatiedossier</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              consignatieComplete ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
            }`}>
              {consignatieComplete ? "Compleet" : "Onvolledig"}
            </span>
          </div>
          {!consignatieComplete && consignatieMissing.length > 0 && (
            <div className="flex items-start gap-2 mb-3 px-3 py-2 rounded-md bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-400">Dossier onvolledig — {consignatieMissing.join(" en ")} ontbreekt.</p>
            </div>
          )}
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            <DocRow
              label="Consignatieovereenkomst"
              present={hasDocument("Consignatieovereenkomst")}
              statusLabel={hasDocument("Consignatieovereenkomst") ? "Geüpload" : "Ontbreekt"}
              onOpen={hasDocument("Consignatieovereenkomst") ? () => { const fp = getDocFilePath("Consignatieovereenkomst"); if (fp) handleOpenDocument(fp); } : undefined}
              onUpload={() => { setUploadType("Consignatieovereenkomst"); setUploadOpen(true); }}
              onDelete={hasDocument("Consignatieovereenkomst") ? async () => {
                const doc = getDoc("Consignatieovereenkomst");
                if (doc) {
                  await supabase.storage.from("vehicle-documents").remove([doc.file_path]);
                  await supabase.from("vehicle_documents").delete().eq("id", doc.id);
                  setVerkoopDocs(prev => prev.filter(d => d.id !== doc.id));
                  toast.success("Document verwijderd");
                }
              } : undefined}
            />
          </div>
          {/* Overige consignatie documenten */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Overige documenten</h4>
              <button onClick={() => { setUploadType("Overig-consignatie"); setUploadOpen(true); }} className="text-[10px] text-primary hover:underline">+ Toevoegen</button>
            </div>
            {consignatieExtraDocs.length === 0 ? (
              <p className="text-xs text-muted-foreground bg-card border border-border rounded-lg px-4 py-4 text-center">Geen overige documenten</p>
            ) : (
              <div className="bg-card border border-border rounded-lg divide-y divide-border">
                {consignatieExtraDocs.map(doc => (
                  <ExtraDocRow key={doc.id} doc={doc} onOpen={handleOpenDocument} onDelete={async () => {
                    await supabase.storage.from("vehicle-documents").remove([doc.file_path]);
                    await supabase.from("vehicle_documents").delete().eq("id", doc.id);
                    setVerkoopDocs(prev => prev.filter(d => d.id !== doc.id));
                    toast.success("Document verwijderd");
                  }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inkoopdossier - show for regulier vehicles (also when sold) */}
      {showInkoopSection && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inkoopdossier</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              inkoopComplete ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
            }`}>
              {inkoopComplete ? "Compleet" : "Onvolledig"}
            </span>
          </div>
          {!inkoopComplete && inkoopMissing.length > 0 && (
            <div className="flex items-start gap-2 mb-3 px-3 py-2 rounded-md bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-400">Dossier onvolledig — {inkoopMissing.join(" en ")} ontbreekt.</p>
            </div>
          )}
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            <DocRow
              label="Inkoopverklaring (particulier)"
              present={hasInkoopverklaringDoc}
              statusLabel={hasInkoopverklaringDoc ? (inkoopverklaringen.length > 0 ? "Aangemaakt" : "Geüpload") : "Ontbreekt"}
              onOpen={inkoopverklaringen.length > 0 && inkoopverklaringen[0].pdf_path ? async () => {
                const { data } = await supabase.storage.from("vehicle-documents").createSignedUrl(inkoopverklaringen[0].pdf_path!, 60);
                if (data?.signedUrl) window.open(data.signedUrl, "_blank");
              } : hasDocument("Inkoopverklaring") ? () => {
                const fp = getDocFilePath("Inkoopverklaring");
                if (fp) handleOpenDocument(fp);
              } : undefined}
              onUpload={() => { setUploadType("Inkoopverklaring"); setUploadOpen(true); }}
              onDelete={hasDocument("Inkoopverklaring") ? async () => {
                const doc = getDoc("Inkoopverklaring");
                if (doc) {
                  await supabase.storage.from("vehicle-documents").remove([doc.file_path]);
                  await supabase.from("vehicle_documents").delete().eq("id", doc.id);
                  setVerkoopDocs(prev => prev.filter(d => d.id !== doc.id));
                  toast.success("Document verwijderd");
                }
              } : undefined}
              subText={inkoopverklaringen.length > 0 ? `${inkoopverklaringen[0].document_naam} · ${inkoopverklaringen[0].verkoper_naam}` : undefined}
            />
            <DocRow
              label="Inkoopfactuur (bedrijf)"
              present={hasInkoopfactuurDoc}
              statusLabel={hasInkoopfactuurDoc ? "Geüpload" : "Ontbreekt"}
              onOpen={hasInkoopfactuurDoc ? () => { const fp = getDocFilePath("Inkoopfactuur"); if (fp) handleOpenDocument(fp); } : undefined}
              onUpload={() => { setUploadType("Inkoopfactuur"); setUploadOpen(true); }}
              onDelete={hasInkoopfactuurDoc ? async () => {
                const doc = getDoc("Inkoopfactuur");
                if (doc) {
                  await supabase.storage.from("vehicle-documents").remove([doc.file_path]);
                  await supabase.from("vehicle_documents").delete().eq("id", doc.id);
                  setVerkoopDocs(prev => prev.filter(d => d.id !== doc.id));
                  toast.success("Document verwijderd");
                }
              } : undefined}
            />
          </div>
          {/* Overige inkoop documenten */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Overige documenten</h4>
              <button onClick={() => { setUploadType("Overig-inkoop"); setUploadOpen(true); }} className="text-[10px] text-primary hover:underline">+ Toevoegen</button>
            </div>
            {inkoopExtraDocs.length === 0 ? (
              <p className="text-xs text-muted-foreground bg-card border border-border rounded-lg px-4 py-4 text-center">Geen overige documenten</p>
            ) : (
              <div className="bg-card border border-border rounded-lg divide-y divide-border">
                {inkoopExtraDocs.map(doc => (
                  <ExtraDocRow key={doc.id} doc={doc} onOpen={handleOpenDocument} onDelete={async () => {
                    await supabase.storage.from("vehicle-documents").remove([doc.file_path]);
                    await supabase.from("vehicle_documents").delete().eq("id", doc.id);
                    setVerkoopDocs(prev => prev.filter(d => d.id !== doc.id));
                    toast.success("Document verwijderd");
                  }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}


      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)]">
          <DialogHeader><DialogTitle>{uploadType} uploaden</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex flex-col items-center gap-2 p-6 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Bestand kiezen</span>
                <span className="text-[10px] text-muted-foreground">PDF, JPG, PNG</span>
              </button>
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploading}
                className="flex flex-col items-center gap-2 p-6 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <Camera className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Scannen</span>
                <span className="text-[10px] text-muted-foreground">Foto → PDF scan</span>
              </button>
            </div>
            {uploading && (
              <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Uploaden...
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const { convertImageToScanPdf } = await import("@/lib/scanToPdf");
                  const pdfFile = await convertImageToScanPdf(f);
                  handleFileUpload(pdfFile);
                } catch {
                  handleFileUpload(f);
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Gegenereerde documenten */}
      {archiveDocs.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Gegenereerde documenten</h3>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {archiveDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.document_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.klant_naam && <span>{doc.klant_naam} · </span>}
                      {new Date(doc.created_at).toLocaleDateString("nl-NL")}
                    </p>
                  </div>
                </div>
                {doc.file_path && (
                  <button onClick={() => handleDownload(doc.file_path, doc.storage_bucket)} className="p-1.5 text-muted-foreground hover:text-foreground">
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proefritten */}
      {testDrives.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Proefritten</h3>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {testDrives.map((td) => (
              <div key={td.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded ${statusColors[td.status] || "bg-secondary text-muted-foreground"}`}>
                    {statusLabels[td.status] || td.status}
                  </span>
                  <span className="text-sm text-foreground">{new Date(td.start_tijd).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aanbetalingen */}
      {aanbetalingen.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Aanbetalingen</h3>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {aanbetalingen.map((ab) => (
              <div key={ab.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{ab.klant_voornaam} {ab.klant_achternaam}</p>
                  <p className="text-xs text-muted-foreground">€ {ab.aanbetalingsbedrag.toLocaleString("nl-NL")} · {new Date(ab.datum).toLocaleDateString("nl-NL")}</p>
                </div>
                {ab.pdf_path && (
                  <button onClick={() => handleDownload(ab.pdf_path, "vehicle-documents")} className="p-1.5 text-muted-foreground hover:text-foreground">
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Foto's */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Foto's</h3>
        <VehicleFotosTab vehicleId={vehicleId} />
      </div>

      {/* Documenten */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Documenten</h3>
        <VehicleDocumentenTab vehicleId={vehicleId} />
      </div>
    </div>
  );
};

const DocRow = ({ label, present, statusLabel, subText, onOpen, onUpload, onDelete }: {
  label: string;
  present: boolean;
  statusLabel: string;
  subText?: string;
  onOpen?: () => void;
  onUpload: () => void;
  onDelete?: () => void;
}) => (
  <div className="flex items-center gap-3 px-4 py-3">
    {present ? (
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
    ) : (
      <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
    )}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className={`text-sm ${present ? "text-foreground font-medium" : "text-muted-foreground"}`}>{label}</p>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
          present ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
        }`}>
          {statusLabel}
        </span>
      </div>
      {subText && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{subText}</p>}
    </div>
    <div className="flex items-center gap-1">
      {present && onOpen && (
        <button onClick={onOpen} className="p-1.5 text-muted-foreground hover:text-foreground">
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      )}
      {present && onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="p-1.5 text-muted-foreground hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Document verwijderen?</AlertDialogTitle>
              <AlertDialogDescription>Weet je zeker dat je dit document wilt verwijderen? Dit kan niet ongedaan worden gemaakt.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuleren</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Verwijderen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {!present && (
        <button onClick={onUpload} className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-primary hover:underline">
          <Upload className="w-3 h-3" /> Uploaden
        </button>
      )}
    </div>
  </div>
);

const ExtraDocRow = ({ doc, onOpen, onDelete }: { doc: { id: string; naam: string; file_path: string }; onOpen: (fp: string) => void; onDelete: () => void }) => (
  <div className="flex items-center gap-3 px-4 py-2.5">
    <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
    <p className="text-sm text-foreground flex-1 truncate">{doc.naam}</p>
    <button onClick={() => onOpen(doc.file_path)} className="p-1 text-muted-foreground hover:text-foreground">
      <ExternalLink className="w-3.5 h-3.5" />
    </button>
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="p-1 text-muted-foreground hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Document verwijderen?</AlertDialogTitle>
          <AlertDialogDescription>Weet je zeker dat je dit document wilt verwijderen?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuleren</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete}>Verwijderen</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
);

export default VehicleDossierTab;

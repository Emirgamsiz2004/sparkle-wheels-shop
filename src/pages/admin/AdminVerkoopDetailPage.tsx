import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useVehicles } from "@/hooks/useVehicles";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Phone, FileText, Download, Upload, Camera, ExternalLink, Trash2, CheckCircle2, Circle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Vehicle, formatEuro, formatEuroDecimal, calcKostprijs, calcWinst, calcMarge, calcTotalKosten, isConsignatie, calcConsignatieCommissie } from "@/types/vehicle";
import SlidingTabs from "@/components/admin/SlidingTabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useRef } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const VERKOOP_DOCUMENTEN = [
  { type: "Koopovereenkomst", label: "Koopovereenkomst", generated: true },
  { type: "Verkoopfactuur", label: "Factuur", generated: true },
  { type: "Machtigingsformulier", label: "Machtigingsformulier", generated: false },
];

const tabItems = [
  { label: "Documenten", value: "documenten" },
  { label: "Geschiedenis", value: "geschiedenis" },
];

const AdminVerkoopDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicles, loading, updateVehicle, removeCost } = useVehicles();
  const [activeTab, setActiveTab] = useState("documenten");
  const [docs, setDocs] = useState<{ id: string; type: string; naam: string; file_path: string }[]>([]);
  const [activityLog, setActivityLog] = useState<{ id: string; actie_type: string; beschrijving: string; created_at: string }[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [sale, setSale] = useState<any>(null);

  const vehicle = vehicles.find(v => v.id === id);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const [docRes, logRes, saleRes] = await Promise.all([
        supabase.from("vehicle_documents").select("id, type, naam, file_path").eq("vehicle_id", id),
        supabase.from("vehicle_activity_log").select("id, actie_type, beschrijving, created_at").eq("vehicle_id", id).order("created_at", { ascending: false }),
        supabase.from("vehicle_sales").select("*").eq("vehicle_id", id).order("created_at", { ascending: false }).limit(1),
      ]);
      setDocs((docRes.data as any[]) || []);
      setActivityLog((logRes.data as any[]) || []);
      setSale(saleRes.data?.[0] || null);
      setLoadingData(false);
    };
    fetchData();
  }, [id]);

  const handleOpenDocument = async (filePath: string) => {
    const { data, error } = await supabase.storage.from("vehicle-documents").createSignedUrl(filePath, 300);
    if (error || !data?.signedUrl) { toast.error("Openen mislukt"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const handleDeleteDoc = async (docId: string, filePath: string) => {
    await supabase.storage.from("vehicle-documents").remove([filePath]);
    await supabase.from("vehicle_documents").delete().eq("id", docId);
    setDocs(prev => prev.filter(d => d.id !== docId));
    toast.success("Document verwijderd");
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !uploadType || !id || !vehicle) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const cleanKenteken = (vehicle.kenteken || "GEEN").replace(/[-\s]/g, "");
    const fileName = `IKV-${vehicle.merk}-${vehicle.model}-${vehicle.bouwjaar}-${cleanKenteken}-${uploadType}.${ext}`;
    const path = `${id}/${Date.now()}-${fileName}`;
    const { error: storageError } = await supabase.storage.from("vehicle-documents").upload(path, file);
    if (storageError) { toast.error("Upload mislukt"); setUploading(false); return; }
    const { data: inserted, error } = await supabase.from("vehicle_documents").insert({
      vehicle_id: id,
      naam: fileName,
      type: uploadType,
      file_path: path,
      file_size: file.size,
      mime_type: file.type,
    } as any).select().single();
    if (error) { toast.error("Opslaan mislukt"); } else {
      toast.success(`${uploadType} geüpload!`);
      setDocs(prev => [...prev, { id: inserted.id, type: uploadType, naam: fileName, file_path: path }]);
    }
    setUploading(false);
    setUploadOpen(false);
    setUploadType("");
  };

  if (loading || loadingData) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  if (!vehicle) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4 text-sm">Verkoop niet gevonden</p>
        <button onClick={() => navigate("/admin/verkopen")} className="text-foreground hover:underline text-sm">Terug</button>
      </div>
    );
  }

  const kostprijs = calcKostprijs(vehicle);
  const winst = calcWinst(vehicle);
  const marge = calcMarge(vehicle);
  const totalKosten = calcTotalKosten(vehicle);
  const hasDoc = (type: string) => docs.some(d => d.type === type);
  const getDoc = (type: string) => docs.find(d => d.type === type);
  const extraDocs = docs.filter(d => !VERKOOP_DOCUMENTEN.some(vd => vd.type === d.type));

  const betaalwijze = sale?.betaalwijze || vehicle.betaalmethode || "—";
  const garantieType = sale?.garantie_type || "geen";
  const garantieMaanden = sale?.garantie_maanden || 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate("/admin/verkopen")} className="mt-1 p-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-medium text-foreground">
            {vehicle.merk} {vehicle.model} {vehicle.bouwjaar} <span className="text-muted-foreground font-normal">{vehicle.kenteken?.toUpperCase()}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            {vehicle.verkoopDatum && (
              <span className="text-xs text-muted-foreground">
                Verkocht op {new Date(vehicle.verkoopDatum).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            )}
            {vehicle.koperNaam && (
              <span className="text-xs text-foreground font-medium">{vehicle.koperNaam}</span>
            )}
            {vehicle.koperTelefoon && (
              <a href={`tel:${vehicle.koperTelefoon}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <Phone className="w-3 h-3" /> {vehicle.koperTelefoon}
              </a>
            )}
          </div>
        </div>
        <Link to={`/admin/voertuigen/${vehicle.id}`} className="text-xs text-muted-foreground hover:text-foreground border border-border px-2.5 py-1.5 rounded-md">
          Voertuig details
        </Link>
      </div>

      {/* Three info blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Financieel */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Financieel</h3>
          <table className="w-full text-sm">
            <tbody>
              <Row label="Inkoopprijs" value={isConsignatie(vehicle) ? `${vehicle.consignatieCommissiePerc}% comm.` : formatEuroDecimal(vehicle.inkoopprijs)} />
              <Row label="Kosten" value={formatEuroDecimal(totalKosten)} />
              <Row label="Verkoopprijs" value={formatEuroDecimal(vehicle.verkoopprijs)} />
              <Row label="Marge" value={`${formatEuroDecimal(winst)} (${marge.toFixed(1)}%)`} valueColor={winst >= 0 ? "text-emerald-500" : "text-red-500"} isLast />
            </tbody>
          </table>
        </div>

        {/* Betaling */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Betaling</h3>
          <table className="w-full text-sm">
            <tbody>
              <Row label="Betaalwijze" value={betaalwijze === "overboeking" ? "Overboeking" : betaalwijze === "contant" ? "Contant" : betaalwijze === "financiering" ? "Financiering" : betaalwijze === "combinatie" ? "Combinatie" : betaalwijze} />
              {!!vehicle.aanbetalingsbedrag && <Row label="Aanbetaling" value={formatEuroDecimal(vehicle.aanbetalingsbedrag)} />}
              {!!vehicle.contantBedrag && <Row label="Contant" value={formatEuroDecimal(vehicle.contantBedrag)} />}
              {!!vehicle.overboekingBedrag && <Row label="Overboeking" value={formatEuroDecimal(vehicle.overboekingBedrag)} />}
              {vehicle.financieringActief && <Row label="Financiering" value={formatEuroDecimal(vehicle.financieringBedrag || 0)} />}
              {vehicle.inruilKenteken && <Row label="Inruil" value={`${vehicle.inruilKenteken} (${formatEuro(vehicle.inruilWaarde || 0)})`} isLast />}
            </tbody>
          </table>
        </div>

        {/* Garantie */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Garantie</h3>
          <table className="w-full text-sm">
            <tbody>
              <Row label="Type" value={garantieType === "geen" ? "Geen garantie" : garantieType} />
              {garantieMaanden > 0 && <Row label="Duur" value={`${garantieMaanden} maanden`} isLast />}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <SlidingTabs tabs={tabItems} value={activeTab} onChange={setActiveTab} className="min-w-max" />
      </div>

      {/* Tab: Documenten */}
      {activeTab === "documenten" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {VERKOOP_DOCUMENTEN.map(doc => {
              const existing = getDoc(doc.type);
              return (
                <div key={doc.type} className="flex items-center gap-3 px-4 py-3">
                  {existing ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${existing ? "text-foreground font-medium" : "text-muted-foreground"}`}>{doc.label}</p>
                    {existing && <p className="text-[10px] text-muted-foreground truncate">{existing.naam}</p>}
                    {doc.generated && !existing && <p className="text-[10px] text-muted-foreground">Gegenereerd door systeem</p>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {existing ? (
                      <>
                        <button onClick={() => handleOpenDocument(existing.file_path)} className="p-1.5 text-muted-foreground hover:text-foreground">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="p-1.5 text-muted-foreground hover:text-red-400">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Document verwijderen?</AlertDialogTitle>
                              <AlertDialogDescription>Weet je zeker dat je dit document wilt verwijderen? Dit kan niet ongedaan worden gemaakt.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuleren</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteDoc(existing.id, existing.file_path)}>Verwijderen</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    ) : (
                      <button
                        onClick={() => { setUploadType(doc.type); setUploadOpen(true); }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-primary hover:underline"
                      >
                        <Upload className="w-3 h-3" /> Uploaden
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Extra documents */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overige documenten</h3>
              <button
                onClick={() => { setUploadType("Overig"); setUploadOpen(true); }}
                className="text-xs text-primary hover:underline"
              >
                + Toevoegen
              </button>
            </div>
            {extraDocs.length === 0 ? (
              <p className="text-xs text-muted-foreground bg-card border border-border rounded-lg px-4 py-6 text-center">Geen overige documenten</p>
            ) : (
              <div className="bg-card border border-border rounded-lg divide-y divide-border">
                {extraDocs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <p className="text-sm text-foreground flex-1 truncate">{doc.naam}</p>
                    <button onClick={() => handleOpenDocument(doc.file_path)} className="p-1.5 text-muted-foreground hover:text-foreground">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
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
                          <AlertDialogAction onClick={() => handleDeleteDoc(doc.id, doc.file_path)}>Verwijderen</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Geschiedenis */}
      {activeTab === "geschiedenis" && (
        <div>
          {activityLog.length === 0 ? (
            <p className="text-xs text-muted-foreground bg-card border border-border rounded-lg px-4 py-8 text-center">Geen activiteit gevonden</p>
          ) : (
            <div className="relative pl-5 space-y-0">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
              {activityLog.map((log, i) => (
                <div key={log.id} className="relative pb-4">
                  <div className="absolute left-[-13px] top-1.5 w-2.5 h-2.5 rounded-full bg-border border-2 border-background" />
                  <div className="ml-3">
                    <p className="text-sm text-foreground">{log.beschrijving}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)]">
          <DialogHeader><DialogTitle>{uploadType} uploaden</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex flex-col items-center gap-2 p-6 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Bestand kiezen</span>
                <span className="text-[10px] text-muted-foreground">PDF, JPG, PNG</span>
              </button>
              <button onClick={() => cameraInputRef.current?.click()} disabled={uploading} className="flex flex-col items-center gap-2 p-6 border border-border rounded-lg hover:bg-accent/50 transition-colors">
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
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
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
    </div>
  );
};

const Row = ({ label, value, valueColor, isLast }: { label: string; value: string; valueColor?: string; isLast?: boolean }) => (
  <tr className={!isLast ? "border-b border-border/50" : ""}>
    <td className="py-2 pr-3 text-xs text-muted-foreground whitespace-nowrap">{label}</td>
    <td className={`py-2 text-sm font-medium tabular-nums text-right ${valueColor || "text-foreground"}`}>{value}</td>
  </tr>
);

export default AdminVerkoopDetailPage;

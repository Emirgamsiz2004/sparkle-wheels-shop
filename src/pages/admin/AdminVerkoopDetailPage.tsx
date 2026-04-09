import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useVehicles } from "@/hooks/useVehicles";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Phone, FileText, Download, Upload, Camera, ExternalLink, Trash2, CheckCircle2, Circle, Clock, Save, Mail } from "lucide-react";
import { toast } from "sonner";
import { Vehicle, formatEuro, formatEuroDecimal, calcKostprijs, calcWinst, calcMarge, calcTotalKosten, isConsignatie, calcConsignatieCommissie } from "@/types/vehicle";
import SlidingTabs from "@/components/admin/SlidingTabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import VehicleDossierTab from "@/components/admin/detail/VehicleDossierTab";

const tabItems = [
  { label: "Gegevens", value: "gegevens" },
  { label: "Documenten", value: "documenten" },
  { label: "Geschiedenis", value: "geschiedenis" },
];

const AdminVerkoopDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicles, loading, updateVehicle } = useVehicles();
  const [activeTab, setActiveTab] = useState("gegevens");
  const [docs, setDocs] = useState<{ id: string; type: string; naam: string; file_path: string }[]>([]);
  const [activityLog, setActivityLog] = useState<{ id: string; actie_type: string; beschrijving: string; created_at: string }[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [sale, setSale] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [form, setForm] = useState({
    koperNaam: "",
    koperEmail: "",
    koperTelefoon: "",
    verkoopDatum: "",
    verkoopprijs: "",
    betaalmethode: "overboeking",
    contantBedrag: "",
    overboekingBedrag: "",
    financieringActief: false,
    financieringBedrag: "",
    aanbetalingsbedrag: "",
    inruilKenteken: "",
    inruilMerk: "",
    inruilModel: "",
    inruilWaarde: "",
  });

  const vehicle = vehicles.find(v => v.id === id);

  // Initialize form from vehicle
  useEffect(() => {
    if (!vehicle) return;
    setForm({
      koperNaam: vehicle.koperNaam || "",
      koperEmail: vehicle.koperEmail || "",
      koperTelefoon: vehicle.koperTelefoon || "",
      verkoopDatum: vehicle.verkoopDatum || "",
      verkoopprijs: String(vehicle.verkoopprijs || ""),
      betaalmethode: vehicle.betaalmethode || "overboeking",
      contantBedrag: String(vehicle.contantBedrag || ""),
      overboekingBedrag: String(vehicle.overboekingBedrag || ""),
      financieringActief: vehicle.financieringActief || false,
      financieringBedrag: String(vehicle.financieringBedrag || ""),
      aanbetalingsbedrag: String(vehicle.aanbetalingsbedrag || ""),
      inruilKenteken: vehicle.inruilKenteken || "",
      inruilMerk: vehicle.inruilMerk || "",
      inruilModel: vehicle.inruilModel || "",
      inruilWaarde: String(vehicle.inruilWaarde || ""),
    });
  }, [vehicle?.id]);

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

  const handleSave = async () => {
    if (!id || !vehicle) return;
    setSaving(true);
    try {
      await updateVehicle({
        ...vehicle,
        koperNaam: form.koperNaam || undefined,
        koperEmail: form.koperEmail || undefined,
        koperTelefoon: form.koperTelefoon || undefined,
        verkoopDatum: form.verkoopDatum || undefined,
        verkoopprijs: Number(form.verkoopprijs) || 0,
        betaalmethode: form.betaalmethode || undefined,
        contantBedrag: Number(form.contantBedrag) || 0,
        overboekingBedrag: Number(form.overboekingBedrag) || 0,
        financieringActief: form.financieringActief,
        financieringBedrag: Number(form.financieringBedrag) || 0,
        aanbetalingsbedrag: Number(form.aanbetalingsbedrag) || 0,
        inruilKenteken: form.inruilKenteken || undefined,
        inruilMerk: form.inruilMerk || undefined,
        inruilModel: form.inruilModel || undefined,
        inruilWaarde: Number(form.inruilWaarde) || 0,
      } as Vehicle);
    } catch {
      toast.error("Opslaan mislukt");
    }
    setSaving(false);
  };

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
    const fileName = `Verkoop-${vehicle.merk}-${vehicle.model}-${vehicle.bouwjaar}-${cleanKenteken}-${uploadType}.${ext}`;
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
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Financieel</h3>
          <table className="w-full text-sm">
            <tbody>
              <InfoRow label="Inkoopprijs" value={isConsignatie(vehicle) ? `${vehicle.consignatieCommissiePerc}% comm.` : formatEuroDecimal(vehicle.inkoopprijs)} />
              <InfoRow label="Kosten" value={formatEuroDecimal(totalKosten)} />
              <InfoRow label="Verkoopprijs" value={formatEuroDecimal(vehicle.verkoopprijs)} />
              <InfoRow label="Marge" value={`${formatEuroDecimal(winst)} (${marge.toFixed(1)}%)`} valueColor={winst >= 0 ? "text-emerald-500" : "text-red-500"} isLast />
            </tbody>
          </table>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Betaling</h3>
          <table className="w-full text-sm">
            <tbody>
              <InfoRow label="Betaalwijze" value={betaalwijze === "overboeking" ? "Overboeking" : betaalwijze === "contant" ? "Contant" : betaalwijze === "financiering" ? "Financiering" : betaalwijze === "combinatie" ? "Combinatie" : betaalwijze} />
              {!!vehicle.aanbetalingsbedrag && <InfoRow label="Aanbetaling" value={formatEuroDecimal(vehicle.aanbetalingsbedrag)} />}
              {!!vehicle.contantBedrag && <InfoRow label="Contant" value={formatEuroDecimal(vehicle.contantBedrag)} />}
              {!!vehicle.overboekingBedrag && <InfoRow label="Overboeking" value={formatEuroDecimal(vehicle.overboekingBedrag)} />}
              {vehicle.financieringActief && <InfoRow label="Financiering" value={formatEuroDecimal(vehicle.financieringBedrag || 0)} />}
              {vehicle.inruilKenteken && <InfoRow label="Inruil" value={`${vehicle.inruilKenteken} (${formatEuro(vehicle.inruilWaarde || 0)})`} isLast />}
            </tbody>
          </table>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Garantie</h3>
          <table className="w-full text-sm">
            <tbody>
              <InfoRow label="Type" value={garantieType === "geen" ? "Geen garantie" : garantieType} />
              {garantieMaanden > 0 && <InfoRow label="Duur" value={`${garantieMaanden} maanden`} isLast />}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <SlidingTabs tabs={tabItems} value={activeTab} onChange={setActiveTab} className="min-w-max" />
      </div>

      {/* Tab: Gegevens */}
      {activeTab === "gegevens" && (
        <div className="space-y-5">
          {/* Kopergegevens */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-4">Kopergegevens</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Naam koper" value={form.koperNaam} onChange={v => setForm(f => ({ ...f, koperNaam: v }))} placeholder="Volledige naam" />
              <Field label="E-mail" value={form.koperEmail} onChange={v => setForm(f => ({ ...f, koperEmail: v }))} placeholder="email@voorbeeld.nl" type="email" />
              <Field label="Telefoon" value={form.koperTelefoon} onChange={v => setForm(f => ({ ...f, koperTelefoon: v }))} placeholder="06-12345678" type="tel" />
              <Field label="Verkoopdatum" value={form.verkoopDatum} onChange={v => setForm(f => ({ ...f, verkoopDatum: v }))} type="date" />
            </div>
          </div>

          {/* Verkoopbedrag & betaalwijze */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-4">Betaalgegevens</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Verkoopprijs" value={form.verkoopprijs} onChange={v => setForm(f => ({ ...f, verkoopprijs: v }))} type="number" prefix="€" />
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Betaalwijze</label>
                <select
                  value={form.betaalmethode}
                  onChange={e => setForm(f => ({ ...f, betaalmethode: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="overboeking">Overboeking</option>
                  <option value="contant">Contant</option>
                  <option value="financiering">Financiering</option>
                  <option value="combinatie">Combinatie</option>
                </select>
              </div>
              {(form.betaalmethode === "contant" || form.betaalmethode === "combinatie") && (
                <Field label="Contant bedrag" value={form.contantBedrag} onChange={v => setForm(f => ({ ...f, contantBedrag: v }))} type="number" prefix="€" />
              )}
              {(form.betaalmethode === "overboeking" || form.betaalmethode === "combinatie") && (
                <Field label="Overboeking bedrag" value={form.overboekingBedrag} onChange={v => setForm(f => ({ ...f, overboekingBedrag: v }))} type="number" prefix="€" />
              )}
              <Field label="Aanbetaling" value={form.aanbetalingsbedrag} onChange={v => setForm(f => ({ ...f, aanbetalingsbedrag: v }))} type="number" prefix="€" />
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Financiering</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, financieringActief: !f.financieringActief }))}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${form.financieringActief ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-accent"}`}
                  >
                    {form.financieringActief ? "Ja" : "Nee"}
                  </button>
                  {form.financieringActief && (
                    <div className="flex-1">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                        <input
                          type="number"
                          value={form.financieringBedrag}
                          onChange={e => setForm(f => ({ ...f, financieringBedrag: e.target.value }))}
                          className="w-full pl-7 pr-3 py-2 text-sm bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          placeholder="Bedrag"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Inruil */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-4">Inruil</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Kenteken inruil" value={form.inruilKenteken} onChange={v => setForm(f => ({ ...f, inruilKenteken: v.toUpperCase() }))} placeholder="XX-XXX-X" />
              <Field label="Merk" value={form.inruilMerk} onChange={v => setForm(f => ({ ...f, inruilMerk: v }))} placeholder="Merk" />
              <Field label="Model" value={form.inruilModel} onChange={v => setForm(f => ({ ...f, inruilModel: v }))} placeholder="Model" />
              <Field label="Inruilwaarde" value={form.inruilWaarde} onChange={v => setForm(f => ({ ...f, inruilWaarde: v }))} type="number" prefix="€" />
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Opslaan
            </button>
          </div>
        </div>
      )}

      {/* Tab: Documenten */}
      {activeTab === "documenten" && (
        <VehicleDossierTab
          vehicleId={vehicle.id}
          vehicleStatus={vehicle.status}
          verkoopType={vehicle.verkoopType}
          koperNaam={vehicle.koperNaam}
          koperEmail={vehicle.koperEmail}
          koperTelefoon={vehicle.koperTelefoon}
          verkoopDatum={vehicle.verkoopDatum}
          verkoopprijs={vehicle.verkoopprijs}
          merk={vehicle.merk}
          model={vehicle.model}
          bouwjaar={vehicle.bouwjaar}
          kenteken={vehicle.kenteken}
        />
      )}

      {/* Tab: Geschiedenis */}
      {activeTab === "geschiedenis" && (
        <div>
          {activityLog.length === 0 ? (
            <p className="text-xs text-muted-foreground bg-card border border-border rounded-lg px-4 py-8 text-center">Geen activiteit gevonden</p>
          ) : (
            <div className="relative pl-5 space-y-0">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
              {activityLog.map((log) => (
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

/* ─── Helpers ─── */

const InfoRow = ({ label, value, valueColor, isLast }: { label: string; value: string; valueColor?: string; isLast?: boolean }) => (
  <tr className={!isLast ? "border-b border-border/50" : ""}>
    <td className="py-2 pr-3 text-xs text-muted-foreground whitespace-nowrap">{label}</td>
    <td className={`py-2 text-sm font-medium tabular-nums text-right ${valueColor || "text-foreground"}`}>{value}</td>
  </tr>
);

const Field = ({ label, value, onChange, placeholder, type = "text", prefix }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; prefix?: string;
}) => (
  <div>
    <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{prefix}</span>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${prefix ? "pl-7" : "pl-3"} pr-3 py-2 text-sm bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground`}
      />
    </div>
  </div>
);

export default AdminVerkoopDetailPage;

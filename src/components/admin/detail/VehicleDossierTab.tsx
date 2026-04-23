import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, ExternalLink, CheckCircle2, Circle } from "lucide-react";
import VehicleFotosTab from "@/components/admin/VehicleFotosTab";
import { toast } from "sonner";

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

const INKOOP_DOCS = [
  { type: "Inkoopverklaring", label: "Inkoopverklaring (particulier)" },
  { type: "Inkoopfactuur", label: "Inkoopfactuur (bedrijf)" },
];

const VehicleDossierTab = ({ vehicleId, merk, model, bouwjaar, kenteken }: VehicleDossierTabProps) => {
  const [docs, setDocs] = useState<{ id: string; type: string; naam: string; file_path: string }[]>([]);
  const [inkoopverklaringen, setInkoopverklaringen] = useState<{ id: string; pdf_path: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingTypeRef = useRef<string | null>(null);

  const fetchAll = async () => {
    const [docRes, ikvRes] = await Promise.all([
      supabase.from("vehicle_documents").select("id, type, naam, file_path").eq("vehicle_id", vehicleId),
      supabase.from("inkoopverklaringen").select("id, pdf_path").eq("vehicle_id", vehicleId),
    ]);
    setDocs(((docRes.data as any[]) || []).filter(d => !d.type?.startsWith("dossier-override-")));
    setInkoopverklaringen((ikvRes.data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [vehicleId]);

  const hasDocument = (type: string) => {
    if (type === "Inkoopverklaring" && inkoopverklaringen.length > 0) return true;
    return docs.some(d => d.type === type);
  };

  const getDocFilePath = (type: string) => {
    if (type === "Inkoopverklaring") {
      const ikv = inkoopverklaringen.find(i => i.pdf_path);
      if (ikv?.pdf_path) return { path: ikv.pdf_path, bucket: "inkoopverklaringen" };
    }
    const d = docs.find(d => d.type === type);
    return d ? { path: d.file_path, bucket: "vehicle-documents" } : null;
  };

  const handleOpenDocument = async (path: string, bucket: string) => {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
    if (error || !data?.signedUrl) { toast.error("Openen mislukt"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const triggerUpload = (type: string) => {
    pendingTypeRef.current = type;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const type = pendingTypeRef.current;
    if (!file || !type) return;
    setUploadingType(type);
    const ext = file.name.split(".").pop() || "pdf";
    const cleanKenteken = (kenteken || "GEEN").replace(/[-\s]/g, "");
    const docName = `${merk || "Onbekend"}-${model || "Onbekend"}-${bouwjaar || "0000"}-${cleanKenteken}-${type}.${ext}`;
    const path = `${vehicleId}/${Date.now()}-${docName}`;
    const { error: storageError } = await supabase.storage.from("vehicle-documents").upload(path, file);
    if (storageError) { toast.error("Upload mislukt"); setUploadingType(null); return; }
    const { error } = await supabase.from("vehicle_documents").insert({
      vehicle_id: vehicleId,
      naam: docName,
      type,
      file_path: path,
      file_size: file.size,
      mime_type: file.type,
    } as any);
    if (error) { toast.error("Opslaan mislukt"); }
    else {
      toast.success(`${type} geüpload`);
      await fetchAll();
    }
    setUploadingType(null);
    pendingTypeRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* Inkoopdossier */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Inkoopdossier</h3>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {INKOOP_DOCS.map(doc => {
            const present = hasDocument(doc.type);
            const fp = getDocFilePath(doc.type);
            const isUploading = uploadingType === doc.type;
            return (
              <div key={doc.type} className="flex items-center gap-2.5 px-4 py-3">
                {present ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                )}
                <span className={`text-sm flex-1 ${present ? "text-foreground" : "text-muted-foreground"}`}>{doc.label}</span>
                {present && fp ? (
                  <button
                    onClick={() => handleOpenDocument(fp.path, fp.bucket)}
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> Openen
                  </button>
                ) : (
                  <button
                    onClick={() => triggerUpload(doc.type)}
                    disabled={isUploading}
                    className="inline-flex items-center gap-1 text-[11px] text-foreground hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    {isUploading ? "Uploaden..." : "Uploaden"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Foto's */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Foto's</h3>
        <VehicleFotosTab vehicleId={vehicleId} />
      </div>

      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
    </div>
  );
};

export default VehicleDossierTab;

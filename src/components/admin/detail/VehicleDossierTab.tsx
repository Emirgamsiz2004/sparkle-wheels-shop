import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, Loader2, Eye } from "lucide-react";
import VehicleFotosTab from "@/components/admin/VehicleFotosTab";
import VehicleDocumentenTab from "@/components/admin/VehicleDocumentenTab";
import { toast } from "sonner";

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

const VehicleDossierTab = ({ vehicleId }: { vehicleId: string }) => {
  const [archiveDocs, setArchiveDocs] = useState<ArchiveDoc[]>([]);
  const [testDrives, setTestDrives] = useState<TestDrive[]>([]);
  const [aanbetalingen, setAanbetalingen] = useState<Aanbetaling[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [archRes, tdRes, abRes] = await Promise.all([
        supabase.from("document_archive").select("*").eq("vehicle_id", vehicleId).order("created_at", { ascending: false }),
        supabase.from("test_drives").select("*").eq("vehicle_id", vehicleId).order("start_tijd", { ascending: false }),
        supabase.from("aanbetalingen").select("*").eq("vehicle_id", vehicleId).order("datum", { ascending: false }),
      ]);
      setArchiveDocs((archRes.data as ArchiveDoc[]) || []);
      setTestDrives((tdRes.data as TestDrive[]) || []);
      setAanbetalingen((abRes.data as Aanbetaling[]) || []);
      setLoading(false);
    };
    fetch();
  }, [vehicleId]);

  const handleDownload = async (filePath: string | null, bucket: string | null) => {
    if (!filePath || !bucket) return;
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(filePath, 300);
    if (error || !data?.signedUrl) { toast.error("Download mislukt"); return; }
    window.open(data.signedUrl, "_blank");
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

  return (
    <div className="space-y-6">
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

export default VehicleDossierTab;

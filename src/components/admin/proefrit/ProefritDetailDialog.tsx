import { useState, useEffect } from "react";
import { TestDrive } from "@/hooks/useTestDrives";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Download, Mail, StopCircle, FileText, X, Trash2,
} from "lucide-react";
import EindProefritDialog from "./EindProefritDialog";
import { useTestDrives } from "@/hooks/useTestDrives";

interface Props {
  testDrive: TestDrive;
  open: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

interface PdfLog {
  id: string;
  actie: string;
  created_at: string;
  user_id: string;
}

const statusLabels: Record<string, string> = {
  wacht_op_klant: "Wacht op klant",
  actief: "Actief",
  afgesloten: "Afgesloten",
  onvolledig: "Onvolledig",
};

const statusDot: Record<string, string> = {
  wacht_op_klant: "bg-amber-400",
  actief: "bg-blue-400",
  afgesloten: "bg-emerald-400",
  onvolledig: "bg-red-400",
};

const ProefritDetailDialog = ({ testDrive: td, open, onClose, onDeleted }: Props) => {
  const { user } = useAuth();
  const { deleteTestDrive } = useTestDrives();
  const [pdfLogs, setPdfLogs] = useState<PdfLog[]>([]);
  const [showEnd, setShowEnd] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [mailing, setMailing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [rijbewijsFotoUrl, setRijbewijsFotoUrl] = useState<string | null>(null);
  const [fotoFullscreen, setFotoFullscreen] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase
      .from("proefrit_pdf_logs" as any)
      .select("*")
      .eq("test_drive_id", td.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setPdfLogs((data as any[]) || []));

    if (td.customer?.rijbewijs_foto_path) {
      const { data } = supabase.storage.from("test-drive-files").getPublicUrl(td.customer.rijbewijs_foto_path);
      setRijbewijsFotoUrl(data?.publicUrl || null);
    }
  }, [open, td.id, td.customer?.rijbewijs_foto_path]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-proefrit-pdf", {
        body: { testDriveId: td.id },
      });
      if (error) throw error;

      if (user) {
        await supabase.from("proefrit_pdf_logs" as any).insert({
          test_drive_id: td.id, user_id: user.id, actie: "download",
        } as any);
      }

      const htmlContent = atob(data.pdf);
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
      }
      toast.success("PDF geopend");

      const { data: logs } = await supabase
        .from("proefrit_pdf_logs" as any)
        .select("*")
        .eq("test_drive_id", td.id)
        .order("created_at", { ascending: false });
      setPdfLogs((logs as any[]) || []);
    } catch (err) {
      console.error(err);
      toast.error("Fout bij genereren PDF");
    }
    setDownloading(false);
  };

  const handleMailPdf = async () => {
    if (!td.customer?.email) {
      toast.error("Geen e-mailadres beschikbaar");
      return;
    }
    setMailing(true);
    try {
      const { error } = await supabase.functions.invoke("generate-proefrit-pdf", {
        body: { testDriveId: td.id, sendEmail: true },
      });
      if (error) throw error;

      if (user) {
        await supabase.from("proefrit_pdf_logs" as any).insert({
          test_drive_id: td.id, user_id: user.id, actie: "email",
        } as any);
      }

      toast.success(`PDF verzonden naar ${td.customer.email}`);
    } catch (err) {
      console.error(err);
      toast.error("Fout bij verzenden e-mail");
    }
    setMailing(false);
  };

  const hasEnded = td.status === "afgesloten" || td.status === "onvolledig";
  const geredenKm = td.km_na != null ? td.km_na - td.km_voor : null;
  const dot = statusDot[td.status] || statusDot.wacht_op_klant;
  const label = statusLabels[td.status] || td.status;

  return (
    <>
      <Dialog open={open && !showEnd} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-foreground">
                {td.voertuig_merk} {td.voertuig_model}
                {td.voertuig_kenteken && (
                  <span className="ml-2 text-xs font-mono text-muted-foreground uppercase">{td.voertuig_kenteken}</span>
                )}
              </h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Klantgegevens */}
            <section>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-3">Klantgegevens</p>
              {td.customer ? (
                <div className="space-y-1.5 text-sm">
                  <Row label="Naam" value={`${td.customer.voornaam} ${td.customer.achternaam}`} />
                  {td.customer.geboortedatum && (
                    <Row label="Geboortedatum" value={format(new Date(td.customer.geboortedatum), "d MMMM yyyy", { locale: nl })} />
                  )}
                  {td.customer.adres && <Row label="Adres" value={td.customer.adres} />}
                  {td.customer.rijbewijsnummer && <Row label="Rijbewijsnummer" value={td.customer.rijbewijsnummer} />}
                  <Row label="Rijbewijscategorie" value={td.customer.rijbewijscategorie || "B"} />
                  <Row label="E-mail" value={td.customer.email} />
                  <Row label="Telefoon" value={td.customer.telefoon} />

                  {rijbewijsFotoUrl && (
                    <div className="pt-2">
                      <button onClick={() => setFotoFullscreen(true)} className="block">
                        <img
                          src={rijbewijsFotoUrl}
                          alt="Rijbewijs"
                          className="w-28 h-auto rounded-md border border-border object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Klant heeft formulier nog niet ingevuld</p>
              )}
            </section>

            {/* Ritgegevens */}
            <section className="border-t border-border pt-5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-3">Ritgegevens</p>
              <div className="space-y-1.5 text-sm">
                <Row label="Voertuig" value={`${td.voertuig_merk} ${td.voertuig_model}`} />
                {td.voertuig_kenteken && <Row label="Kenteken" value={td.voertuig_kenteken.toUpperCase()} />}
                {td.voertuig_bouwjaar && <Row label="Bouwjaar" value={String(td.voertuig_bouwjaar)} />}
                <Row label="Starttijdstip" value={format(new Date(td.start_tijd), "d MMM yyyy, HH:mm:ss", { locale: nl })} />
                {td.eind_tijd && (
                  <Row label="Eindtijdstip" value={format(new Date(td.eind_tijd), "d MMM yyyy, HH:mm:ss", { locale: nl })} />
                )}
                <Row label="KM bij start" value={td.km_voor.toLocaleString("nl-NL")} />
                {td.km_na != null && <Row label="KM bij einde" value={td.km_na.toLocaleString("nl-NL")} />}
                {geredenKm != null && (
                  <Row label="Totaal gereden" value={`${geredenKm.toLocaleString("nl-NL")} km`} />
                )}
              </div>
            </section>

            {/* Opmerkingen */}
            {(td.opmerkingen_voor || td.opmerkingen_na) && (
              <section className="border-t border-border pt-5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-3">Opmerkingen</p>
                {td.opmerkingen_voor && (
                  <p className="text-sm"><span className="text-muted-foreground">Voor rit: </span>{td.opmerkingen_voor}</p>
                )}
                {td.opmerkingen_na && (
                  <p className="text-sm mt-1"><span className="text-muted-foreground">Na rit: </span>{td.opmerkingen_na}</p>
                )}
              </section>
            )}

            {/* Schade foto's */}
            {td.schade_fotos && td.schade_fotos.length > 0 && (
              <section className="border-t border-border pt-5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-3">Schadefoto's</p>
                <div className="flex gap-2 flex-wrap">
                  {td.schade_fotos.map((foto, i) => {
                    const { data } = supabase.storage.from("test-drive-files").getPublicUrl(foto);
                    return (
                      <img key={i} src={data?.publicUrl} alt={`Schade ${i + 1}`}
                        className="w-20 h-20 rounded-md border border-border object-cover" />
                    );
                  })}
                </div>
              </section>
            )}

            {/* Handtekening */}
            {td.handtekening_data && (
              <section className="border-t border-border pt-5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-3">Ondertekening</p>
                <div className="bg-white rounded-md border border-border p-3 inline-block">
                  <img src={td.handtekening_data} alt="Handtekening" className="max-h-20" />
                </div>
                {td.formulier_ingevuld_op && (
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    Ondertekend op {format(new Date(td.formulier_ingevuld_op), "d MMMM yyyy 'om' HH:mm:ss", { locale: nl })}
                    {td.ip_adres && ` vanaf IP ${td.ip_adres}`}.
                    {td.customer?.email && ` Kopie verzonden naar ${td.customer.email}.`}
                  </p>
                )}
              </section>
            )}

            {/* Acties */}
            <div className="border-t border-border pt-4 flex flex-wrap gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {downloading ? "Bezig..." : "PDF downloaden"}
              </button>

              {td.customer?.email && (
                <button
                  onClick={handleMailPdf}
                  disabled={mailing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {mailing ? "Bezig..." : "PDF mailen"}
                </button>
              )}

              {!hasEnded && (
                <button
                  onClick={() => setShowEnd(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  Beëindigen
                </button>
              )}

              <button
                onClick={async () => {
                  if (!confirm("Weet je zeker dat je deze proefrit wilt verwijderen?")) return;
                  setDeleting(true);
                  const ok = await deleteTestDrive(td.id);
                  setDeleting(false);
                  if (ok) { onDeleted?.(); onClose(); }
                }}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-500/30 text-red-400 rounded-md hover:bg-red-500/10 transition-colors disabled:opacity-50 ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? "Bezig..." : "Verwijderen"}
              </button>
            </div>

            {/* Email status */}
            {(td as any).email_verzonden_op && (
              <p className="text-[11px] text-muted-foreground">
                Bevestigingsmail verzonden op {format(new Date((td as any).email_verzonden_op), "d MMM yyyy, HH:mm", { locale: nl })}
              </p>
            )}

            {/* PDF log */}
            {pdfLogs.length > 0 && (
              <div className="border-t border-border pt-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> Activiteitenlog
                </p>
                <div className="space-y-0.5">
                  {pdfLogs.map((log) => (
                    <p key={log.id} className="text-[11px] text-muted-foreground/60">
                      {log.actie === "download" ? "PDF gedownload" : "PDF gemaild"} — {format(new Date(log.created_at), "d MMM yyyy, HH:mm", { locale: nl })}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rijbewijs fullscreen */}
      {fotoFullscreen && rijbewijsFotoUrl && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setFotoFullscreen(false)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={() => setFotoFullscreen(false)}>
            <X className="w-6 h-6" />
          </button>
          <img src={rijbewijsFotoUrl} alt="Rijbewijs" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}

      {showEnd && (
        <EindProefritDialog testDrive={td} open={showEnd} onClose={() => { setShowEnd(false); onClose(); }} />
      )}
    </>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span className="text-foreground text-right">{value}</span>
  </div>
);

export default ProefritDetailDialog;

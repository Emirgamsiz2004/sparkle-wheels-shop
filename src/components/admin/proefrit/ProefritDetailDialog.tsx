import { useState, useEffect } from "react";
import { TestDrive } from "@/hooks/useTestDrives";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  User, Car, Clock, CreditCard, MapPin, Download, Mail, StopCircle, FileText, Image as ImageIcon, X,
} from "lucide-react";
import EindProefritDialog from "./EindProefritDialog";

interface Props {
  testDrive: TestDrive;
  open: boolean;
  onClose: () => void;
}

interface PdfLog {
  id: string;
  actie: string;
  created_at: string;
  user_id: string;
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  wacht_op_klant: { bg: "bg-amber-500", text: "text-white", label: "Wacht op klant" },
  actief: { bg: "bg-blue-500", text: "text-white", label: "Actief" },
  afgesloten: { bg: "bg-emerald-500", text: "text-white", label: "Afgesloten — Compleet" },
  onvolledig: { bg: "bg-red-500", text: "text-white", label: "Afgesloten — Onvolledig" },
};

const ProefritDetailDialog = ({ testDrive: td, open, onClose }: Props) => {
  const { user } = useAuth();
  const [pdfLogs, setPdfLogs] = useState<PdfLog[]>([]);
  const [showEnd, setShowEnd] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [mailing, setMailing] = useState(false);
  const [rijbewijsFotoUrl, setRijbewijsFotoUrl] = useState<string | null>(null);
  const [fotoFullscreen, setFotoFullscreen] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Fetch PDF logs
    supabase
      .from("proefrit_pdf_logs" as any)
      .select("*")
      .eq("test_drive_id", td.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setPdfLogs((data as any[]) || []));

    // Get rijbewijs foto URL
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

      // Log the download
      if (user) {
        await supabase.from("proefrit_pdf_logs" as any).insert({
          test_drive_id: td.id,
          user_id: user.id,
          actie: "download",
        } as any);
      }

      // The edge function returns HTML as base64 - open in print window
      const htmlContent = atob(data.pdf);
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
      }
      toast.success("PDF geopend voor afdrukken/downloaden");

      // Refresh logs
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
          test_drive_id: td.id,
          user_id: user.id,
          actie: "email",
        } as any);
      }

      toast.success(`PDF verzonden naar ${td.customer.email}`);
    } catch (err) {
      console.error(err);
      toast.error("Fout bij verzenden e-mail");
    }
    setMailing(false);
  };

  const status = statusStyles[td.status] || statusStyles.wacht_op_klant;
  const hasEnded = td.status === "afgesloten" || td.status === "onvolledig";
  const geredenKm = td.km_na != null ? td.km_na - td.km_voor : null;

  return (
    <>
      <Dialog open={open && !showEnd} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          {/* Status bar */}
          <div className={`${status.bg} ${status.text} px-5 py-2.5 text-sm font-medium rounded-t-lg`}>
            {status.label}
          </div>

          <div className="p-5 space-y-6">
            {/* Two columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Klantgegevens */}
              <div className="space-y-4">
                <SectionHeader icon={User} title="Klantgegevens" />
                {td.customer ? (
                  <div className="space-y-2 text-sm">
                    <Row label="Naam" value={`${td.customer.voornaam} ${td.customer.achternaam}`} />
                    {td.customer.geboortedatum && (
                      <Row label="Geboortedatum" value={format(new Date(td.customer.geboortedatum), "d MMMM yyyy", { locale: nl })} />
                    )}
                    {td.customer.adres && <Row label="Adres" value={td.customer.adres} />}
                    {td.customer.rijbewijsnummer && <Row label="Rijbewijsnummer" value={td.customer.rijbewijsnummer} />}
                    <Row label="Rijbewijscategorie" value={td.customer.rijbewijscategorie || "B"} />
                    <Row label="E-mail" value={td.customer.email} />
                    <Row label="Telefoon" value={td.customer.telefoon} />

                    {/* Rijbewijs foto */}
                    {rijbewijsFotoUrl && (
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground mb-1.5">Rijbewijs foto</p>
                        <button onClick={() => setFotoFullscreen(true)} className="block">
                          <img
                            src={rijbewijsFotoUrl}
                            alt="Rijbewijs"
                            className="w-32 h-auto rounded-md border border-border object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Klant heeft formulier nog niet ingevuld</p>
                )}
              </div>

              {/* Right: Ritgegevens */}
              <div className="space-y-4">
                <SectionHeader icon={Car} title="Ritgegevens" />
                <div className="space-y-2 text-sm">
                  <Row label="Voertuig" value={`${td.voertuig_merk} ${td.voertuig_model}`} />
                  {td.voertuig_kenteken && <Row label="Kenteken" value={td.voertuig_kenteken.toUpperCase()} />}
                  {td.voertuig_bouwjaar && <Row label="Bouwjaar" value={String(td.voertuig_bouwjaar)} />}

                  <div className="pt-2 border-t border-border" />
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

                {/* Opmerkingen */}
                {(td.opmerkingen_voor || td.opmerkingen_na) && (
                  <div className="space-y-2 pt-2">
                    <SectionHeader icon={MapPin} title="Opmerkingen" />
                    {td.opmerkingen_voor && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Voor rit: </span>
                        <span className="text-foreground">{td.opmerkingen_voor}</span>
                      </div>
                    )}
                    {td.opmerkingen_na && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Na rit: </span>
                        <span className="text-foreground">{td.opmerkingen_na}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Schade foto's */}
                {td.schade_fotos && td.schade_fotos.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" /> Schadefoto's
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {td.schade_fotos.map((foto, i) => {
                        const { data } = supabase.storage.from("test-drive-files").getPublicUrl(foto);
                        return (
                          <img
                            key={i}
                            src={data?.publicUrl}
                            alt={`Schade ${i + 1}`}
                            className="w-20 h-20 rounded-md border border-border object-cover"
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Handtekening */}
            {td.handtekening_data && (
              <div className="border-t border-border pt-4">
                <SectionHeader icon={CreditCard} title="Digitale handtekening" />
                <div className="mt-2 bg-white rounded-lg border border-border p-3 inline-block">
                  <img src={td.handtekening_data} alt="Handtekening" className="max-h-24" />
                </div>
                {td.formulier_ingevuld_op && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Digitaal ondertekend op {format(new Date(td.formulier_ingevuld_op), "d MMMM yyyy 'om' HH:mm:ss", { locale: nl })}
                    {td.ip_adres && ` vanaf IP-adres ${td.ip_adres}`}.
                    {td.customer?.email && ` De ondertekenaar heeft automatisch een kopie ontvangen op ${td.customer.email}.`}
                  </p>
                )}
              </div>
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent/20 transition-colors text-foreground disabled:opacity-50"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {mailing ? "Bezig..." : "PDF opnieuw mailen"}
                </button>
              )}

              {!hasEnded && (
                <button
                  onClick={() => setShowEnd(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-amber-500/30 text-amber-400 rounded-md hover:bg-amber-500/10 transition-colors"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  Proefrit beëindigen
                </button>
              )}
            </div>

            {/* Email status */}
            {(td as any).email_verzonden_op && (
              <div className="text-xs text-muted-foreground">
                Bevestigingsmail verzonden op {format(new Date((td as any).email_verzonden_op), "d MMM yyyy, HH:mm", { locale: nl })}
              </div>
            )}

            {/* PDF download log */}
            {pdfLogs.length > 0 && (
              <div className="border-t border-border pt-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> PDF activiteitenlog
                </p>
                <div className="space-y-1">
                  {pdfLogs.map((log) => (
                    <div key={log.id} className="text-[11px] text-muted-foreground/70">
                      {log.actie === "download" ? "PDF gedownload" : "PDF gemaild"} op{" "}
                      {format(new Date(log.created_at), "d MMM yyyy, HH:mm", { locale: nl })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rijbewijs foto fullscreen */}
      {fotoFullscreen && rijbewijsFotoUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setFotoFullscreen(false)}
        >
          <button className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={() => setFotoFullscreen(false)}>
            <X className="w-6 h-6" />
          </button>
          <img src={rijbewijsFotoUrl} alt="Rijbewijs" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}

      {/* Eind dialog */}
      {showEnd && (
        <EindProefritDialog
          testDrive={td}
          open={showEnd}
          onClose={() => {
            setShowEnd(false);
            onClose();
          }}
        />
      )}
    </>
  );
};

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-1.5">
    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span className="text-foreground text-right">{value}</span>
  </div>
);

export default ProefritDetailDialog;

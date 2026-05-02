import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { Vehicle, formatEuroDecimal } from "@/types/vehicle";
import { useMoneybird } from "@/hooks/useMoneybird";
import { toast } from "sonner";
import { Loader2, Wallet, X, Download, CheckCircle2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import AanbetalingMoneybirdDialog from "./AanbetalingMoneybirdDialog";
import { generateAanbetalingsbewijsPdf } from "@/lib/aanbetalingsbewijsPdf";

interface Props {
  vehicle: Vehicle;
  onChange?: () => void;
}

interface Aanbetaling {
  id: string;
  aanbetalingsbedrag: number;
  verkoopprijs: number | null;
  restbedrag: number | null;
  status: string;
  moneybird_invoice_id: string | null;
  klant_email: string | null;
  klant_voornaam: string | null;
  klant_achternaam: string | null;
  voertuig_merk: string | null;
  voertuig_model: string | null;
  voertuig_bouwjaar: number | null;
  voertuig_kenteken: string | null;
  bewijs_pdf_path: string | null;
  betaald_op: string | null;
}

const btnCls =
  "inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border border-border rounded-md hover:bg-accent hover:border-accent transition-colors active:scale-[0.97] text-foreground min-h-[36px]";

const AanbetalingControl = ({ vehicle, onChange }: Props) => {
  const { invoke } = useMoneybird();
  const [open, setOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmReceived, setConfirmReceived] = useState(false);
  const [cancelMode, setCancelMode] = useState<"refund" | "no_refund" | null>(null);
  const [active, setActive] = useState<Aanbetaling | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("aanbetalingen")
      .select("id, aanbetalingsbedrag, verkoopprijs, restbedrag, status, moneybird_invoice_id, klant_email, klant_voornaam, klant_achternaam, voertuig_merk, voertuig_model, voertuig_bouwjaar, voertuig_kenteken, bewijs_pdf_path, betaald_op")
      .eq("vehicle_id", vehicle.id)
      .in("status", ["open", "betaald"])
      .eq("bron", "moneybird")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setActive((data as any) || null);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle.id]);

  const allowed = !["verkocht", "gereserveerd"].includes(vehicle.status);

  const handleCancel = async (mode: "refund" | "no_refund") => {
    if (!active) return;
    setBusy(true);
    try {
      const isRefund = mode === "refund";
      // Alleen creditnota maken bij terugbetaling
      if (isRefund && active.moneybird_invoice_id) {
        await invoke("credit_aanbetaling_invoice", { invoice_id: active.moneybird_invoice_id });
      }
      await supabase.from("aanbetalingen").update({
        status: isRefund ? "geannuleerd_terugbetaald" : "geannuleerd_geen_terugbetaling",
        geannuleerd_op: new Date().toISOString(),
      } as any).eq("id", active.id);
      await supabase.from("vehicles").update({
        heeft_aanbetaling: false,
        aanbetalingsbedrag: 0,
      } as any).eq("id", vehicle.id);
      await supabase.from("vehicle_activity_log").insert({
        vehicle_id: vehicle.id,
        actie_type: "aanbetaling_geannuleerd",
        beschrijving: isRefund
          ? `Aanbetaling €${Number(active.aanbetalingsbedrag).toFixed(0)} geannuleerd MET terugbetaling, creditnota verstuurd`
          : `Aanbetaling €${Number(active.aanbetalingsbedrag).toFixed(0)} geannuleerd ZONDER terugbetaling (annulering door klant)`,
      } as any);
      toast.success(
        isRefund
          ? "Aanbetaling geannuleerd en creditnota verstuurd"
          : "Aanbetaling geannuleerd zonder terugbetaling"
      );
      setActive(null);
      setConfirmCancel(false);
      setCancelMode(null);
      onChange?.();
    } catch (e: any) {
      toast.error(e.message || "Annuleren mislukt");
    }
    setBusy(false);
  };

  const handleMarkReceived = async () => {
    if (!active) return;
    setBusy(true);
    try {
      const klantNaam = `${active.klant_voornaam || ""} ${active.klant_achternaam || ""}`.trim() || "Klant";
      const today = new Date().toISOString().slice(0, 10);
      const verkoopprijs = Number(active.verkoopprijs || vehicle.verkoopprijs || 0);
      const aanbetaling = Number(active.aanbetalingsbedrag || 0);
      const restbedrag = Number(active.restbedrag ?? Math.max(0, verkoopprijs - aanbetaling));

      // 1) Genereer PDF
      const doc = generateAanbetalingsbewijsPdf({
        voertuig: {
          merk: active.voertuig_merk || vehicle.merk,
          model: active.voertuig_model || vehicle.model,
          bouwjaar: active.voertuig_bouwjaar || vehicle.bouwjaar,
          kenteken: active.voertuig_kenteken || vehicle.kenteken,
        },
        klantNaam,
        aanbetalingsbedrag: aanbetaling,
        verkoopprijs,
        restbedrag,
        datum: today,
      });
      const pdfBlob = doc.output("blob");

      // 2) Upload naar storage
      const safeKenteken = (active.voertuig_kenteken || vehicle.kenteken || "voertuig").replace(/[^A-Za-z0-9-]/g, "");
      const path = `aanbetalingen/${vehicle.id}/Aanbetalingsbewijs_${safeKenteken}_${active.id.slice(0, 8)}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("vehicle-documents")
        .upload(path, pdfBlob, { contentType: "application/pdf", upsert: true });
      if (upErr) throw new Error(`Upload mislukt: ${upErr.message}`);

      // 3) Signed URL voor in mail (7 dagen)
      const { data: signed } = await supabase.storage
        .from("vehicle-documents")
        .createSignedUrl(path, 60 * 60 * 24 * 7);

      // 4) Update DB
      await supabase.from("aanbetalingen").update({
        status: "betaald",
        betaald_op: new Date().toISOString(),
        bewijs_pdf_path: path,
      } as any).eq("id", active.id);

      // 5) Mail naar klant
      if (active.klant_email && signed?.signedUrl) {
        try {
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "aanbetalingsbewijs",
              recipientEmail: active.klant_email,
              idempotencyKey: `aanbetalingsbewijs-${active.id}`,
              templateData: {
                klantNaam,
                voertuig: `${active.voertuig_merk || vehicle.merk} ${active.voertuig_model || vehicle.model} ${active.voertuig_bouwjaar || vehicle.bouwjaar || ""}`.trim(),
                kenteken: active.voertuig_kenteken || vehicle.kenteken,
                bedrag: formatEuroDecimal(aanbetaling),
                datum: new Date().toLocaleDateString("nl-NL"),
                pdfUrl: signed.signedUrl,
              },
            },
          });
        } catch (mailErr) {
          console.error("Mail mislukt:", mailErr);
          toast.warning("Aanbetalingsbewijs opgeslagen, maar mailen mislukt");
        }
      }

      // 6) Activity log
      await supabase.from("vehicle_activity_log").insert({
        vehicle_id: vehicle.id,
        actie_type: "aanbetaling_ontvangen",
        beschrijving: `Aanbetaling €${aanbetaling.toFixed(0)} bevestigd ontvangen, bewijs verstuurd naar ${active.klant_email || "klant"}`,
      } as any);

      toast.success(`Aanbetaling bevestigd en bewijs verstuurd${active.klant_email ? ` naar ${active.klant_email}` : ""}`);
      setConfirmReceived(false);
      await load();
      onChange?.();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Bevestigen mislukt");
    }
    setBusy(false);
  };

  const handleDownloadFactuur = async () => {
    if (!active?.moneybird_invoice_id) {
      toast.error("Geen Moneybird factuur gekoppeld");
      return;
    }
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Niet ingelogd");
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moneybird`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            action: "download_invoice_pdf_blob",
            invoice_id: active.moneybird_invoice_id,
            kenteken: vehicle.kenteken,
            datum: new Date().toISOString().slice(0, 10),
          }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Aanbetalingsfactuur_${vehicle.kenteken || vehicle.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e.message || "Downloaden mislukt");
    }
    setBusy(false);
  };

  const handleDownloadBewijs = async () => {
    if (!active?.bewijs_pdf_path) {
      toast.error("Geen aanbetalingsbewijs beschikbaar");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.storage
        .from("vehicle-documents")
        .createSignedUrl(active.bewijs_pdf_path, 60);
      if (error || !data) throw new Error(error?.message || "Geen URL");
      window.open(data.signedUrl, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Openen mislukt");
    }
    setBusy(false);
  };

  if (!allowed && !active) return null;

  if (active) {
    const isBetaald = active.status === "betaald";
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={btnCls + " !border-emerald-500/30 !text-emerald-400 hover:!bg-emerald-500/10"}
            >
              <Wallet className="w-3.5 h-3.5" />
              Aanbetaling {isBetaald ? "ontvangen" : "open"} — {formatEuroDecimal(active.aanbetalingsbedrag)}
              <ChevronDown className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="p-1.5 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
            {!isBetaald && (
              <DropdownMenuItem onClick={() => setConfirmReceived(true)} className="flex items-center gap-2.5 text-emerald-400 focus:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Markeer als ontvangen
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleDownloadFactuur} disabled={busy} className="flex items-center gap-2.5">
              <Download className="w-3.5 h-3.5" /> Download factuur
            </DropdownMenuItem>
            {isBetaald && active.bewijs_pdf_path && (
              <DropdownMenuItem onClick={handleDownloadBewijs} disabled={busy} className="flex items-center gap-2.5">
                <Download className="w-3.5 h-3.5" /> Download aanbetalingsbewijs
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setConfirmCancel(true)} className="flex items-center gap-2.5 text-rose-400 focus:text-rose-400">
              <X className="w-3.5 h-3.5" /> Annuleren
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {confirmReceived && createPortal(
          <div className="admin-theme fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4" onClick={() => !busy && setConfirmReceived(false)}>
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-medium text-foreground">Aanbetaling als ontvangen markeren?</h3>
              <p className="text-sm text-muted-foreground">
                Dit bevestigt dat de aanbetaling van <strong className="text-foreground">{formatEuroDecimal(active.aanbetalingsbedrag)}</strong> is ontvangen.
                Er wordt automatisch een aanbetalingsbewijs gegenereerd en per e-mail verstuurd naar{" "}
                <strong className="text-foreground">{active.klant_email || "de klant"}</strong>.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setConfirmReceived(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded-xl">
                  Terug
                </button>
                <button
                  onClick={handleMarkReceived}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-emerald-500/30 text-emerald-400 rounded-xl hover:bg-emerald-500/10 disabled:opacity-50"
                >
                  {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Bevestig & verstuur bewijs
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {confirmCancel && createPortal(
          <div className="admin-theme fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4" onClick={() => !busy && (setConfirmCancel(false), setCancelMode(null))}>
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-medium text-foreground">Aanbetaling annuleren?</h3>
              <p className="text-sm text-muted-foreground">
                Aanbetaling van <strong className="text-foreground">{formatEuroDecimal(active.aanbetalingsbedrag)}</strong>.
                Kies hoe je deze wilt annuleren:
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => setCancelMode("refund")}
                  disabled={busy}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                    cancelMode === "refund"
                      ? "border-amber-500/50 bg-amber-500/10"
                      : "border-border hover:border-amber-500/30 hover:bg-amber-500/5"
                  }`}
                >
                  <div className="text-sm font-medium text-foreground">Annuleren mét terugbetaling</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Annulering vanuit ons. Creditnota wordt aangemaakt en verstuurd, klant krijgt aanbetaling terug.
                  </div>
                </button>

                <button
                  onClick={() => setCancelMode("no_refund")}
                  disabled={busy}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                    cancelMode === "no_refund"
                      ? "border-rose-500/50 bg-rose-500/10"
                      : "border-border hover:border-rose-500/30 hover:bg-rose-500/5"
                  }`}
                >
                  <div className="text-sm font-medium text-foreground">Annuleren zónder terugbetaling</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Annulering door klant. Aanbetaling wordt niet terugbetaald, geen creditnota.
                  </div>
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => { setConfirmCancel(false); setCancelMode(null); }}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded-xl"
                >
                  Terug
                </button>
                <button
                  onClick={() => cancelMode && handleCancel(cancelMode)}
                  disabled={busy || !cancelMode}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-rose-500/30 text-rose-400 rounded-xl hover:bg-rose-500/10 disabled:opacity-50"
                >
                  {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Bevestig annulering
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={btnCls}>
        <Wallet className="w-3.5 h-3.5" /> Aanbetaling registreren
      </button>
      <AanbetalingMoneybirdDialog
        open={open}
        onClose={() => setOpen(false)}
        vehicle={vehicle}
        onCreated={() => { load(); onChange?.(); }}
      />
    </>
  );
};

export default AanbetalingControl;

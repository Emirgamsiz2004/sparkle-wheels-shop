import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Vehicle, formatEuroDecimal } from "@/types/vehicle";
import { useMoneybird } from "@/hooks/useMoneybird";
import { toast } from "sonner";
import { Loader2, Wallet, X, Download } from "lucide-react";
import AanbetalingMoneybirdDialog from "./AanbetalingMoneybirdDialog";

interface Props {
  vehicle: Vehicle;
  onChange?: () => void;
}

interface Aanbetaling {
  id: string;
  aanbetalingsbedrag: number;
  status: string;
  moneybird_invoice_id: string | null;
  klant_email: string | null;
}

const btnCls =
  "inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border border-border rounded-md hover:bg-accent hover:border-accent transition-colors active:scale-[0.97] text-foreground min-h-[36px]";

const AanbetalingControl = ({ vehicle, onChange }: Props) => {
  const { invoke } = useMoneybird();
  const [open, setOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [active, setActive] = useState<Aanbetaling | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("aanbetalingen")
      .select("id, aanbetalingsbedrag, status, moneybird_invoice_id, klant_email")
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

  const handleCancel = async () => {
    if (!active) return;
    setBusy(true);
    try {
      if (active.moneybird_invoice_id) {
        await invoke("credit_aanbetaling_invoice", { invoice_id: active.moneybird_invoice_id });
      }
      await supabase.from("aanbetalingen").update({
        status: "geannuleerd",
        geannuleerd_op: new Date().toISOString(),
      } as any).eq("id", active.id);
      await supabase.from("vehicles").update({
        heeft_aanbetaling: false,
        aanbetalingsbedrag: 0,
      } as any).eq("id", vehicle.id);
      await supabase.from("vehicle_activity_log").insert({
        vehicle_id: vehicle.id,
        actie_type: "aanbetaling_geannuleerd",
        beschrijving: `Aanbetaling €${Number(active.aanbetalingsbedrag).toFixed(0)} geannuleerd, creditnota verstuurd`,
      } as any);
      toast.success("Aanbetaling geannuleerd en creditnota verstuurd");
      setActive(null);
      setConfirmCancel(false);
      onChange?.();
    } catch (e: any) {
      toast.error(e.message || "Annuleren mislukt");
    }
    setBusy(false);
  };

  const handleDownload = async () => {
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
      a.download = `Aanbetaling_${vehicle.kenteken || vehicle.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e.message || "Downloaden mislukt");
    }
    setBusy(false);
  };

  if (!allowed && !active) return null;

  if (active) {
    return (
      <>
        <span className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 min-h-[36px]">
          <Wallet className="w-3.5 h-3.5" />
          Aanbetaling {active.status === "betaald" ? "ontvangen" : "open"} — {formatEuroDecimal(active.aanbetalingsbedrag)}
        </span>
        <button onClick={handleDownload} disabled={busy} className={btnCls} title="Factuur downloaden">
          <Download className="w-3.5 h-3.5" /> Factuur
        </button>
        <button onClick={() => setConfirmCancel(true)} className={btnCls + " !border-rose-500/30 !text-rose-400"}>
          <X className="w-3.5 h-3.5" /> Aanbetaling annuleren
        </button>

        {confirmCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-background border border-border rounded-2xl max-w-sm w-full p-6 space-y-4">
              <h3 className="text-base font-medium">Aanbetaling annuleren?</h3>
              <p className="text-sm text-muted-foreground">
                Weet je zeker dat je de aanbetaling van {formatEuroDecimal(active.aanbetalingsbedrag)} wilt annuleren? Er wordt een creditnota aangemaakt in Moneybird en verstuurd naar de klant.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setConfirmCancel(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded-xl">
                  Terug
                </button>
                <button
                  onClick={handleCancel}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-rose-500/30 text-rose-400 rounded-xl hover:bg-rose-500/10 disabled:opacity-50"
                >
                  {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Bevestig annulering
                </button>
              </div>
            </div>
          </div>
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

import { useState } from "react";
import { Phone, Mail, Calendar, Check, X, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Appointment, typeLabels } from "@/hooks/useAppointments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  aanvragen: Appointment[];
  onUpdate: (id: string, patch: Partial<Appointment>) => Promise<any>;
  onDelete?: (id: string) => Promise<any>;
}

const TIMESLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

const OpenstaandeAanvragen = ({ aanvragen, onUpdate }: Props) => {
  const [bevestigingId, setBevestigingId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);

  if (aanvragen.length === 0) return null;

  const naamVan = (a: Appointment) =>
    `${a.aanvrager_voornaam || a.customer?.voornaam || ""} ${a.aanvrager_achternaam || a.customer?.achternaam || ""}`.trim() || "Onbekend";
  const emailVan = (a: Appointment) => a.aanvrager_email || a.customer?.email || "";
  const telefoonVan = (a: Appointment) => a.aanvrager_telefoon || a.customer?.telefoon || "";

  const bevestig = async (a: Appointment) => {
    if (!date || !time) { toast.error("Kies datum en tijd"); return; }
    setBusy(true);
    try {
      const [hh, mm] = time.split(":").map(Number);
      const dt = new Date(`${date}T00:00:00`);
      dt.setHours(hh, mm, 0, 0);
      const eind = new Date(dt); eind.setHours(eind.getHours() + 1);
      await onUpdate(a.id, {
        is_aanvraag: false,
        datum_tijd: dt.toISOString(),
        eind_datum_tijd: eind.toISOString(),
        status: "gepland",
      });
      const datumStr = format(dt, "EEEE d MMMM yyyy", { locale: nl });
      const email = emailVan(a);
      if (email) {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "afspraak-bevestiging",
            recipientEmail: email,
            idempotencyKey: `aanvraag-bevestigd-${a.id}`,
            templateData: {
              naam: a.aanvrager_voornaam || a.customer?.voornaam,
              type: typeLabels[a.type], datum: datumStr, tijdstip: time,
            },
          },
        });
      }
      toast.success("Aanvraag bevestigd en mail verstuurd");
      setBevestigingId(null); setDate(""); setTime("");
    } catch (e: any) {
      toast.error(e.message || "Mislukt");
    } finally {
      setBusy(false);
    }
  };

  const wijsAf = async (a: Appointment) => {
    if (!confirm("Aanvraag afwijzen en mail versturen?")) return;
    setBusy(true);
    try {
      await onUpdate(a.id, { status: "geannuleerd" });
      const email = emailVan(a);
      if (email) {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "afspraak-afwijzing",
            recipientEmail: email,
            idempotencyKey: `aanvraag-afgewezen-${a.id}`,
            templateData: { naam: a.aanvrager_voornaam || a.customer?.voornaam },
          },
        });
      }
      toast.success("Afwijzingsmail verstuurd");
    } catch (e: any) {
      toast.error(e.message || "Mislukt");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-md p-3 sm:p-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-orange-400" />
        Openstaande aanvragen ({aanvragen.length})
      </h3>
      <div className="space-y-2">
        {aanvragen.map((a) => (
          <div key={a.id} className="bg-muted/40 rounded-md p-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{naamVan(a)}</span>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30">
                    {typeLabels[a.type]}
                  </span>
                </div>
                {a.aanvraag_omschrijving && (
                  <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{a.aanvraag_omschrijving}</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                  {telefoonVan(a) && (
                    <a href={`tel:${telefoonVan(a)}`} className="inline-flex items-center gap-1 hover:text-foreground">
                      <Phone className="w-3 h-3" /> {telefoonVan(a)}
                    </a>
                  )}
                  {emailVan(a) && (
                    <a href={`mailto:${emailVan(a)}`} className="inline-flex items-center gap-1 hover:text-foreground">
                      <Mail className="w-3 h-3" /> {emailVan(a)}
                    </a>
                  )}
                  {a.voorkeursdatum && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Voorkeur: {format(new Date(a.voorkeursdatum), "d MMM yyyy", { locale: nl })}
                    </span>
                  )}
                  {a.aanvrager_kenteken && <span>Kenteken: {a.aanvrager_kenteken}</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => { setBevestigingId(bevestigingId === a.id ? null : a.id); setDate(a.voorkeursdatum || ""); }}
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                >
                  <Check className="w-3 h-3" /> Bevestigen
                </button>
                <button
                  onClick={() => wijsAf(a)}
                  disabled={busy}
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                >
                  <X className="w-3 h-3" /> Afwijzen
                </button>
              </div>
            </div>

            {bevestigingId === a.id && (
              <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Datum</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="bg-background border border-border rounded-md px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Tijd</label>
                  <select value={time} onChange={(e) => setTime(e.target.value)}
                    className="bg-background border border-border rounded-md px-3 py-1.5 text-sm">
                    <option value="">--:--</option>
                    {TIMESLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <button onClick={() => bevestig(a)} disabled={busy}
                  className="text-xs px-4 py-1.5 rounded-md bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50">
                  {busy ? "Bezig..." : "Inplannen & mail sturen"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OpenstaandeAanvragen;

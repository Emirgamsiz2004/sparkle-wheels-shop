// Helper voor het versturen van afspraakbevestigingsmails.
// Bouwt alle template-data, Google Calendar URL en .ics URL.
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const TYPE_LABELS: Record<string, string> = {
  bezichtiging: "Bezichtiging",
  proefrit: "Proefrit",
  ophalen: "Ophalen",
  aflevering: "Aflevering",
  onderhoud: "Onderhoud / reparatie",
  terugbelafspraak: "Terugbelafspraak",
  anders: "Afspraak",
};

const ADRES = "Cilinderweg 99, 2371DZ Roelofarendsveen";
const LOCATION_PARAM = "Cilinderweg+99+Roelofarendsveen";

const PROJECT_ID = (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID || "leykexzdvatuyitkxdxs";
const ICS_URL_BASE = `https://${PROJECT_ID}.supabase.co/functions/v1/appointment-ics`;

function pad(n: number) { return String(n).padStart(2, "0"); }
function fmtCal(d: Date) {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

export interface SendOpts {
  appointmentId: string;
  recipientEmail: string;
  voornaam?: string | null;
  type: string;
  datumTijd: string; // ISO
  eindDatumTijd?: string | null;
  duurMinuten?: number | null;
  voertuig?: { merk?: string; model?: string; kenteken?: string | null } | null;
  omschrijving?: string | null;
}

export async function sendAppointmentConfirmation(opts: SendOpts): Promise<boolean> {
  try {
    const start = new Date(opts.datumTijd);
    let end: Date;
    if (opts.eindDatumTijd) {
      end = new Date(opts.eindDatumTijd);
    } else {
      const minuten = opts.duurMinuten || 60;
      end = new Date(start.getTime() + minuten * 60 * 1000);
    }

    const datumStr = format(start, "EEEE d MMMM yyyy", { locale: nl });
    const tijdStr = format(start, "HH:mm");
    const eindStr = format(end, "HH:mm");
    const typeLabel = TYPE_LABELS[opts.type] || "Afspraak";

    const voertuigStr = opts.voertuig
      ? `${[opts.voertuig.merk, opts.voertuig.model].filter(Boolean).join(" ")}${opts.voertuig.kenteken ? ` (${opts.voertuig.kenteken})` : ""}`.trim()
      : "";

    // Google Calendar link
    const titel = `${typeLabel} — Platin Automotive`;
    const description = [opts.omschrijving, voertuigStr ? `Voertuig: ${voertuigStr}` : ""].filter(Boolean).join("\n");
    const googleCalendarUrl =
      `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(titel)}` +
      `&dates=${fmtCal(start)}/${fmtCal(end)}` +
      `&details=${encodeURIComponent(description)}` +
      `&location=${LOCATION_PARAM}`;

    // ICS download URL
    const icsUrl = `${ICS_URL_BASE}?id=${encodeURIComponent(opts.appointmentId)}`;

    // Custom template-overrides ophalen
    let onderwerpRegel: string | undefined;
    let aanhef: string | undefined;
    let introTekst: string | undefined;
    let slotTekst: string | undefined;
    let footerTekst: string | undefined;
    try {
      const { data: tpl } = await supabase
        .from("email_templates" as any)
        .select("subject, html_body")
        .eq("template_key", "afspraak_bevestiging")
        .maybeSingle();
      if (tpl) {
        const t = tpl as any;
        onderwerpRegel = t.subject || undefined;
        // html_body bevat een JSON met de tekstvelden
        try {
          const parsed = JSON.parse(t.html_body || "{}");
          aanhef = parsed.aanhef || undefined;
          introTekst = parsed.introTekst || undefined;
          slotTekst = parsed.slotTekst || undefined;
          footerTekst = parsed.footerTekst || undefined;
        } catch { /* legacy plain html — negeer */ }
      }
    } catch { /* tabel optioneel */ }

    const templateData: Record<string, any> = {
      appointmentId: opts.appointmentId,
      voornaam: opts.voornaam || "klant",
      type: typeLabel,
      datum: datumStr,
      tijd: tijdStr,
      eindtijd: eindStr,
      duurMinuten: opts.duurMinuten,
      voertuig: voertuigStr,
      kenteken: opts.voertuig?.kenteken || "",
      omschrijving: opts.omschrijving || "",
      locatie: ADRES,
      googleCalendarUrl,
      icsUrl,
      onderwerpRegel,
      aanhef,
      introTekst,
      slotTekst,
      footerTekst,
    };

    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "afspraak-bevestiging",
        recipientEmail: opts.recipientEmail,
        idempotencyKey: `afspraak-bevestig-${opts.appointmentId}-${Date.now()}`,
        templateData,
      },
    });

    if (error) {
      console.error("Bevestigingsmail kon niet verstuurd worden:", error);
      return false;
    }

    // Mark as sent
    await supabase
      .from("appointments")
      .update({
        bevestigingsmail_verstuurd: true,
        bevestigingsmail_verstuurd_op: new Date().toISOString(),
      } as any)
      .eq("id", opts.appointmentId);

    return true;
  } catch (e) {
    console.error("sendAppointmentConfirmation error:", e);
    return false;
  }
}

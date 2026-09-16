import { supabase } from "@/integrations/supabase/client";

export interface AutoRmLead {
  /** Volledige naam van de klant */
  name: string;
  email?: string | null;
  phone?: string | null;
  /** Soort aanvraag, bijv. "Consignatie", "Detailing", "Financiering" */
  subject: string;
  /** Voertuig of zoekopdracht, optioneel */
  vehicle?: string | null;
  /** Vrije tekst met alle details */
  message?: string | null;
}

/**
 * Stuurt een aanmelding door naar het AutoRM leadsysteem.
 * Best-effort: faalt stil zodat een klantformulier nooit blokkeert.
 */
export async function sendLeadToAutoRM(lead: AutoRmLead): Promise<void> {
  try {
    const name = (lead.name || "").trim();
    if (!name) return;
    await supabase.functions.invoke("forward-lead", {
      body: {
        name,
        email: lead.email?.trim() || "",
        phone: lead.phone?.trim() || "",
        subject: (lead.subject || "Website").trim(),
        vehicle: lead.vehicle?.trim() || "",
        message: lead.message?.trim() || "",
      },
    });
  } catch {
    // stil falen — de aanvraag zelf is al opgeslagen/verstuurd
  }
}

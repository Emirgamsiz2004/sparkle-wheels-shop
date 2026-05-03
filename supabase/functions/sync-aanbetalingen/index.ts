// Polls Moneybird every 15 min for outstanding aanbetaling invoices
// Also processes a single aanbetaling when the admin manually marks it as received.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MB_BASE = "https://moneybird.com/api/v2";

type Aanbetaling = {
  id: string;
  vehicle_id: string;
  status: string;
  moneybird_invoice_id: string | null;
  bewijs_pdf_path: string | null;
  betaald_op: string | null;
  aanbetalingsbedrag: number | string | null;
  verkoopprijs: number | string | null;
  restbedrag: number | string | null;
  voertuig_merk: string | null;
  voertuig_model: string | null;
  voertuig_bouwjaar: number | null;
  voertuig_kenteken: string | null;
  klant_voornaam: string | null;
  klant_achternaam: string | null;
  klant_email: string | null;
};

const money = (value: number) =>
  new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);

const emailMoney = (value: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(value || 0);

const formatDate = (date: Date) => date.toLocaleDateString("nl-NL", { timeZone: "Europe/Amsterdam" });

const safeText = (value?: string | null) => String(value || "-").replace(/[€]/g, "EUR").replace(/[—–]/g, "-");

async function generateProofPdf(a: Aanbetaling, paidAt: Date) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const width = page.getWidth();
  const height = page.getHeight();
  const margin = 48;
  const bedrag = Number(a.aanbetalingsbedrag || 0);
  const verkoopprijs = Number(a.verkoopprijs || 0);
  const restbedrag = Number(a.restbedrag ?? Math.max(0, verkoopprijs - bedrag));
  const voertuig = `${a.voertuig_merk || ""} ${a.voertuig_model || ""} ${a.voertuig_bouwjaar || ""}`.trim();
  const klantNaam = `${a.klant_voornaam || ""} ${a.klant_achternaam || ""}`.trim() || "Klant";

  page.drawRectangle({ x: 0, y: height - 116, width, height: 116, color: rgb(0.07, 0.07, 0.07) });
  page.drawText("PLATIN AUTOMOTIVE", { x: margin, y: height - 56, size: 18, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Cilinderweg 99 - 2371 DZ Roelofarendsveen - 06 8282 3050", { x: margin, y: height - 78, size: 8.5, font: regular, color: rgb(0.72, 0.72, 0.72) });
  page.drawText("AANBETALINGSBEWIJS", { x: width - 210, y: height - 56, size: 11, font: bold, color: rgb(1, 1, 1) });
  page.drawText(formatDate(paidAt), { x: width - 210, y: height - 76, size: 9, font: regular, color: rgb(0.72, 0.72, 0.72) });

  let y = height - 166;
  page.drawText("Aanbetaling ontvangen", { x: margin, y, size: 24, font: bold, color: rgb(0.07, 0.07, 0.07) });
  y -= 28;
  page.drawText("Hierbij bevestigen wij de ontvangst van uw aanbetaling voor het onderstaande voertuig.", { x: margin, y, size: 10.5, font: regular, color: rgb(0.34, 0.34, 0.34) });

  y -= 64;
  page.drawRectangle({ x: margin, y: y - 28, width: width - margin * 2, height: 72, color: rgb(0.96, 0.96, 0.96) });
  page.drawText("ONTVANGEN AANBETALING", { x: margin + 20, y: y + 18, size: 8.5, font: bold, color: rgb(0.42, 0.42, 0.42) });
  page.drawText(`EUR ${money(bedrag)}`, { x: margin + 20, y: y - 8, size: 24, font: bold, color: rgb(0.07, 0.07, 0.07) });
  page.drawText("BETAALD", { x: width - margin - 96, y: y + 12, size: 9, font: bold, color: rgb(0.08, 0.55, 0.24) });
  page.drawText(`Ontvangen op ${formatDate(paidAt)}`, { x: width - margin - 132, y: y - 8, size: 8.5, font: regular, color: rgb(0.42, 0.42, 0.42) });

  y -= 86;
  const drawLabelValue = (label: string, value: string, x: number, yy: number) => {
    page.drawText(label, { x, y: yy, size: 8.5, font: regular, color: rgb(0.42, 0.42, 0.42) });
    page.drawText(safeText(value), { x, y: yy - 15, size: 11, font: bold, color: rgb(0.07, 0.07, 0.07) });
  };

  page.drawText("Klant", { x: margin, y, size: 9, font: bold, color: rgb(0.42, 0.42, 0.42) });
  page.drawLine({ start: { x: margin, y: y - 10 }, end: { x: width - margin, y: y - 10 }, thickness: 0.5, color: rgb(0.88, 0.88, 0.88) });
  y -= 36;
  drawLabelValue("Naam", klantNaam, margin, y);
  drawLabelValue("E-mail", a.klant_email || "-", width / 2, y);

  y -= 72;
  page.drawText("Voertuig", { x: margin, y, size: 9, font: bold, color: rgb(0.42, 0.42, 0.42) });
  page.drawLine({ start: { x: margin, y: y - 10 }, end: { x: width - margin, y: y - 10 }, thickness: 0.5, color: rgb(0.88, 0.88, 0.88) });
  y -= 36;
  drawLabelValue("Merk / model", voertuig || "-", margin, y);
  drawLabelValue("Kenteken", a.voertuig_kenteken || "-", width / 2, y);

  y -= 76;
  page.drawText("Financieel overzicht", { x: margin, y, size: 9, font: bold, color: rgb(0.42, 0.42, 0.42) });
  page.drawLine({ start: { x: margin, y: y - 10 }, end: { x: width - margin, y: y - 10 }, thickness: 0.5, color: rgb(0.88, 0.88, 0.88) });
  y -= 36;
  drawLabelValue("Verkoopprijs", `EUR ${money(verkoopprijs)}`, margin, y);
  drawLabelValue("Aanbetaling", `EUR ${money(bedrag)}`, width / 2, y);
  y -= 50;
  drawLabelValue("Resterend bedrag", `EUR ${money(restbedrag)}`, margin, y);

  page.drawRectangle({ x: margin, y: 128, width: width - margin * 2, height: 54, borderColor: rgb(0.88, 0.88, 0.88), borderWidth: 1 });
  page.drawText("Bevestiging", { x: margin + 18, y: 160, size: 11, font: bold, color: rgb(0.07, 0.07, 0.07) });
  page.drawText("De aanbetaling is ontvangen en administratief verwerkt door Platin Automotive.", { x: margin + 18, y: 143, size: 9.5, font: regular, color: rgb(0.34, 0.34, 0.34) });

  page.drawText("Platin Automotive - info@platinautomotive.nl - www.platinautomotive.nl - KvK 99146193", { x: margin, y: 52, size: 8, font: regular, color: rgb(0.55, 0.55, 0.55) });

  return await pdf.save();
}

async function processAanbetaling(supabase: any, a: Aanbetaling, supabaseUrl: string) {
  const paidAt = a.betaald_op ? new Date(a.betaald_op) : new Date();
  let proofPath = a.bewijs_pdf_path;

  if (!proofPath) {
    const pdfBytes = await generateProofPdf(a, paidAt);
    const safeKenteken = (a.voertuig_kenteken || "voertuig").replace(/[^A-Za-z0-9-]/g, "");
    proofPath = `aanbetalingen/${a.vehicle_id}/Aanbetalingsbewijs_${safeKenteken}_${a.id.slice(0, 8)}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("vehicle-documents")
      .upload(proofPath, new Blob([pdfBytes], { type: "application/pdf" }), {
        contentType: "application/pdf",
        upsert: true,
      });
    if (uploadError) throw uploadError;
  }

  const { error: updateError } = await supabase
    .from("aanbetalingen")
    .update({ status: "betaald", betaald_op: paidAt.toISOString(), bewijs_pdf_path: proofPath })
    .eq("id", a.id);
  if (updateError) throw updateError;

  const { data: signed } = await supabase.storage
    .from("vehicle-documents")
    .createSignedUrl(proofPath, 60 * 60 * 24 * 7);

  let emailSent = false;
  let emailError: string | null = null;
  if (a.klant_email && signed?.signedUrl) {
    const klantNaam = `${a.klant_voornaam || ""} ${a.klant_achternaam || ""}`.trim() || "Klant";
    const voertuig = `${a.voertuig_merk || ""} ${a.voertuig_model || ""} ${a.voertuig_bouwjaar || ""}`.trim();
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(serviceKey ? { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey } : {}),
      },
      body: JSON.stringify({
        templateName: "aanbetalingsbewijs",
        recipientEmail: a.klant_email,
        idempotencyKey: `aanbetalingsbewijs-${a.id}`,
        templateData: {
          klantNaam,
          voertuig,
          kenteken: a.voertuig_kenteken || "",
          bedrag: emailMoney(Number(a.aanbetalingsbedrag || 0)),
          datum: formatDate(paidAt),
          pdfUrl: signed.signedUrl,
        },
      }),
    });
    if (!emailRes.ok) emailError = await emailRes.text();
    else emailSent = true;
  }

  if (a.status !== "betaald" || !a.bewijs_pdf_path) {
    await supabase.from("vehicle_activity_log").insert({
      vehicle_id: a.vehicle_id,
      actie_type: "aanbetaling_ontvangen",
      beschrijving: `Aanbetaling EUR ${money(Number(a.aanbetalingsbedrag || 0))} bevestigd ontvangen, aanbetalingsbewijs ${emailSent ? `verstuurd naar ${a.klant_email}` : "aangemaakt"}`,
    });
  }

  return { id: a.id, proofPath, emailSent, emailMissing: !a.klant_email, emailError };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const token = Deno.env.get("MONEYBIRD_API_TOKEN");
    const adminId = Deno.env.get("MONEYBIRD_ADMINISTRATION_ID");
    if (!token || !adminId) throw new Error("Moneybird credentials missing");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let body: any = {};
    try {
      body = req.method === "POST" ? await req.json() : {};
    } catch (_e) {
      body = {};
    }

    if (body?.action === "process_single" && body?.aanbetaling_id) {
      const { data: aanbetaling, error: singleError } = await supabase
        .from("aanbetalingen")
        .select("id, vehicle_id, status, moneybird_invoice_id, bewijs_pdf_path, betaald_op, aanbetalingsbedrag, verkoopprijs, restbedrag, voertuig_merk, voertuig_model, voertuig_bouwjaar, voertuig_kenteken, klant_voornaam, klant_achternaam, klant_email")
        .eq("id", body.aanbetaling_id)
        .maybeSingle();
      if (singleError) throw singleError;
      if (!aanbetaling) throw new Error("Aanbetaling niet gevonden");

      const result = await processAanbetaling(supabase, aanbetaling as Aanbetaling, supabaseUrl);
      return new Response(JSON.stringify({ ok: true, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: open, error } = await supabase
      .from("aanbetalingen")
      .select("id, vehicle_id, status, moneybird_invoice_id, bewijs_pdf_path, betaald_op, aanbetalingsbedrag, verkoopprijs, restbedrag, voertuig_merk, voertuig_model, voertuig_bouwjaar, voertuig_kenteken, klant_voornaam, klant_achternaam, klant_email")
      .or("status.eq.open,and(status.eq.betaald,bewijs_pdf_path.is.null)")
      .not("moneybird_invoice_id", "is", null);
    if (error) throw error;

    const updates: any[] = [];
    for (const a of (open || [])) {
      try {
        let isPaid = a.status === "betaald";
        if (!isPaid) {
          const r = await fetch(`${MB_BASE}/${adminId}/sales_invoices/${a.moneybird_invoice_id}.json`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!r.ok) continue;
          const inv = await r.json();
          isPaid = inv.state === "paid";
        }
        if (isPaid) {
          await processAanbetaling(supabase, a as Aanbetaling, supabaseUrl);

          // In-app notification for all admins
          const { data: admins } = await supabase
            .from("user_roles").select("user_id").eq("role", "admin");
          for (const u of (admins || [])) {
            await supabase.from("notifications").insert({
              user_id: u.user_id,
              type: "aanbetaling_ontvangen",
              title: `Aanbetaling van €${Number(a.aanbetalingsbedrag).toFixed(0)} ontvangen voor ${a.voertuig_merk || ""} ${a.voertuig_model || ""} ${a.voertuig_kenteken || ""}`.trim(),
              vehicle_id: a.vehicle_id,
              link: `/admin/voertuigen/${a.vehicle_id}`,
            });
          }
          updates.push(a.id);
        }
      } catch (e) {
        console.error("sync failed for", a.id, e);
      }
    }

    return new Response(JSON.stringify({ checked: open?.length || 0, paid: updates.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BEDRIJF = {
  naam: "Platin Automotive",
  adres: "Cilinderweg 99, 2371 DZ Roelofarendsveen",
  kvk: "94498083",
  telefoon: "06-12693825",
  email: "info@platinautomotive.nl",
};

const OVEREENKOMST_TEKST = `De onderstaande bestuurder verklaart hierbij het voertuig zoals omschreven in goede en onbeschadigde staat te hebben ontvangen voor een proefrit. De bestuurder verklaart in het bezit te zijn van een geldig rijbewijs voor de betreffende voertuigcategorie en verklaart nuchter te zijn en fysiek in staat om het voertuig te besturen.

De bestuurder is volledig aansprakelijk voor alle verkeersboetes, parkeerboetes en andere overtredingen begaan tijdens de proefrit. Bij schade aan het voertuig veroorzaakt door eigen schuld van de bestuurder is de bestuurder aansprakelijk voor het van toepassing zijnde eigen risico zoals vooraf medegedeeld door de garage.

De bestuurder gaat ermee akkoord dat de garage de persoonsgegevens zoals vermeld in dit formulier mag bewaren voor administratieve en juridische doeleinden conform de AVG wetgeving. De gegevens worden niet gedeeld met derden.

Deze overeenkomst is rechtsgeldig zonder fysieke handtekening op papier. De digitale handtekening in combinatie met het vastgelegde IP-adres, tijdstempel en de automatische bevestigingsmail naar het opgegeven e-mailadres vormen samen een juridisch bindend bewijs van ondertekening.`;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }) +
    " om " + d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

async function generateDocumentNummer(supabase: any, testDriveId: string): Promise<string> {
  // Check if already has a nummer
  const { data: td } = await supabase
    .from("test_drives")
    .select("document_nummer")
    .eq("id", testDriveId)
    .single();

  if (td?.document_nummer) return td.document_nummer;

  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("test_drives")
    .select("id", { count: "exact", head: true })
    .like("document_nummer", `PR-${year}-%`);

  const nummer = `PR-${year}-${String((count || 0) + 1).padStart(4, "0")}`;

  await supabase
    .from("test_drives")
    .update({ document_nummer: nummer })
    .eq("id", testDriveId);

  return nummer;
}

// Simple PDF builder using basic PDF spec
function buildPdfContent(sections: { type: string; text?: string; lines?: string[]; image?: string }[]): string {
  // We'll use a text-based approach - generate HTML and note that we need jsPDF or similar
  // For now, return structured HTML that the frontend can render to PDF
  let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #1a1a1a; margin: 0; padding: 40px; line-height: 1.5; }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.company-info { text-align: right; font-size: 10px; color: #555; }
.company-name { font-size: 14px; font-weight: 600; color: #1a1a1a; }
hr { border: none; border-top: 1px solid #ddd; margin: 15px 0; }
h1 { text-align: center; font-size: 18px; font-weight: 600; margin: 20px 0 5px; }
.doc-meta { text-align: right; font-size: 10px; color: #666; margin-bottom: 20px; }
.section-title { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #333; margin: 20px 0 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
.row { display: flex; justify-content: space-between; padding: 3px 0; }
.row-label { color: #666; }
.row-value { font-weight: 500; text-align: right; }
.agreement-text { font-size: 10px; color: #333; line-height: 1.6; text-align: justify; white-space: pre-wrap; background: #fafafa; padding: 12px; border-radius: 4px; }
.signature-box { border: 1px solid #ddd; border-radius: 4px; padding: 10px; display: inline-block; background: #fff; }
.signature-box img { max-height: 80px; }
.signature-meta { font-size: 9px; color: #888; margin-top: 8px; }
.footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; font-size: 9px; color: #999; text-align: center; }
.rijbewijs-foto { max-width: 120px; max-height: 80px; border-radius: 4px; border: 1px solid #ddd; }
</style></head><body>`;

  for (const s of sections) {
    html += s.text || "";
  }

  html += `</body></html>`;
  return html;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { testDriveId, sendEmail } = await req.json();

    // Fetch test drive with customer
    const { data: td, error: tdErr } = await supabase
      .from("test_drives")
      .select("*, test_drive_customers(*)")
      .eq("id", testDriveId)
      .single();

    if (tdErr || !td) {
      return new Response(JSON.stringify({ error: "Proefrit niet gevonden" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customer = td.test_drive_customers;
    const docNummer = await generateDocumentNummer(supabase, testDriveId);

    // Get rijbewijs foto URL if exists
    let rijbewijsFotoUrl = "";
    if (customer?.rijbewijs_foto_path) {
      const { data: urlData } = supabase.storage.from("test-drive-files").getPublicUrl(customer.rijbewijs_foto_path);
      rijbewijsFotoUrl = urlData?.publicUrl || "";
    }

    const geredenKm = td.km_na != null ? td.km_na - td.km_voor : null;
    const now = new Date().toISOString();

    // Build HTML PDF content
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
@page { size: A4; margin: 25mm 20mm; }
body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #1a1a1a; margin: 0; padding: 0; line-height: 1.5; }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
.logo-area { font-size: 16px; font-weight: 700; letter-spacing: 1px; }
.company-info { text-align: right; font-size: 9px; color: #555; line-height: 1.6; }
hr { border: none; border-top: 1px solid #ccc; margin: 12px 0; }
h1 { text-align: center; font-size: 16px; font-weight: 600; margin: 15px 0 5px; letter-spacing: 0.5px; }
.doc-meta { text-align: right; font-size: 9px; color: #666; margin-bottom: 15px; }
.section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #333; margin: 18px 0 6px; border-bottom: 1px solid #eee; padding-bottom: 3px; }
table.info { width: 100%; border-collapse: collapse; font-size: 10px; }
table.info td { padding: 2px 0; }
table.info td:first-child { color: #666; width: 40%; }
table.info td:last-child { font-weight: 500; }
.agreement-text { font-size: 9px; color: #333; line-height: 1.7; text-align: justify; white-space: pre-wrap; background: #f8f8f8; padding: 10px; border-radius: 3px; margin-top: 6px; }
.signature-box { border: 1px solid #ddd; border-radius: 3px; padding: 8px; display: inline-block; background: #fff; margin-top: 6px; }
.signature-box img { max-height: 60px; }
.sig-meta { font-size: 8px; color: #888; margin-top: 6px; line-height: 1.5; }
.footer { margin-top: 25px; border-top: 1px solid #ccc; padding-top: 8px; font-size: 8px; color: #999; text-align: center; line-height: 1.5; }
.two-col { display: flex; gap: 30px; }
.two-col > div { flex: 1; }
.rijbewijs-foto { max-width: 100px; max-height: 70px; border-radius: 3px; border: 1px solid #ddd; margin-top: 4px; }
</style></head><body>

<div class="header">
  <div class="logo-area">PLATIN AUTOMOTIVE</div>
  <div class="company-info">
    ${BEDRIJF.naam}<br>
    ${BEDRIJF.adres}<br>
    KVK: ${BEDRIJF.kvk}<br>
    Tel: ${BEDRIJF.telefoon}<br>
    ${BEDRIJF.email}
  </div>
</div>

<hr>

<h1>Proefrit Overeenkomst</h1>
<div class="doc-meta">
  Documentnummer: ${docNummer}<br>
  Datum: ${formatDate(td.created_at)}
</div>

<div class="section-title">1. Voertuiggegevens</div>
<table class="info">
  <tr><td>Merk / Model</td><td>${td.voertuig_merk} ${td.voertuig_model}</td></tr>
  ${td.voertuig_bouwjaar ? `<tr><td>Bouwjaar</td><td>${td.voertuig_bouwjaar}</td></tr>` : ""}
  ${td.voertuig_kenteken ? `<tr><td>Kenteken</td><td>${td.voertuig_kenteken.toUpperCase()}</td></tr>` : ""}
  <tr><td>Kilometerstand bij start</td><td>${td.km_voor.toLocaleString("nl-NL")}</td></tr>
</table>

<div class="section-title">2. Klantgegevens</div>
<div class="two-col">
  <div>
    <table class="info">
      <tr><td>Naam</td><td>${customer ? `${customer.voornaam} ${customer.achternaam}` : "—"}</td></tr>
      ${customer?.geboortedatum ? `<tr><td>Geboortedatum</td><td>${formatDate(customer.geboortedatum)}</td></tr>` : ""}
      ${customer?.adres ? `<tr><td>Adres</td><td>${customer.adres}</td></tr>` : ""}
      ${customer?.rijbewijsnummer ? `<tr><td>Rijbewijsnummer</td><td>${customer.rijbewijsnummer}</td></tr>` : ""}
      <tr><td>Rijbewijscategorie</td><td>${customer?.rijbewijscategorie || "B"}</td></tr>
      <tr><td>E-mail</td><td>${customer?.email || "—"}</td></tr>
      <tr><td>Telefoon</td><td>${customer?.telefoon || "—"}</td></tr>
    </table>
  </div>
  ${rijbewijsFotoUrl ? `<div style="text-align:right;"><img src="${rijbewijsFotoUrl}" class="rijbewijs-foto" alt="Rijbewijs"></div>` : "<div></div>"}
</div>

<div class="section-title">3. Proefrit details</div>
<table class="info">
  <tr><td>Starttijdstip</td><td>${formatDateTime(td.start_tijd)}</td></tr>
  ${td.eind_tijd ? `<tr><td>Eindtijdstip</td><td>${formatDateTime(td.eind_tijd)}</td></tr>` : ""}
  <tr><td>Kilometerstand voor</td><td>${td.km_voor.toLocaleString("nl-NL")}</td></tr>
  ${td.km_na != null ? `<tr><td>Kilometerstand na</td><td>${td.km_na.toLocaleString("nl-NL")}</td></tr>` : ""}
  ${geredenKm != null ? `<tr><td>Totaal gereden</td><td>${geredenKm.toLocaleString("nl-NL")} km</td></tr>` : ""}
</table>

<div class="section-title">4. Overeenkomst</div>
<div class="agreement-text">${OVEREENKOMST_TEKST}</div>

<div class="section-title">5. Ondertekening</div>
${td.handtekening_data ? `
<div class="signature-box">
  <img src="${td.handtekening_data}" alt="Handtekening">
</div>
<div class="sig-meta">
  ${customer ? `${customer.voornaam} ${customer.achternaam}` : ""}<br>
  ${td.formulier_ingevuld_op ? `Ondertekend op: ${formatDateTime(td.formulier_ingevuld_op)}` : ""}<br>
  ${td.ip_adres ? `IP-adres: ${td.ip_adres}` : ""}<br>
  ${customer?.email ? `Automatische bevestiging verzonden naar ${customer.email}${td.email_verzonden_op ? ` op ${formatDateTime(td.email_verzonden_op)}` : ""}` : ""}
</div>
` : `<p style="color:#999;font-size:10px;">Nog niet ondertekend</p>`}

<div class="footer">
  Dit document is automatisch gegenereerd en gearchiveerd door ${BEDRIJF.naam}.<br>
  Documentnummer: ${docNummer}. Gegenereerd op: ${formatDateTime(now)}.
</div>

</body></html>`;

    // For now, we return the HTML as base64 - the frontend will handle printing/PDF
    // In production, you'd use a headless browser or PDF library
    const encoder = new TextEncoder();
    const pdfBase64 = btoa(String.fromCharCode(...encoder.encode(htmlContent)));

    // Store the HTML in storage for archiving
    const storagePath = `${testDriveId}/overeenkomst-${docNummer}.html`;
    await supabase.storage
      .from("test-drive-files")
      .upload(storagePath, encoder.encode(htmlContent), {
        contentType: "text/html",
        upsert: true,
      });

    // Update pdf_path
    const updateField = td.eind_tijd ? "pdf_definitief_path" : "pdf_path";
    await supabase.from("test_drives").update({ [updateField]: storagePath }).eq("id", testDriveId);

    // If sendEmail, record the timestamp
    if (sendEmail && customer?.email) {
      await supabase
        .from("test_drives")
        .update({ email_verzonden_op: new Date().toISOString() })
        .eq("id", testDriveId);
    }

    return new Response(JSON.stringify({ pdf: pdfBase64, html: true, docNummer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

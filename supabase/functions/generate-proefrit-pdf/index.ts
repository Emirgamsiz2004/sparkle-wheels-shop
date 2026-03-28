import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { template as proefritTemplate } from "../_shared/transactional-email-templates/proefrit-overeenkomst.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BEDRIJF = {
  naam: "Platin Automotive",
  adres: "Cilinderweg 99 · 2371 DZ Roelofarendsveen",
  kvk: "99146193",
  telefoon: "06-12693825",
  email: "info@platinautomotive.nl",
  website: "platinautomotive.nl",
};

const OVEREENKOMST_TEKST = `De onderstaande bestuurder verklaart het voertuig in goede en onbeschadigde staat te hebben ontvangen voor een proefrit. De bestuurder verklaart in het bezit te zijn van een geldig rijbewijs voor de betreffende voertuigcategorie, nuchter te zijn en fysiek in staat om het voertuig te besturen.

De bestuurder is volledig aansprakelijk voor alle verkeersboetes en overtredingen begaan tijdens de proefrit. Bij schade door eigen schuld is de bestuurder aansprakelijk voor het van toepassing zijnde eigen risico. Persoonsgegevens worden bewaard conform de AVG en niet gedeeld met derden.`;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function formatDateTime(dateStr: string): string {
  return `${formatShortDate(dateStr)} ${formatTime(dateStr)}`;
}

async function generateDocumentNummer(supabase: any, testDriveId: string): Promise<string> {
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

function nl(n: number): string {
  return n.toLocaleString("nl-NL");
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

    let rijbewijsFotoUrl = "";
    if (customer?.rijbewijs_foto_path) {
      const { data: urlData } = supabase.storage.from("test-drive-files").getPublicUrl(customer.rijbewijs_foto_path);
      rijbewijsFotoUrl = urlData?.publicUrl || "";
    }

    const geredenKm = td.km_na != null ? td.km_na - td.km_voor : null;
    const voertuigTitel = `${td.voertuig_merk || ''} ${td.voertuig_model || ''}`.trim();
    const kentekenDisplay = td.voertuig_kenteken ? td.voertuig_kenteken.toUpperCase() : '—';

    // Build HTML matching the uploaded PDF template exactly
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; color: #1a1a1a; margin: 0; padding: 0; line-height: 1.4; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; min-height: 297mm; padding: 0; margin: 0 auto; position: relative; }

/* Dark header */
.header { background: #333; color: #fff; padding: 28px 35px 20px; display: flex; justify-content: space-between; align-items: flex-start; }
.header-left h1 { font-size: 28px; font-weight: 700; margin: 0 0 4px; letter-spacing: 0.5px; }
.header-left .subtitle { font-size: 16px; font-weight: 300; font-style: italic; color: #ccc; margin: 0 0 12px; }
.header-left .vehicle-line { font-size: 10px; color: #bbb; margin: 0 0 2px; }
.header-left .date-line { font-size: 10px; color: #bbb; margin: 4px 0 0; }
.header-right { text-align: right; }
.header-right .logo-text { font-size: 26px; font-weight: 800; letter-spacing: 3px; color: #fff; }
.header-right .logo-sub { font-size: 8px; letter-spacing: 4px; color: #999; text-transform: uppercase; margin-top: -2px; }

/* Company bar */
.company-bar { font-size: 8px; color: #666; padding: 8px 35px; border-bottom: 1px solid #ddd; }

/* Content area */
.content { padding: 0 35px 20px; }

/* Section title */
.section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #1a1a1a; margin: 22px 0 0; padding-left: 8px; border-left: 3px solid #333; }

/* Data table */
.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
.data-table td { padding: 6px 10px; border: 1px solid #e0e0e0; vertical-align: top; }
.data-table .label { font-size: 8px; color: #888; display: block; margin-bottom: 2px; }
.data-table .value { font-size: 11px; font-weight: 500; color: #1a1a1a; display: block; min-height: 16px; }

/* Agreement text */
.agreement { font-size: 9px; color: #333; line-height: 1.7; text-align: justify; margin-top: 10px; }

/* Signature section */
.sig-grid { display: flex; gap: 30px; margin-top: 10px; }
.sig-box { flex: 1; border: 1px solid #e0e0e0; border-radius: 2px; padding: 10px; min-height: 90px; position: relative; }
.sig-box .sig-label { font-size: 8px; color: #888; margin-bottom: 4px; }
.sig-box img { max-height: 60px; }
.sig-line { border-top: 1px solid #999; margin-top: 10px; padding-top: 4px; font-size: 9px; color: #666; }

/* Footer */
.footer { position: absolute; bottom: 0; left: 0; right: 0; border-top: 1px solid #ccc; padding: 10px 35px; font-size: 8px; color: #999; text-align: center; }

.rijbewijs-foto { max-width: 90px; max-height: 65px; border-radius: 2px; border: 1px solid #ddd; margin-top: 4px; }

@media print {
  body { margin: 0; }
  .page { width: 100%; min-height: auto; }
}
</style></head><body>
<div class="page">

<!-- HEADER -->
<div class="header">
  <div class="header-left">
    <h1>Proefrit</h1>
    <div class="subtitle">Overeenkomst</div>
    <div class="vehicle-line">${voertuigTitel} · ${kentekenDisplay}${td.voertuig_bouwjaar ? ` · ${td.voertuig_bouwjaar}` : ''}</div>
    <div class="vehicle-line">Documentnummer: ${docNummer}</div>
    <div class="date-line">Datum: ${formatDate(td.created_at)}</div>
  </div>
  <div class="header-right">
    <div class="logo-text">PLATIN</div>
    <div class="logo-sub">AUTOMOTIVE</div>
  </div>
</div>

<!-- COMPANY BAR -->
<div class="company-bar">
  ${BEDRIJF.adres} · ${BEDRIJF.telefoon} · ${BEDRIJF.email} · ${BEDRIJF.website} · KvK ${BEDRIJF.kvk}
</div>

<div class="content">

<!-- 1. VOERTUIGGEGEVENS -->
<div class="section-title">1. VOERTUIGGEGEVENS</div>
<table class="data-table">
  <tr>
    <td style="width:33%"><span class="label">Merk</span><span class="value">${td.voertuig_merk || '—'}</span></td>
    <td style="width:34%"><span class="label">Model</span><span class="value">${td.voertuig_model || '—'}</span></td>
    <td style="width:33%"><span class="label">Bouwjaar</span><span class="value">${td.voertuig_bouwjaar || '—'}</span></td>
  </tr>
  <tr>
    <td><span class="label">Kenteken</span><span class="value">${kentekenDisplay}</span></td>
    <td><span class="label">Kilometerstand bij start</span><span class="value">${nl(td.km_voor)}</span></td>
    <td><span class="label">Kilometerstand bij einde</span><span class="value">${td.km_na != null ? nl(td.km_na) : ''}</span></td>
  </tr>
</table>

<!-- 2. KLANTGEGEVENS -->
<div class="section-title">2. KLANTGEGEVENS</div>
<table class="data-table">
  <tr>
    <td style="width:33%"><span class="label">Voornaam</span><span class="value">${customer?.voornaam || ''}</span></td>
    <td style="width:34%"><span class="label">Achternaam</span><span class="value">${customer?.achternaam || ''}</span></td>
    <td style="width:33%"><span class="label">Geboortedatum</span><span class="value">${customer?.geboortedatum ? formatShortDate(customer.geboortedatum) : ''}</span></td>
  </tr>
  <tr>
    <td><span class="label">Adres</span><span class="value">${customer?.adres || ''}</span></td>
    <td><span class="label">Postcode</span><span class="value">${customer?.postcode || ''}</span></td>
    <td><span class="label">Plaats</span><span class="value">${customer?.plaats || ''}</span></td>
  </tr>
  <tr>
    <td><span class="label">Telefoonnummer</span><span class="value">${customer?.telefoon || ''}</span></td>
    <td><span class="label">E-mailadres</span><span class="value">${customer?.email || ''}</span></td>
    <td><span class="label">Rijbewijscategorie</span><span class="value">${customer?.rijbewijscategorie || 'B'}</span></td>
  </tr>
  <tr>
    <td colspan="2"><span class="label">Rijbewijsnummer</span><span class="value">${customer?.rijbewijsnummer || ''}</span></td>
    <td>${customer?.rijbewijs_foto_path ? `<span class="label">Rijbewijs foto</span><img src="${rijbewijsFotoUrl}" class="rijbewijs-foto" alt="Rijbewijs">` : ''}</td>
  </tr>
</table>

<!-- 3. PROEFRIT DETAILS -->
<div class="section-title">3. PROEFRIT DETAILS</div>
<table class="data-table">
  <tr>
    <td style="width:33%"><span class="label">Datum</span><span class="value">${formatShortDate(td.start_tijd)}</span></td>
    <td style="width:34%"><span class="label">Starttijdstip</span><span class="value">${formatTime(td.start_tijd)}</span></td>
    <td style="width:33%"><span class="label">Eindtijdstip</span><span class="value">${td.eind_tijd ? formatTime(td.eind_tijd) : ''}</span></td>
  </tr>
  <tr>
    <td><span class="label">Totaal gereden (km)</span><span class="value">${geredenKm != null ? nl(geredenKm) : ''}</span></td>
    <td colspan="2"><span class="label">Begeleidende medewerker</span><span class="value">${td.begeleidende_medewerker || ''}</span></td>
  </tr>
</table>

<!-- 4. OVEREENKOMST -->
<div class="section-title">4. OVEREENKOMST</div>
<div class="agreement">${OVEREENKOMST_TEKST.replace(/\n\n/g, '<br><br>')}</div>

<!-- 5. ONDERTEKENING -->
<div class="section-title">5. ONDERTEKENING</div>
<div class="sig-grid">
  <div class="sig-box">
    <div class="sig-label">Handtekening klant</div>
    ${td.handtekening_data ? `<img src="${td.handtekening_data}" alt="Handtekening">` : ''}
    <div class="sig-line">Naam: ${customer ? `${customer.voornaam} ${customer.achternaam}` : '________________________________'}</div>
    <div class="sig-line" style="border-top:none;margin-top:2px;">Plaats: ${customer?.plaats || '________________________'}</div>
  </div>
  <div class="sig-box">
    <div class="sig-label">Datum & tijdstip ondertekening</div>
    <div style="margin-top:40px"></div>
    <div class="sig-line">Datum / tijd: ${td.formulier_ingevuld_op ? formatDateTime(td.formulier_ingevuld_op) : '________________________'}</div>
    <div class="sig-line" style="border-top:none;margin-top:2px;">Postcode: ${customer?.postcode || '________________________'}</div>
  </div>
</div>

${td.ip_adres ? `<div style="font-size:7px;color:#aaa;margin-top:8px;">Digitaal ondertekend op ${td.formulier_ingevuld_op ? formatDateTime(td.formulier_ingevuld_op) : '—'} · IP-adres: ${td.ip_adres} · Document: ${docNummer}</div>` : ''}
${td.opmerkingen_voor ? `<div style="font-size:8px;color:#666;margin-top:6px;"><strong>Opmerkingen klant:</strong> ${td.opmerkingen_voor}</div>` : ''}
${td.opmerkingen_na ? `<div style="font-size:8px;color:#666;margin-top:4px;"><strong>Opmerkingen na rit:</strong> ${td.opmerkingen_na}</div>` : ''}

</div><!-- /content -->

<!-- FOOTER -->
<div class="footer">
  ${BEDRIJF.naam} · ${BEDRIJF.adres} · KvK ${BEDRIJF.kvk} · ${BEDRIJF.website} | Documentnummer: ${docNummer} · ${formatDate(td.created_at)}
</div>

</div><!-- /page -->
</body></html>`;

    const encoder = new TextEncoder();
    const pdfBase64 = btoa(String.fromCharCode(...encoder.encode(htmlContent)));

    // Store in storage for archiving
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

    // Send email if requested
    if (sendEmail && customer?.email) {
      // Generate a signed URL for the stored HTML
      const { data: signedData } = await supabase.storage
        .from("test-drive-files")
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365); // 1 year

      const pdfUrl = signedData?.signedUrl || "";

      const templateData = {
        klantNaam: `${customer.voornaam} ${customer.achternaam}`,
        voertuig: voertuigTitel,
        kenteken: kentekenDisplay,
        datum: formatDate(td.created_at),
        documentNummer: docNummer,
        pdfUrl,
      };

      try {
        // Render the email template directly
        const html = await renderAsync(
          React.createElement(proefritTemplate.component, templateData)
        );
        const plainText = await renderAsync(
          React.createElement(proefritTemplate.component, templateData),
          { plainText: true }
        );

        const resolvedSubject = typeof proefritTemplate.subject === 'function'
          ? proefritTemplate.subject(templateData)
          : proefritTemplate.subject;

        const messageId = crypto.randomUUID();

        // Get or create unsubscribe token
        const normalizedEmail = customer.email.toLowerCase();
        let unsubscribeToken: string;
        const { data: existingToken } = await supabase
          .from('email_unsubscribe_tokens')
          .select('token')
          .eq('email', normalizedEmail)
          .maybeSingle();

        if (existingToken) {
          unsubscribeToken = existingToken.token;
        } else {
          const bytes = new Uint8Array(32);
          crypto.getRandomValues(bytes);
          unsubscribeToken = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
          await supabase.from('email_unsubscribe_tokens').upsert(
            { token: unsubscribeToken, email: normalizedEmail },
            { onConflict: 'email', ignoreDuplicates: true }
          );
          // Re-read in case of race
          const { data: storedToken } = await supabase
            .from('email_unsubscribe_tokens').select('token').eq('email', normalizedEmail).maybeSingle();
          if (storedToken) unsubscribeToken = storedToken.token;
        }

        // Log pending
        await supabase.from('email_send_log').insert({
          message_id: messageId,
          template_name: 'proefrit-overeenkomst',
          recipient_email: customer.email,
          status: 'pending',
        });

        // Enqueue directly to the email queue
        const { error: enqueueError } = await supabase.rpc('enqueue_email', {
          queue_name: 'transactional_emails',
          payload: {
            message_id: messageId,
            to: customer.email,
            from: `Platin Automotive <noreply@notify.platinautomotive.nl>`,
            sender_domain: 'notify.platinautomotive.nl',
            subject: resolvedSubject,
            html,
            text: plainText,
            purpose: 'transactional',
            label: 'proefrit-overeenkomst',
            idempotency_key: `proefrit-${testDriveId}-${Date.now()}`,
            unsubscribe_token: unsubscribeToken,
            queued_at: new Date().toISOString(),
          },
        });

        if (enqueueError) {
          console.error("Email enqueue error:", enqueueError);
        } else {
          console.log("Email enqueued for", customer.email);
          await supabase
            .from("test_drives")
            .update({ email_verzonden_op: new Date().toISOString() })
            .eq("id", testDriveId);
        }
      } catch (emailErr) {
        console.error("Email render/enqueue error:", emailErr);
      }
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

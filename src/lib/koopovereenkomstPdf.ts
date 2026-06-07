import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface KoopovereenkomstData {
  voertuig: {
    merk: string;
    model: string;
    bouwjaar: number;
    kenteken: string;
    kilometerstand: number;
    vin?: string;
    kleur?: string;
    brandstof?: string;
    uitvoering?: string;
    apkTot?: string;
    nap?: boolean;
    btwType?: string; // "Marge" | "BTW" | "Consignatie"
  };
  klant: {
    voornaam: string;
    achternaam: string;
    adres: string;
    postcode: string;
    woonplaats: string;
    telefoon: string;
    email?: string;
    geboortedatum?: string;
    bedrijfsnaam?: string;
    kvk?: string;
    isZakelijk?: boolean;
  };
  financieel: {
    verkoopprijs: number;
    afleverkosten?: number;
    leges?: number;
    betaalwijze: string;
    betalingen?: Array<{ methode: string; bedrag: number; maatschappij?: string }>;
    aanbetalingActief: boolean;
    aanbetalingsbedrag?: number;
    aanbetalingBetaalwijze?: string;
    restbedrag?: number;
  };
  inruil?: {
    kenteken: string;
    merk: string;
    model: string;
    km?: number;
    waarde: number;
  } | null;
  garantie: {
    type: string;
    maanden?: number;
    kosten?: number;
    betaler?: string;
  };
  overeenkomstnummer?: string;
  wwftBevestigd: boolean;
  datum: string;
  plaats: string;
  afleverDatum?: string;
  opmerkingen?: string;
  verkoperHandtekeningDataUrl?: string;
  bedrijf?: {
    kvk?: string;
  };
}

const formatEur = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n || 0);

const formatDate = (d?: string) => {
  if (!d) return "—";
  const parts = d.split("-");
  if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return d;
};

const escapeHtml = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function buildHtml(data: KoopovereenkomstData): string {
  const garantieKosten = data.garantie.kosten || 0;
  const totaal =
    data.financieel.verkoopprijs +
    (data.financieel.afleverkosten || 0) +
    (data.financieel.leges || 0) +
    garantieKosten;
  const aanbetaling = data.financieel.aanbetalingActief ? data.financieel.aanbetalingsbedrag || 0 : 0;
  const inruilWaarde = data.inruil?.waarde || 0;
  const restbedrag =
    data.financieel.restbedrag != null
      ? data.financieel.restbedrag
      : totaal - aanbetaling - inruilWaarde;

  let garantieTekst = "";
  if (data.garantie.type === "geen") {
    garantieTekst =
      "Het voertuig wordt verkocht zonder garantie, in de staat zoals bezichtigd en geaccepteerd door koper.";
  } else if (data.garantie.type === "autotrust") {
    garantieTekst = `Op het voertuig is een AutoTrust garantie van toepassing voor een periode van ${
      data.garantie.maanden || 12
    } maanden na aflevering. De voorwaarden zijn vastgelegd in een separaat AutoTrust garantiecertificaat.`;
  } else {
    garantieTekst = `Op het voertuig is een garantie van Platin Automotive van toepassing voor een periode van ${
      data.garantie.maanden || 3
    } maanden na aflevering, conform onze algemene voorwaarden.`;
  }

  const klantNaam = data.klant.isZakelijk && data.klant.bedrijfsnaam
    ? data.klant.bedrijfsnaam
    : `${data.klant.voornaam} ${data.klant.achternaam}`.trim();

  const klantIdLine = data.klant.isZakelijk
    ? `KVK ${escapeHtml(data.klant.kvk || "—")}`
    : `Geboortedatum ${escapeHtml(formatDate(data.klant.geboortedatum))}`;

  const payLabels: Record<string, string> = {
    cash: "Cash", pin: "Pin", ideal: "iDEAL", overboeking: "Overboeking",
    bank: "Bank", financiering: "Financiering", aanbetaling: "Aanbetaling",
  };

  // Bouw financiële regels als platte tekst
  const finRows: Array<[string, string]> = [
    ["Voertuigprijs", formatEur(data.financieel.verkoopprijs)],
  ];
  if (garantieKosten > 0) {
    finRows.push([
      `Garantie ${data.garantie.type === "autotrust" ? "AutoTrust" : "Platin"} ${data.garantie.maanden || 12} maanden`,
      formatEur(garantieKosten),
    ]);
  }
  if ((data.financieel.afleverkosten || 0) > 0) finRows.push(["Afleverkosten", formatEur(data.financieel.afleverkosten || 0)]);
  if ((data.financieel.leges || 0) > 0) finRows.push(["Leges", formatEur(data.financieel.leges || 0)]);

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #000;
    width: 794px;
    font-size: 11px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }
  .page {
    width: 794px;
    min-height: 1123px;
    padding: 70px 72px 56px 72px;
    background: #fff;
  }

  /* ───── TITEL ───── */
  .title {
    font-size: 44px;
    font-weight: 800;
    letter-spacing: -0.5px;
    line-height: 0.95;
    text-transform: uppercase;
    color: #000;
  }
  .title-meta {
    margin-top: 14px;
    font-size: 10.5px;
    color: #000;
    letter-spacing: 0.2px;
  }
  .title-meta span { margin-right: 24px; }

  /* ───── KOPJES ───── */
  h2 {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: #000;
    margin-top: 26px;
    margin-bottom: 8px;
  }

  p, .line { font-size: 11px; color: #000; line-height: 1.6; }
  p + p { margin-top: 4px; }

  .parties { margin-top: 6px; }
  .parties p { margin-bottom: 2px; }

  /* ───── TABELLEN ───── */
  table.kv { width: 100%; border-collapse: collapse; }
  table.kv td {
    padding: 3px 0;
    font-size: 11px;
    vertical-align: top;
    color: #000;
  }
  table.kv td.lbl { width: 32%; padding-right: 10px; }
  table.kv td.val { font-weight: 700; }

  table.fin { width: 100%; border-collapse: collapse; margin-top: 4px; }
  table.fin td {
    padding: 4px 0;
    font-size: 11px;
    color: #000;
  }
  table.fin td.amt { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  table.fin tr.divider td { border-top: 1px solid #000; padding-top: 7px; }
  table.fin tr.total td { font-weight: 800; }
  table.fin tr.rest td {
    font-weight: 800;
    font-size: 13px;
    padding-top: 8px;
    border-top: 1.5px solid #000;
  }
  table.fin tr.pay td { font-size: 10.5px; padding: 2px 0 2px 14px; }

  ul.bullets { padding-left: 18px; margin-top: 2px; }
  ul.bullets li { font-size: 11px; line-height: 1.6; margin-bottom: 2px; }

  /* ───── HANDTEKENINGEN ───── */
  .signs {
    display: flex;
    gap: 56px;
    margin-top: 38px;
  }
  .sign { flex: 1; }
  .sign .role {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #000;
    margin-bottom: 30px;
  }
  .sign .sigbox {
    border-bottom: 1px solid #000;
    height: 40px;
    position: relative;
  }
  .sign .sigbox img {
    position: absolute; left: 0; bottom: 2px;
    max-height: 36px; max-width: 100%; object-fit: contain;
  }
  .sign .caption {
    font-size: 10px;
    color: #000;
    margin-top: 6px;
  }

  .closing {
    margin-top: 22px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #000;
  }
</style></head>
<body>
<div class="page">

  <!-- TITEL -->
  <div class="title">KOOP-<br/>OVEREENKOMST</div>
  <div class="title-meta">
    <span>Nr. ${escapeHtml(data.overeenkomstnummer || "—")}</span>
    <span>Datum ${escapeHtml(formatDate(data.datum))}</span>
    <span>${escapeHtml(data.plaats || "Roelofarendsveen")}</span>
  </div>

  <!-- PARTIJEN -->
  <h2>Partijen</h2>
  <div class="parties">
    <p><strong>Verkoper:</strong> Platin Automotive, gevestigd te Cilinderweg 99, 2371 DZ Roelofarendsveen, ingeschreven bij de Kamer van Koophandel onder nummer ${escapeHtml(data.bedrijf?.kvk || "99146193")}.</p>
    <p style="margin-top:6px;"><strong>Koper:</strong> ${escapeHtml(klantNaam)}, wonende te ${escapeHtml(data.klant.adres || "—")}, ${escapeHtml(`${data.klant.postcode || ""} ${data.klant.woonplaats || ""}`.trim() || "—")}. ${klantIdLine}. Tel ${escapeHtml(data.klant.telefoon || "—")}${data.klant.email ? ` · ${escapeHtml(data.klant.email)}` : ""}.</p>
  </div>

  <!-- ARTIKEL 1 — VOERTUIG -->
  <h2>Artikel 1 – Voertuig</h2>
  <table class="kv">
    <tr><td class="lbl">Merk &amp; model</td><td class="val">${escapeHtml(`${data.voertuig.merk || ""} ${data.voertuig.model || ""}`.trim() || "—")}${data.voertuig.uitvoering ? ` ${escapeHtml(data.voertuig.uitvoering)}` : ""}</td></tr>
    <tr><td class="lbl">Kenteken</td><td class="val">${escapeHtml(data.voertuig.kenteken || "—")}</td></tr>
    <tr><td class="lbl">Chassisnummer</td><td class="val">${escapeHtml(data.voertuig.vin || "—")}</td></tr>
    <tr><td class="lbl">Bouwjaar</td><td class="val">${escapeHtml(String(data.voertuig.bouwjaar || "—"))}</td></tr>
    <tr><td class="lbl">Kilometerstand</td><td class="val">${(data.voertuig.kilometerstand || 0).toLocaleString("nl-NL")} km${data.voertuig.nap === false ? " (geen NAP)" : ""}</td></tr>
    <tr><td class="lbl">Kleur / Brandstof</td><td class="val">${escapeHtml(data.voertuig.kleur || "—")} · ${escapeHtml(data.voertuig.brandstof || "—")}</td></tr>
    <tr><td class="lbl">APK tot</td><td class="val">${escapeHtml(formatDate(data.voertuig.apkTot))}</td></tr>
    <tr><td class="lbl">BTW-regeling</td><td class="val">${escapeHtml(data.voertuig.btwType || "Marge")}</td></tr>
  </table>

  ${data.inruil ? `
  <!-- ARTIKEL — INRUIL -->
  <h2>Artikel 2 – Inruilvoertuig</h2>
  <table class="kv">
    <tr><td class="lbl">Merk &amp; model</td><td class="val">${escapeHtml(`${data.inruil.merk || ""} ${data.inruil.model || ""}`.trim() || "—")}</td></tr>
    <tr><td class="lbl">Kenteken</td><td class="val">${escapeHtml(data.inruil.kenteken || "—")}</td></tr>
    <tr><td class="lbl">Kilometerstand</td><td class="val">${(data.inruil.km || 0).toLocaleString("nl-NL")} km</td></tr>
    <tr><td class="lbl">Inruilwaarde</td><td class="val">${formatEur(data.inruil.waarde || 0)}</td></tr>
  </table>
  ` : ""}

  <!-- ARTIKEL — FINANCIEEL -->
  <h2>Artikel ${data.inruil ? 3 : 2} – Financieel</h2>
  <table class="fin">
    ${finRows.map(([l, v]) => `<tr><td>${escapeHtml(l)}</td><td class="amt">${v}</td></tr>`).join("")}
    <tr class="divider total"><td>Totaalbedrag</td><td class="amt">${formatEur(totaal)}</td></tr>
    ${inruilWaarde > 0 ? `<tr><td>Inruil ${escapeHtml([data.inruil?.merk, data.inruil?.model].filter(Boolean).join(" "))}${data.inruil?.kenteken ? ` (${escapeHtml(data.inruil.kenteken)})` : ""}</td><td class="amt">− ${formatEur(inruilWaarde)}</td></tr>` : ""}
    ${aanbetaling > 0 ? `<tr><td>Aanbetaling${data.financieel.aanbetalingBetaalwijze ? ` (${escapeHtml(payLabels[data.financieel.aanbetalingBetaalwijze] || data.financieel.aanbetalingBetaalwijze)})` : ""} — reeds voldaan</td><td class="amt">− ${formatEur(aanbetaling)}</td></tr>` : ""}
    <tr class="rest"><td>Restbedrag</td><td class="amt">${formatEur(restbedrag)}</td></tr>
    ${(data.financieel.betalingen && data.financieel.betalingen.length > 0)
      ? data.financieel.betalingen.map(b => {
          const label = payLabels[b.methode] || b.methode;
          const suffix = b.methode === "financiering" && b.maatschappij ? ` (${escapeHtml(b.maatschappij)})` : "";
          return `<tr class="pay"><td>${escapeHtml(label)}${suffix}</td><td class="amt">${formatEur(b.bedrag || 0)}</td></tr>`;
        }).join("")
      : `<tr class="pay"><td>Betaalwijze restbedrag: ${escapeHtml(data.financieel.betaalwijze || "—")}</td><td></td></tr>`}
  </table>
  ${data.afleverDatum ? `<p style="margin-top:8px;"><strong>Verwachte leverdatum:</strong> ${escapeHtml(formatDate(data.afleverDatum))}</p>` : ""}

  <!-- ARTIKEL — GARANTIE -->
  <h2>Artikel ${data.inruil ? 4 : 3} – Garantie</h2>
  <p>${escapeHtml(garantieTekst)}</p>

  <!-- ARTIKEL — OVERIGE BEPALINGEN -->
  <h2>Artikel ${data.inruil ? 5 : 4} – Overige bepalingen</h2>
  <ul class="bullets">
    <li>Op deze overeenkomst zijn de algemene voorwaarden van Platin Automotive van toepassing.</li>
    <li>Het voertuig is door koper bezichtigd en akkoord bevonden in de staat zoals aangetroffen.</li>
    <li>Eigendom gaat over op koper na volledige betaling en aflevering van het voertuig.</li>
    <li>Op deze overeenkomst is Nederlands recht van toepassing.</li>
    ${data.wwftBevestigd ? `<li>Conform de Wwft is de identiteit van koper geverifieerd en zijn eventuele meldingsplichten in acht genomen.</li>` : ""}
  </ul>

  ${data.opmerkingen ? `<h2>Opmerkingen</h2><p>${escapeHtml(data.opmerkingen)}</p>` : ""}

  <div class="closing">Aldus overeengekomen en in tweevoud ondertekend op ${escapeHtml(formatDate(data.datum))} te ${escapeHtml(data.plaats || "Roelofarendsveen")}.</div>

  <!-- HANDTEKENINGEN -->
  <div class="signs">
    <div class="sign">
      <div class="role">Verkoper</div>
      <div class="sigbox">${data.verkoperHandtekeningDataUrl ? `<img src="${data.verkoperHandtekeningDataUrl}" alt="Handtekening" />` : ""}</div>
      <div class="caption">Platin Automotive — Naam &amp; handtekening</div>
    </div>
    <div class="sign">
      <div class="role">Koper</div>
      <div class="sigbox"></div>
      <div class="caption">${escapeHtml(klantNaam)} — Naam &amp; handtekening</div>
    </div>
  </div>

</div>
</body></html>`;
}

async function renderToPdf(data: KoopovereenkomstData): Promise<jsPDF> {
  const html = buildHtml(data);

  // Render in een offscreen container
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.background = "#ffffff";
  container.innerHTML = html;
  document.body.appendChild(container);

    const target = container.querySelector(".page") as HTMLElement | null;
    const node = target || container;

  try {
    const canvas = await html2canvas(node, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      windowWidth: 794,
    });
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageW = 210;
    const pageH = 297;
    const imgWmm = pageW;
    const imgHmm = (canvas.height * imgWmm) / canvas.width;
    // Fit binnen één A4: schaal indien hoger dan paginahoogte
    const finalH = Math.min(imgHmm, pageH);
    const finalW = (canvas.width * finalH) / canvas.height;
    const x = (pageW - finalW) / 2;
    pdf.addImage(imgData, "JPEG", x, 0, finalW, finalH);
    return pdf;
  } finally {
    document.body.removeChild(container);
  }
}

export async function buildKoopovereenkomstDoc(data: KoopovereenkomstData): Promise<jsPDF> {
  return renderToPdf(data);
}

export async function printKoopovereenkomst(data: KoopovereenkomstData) {
  const doc = await renderToPdf(data);
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url);
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

export async function downloadKoopovereenkomst(data: KoopovereenkomstData) {
  const doc = await renderToPdf(data);
  doc.save(
    `Koopovereenkomst_${data.voertuig.merk}_${data.voertuig.model}_${data.voertuig.kenteken || "onbekend"}.pdf`
  );
}

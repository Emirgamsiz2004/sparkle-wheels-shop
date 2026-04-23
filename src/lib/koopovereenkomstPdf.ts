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
    aanbetalingActief: boolean;
    aanbetalingsbedrag?: number;
    restbedrag?: number;
  };
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
  const restbedrag = data.financieel.restbedrag != null ? data.financieel.restbedrag : totaal - aanbetaling;

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

  const klantIdRow = data.klant.isZakelijk
    ? `<div><span class="lbl">KVK:</span> ${escapeHtml(data.klant.kvk || "—")}</div>`
    : `<div><span class="lbl">Geb.datum:</span> ${escapeHtml(formatDate(data.klant.geboortedatum))}</div>`;

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Helvetica, Arial, sans-serif;
    color: #000;
    background: #fff;
    width: 794px;
    padding: 36px 44px;
    font-size: 9px;
    line-height: 1.45;
  }
  .hr { border: none; border-top: 0.5px solid #cccccc; margin: 10px 0; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; }
  .header .left { width: 60%; }
  .header .right { width: 40%; text-align: right; }
  .brand { font-size: 16px; font-weight: 700; letter-spacing: 1px; color: #000; }
  .meta { font-size: 9px; color: #000; margin-top: 4px; }
  .meta div { margin-top: 1px; }
  .doctitle { font-size: 14px; font-weight: 700; letter-spacing: 1.5px; color: #000; }
  .docnum { font-size: 9px; margin-top: 6px; color: #000; }

  .section-title {
    font-size: 8px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    font-weight: 600;
    margin-bottom: 6px;
  }
  .cols { display: flex; gap: 4%; }
  .col { width: 48%; }
  .col p { margin-top: 1px; font-size: 9px; }
  .col .name { font-weight: 700; font-size: 10px; margin-bottom: 2px; }

  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 32px;
    row-gap: 4px;
  }
  .grid2 > div { font-size: 9px; }
  .lbl { color: #555; display: inline-block; min-width: 78px; }

  .fin-row {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    padding: 2px 0;
  }
  .fin-row.divider { border-top: 0.5px solid #cccccc; margin-top: 4px; padding-top: 4px; }
  .fin-row.bold { font-weight: 700; }
  .fin-meta { font-size: 9px; margin-top: 6px; }

  .small { font-size: 8px; color: #555; line-height: 1.5; }

  .signs { display: flex; gap: 4%; margin-top: 12px; }
  .sign { width: 48%; }
  .sign .role { font-weight: 700; font-size: 9px; }
  .sign .who { font-size: 9px; margin-bottom: 14px; }
  .sign .line { font-size: 9px; margin-top: 4px; }
  .sign .siglabel { font-size: 9px; margin-top: 10px; }
  .sign .sigbox { border-bottom: 0.5px solid #999; height: 28px; margin-top: 4px; }

  .footer { font-size: 8px; color: #777; text-align: center; margin-top: 14px; }
</style></head>
<body>
  <div class="header">
    <div class="left">
      <div class="brand">PLATIN AUTOMOTIVE</div>
      <div class="meta">
        <div>Cilinderweg 99 | 2371DZ Roelofarendsveen</div>
        <div>Tel: 06-12693825 | info@platinautomotive.nl</div>
        <div>IBAN: NL54 INGB 0117 0493 36</div>
        <div>KVK: ${escapeHtml(data.bedrijf?.kvk || "99146193")}</div>
      </div>
    </div>
    <div class="right">
      <div class="doctitle">KOOPOVEREENKOMST</div>
      <div class="docnum">Overeenkomstnummer: ${escapeHtml(data.overeenkomstnummer || "—")}</div>
      <div class="docnum">Datum: ${escapeHtml(formatDate(data.datum))}</div>
    </div>
  </div>
  <hr class="hr"/>

  <div class="cols">
    <div class="col">
      <div class="section-title">Verkoper</div>
      <p class="name">Platin Automotive</p>
      <p>Cilinderweg 99</p>
      <p>2371DZ Roelofarendsveen</p>
      <p>Tel: 06-12693825</p>
      <p>info@platinautomotive.nl</p>
    </div>
    <div class="col">
      <div class="section-title">Koper</div>
      <p class="name">${escapeHtml(klantNaam)}</p>
      <p>${escapeHtml(data.klant.adres || "—")}</p>
      <p>${escapeHtml(`${data.klant.postcode || ""} ${data.klant.woonplaats || ""}`.trim() || "—")}</p>
      <p>Tel: ${escapeHtml(data.klant.telefoon || "—")}</p>
      <p>Email: ${escapeHtml(data.klant.email || "—")}</p>
      <p>${data.klant.isZakelijk ? `KVK: ${escapeHtml(data.klant.kvk || "—")}` : `Geb.datum: ${escapeHtml(formatDate(data.klant.geboortedatum))}`}</p>
    </div>
  </div>
  <hr class="hr"/>

  <div class="section-title">Voertuiggegevens</div>
  <div class="grid2">
    <div><span class="lbl">Merk:</span> ${escapeHtml(data.voertuig.merk)}</div>
    <div><span class="lbl">Kleur:</span> ${escapeHtml(data.voertuig.kleur || "—")}</div>
    <div><span class="lbl">Model:</span> ${escapeHtml(data.voertuig.model)}</div>
    <div><span class="lbl">Brandstof:</span> ${escapeHtml(data.voertuig.brandstof || "—")}</div>
    <div><span class="lbl">Uitvoering:</span> ${escapeHtml(data.voertuig.uitvoering || "—")}</div>
    <div><span class="lbl">Bouwjaar:</span> ${escapeHtml(String(data.voertuig.bouwjaar || "—"))}</div>
    <div><span class="lbl">Kenteken:</span> ${escapeHtml(data.voertuig.kenteken || "—")}</div>
    <div><span class="lbl">NAP:</span> ${data.voertuig.nap === false ? "Nee" : "Ja"}</div>
    <div><span class="lbl">Chassisnr:</span> ${escapeHtml(data.voertuig.vin || "—")}</div>
    <div><span class="lbl">APK tot:</span> ${escapeHtml(formatDate(data.voertuig.apkTot))}</div>
    <div><span class="lbl">KM-stand:</span> ${(data.voertuig.kilometerstand || 0).toLocaleString("nl-NL")}</div>
    <div><span class="lbl">BTW:</span> ${escapeHtml(data.voertuig.btwType || "Marge")}</div>
  </div>
  <hr class="hr"/>

  <div class="section-title">Financieel</div>
  <div class="fin-row"><span>Voertuigprijs</span><span>${formatEur(data.financieel.verkoopprijs)}</span></div>
  ${garantieKosten > 0 ? `<div class="fin-row"><span>Garantie ${data.garantie.type === "autotrust" ? "AutoTrust" : "Platin"} ${data.garantie.maanden || 12} mnd</span><span>${formatEur(garantieKosten)}</span></div>` : ""}
  ${(data.financieel.afleverkosten || 0) > 0 ? `<div class="fin-row"><span>Afleverkosten</span><span>${formatEur(data.financieel.afleverkosten || 0)}</span></div>` : ""}
  ${(data.financieel.leges || 0) > 0 ? `<div class="fin-row"><span>Leges</span><span>${formatEur(data.financieel.leges || 0)}</span></div>` : ""}
  <div class="fin-row divider bold"><span>Totaalbedrag</span><span>${formatEur(totaal)}</span></div>
  ${aanbetaling > 0 ? `<div class="fin-row"><span>Aanbetaling</span><span>- ${formatEur(aanbetaling)}</span></div>` : ""}
  ${aanbetaling > 0 ? `<div class="fin-row bold"><span>Restbedrag</span><span>${formatEur(restbedrag)}</span></div>` : ""}
  <div class="fin-meta"><strong>Betaalwijze:</strong> ${escapeHtml(data.financieel.betaalwijze || "—")}</div>
  <div class="fin-meta"><strong>Verwachte leverdatum:</strong> ${escapeHtml(formatDate(data.afleverDatum))}</div>
  <hr class="hr"/>

  <div class="small">${escapeHtml(garantieTekst)}</div>
  ${data.opmerkingen ? `<div class="small" style="margin-top:6px;"><strong>Opmerkingen:</strong> ${escapeHtml(data.opmerkingen)}</div>` : ""}

  <div class="signs">
    <div class="sign">
      <div class="role">Verkoper</div>
      <div class="who">Platin Automotive</div>
      <div class="line">Datum: ................</div>
      <div class="siglabel">Handtekening:</div>
      <div class="sigbox"></div>
    </div>
    <div class="sign">
      <div class="role">Koper</div>
      <div class="who">${escapeHtml(klantNaam)}</div>
      <div class="line">Datum: ................</div>
      <div class="siglabel">Handtekening:</div>
      <div class="sigbox"></div>
    </div>
  </div>

  <hr class="hr"/>
  <div class="footer">
    Op deze overeenkomst zijn onze algemene voorwaarden van toepassing. Platin Automotive — platinautomotive.nl
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

  const target = container.querySelector("body") as HTMLElement | null;
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

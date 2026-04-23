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

  const klantIdLine = data.klant.isZakelijk
    ? `KVK: ${escapeHtml(data.klant.kvk || "—")}`
    : `Geb.datum: ${escapeHtml(formatDate(data.klant.geboortedatum))}`;

  const field = (label: string, value: string) =>
    `<div class="field"><div class="f-lbl">${label}</div><div class="f-val">${value}</div></div>`;

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #111;
    background: #fff;
    width: 794px;
    padding: 57px 57px;
    font-size: 9px;
    line-height: 1.4;
  }

  /* HEADER */
  .header { display: flex; justify-content: space-between; align-items: flex-start; }
  .header .left { width: 55%; }
  .header .right { width: 45%; text-align: right; }
  .brand-platin { font-size: 22px; font-weight: 700; letter-spacing: 0; color: #000; line-height: 1; }
  .brand-sub {
    font-size: 9px; letter-spacing: 4px; color: #888; margin-top: 2px;
    border-bottom: 1px solid #ddd; padding-bottom: 4px; display: inline-block; padding-right: 20px;
  }
  .brand-meta { font-size: 8px; color: #777; margin-top: 5px; line-height: 1.5; }
  .doctitle { font-size: 14px; font-weight: 700; letter-spacing: 2px; color: #000; }
  .docmeta { font-size: 9px; color: #777; margin-top: 4px; }
  .thick-hr { border: none; border-top: 2px solid #000; margin: 8px 0 12px; }

  /* PARTY BOX */
  .party-box {
    background: #f8f8f8;
    border-radius: 4px;
    padding: 10px;
    display: flex;
    gap: 4%;
  }
  .party { width: 48%; }
  .party-lbl { font-size: 7px; color: #888; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 4px; font-weight: 600; }
  .party-name { font-size: 10px; font-weight: 700; color: #000; margin-bottom: 2px; }
  .party p { font-size: 9px; line-height: 1.5; color: #222; }

  /* SECTION TITLES */
  .sec { margin-top: 12px; }
  .sec-title {
    font-size: 7px; color: #888; text-transform: uppercase;
    letter-spacing: 1px; font-weight: 600;
    border-bottom: 0.5px solid #ddd; padding-bottom: 3px; margin-bottom: 8px;
  }

  /* VEHICLE GRID */
  .v-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; column-gap: 16px; row-gap: 6px; }
  .field .f-lbl { font-size: 7px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .field .f-val { font-size: 9px; font-weight: 700; color: #000; margin-top: 1px; }

  /* FINANCIEEL */
  .fin-row { display: flex; justify-content: space-between; font-size: 9px; padding: 2px 0; }
  .fin-row .desc { color: #222; }
  .fin-row .amt { color: #000; font-variant-numeric: tabular-nums; }
  .fin-divider { border-top: 0.5px solid #bbb; margin: 4px 0; }
  .fin-row.bold { font-weight: 700; }
  .fin-row.rest { font-weight: 700; font-size: 11px; padding-top: 4px; }
  .fin-meta { font-size: 8.5px; color: #333; margin-top: 6px; }
  .fin-meta strong { color: #000; }
  .pay-row { display: flex; justify-content: space-between; font-size: 8px; color: #666; padding: 1px 0 1px 10px; }
  .pay-row .pay-amt { font-variant-numeric: tabular-nums; }

  /* GARANTIE BOX */
  .garantie-box {
    background: #fffbf0;
    border-left: 3px solid #f0a500;
    padding: 8px 10px;
    margin-top: 12px;
    font-size: 7.5px;
    color: #555;
    line-height: 1.5;
  }

  /* OPMERKINGEN */
  .opm { font-size: 8px; color: #555; margin-top: 8px; }
  .opm strong { color: #000; }

  /* HANDTEKENINGEN */
  .signs { display: flex; gap: 8%; margin-top: 18px; }
  .sign { width: 46%; }
  .sign .role { font-size: 7px; color: #888; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 600; }
  .sign .who { font-size: 10px; font-weight: 700; color: #000; margin-top: 2px; margin-bottom: 10px; }
  .sign .row { font-size: 8.5px; color: #333; margin-top: 6px; }
  .sign .siglabel { font-size: 8.5px; color: #333; margin-top: 10px; }
  .sign .sigbox { border-bottom: 0.5px solid #888; height: 26px; margin-top: 4px; }

  /* FOOTER */
  .footer-hr { border: none; border-top: 0.5px solid #ddd; margin-top: 14px; }
  .footer { font-size: 7px; color: #999; text-align: center; margin-top: 6px; }
</style></head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div class="left">
      <div class="brand-platin">PLATIN</div>
      <div class="brand-sub">AUTOMOTIVE</div>
      <div class="brand-meta">
        <div>Cilinderweg 99 | 2371DZ Roelofarendsveen</div>
        <div>Tel: 06-12693825 | info@platinautomotive.nl</div>
        <div>IBAN: NL54 INGB 0117 0493 36</div>
      </div>
    </div>
    <div class="right">
      <div class="doctitle">KOOPOVEREENKOMST</div>
      <div class="docmeta">Nr: ${escapeHtml(data.overeenkomstnummer || "—")}</div>
      <div class="docmeta">Datum: ${escapeHtml(formatDate(data.datum))}</div>
    </div>
  </div>
  <hr class="thick-hr"/>

  <!-- VERKOPER / KOPER -->
  <div class="party-box">
    <div class="party">
      <div class="party-lbl">Verkoper</div>
      <div class="party-name">Platin Automotive</div>
      <p>Cilinderweg 99</p>
      <p>2371DZ Roelofarendsveen</p>
      <p>Tel: 06-12693825</p>
    </div>
    <div class="party">
      <div class="party-lbl">Koper</div>
      <div class="party-name">${escapeHtml(klantNaam)}</div>
      <p>${escapeHtml(data.klant.adres || "—")}</p>
      <p>${escapeHtml(`${data.klant.postcode || ""} ${data.klant.woonplaats || ""}`.trim() || "—")}</p>
      <p>Tel: ${escapeHtml(data.klant.telefoon || "—")}</p>
      <p>${escapeHtml(data.klant.email || "—")}</p>
      <p>${klantIdLine}</p>
    </div>
  </div>

  <!-- VOERTUIG -->
  <div class="sec">
    <div class="sec-title">Voertuiggegevens</div>
    <div class="v-grid">
      ${field("Merk", escapeHtml(data.voertuig.merk || "—"))}
      ${field("Kenteken", escapeHtml(data.voertuig.kenteken || "—"))}
      ${field("Kleur", escapeHtml(data.voertuig.kleur || "—"))}
      ${field("Model", escapeHtml(data.voertuig.model || "—"))}
      ${field("Chassisnr", escapeHtml(data.voertuig.vin || "—"))}
      ${field("Brandstof", escapeHtml(data.voertuig.brandstof || "—"))}
      ${field("KM-stand", (data.voertuig.kilometerstand || 0).toLocaleString("nl-NL"))}
      ${field("Bouwjaar", escapeHtml(String(data.voertuig.bouwjaar || "—")))}
      ${field("APK tot", escapeHtml(formatDate(data.voertuig.apkTot)))}
      ${field("Uitvoering", escapeHtml(data.voertuig.uitvoering || "—"))}
      ${field("NAP", data.voertuig.nap === false ? "Nee" : "Ja")}
      ${field("BTW", escapeHtml(data.voertuig.btwType || "Marge"))}
    </div>
  </div>

  <!-- FINANCIEEL -->
  <div class="sec">
    <div class="sec-title">Financieel</div>
    <div class="fin-row"><span class="desc">Voertuigprijs</span><span class="amt">${formatEur(data.financieel.verkoopprijs)}</span></div>
    ${garantieKosten > 0 ? `<div class="fin-row"><span class="desc">Garantie ${data.garantie.type === "autotrust" ? "AutoTrust" : "Platin"} ${data.garantie.maanden || 12} mnd</span><span class="amt">${formatEur(garantieKosten)}</span></div>` : ""}
    ${(data.financieel.afleverkosten || 0) > 0 ? `<div class="fin-row"><span class="desc">Afleverkosten</span><span class="amt">${formatEur(data.financieel.afleverkosten || 0)}</span></div>` : ""}
    ${(data.financieel.leges || 0) > 0 ? `<div class="fin-row"><span class="desc">Leges</span><span class="amt">${formatEur(data.financieel.leges || 0)}</span></div>` : ""}
    <div class="fin-divider"></div>
    <div class="fin-row bold"><span class="desc">Totaalbedrag</span><span class="amt">${formatEur(totaal)}</span></div>
    ${aanbetaling > 0 ? `<div class="fin-row"><span class="desc">Aanbetaling</span><span class="amt">- ${formatEur(aanbetaling)}</span></div><div class="fin-divider"></div>` : ""}
    <div class="fin-row rest"><span class="desc">Restbedrag</span><span class="amt">${formatEur(restbedrag)}</span></div>
    ${(data.financieel.betalingen && data.financieel.betalingen.length > 0)
      ? data.financieel.betalingen.map(b => {
          const labels: Record<string, string> = { cash: "Cash", pin: "Pin", ideal: "iDEAL", overboeking: "Overboeking", financiering: "Financiering" };
          const label = labels[b.methode] || b.methode;
          const suffix = b.methode === "financiering" && b.maatschappij ? ` (${escapeHtml(b.maatschappij)})` : "";
          return `<div class="pay-row"><span class="pay-desc">${escapeHtml(label)}${suffix}</span><span class="pay-amt">${formatEur(b.bedrag || 0)}</span></div>`;
        }).join("")
      : `<div class="fin-meta"><strong>Betaalwijze:</strong> ${escapeHtml(data.financieel.betaalwijze || "—")}</div>`}
    <div class="fin-meta" style="margin-top:8px;"><strong>Verwachte leverdatum:</strong> ${escapeHtml(formatDate(data.afleverDatum))}</div>
  </div>

  <!-- GARANTIETEKST -->
  <div class="garantie-box">${escapeHtml(garantieTekst)}</div>

  ${data.opmerkingen ? `<div class="opm"><strong>Opmerkingen:</strong> ${escapeHtml(data.opmerkingen)}</div>` : ""}

  <!-- HANDTEKENINGEN -->
  <div class="signs">
    <div class="sign">
      <div class="role">Verkoper</div>
      <div class="who">Platin Automotive</div>
      <div class="row">Datum: _______________</div>
      <div class="row">Plaats: _______________</div>
      <div class="siglabel">Handtekening:</div>
      <div class="sigbox"></div>
    </div>
    <div class="sign">
      <div class="role">Koper</div>
      <div class="who">${escapeHtml(klantNaam)}</div>
      <div class="row">Datum: _______________</div>
      <div class="row">Plaats: _______________</div>
      <div class="siglabel">Handtekening:</div>
      <div class="sigbox"></div>
    </div>
  </div>

  <hr class="footer-hr"/>
  <div class="footer">
    Op deze overeenkomst zijn onze algemene voorwaarden van toepassing | Platin Automotive | platinautomotive.nl | KVK: ${escapeHtml(data.bedrijf?.kvk || "99146193")}
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

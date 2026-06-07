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
    ? `KVK: ${escapeHtml(data.klant.kvk || "—")}`
    : `Geb.datum: ${escapeHtml(formatDate(data.klant.geboortedatum))}`;

  const field = (label: string, value: string) =>
    `<div class="field"><div class="f-lbl">${label}</div><div class="f-val">${value}</div></div>`;

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #1a1a1a;
    width: 794px;
    font-size: 10.5px;
    line-height: 1.5;
  }
  .page {
    width: 794px;
    min-height: 1123px;
    padding: 64px 68px 56px 68px;
    background: #fff;
  }

  /* ───── HEADER ───── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-bottom: 14px;
    border-bottom: 1.5px solid #1a1a1a;
  }
  .brand { line-height: 1; }
  .brand .name { font-size: 26px; font-weight: 700; letter-spacing: 1px; color: #1a1a1a; }
  .brand .sub { font-size: 9px; letter-spacing: 5px; color: #666; margin-top: 5px; }
  .doc-title { text-align: right; }
  .doc-title .t { font-size: 14px; font-weight: 700; letter-spacing: 2.5px; color: #1a1a1a; }
  .doc-title .m { font-size: 10px; color: #555; margin-top: 5px; }

  .company-info {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: #666;
    margin-top: 8px;
    padding-bottom: 18px;
  }

  /* ───── PARTIJEN ───── */
  .parties { display: flex; gap: 32px; margin-top: 4px; }
  .party { flex: 1; }
  .party h3 {
    font-size: 9px; font-weight: 700; color: #666;
    text-transform: uppercase; letter-spacing: 1.5px;
    padding-bottom: 6px; margin-bottom: 8px;
    border-bottom: 0.5px solid #ccc;
  }
  .party .name { font-size: 11.5px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
  .party p { font-size: 10px; color: #333; line-height: 1.55; }

  /* ───── SECTIES ───── */
  .section { margin-top: 22px; }
  .section h3 {
    font-size: 9px; font-weight: 700; color: #666;
    text-transform: uppercase; letter-spacing: 1.5px;
    padding-bottom: 6px; margin-bottom: 10px;
    border-bottom: 0.5px solid #ccc;
  }

  /* ───── VOERTUIG TABEL ───── */
  table.specs { width: 100%; border-collapse: collapse; }
  table.specs td {
    padding: 5px 0;
    font-size: 10px;
    vertical-align: top;
  }
  table.specs td.lbl { color: #777; padding-right: 8px; width: 11%; }
  table.specs td.val { color: #1a1a1a; font-weight: 600; padding-right: 22px; width: 22%; }

  /* ───── FINANCIEEL ───── */
  table.fin { width: 100%; border-collapse: collapse; }
  table.fin td {
    padding: 5px 0;
    font-size: 10.5px;
    vertical-align: middle;
  }
  table.fin td.amt { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  table.fin tr.sub td { color: #333; }
  table.fin tr.divider td { border-top: 0.5px solid #999; padding-top: 7px; }
  table.fin tr.total td { font-weight: 700; color: #1a1a1a; }
  table.fin tr.rest td { font-weight: 700; font-size: 12.5px; padding-top: 8px; border-top: 1px solid #1a1a1a; }
  table.fin tr.pay td { font-size: 9.5px; color: #666; padding: 3px 0 3px 18px; }
  table.fin tr.pay td.amt { padding-right: 0; }

  .fin-foot { display: flex; justify-content: space-between; font-size: 10px; color: #444; margin-top: 12px; padding-top: 10px; border-top: 0.5px solid #e5e5e5; }
  .fin-foot strong { color: #1a1a1a; font-weight: 700; }

  /* ───── GARANTIE ───── */
  .garantie {
    margin-top: 18px;
    font-size: 9.5px;
    color: #444;
    line-height: 1.6;
    padding: 10px 14px;
    background: #fafafa;
    border-left: 2px solid #999;
  }

  .opm { margin-top: 10px; font-size: 9.5px; color: #444; }
  .opm strong { color: #1a1a1a; }

  /* ───── HANDTEKENINGEN ───── */
  .signs { display: flex; gap: 48px; margin-top: 30px; }
  .sign { flex: 1; }
  .sign h4 {
    font-size: 9px; font-weight: 700; color: #666;
    text-transform: uppercase; letter-spacing: 1.5px;
    padding-bottom: 6px; margin-bottom: 8px;
    border-bottom: 0.5px solid #ccc;
  }
  .sign .name { font-size: 11px; font-weight: 700; color: #1a1a1a; margin-bottom: 14px; }
  .sign .row { font-size: 10px; color: #444; margin-top: 10px; display: flex; align-items: baseline; gap: 8px; }
  .sign .row .label { color: #666; min-width: 55px; }
  .sign .row .line { flex: 1; border-bottom: 0.5px solid #888; height: 13px; }
  .sign .siglabel { font-size: 10px; color: #666; margin-top: 16px; }
  .sign .sigbox { border-bottom: 0.5px solid #1a1a1a; height: 38px; margin-top: 4px; position: relative; }
  .sign .sigbox img { position: absolute; left: 0; bottom: 2px; max-height: 36px; max-width: 100%; object-fit: contain; }

  /* ───── FOOTER ───── */
  .footer {
    margin-top: 24px;
    padding-top: 10px;
    border-top: 0.5px solid #ccc;
    font-size: 8.5px;
    color: #888;
    text-align: center;
    line-height: 1.5;
  }
</style></head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="brand">
      <div class="name">PLATIN</div>
      <div class="sub">AUTOMOTIVE</div>
    </div>
    <div class="doc-title">
      <div class="t">KOOPOVEREENKOMST</div>
      <div class="m">Nummer: <strong>${escapeHtml(data.overeenkomstnummer || "—")}</strong></div>
      <div class="m">Datum: ${escapeHtml(formatDate(data.datum))}</div>
    </div>
  </div>
  <div class="company-info">
    <span>Cilinderweg 99, 2371 DZ Roelofarendsveen</span>
    <span>071-781 25 25</span>
    <span>info@platinautomotive.nl</span>
    <span>KVK ${escapeHtml(data.bedrijf?.kvk || "99146193")}</span>
  </div>

  <!-- PARTIJEN -->
  <div class="parties">
    <div class="party">
      <h3>Verkoper</h3>
      <div class="name">Platin Automotive</div>
      <p>Cilinderweg 99</p>
      <p>2371 DZ Roelofarendsveen</p>
      <p>Tel: 071-781 25 25</p>
      <p>info@platinautomotive.nl</p>
    </div>
    <div class="party">
      <h3>Koper</h3>
      <div class="name">${escapeHtml(klantNaam)}</div>
      <p>${escapeHtml(data.klant.adres || "—")}</p>
      <p>${escapeHtml(`${data.klant.postcode || ""} ${data.klant.woonplaats || ""}`.trim() || "—")}</p>
      <p>Tel: ${escapeHtml(data.klant.telefoon || "—")}</p>
      <p>${escapeHtml(data.klant.email || "—")}</p>
      <p>${klantIdLine}</p>
    </div>
  </div>

  <!-- VOERTUIG -->
  <div class="section">
    <h3>Voertuiggegevens</h3>
    <table class="specs">
      <tr>
        <td class="lbl">Merk</td><td class="val">${escapeHtml(data.voertuig.merk || "—")}</td>
        <td class="lbl">Kenteken</td><td class="val">${escapeHtml(data.voertuig.kenteken || "—")}</td>
        <td class="lbl">Kleur</td><td class="val">${escapeHtml(data.voertuig.kleur || "—")}</td>
      </tr>
      <tr>
        <td class="lbl">Model</td><td class="val">${escapeHtml(data.voertuig.model || "—")}</td>
        <td class="lbl">Chassisnr.</td><td class="val">${escapeHtml(data.voertuig.vin || "—")}</td>
        <td class="lbl">Brandstof</td><td class="val">${escapeHtml(data.voertuig.brandstof || "—")}</td>
      </tr>
      <tr>
        <td class="lbl">Uitvoering</td><td class="val">${escapeHtml(data.voertuig.uitvoering || "—")}</td>
        <td class="lbl">Bouwjaar</td><td class="val">${escapeHtml(String(data.voertuig.bouwjaar || "—"))}</td>
        <td class="lbl">APK tot</td><td class="val">${escapeHtml(formatDate(data.voertuig.apkTot))}</td>
      </tr>
      <tr>
        <td class="lbl">KM-stand</td><td class="val">${(data.voertuig.kilometerstand || 0).toLocaleString("nl-NL")}</td>
        <td class="lbl">NAP</td><td class="val">${data.voertuig.nap === false ? "Nee" : "Ja"}</td>
        <td class="lbl">BTW</td><td class="val">${escapeHtml(data.voertuig.btwType || "Marge")}</td>
      </tr>
    </table>
  </div>

  ${data.inruil ? `
  <!-- INRUIL -->
  <div class="section">
    <h3>Inruilvoertuig</h3>
    <table class="specs">
      <tr>
        <td class="lbl">Merk</td><td class="val">${escapeHtml(data.inruil.merk || "—")}</td>
        <td class="lbl">Model</td><td class="val">${escapeHtml(data.inruil.model || "—")}</td>
        <td class="lbl">Kenteken</td><td class="val">${escapeHtml(data.inruil.kenteken || "—")}</td>
      </tr>
      <tr>
        <td class="lbl">KM-stand</td><td class="val">${(data.inruil.km || 0).toLocaleString("nl-NL")}</td>
        <td class="lbl">Inruilwaarde</td><td class="val">${formatEur(data.inruil.waarde || 0)}</td>
        <td class="lbl"></td><td class="val"></td>
      </tr>
    </table>
  </div>
  ` : ""}

  <!-- FINANCIEEL -->
  <div class="section">
    <h3>Financieel</h3>
    <table class="fin">
      <tr class="sub"><td>Voertuigprijs</td><td class="amt">${formatEur(data.financieel.verkoopprijs)}</td></tr>
      ${garantieKosten > 0 ? `<tr class="sub"><td>Garantie ${data.garantie.type === "autotrust" ? "AutoTrust" : "Platin"} ${data.garantie.maanden || 12} maanden</td><td class="amt">${formatEur(garantieKosten)}</td></tr>` : ""}
      ${(data.financieel.afleverkosten || 0) > 0 ? `<tr class="sub"><td>Afleverkosten</td><td class="amt">${formatEur(data.financieel.afleverkosten || 0)}</td></tr>` : ""}
      ${(data.financieel.leges || 0) > 0 ? `<tr class="sub"><td>Leges</td><td class="amt">${formatEur(data.financieel.leges || 0)}</td></tr>` : ""}
      <tr class="divider total"><td>Totaalbedrag</td><td class="amt">${formatEur(totaal)}</td></tr>
      ${inruilWaarde > 0 ? `<tr class="sub"><td>Inruil ${escapeHtml([data.inruil?.merk, data.inruil?.model].filter(Boolean).join(" "))}${data.inruil?.kenteken ? ` (${escapeHtml(data.inruil.kenteken)})` : ""}</td><td class="amt">− ${formatEur(inruilWaarde)}</td></tr>` : ""}
      ${aanbetaling > 0 ? `<tr class="sub"><td>Aanbetaling${data.financieel.aanbetalingBetaalwijze ? ` (${escapeHtml(({cash:"Cash",pin:"Pin",ideal:"iDEAL",overboeking:"Overboeking",bank:"Bank",financiering:"Financiering"} as Record<string,string>)[data.financieel.aanbetalingBetaalwijze] || data.financieel.aanbetalingBetaalwijze)})` : ""} — reeds voldaan</td><td class="amt">− ${formatEur(aanbetaling)}</td></tr>` : ""}
      <tr class="rest"><td>Restbedrag</td><td class="amt">${formatEur(restbedrag)}</td></tr>
      ${(data.financieel.betalingen && data.financieel.betalingen.length > 0)
        ? data.financieel.betalingen.map(b => {
            const labels: Record<string, string> = { cash: "Cash", pin: "Pin", ideal: "iDEAL", overboeking: "Overboeking", financiering: "Financiering", aanbetaling: "Aanbetaling" };
            const label = labels[b.methode] || b.methode;
            const suffix = b.methode === "financiering" && b.maatschappij ? ` (${escapeHtml(b.maatschappij)})` : "";
            return `<tr class="pay"><td>${escapeHtml(label)}${suffix}</td><td class="amt">${formatEur(b.bedrag || 0)}</td></tr>`;
          }).join("")
        : `<tr class="pay"><td>Betaalwijze restbedrag: ${escapeHtml(data.financieel.betaalwijze || "—")}</td><td></td></tr>`}
    </table>
    <div class="fin-foot">
      <span><strong>Verwachte leverdatum:</strong> ${escapeHtml(formatDate(data.afleverDatum))}</span>
    </div>
  </div>

  <!-- GARANTIE -->
  <div class="garantie">${escapeHtml(garantieTekst)}</div>

  <!-- AKKOORD ALGEMENE VOORWAARDEN -->
  <div class="garantie" style="border-left-color:#1a1a1a;background:#f4f4f4;margin-top:10px;">
    <strong style="color:#1a1a1a;">Akkoord algemene voorwaarden.</strong>
    Door ondertekening van deze koopovereenkomst verklaart de koper de algemene voorwaarden van
    Platin Automotive (versie 7 juni 2026) voorafgaand aan de ondertekening te hebben ontvangen,
    gelezen en hiermee onvoorwaardelijk akkoord te gaan. De voorwaarden zijn tevens te raadplegen
    via platinautomotive.nl/algemene-voorwaarden en zijn op verzoek kosteloos verkrijgbaar.
  </div>

  ${data.opmerkingen ? `<div class="opm"><strong>Opmerkingen:</strong> ${escapeHtml(data.opmerkingen)}</div>` : ""}

  <!-- HANDTEKENINGEN -->
  <div style="margin-top: 26px;">
    <div class="row" style="display:flex;align-items:baseline;gap:10px;font-size:10px;color:#444;margin-bottom:14px;">
      <span style="color:#666;min-width:55px;">Datum</span>
      <span style="flex:0 0 220px;border-bottom:0.5px solid #888;height:13px;"></span>
    </div>
    <div class="signs">
      <div class="sign">
        <h4>Verkoper</h4>
        <div class="name">Platin Automotive</div>
        <div class="siglabel">Handtekening</div>
        <div class="sigbox">${data.verkoperHandtekeningDataUrl ? `<img src="${data.verkoperHandtekeningDataUrl}" alt="Handtekening" />` : ""}</div>
      </div>
      <div class="sign">
        <h4>Koper</h4>
        <div class="name">${escapeHtml(klantNaam)}</div>
        <div class="siglabel">Handtekening</div>
        <div class="sigbox"></div>
      </div>
    </div>
  </div>

  <div class="footer">
    Op deze overeenkomst zijn onze algemene voorwaarden van toepassing &nbsp;·&nbsp;
    Platin Automotive &nbsp;·&nbsp; platinautomotive.nl &nbsp;·&nbsp; KVK ${escapeHtml(data.bedrijf?.kvk || "99146193")}
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

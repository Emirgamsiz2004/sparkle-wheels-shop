import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface AanbetalingsbewijsData {
  voertuig: {
    merk: string;
    model: string;
    bouwjaar?: number | null;
    kenteken?: string | null;
  };
  klantNaam?: string;
  klantEmail?: string;
  aanbetalingsbedrag: number;
  verkoopprijs: number;
  restbedrag: number;
  betaalwijze?: string;
  leverdatum?: string;
  datum: string;
  bewijsNummer?: string;
  inruil?: {
    merk?: string;
    model?: string;
    kenteken?: string;
    waarde: number;
  };
}

const formatEur = (n: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n || 0);

const formatDate = (d?: string) => {
  if (!d) return "-";
  const parts = d.split("-");
  if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return d;
};

const formatKenteken = (k?: string | null) => (k ? k.toUpperCase().replace(/\s+/g, "") : "-");

const escapeHtml = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function buildHtml(data: AanbetalingsbewijsData): string {
  const v = data.voertuig;
  const voertuigText = `${v.merk || ""} ${v.model || ""}`.trim() || "-";

  const inruilHtml = data.inruil
    ? `
    <h2>Inruilvoertuig</h2>
    <table class="kv">
      <tr><td class="lbl">Merk &amp; model</td><td class="val">${escapeHtml(`${data.inruil.merk || ""} ${data.inruil.model || ""}`.trim() || "-")}</td></tr>
      <tr><td class="lbl">Kenteken</td><td class="val">${escapeHtml(formatKenteken(data.inruil.kenteken))}</td></tr>
      <tr><td class="lbl">Inruilwaarde</td><td class="val">${escapeHtml(formatEur(data.inruil.waarde))}</td></tr>
    </table>`
    : "";

  return `<!doctype html>
<html><head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #000; background: #fff; }
  .page {
    width: 794px;
    min-height: 1123px;
    padding: 70px 72px 56px 72px;
    background: #fff;
  }
  .title {
    font-size: 44px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: -0.5px;
    line-height: 0.95;
    color: #000;
  }
  .title-meta {
    margin-top: 14px;
    font-size: 10.5px;
    color: #000;
  }
  .title-meta span { margin-right: 24px; }
  h2 {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: #000;
    margin-top: 26px;
    margin-bottom: 8px;
  }
  p { font-size: 11px; line-height: 1.6; color: #000; }
  table.kv { width: 100%; border-collapse: collapse; }
  table.kv td { padding: 3px 0; font-size: 11px; color: #000; vertical-align: top; }
  table.kv td.lbl { width: 32%; padding-right: 10px; }
  table.kv td.val { font-weight: 700; }
  table.fin { width: 100%; border-collapse: collapse; margin-top: 4px; }
  table.fin td { padding: 4px 0; font-size: 11px; color: #000; }
  table.fin td.amt { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  table.fin tr.divider td { border-top: 1px solid #000; padding-top: 7px; font-weight: 800; }
  table.fin tr.rest td {
    font-weight: 800;
    font-size: 13px;
    padding-top: 8px;
    border-top: 1.5px solid #000;
  }
  .amount-hero {
    margin-top: 24px;
    padding-bottom: 14px;
    border-bottom: 1.5px solid #000;
  }
  .amount-hero .lbl {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #000;
  }
  .amount-hero .val {
    font-size: 40px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #000;
    margin-top: 6px;
  }
  .closing {
    margin-top: 30px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #000;
  }
</style>
</head>
<body>
<div class="page">
  <div class="title">AANBETALINGS-<br/>BEWIJS</div>
  <div class="title-meta">
    ${data.bewijsNummer ? `<span>Nr. ${escapeHtml(data.bewijsNummer)}</span>` : ""}
    <span>Datum ${escapeHtml(formatDate(data.datum))}</span>
  </div>

  <div class="amount-hero">
    <div class="lbl">Ontvangen aanbetaling</div>
    <div class="val">${escapeHtml(formatEur(data.aanbetalingsbedrag))}</div>
  </div>

  <p style="margin-top:18px;">Hierbij bevestigt Platin Automotive de ontvangst van bovenstaande aanbetaling voor het hieronder vermelde voertuig. Dit document dient als officieel ontvangstbewijs.</p>

  <h2>Partijen</h2>
  <p><strong>Verkoper:</strong> Platin Automotive, Cilinderweg 99, 2371 DZ Roelofarendsveen. KvK 99146193.</p>
  <p style="margin-top:4px;"><strong>Koper:</strong> ${escapeHtml(data.klantNaam || "—")}${data.klantEmail ? ` · ${escapeHtml(data.klantEmail)}` : ""}.</p>

  <h2>Voertuig</h2>
  <table class="kv">
    <tr><td class="lbl">Merk &amp; model</td><td class="val">${escapeHtml(voertuigText)}</td></tr>
    <tr><td class="lbl">Kenteken</td><td class="val">${escapeHtml(formatKenteken(v.kenteken))}</td></tr>
    ${v.bouwjaar ? `<tr><td class="lbl">Bouwjaar</td><td class="val">${v.bouwjaar}</td></tr>` : ""}
  </table>

  ${inruilHtml}

  <h2>Financieel overzicht</h2>
  <table class="fin">
    <tr><td>Verkoopprijs voertuig</td><td class="amt">${escapeHtml(formatEur(data.verkoopprijs))}</td></tr>
    ${data.inruil ? `<tr><td>Inruilwaarde</td><td class="amt">− ${escapeHtml(formatEur(data.inruil.waarde))}</td></tr>` : ""}
    <tr class="divider"><td>Reeds aanbetaald${data.betaalwijze ? ` (${escapeHtml(data.betaalwijze)})` : ""}</td><td class="amt">− ${escapeHtml(formatEur(data.aanbetalingsbedrag))}</td></tr>
    <tr class="rest"><td>Restbedrag bij levering</td><td class="amt">${escapeHtml(formatEur(data.restbedrag))}</td></tr>
    ${data.leverdatum ? `<tr><td>Verwachte leverdatum</td><td class="amt">${escapeHtml(formatDate(data.leverdatum))}</td></tr>` : ""}
  </table>

  <div class="closing">Digitaal bevestigd op ${escapeHtml(formatDate(data.datum))} — geldig zonder handtekening.</div>
</div>
</body></html>`;
}

async function renderToPdf(data: AanbetalingsbewijsData): Promise<jsPDF> {
  const html = buildHtml(data);
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.background = "#ffffff";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const target = container.querySelector(".page") as HTMLElement | null;
    const node = target || container;

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
    const finalH = Math.min(imgHmm, pageH);
    const finalW = (canvas.width * finalH) / canvas.height;
    const x = (pageW - finalW) / 2;
    pdf.addImage(imgData, "JPEG", x, 0, finalW, finalH);
    return pdf;
  } finally {
    document.body.removeChild(container);
  }
}

export async function generateAanbetalingsbewijsPdf(data: AanbetalingsbewijsData): Promise<jsPDF> {
  return renderToPdf(data);
}

export async function openAanbetalingsbewijsPdf(data: AanbetalingsbewijsData) {
  const doc = await renderToPdf(data);
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

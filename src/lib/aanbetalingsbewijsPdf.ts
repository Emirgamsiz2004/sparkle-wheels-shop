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
    <div class="section">
      <div class="section-label">Inruilvoertuig</div>
      <div class="grid-2">
        <div>
          <div class="kv-label">Voertuig</div>
          <div class="kv-value">${escapeHtml(`${data.inruil.merk || ""} ${data.inruil.model || ""}`.trim() || "-")}</div>
        </div>
        <div>
          <div class="kv-label">Kenteken</div>
          <div class="kv-value">${escapeHtml(formatKenteken(data.inruil.kenteken))}</div>
        </div>
      </div>
      <div style="margin-top:10px;">
        <div class="kv-label">Inruilwaarde</div>
        <div class="kv-value">${escapeHtml(formatEur(data.inruil.waarde))}</div>
      </div>
    </div>`
    : "";

  return `<!doctype html>
<html><head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111; background: #fff; }
  .page {
    width: 794px;
    min-height: 1123px;
    background: #fff;
    display: flex;
    flex-direction: column;
  }

  /* HEADER */
  .header {
    background: #111;
    color: #fff;
    padding: 28px 56px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .brand-name { font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
  .brand-meta { font-size: 11px; color: #b8b8b8; line-height: 1.6; margin-top: 6px; }
  .doc-label { text-align: right; }
  .doc-label .type { font-size: 11px; font-weight: 700; letter-spacing: 1.2px; color: #fff; }
  .doc-label .nr { font-size: 11px; color: #b8b8b8; margin-top: 6px; }
  .doc-label .date { font-size: 11px; color: #b8b8b8; margin-top: 2px; }

  /* CONTENT */
  .content { padding: 36px 56px 0; flex: 1; }

  .title { font-size: 28px; font-weight: 700; color: #111; letter-spacing: -0.5px; }
  .subtitle { font-size: 13px; color: #6b6b6b; margin-top: 8px; line-height: 1.55; max-width: 540px; }

  /* AMOUNT CARD */
  .amount-card {
    background: #f5f5f5;
    border-radius: 8px;
    padding: 22px 26px;
    margin-top: 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .amount-card .label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.2px;
    color: #6b6b6b;
  }
  .amount-card .amount {
    font-size: 32px;
    font-weight: 700;
    color: #111;
    margin-top: 8px;
    letter-spacing: -1px;
  }
  .amount-card .right { text-align: right; }
  .badge {
    display: inline-block;
    background: #16a34a;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.2px;
    padding: 6px 14px;
    border-radius: 4px;
  }
  .amount-card .received { font-size: 11px; color: #6b6b6b; margin-top: 10px; }

  /* SECTIONS */
  .section { margin-top: 32px; }
  .section-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.4px;
    color: #6b6b6b;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e5e5;
    margin-bottom: 14px;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  .kv-label { font-size: 11px; color: #6b6b6b; margin-bottom: 3px; }
  .kv-value { font-size: 13px; font-weight: 600; color: #111; }
  .kv + .kv { margin-top: 12px; }

  /* FINANCIAL TABLE */
  .fin-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 4px;
    border-bottom: 1px solid #eee;
    font-size: 12.5px;
  }
  .fin-row .lbl { color: #111; }
  .fin-row .val { color: #111; font-weight: 500; }
  .fin-row.muted .lbl, .fin-row.muted .val { color: #6b6b6b; }
  .fin-row.bold .lbl, .fin-row.bold .val { font-weight: 700; }
  .fin-row.total {
    background: #f5f5f5;
    border-bottom: none;
    border-radius: 6px;
    padding: 14px 14px;
    margin-top: 6px;
    font-size: 14px;
  }
  .fin-row.total .lbl, .fin-row.total .val { font-weight: 700; }

  /* CONFIRMATION */
  .confirm {
    margin-top: 32px;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    padding: 18px 22px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .confirm .left { display: flex; align-items: center; gap: 14px; }
  .check {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #16a34a;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    line-height: 1;
  }
  .confirm .title-sm { font-size: 13px; font-weight: 700; color: #111; }
  .confirm .desc { font-size: 11px; color: #6b6b6b; margin-top: 3px; line-height: 1.5; }
  .confirm .right { text-align: right; }
  .confirm .right .lbl { font-size: 10px; color: #6b6b6b; }
  .confirm .right .val { font-size: 12px; font-weight: 700; color: #111; margin-top: 3px; }

  /* FOOTER */
  .footer {
    margin-top: auto;
    padding: 18px 56px 24px;
    border-top: 1px solid #e5e5e5;
    text-align: center;
    color: #8a8a8a;
    font-size: 10px;
    line-height: 1.6;
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="brand-name">PLATIN AUTOMOTIVE</div>
      <div class="brand-meta">
        Cilinderweg 99 · 2371 DZ Roelofarendsveen · 06 8282 3050<br/>
        info@platinautomotive.nl · www.platinautomotive.nl · KvK 99146193
      </div>
    </div>
    <div class="doc-label">
      <div class="type">AANBETALINGSBEWIJS</div>
      ${data.bewijsNummer ? `<div class="nr">Nr. ${escapeHtml(data.bewijsNummer)}</div>` : ""}
      <div class="date">${escapeHtml(formatDate(data.datum))}</div>
    </div>
  </div>

  <div class="content">
    <div class="title">Aanbetaling ontvangen</div>
    <div class="subtitle">
      Hierbij bevestigen wij de ontvangst van uw aanbetaling voor het hieronder vermelde voertuig.
      Dit document dient als officieel ontvangstbewijs.
    </div>

    <div class="amount-card">
      <div>
        <div class="label">ONTVANGEN AANBETALING</div>
        <div class="amount">${escapeHtml(formatEur(data.aanbetalingsbedrag))}</div>
      </div>
      <div class="right">
        <span class="badge">BETAALD</span>
        <div class="received">Ontvangen op ${escapeHtml(formatDate(data.datum))}</div>
      </div>
    </div>

    <div class="grid-2" style="margin-top: 32px;">
      <div>
        <div class="section-label">Klantgegevens</div>
        <div class="kv">
          <div class="kv-label">Naam</div>
          <div class="kv-value">${escapeHtml(data.klantNaam || "-")}</div>
        </div>
        ${
          data.klantEmail
            ? `<div class="kv"><div class="kv-label">E-mail</div><div class="kv-value">${escapeHtml(data.klantEmail)}</div></div>`
            : ""
        }
      </div>
      <div>
        <div class="section-label">Voertuig</div>
        <div class="kv">
          <div class="kv-label">Merk &amp; model</div>
          <div class="kv-value">${escapeHtml(voertuigText)}</div>
        </div>
        <div class="kv">
          <div class="kv-label">Kenteken</div>
          <div class="kv-value">${escapeHtml(formatKenteken(v.kenteken))}</div>
        </div>
        ${
          v.bouwjaar
            ? `<div class="kv"><div class="kv-label">Bouwjaar</div><div class="kv-value">${v.bouwjaar}</div></div>`
            : ""
        }
      </div>
    </div>

    ${inruilHtml}

    <div class="section">
      <div class="section-label">Financieel overzicht</div>
      <div class="fin-row">
        <div class="lbl">Verkoopprijs voertuig</div>
        <div class="val">${escapeHtml(formatEur(data.verkoopprijs))}</div>
      </div>
      ${
        data.inruil
          ? `<div class="fin-row muted"><div class="lbl">Inruilwaarde</div><div class="val">- ${escapeHtml(formatEur(data.inruil.waarde))}</div></div>`
          : ""
      }
      <div class="fin-row bold">
        <div class="lbl">Reeds aanbetaald</div>
        <div class="val">- ${escapeHtml(formatEur(data.aanbetalingsbedrag))}</div>
      </div>
      ${
        data.betaalwijze
          ? `<div class="fin-row muted"><div class="lbl">Betaalmethode</div><div class="val">${escapeHtml(data.betaalwijze)}</div></div>`
          : ""
      }
      <div class="fin-row total">
        <div class="lbl">Resterend te voldoen bij levering</div>
        <div class="val">${escapeHtml(formatEur(data.restbedrag))}</div>
      </div>
      ${
        data.leverdatum
          ? `<div class="fin-row" style="border-bottom:none; margin-top:6px;"><div class="lbl" style="color:#6b6b6b;">Verwachte leverdatum</div><div class="val">${escapeHtml(formatDate(data.leverdatum))}</div></div>`
          : ""
      }
    </div>

    <div class="confirm">
      <div class="left">
        <div class="check">✓</div>
        <div>
          <div class="title-sm">Digitaal bevestigd</div>
          <div class="desc">
            Deze aanbetaling is op afstand voldaan en automatisch verwerkt.<br/>
            Een fysieke handtekening is daarom niet vereist.
          </div>
        </div>
      </div>
      <div class="right">
        <div class="lbl">Bevestigd op</div>
        <div class="val">${escapeHtml(formatDate(data.datum))}</div>
      </div>
    </div>
  </div>

  <div class="footer">
    Platin Automotive · Cilinderweg 99, 2371 DZ Roelofarendsveen · KvK 99146193<br/>
    Dit is een automatisch gegenereerd document en is geldig zonder handtekening.
  </div>
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

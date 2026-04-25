import jsPDF from "jspdf";

export interface RestbetalingPdfData {
  voertuig: {
    merk: string;
    model: string;
    bouwjaar: number | null;
    kenteken: string;
  };
  klant: {
    voornaam: string;
    achternaam: string;
    adres: string;
    postcode: string;
    woonplaats: string;
  };
  reedsVoldaan: number;
  restbedrag: number;
  uiterlijkeDatum: string; // YYYY-MM-DD
  betaalwijze: "bank" | "cash";
  opmerking?: string;
  datum: string; // YYYY-MM-DD (vandaag)
}

const fmtEur = (n: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);

const fmtDate = (d: string) => {
  if (!d) return "";
  const parts = d.split("-");
  if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return d;
};

function buildDoc(data: RestbetalingPdfData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = 210;
  const ml = 20;
  const mr = 20;
  const cw = pw - ml - mr;
  let y = 20;

  const setFont = (style: "normal" | "bold" | "italic", size: number) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
  };
  const checkPage = (needed: number) => {
    if (y + needed > 275) {
      doc.addPage();
      y = 20;
    }
  };

  // ─── Header ───
  setFont("bold", 18);
  doc.setTextColor(30, 30, 30);
  doc.text("BETALINGSAFSPRAAK", pw / 2, y, { align: "center" });
  y += 4;
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.5);
  doc.line(ml, y, pw - mr, y);
  y += 10;

  // Bedrijfsgegevens
  setFont("bold", 10);
  doc.text("Platin Automotive", ml, y);
  y += 5;
  setFont("normal", 9);
  doc.setTextColor(80, 80, 80);
  doc.text("Cilinderweg 99, 2371 DZ Roelofarendsveen", ml, y); y += 4;
  doc.text("info@platinautomotive.nl  |  06-12693825", ml, y); y += 4;
  doc.text("KvK: 99146193", ml, y); y += 4;
  doc.text('Hierna te noemen: "Verkoper"', ml, y);

  // Datum rechts
  setFont("normal", 9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Datum: ${fmtDate(data.datum)}`, pw - mr, 30, { align: "right" });

  y += 10;

  // Koper
  setFont("bold", 10);
  doc.setTextColor(30, 30, 30);
  doc.text("Koper:", ml, y);
  y += 5;
  setFont("normal", 9);
  doc.setTextColor(80, 80, 80);
  doc.text(`${data.klant.voornaam} ${data.klant.achternaam}`.trim() || "—", ml, y); y += 4;
  const adresRegel = [
    data.klant.adres,
    [data.klant.postcode, data.klant.woonplaats].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
  doc.text(adresRegel || "—", ml, y); y += 4;
  doc.text('Hierna te noemen: "Koper"', ml, y);
  y += 10;

  const addArtikel = (title: string) => {
    checkPage(12);
    setFont("bold", 10);
    doc.setTextColor(30, 30, 30);
    doc.text(title, ml, y);
    y += 6;
    setFont("normal", 9);
    doc.setTextColor(60, 60, 60);
  };

  // ─── Voertuig ───
  addArtikel("Artikel 1 — Voertuig");
  const rows: [string, string][] = [
    ["Merk / Model", `${data.voertuig.merk || ""} ${data.voertuig.model || ""}`.trim() || "—"],
    ["Bouwjaar", data.voertuig.bouwjaar ? String(data.voertuig.bouwjaar) : "—"],
    ["Kenteken", (data.voertuig.kenteken || "—").toUpperCase()],
  ];
  rows.forEach(([label, val]) => {
    checkPage(5);
    setFont("normal", 9);
    doc.setTextColor(100, 100, 100);
    doc.text(label + ":", ml + 4, y);
    doc.setTextColor(30, 30, 30);
    doc.text(val, ml + 55, y);
    y += 5;
  });
  y += 5;

  // ─── Afspraak ───
  addArtikel("Artikel 2 — Betalingsafspraak");
  const datumStr = fmtDate(data.uiterlijkeDatum);
  const intro = `Koper en verkoper komen overeen dat het openstaande restbedrag voor het bovengenoemde voertuig op een later moment door koper aan verkoper wordt voldaan, conform onderstaande specificatie:`;
  const introLines = doc.splitTextToSize(intro, cw);
  checkPage(introLines.length * 4 + 4);
  doc.text(introLines, ml, y);
  y += introLines.length * 4 + 4;

  const afspraak: [string, string][] = [
    ["Reeds voldaan", fmtEur(data.reedsVoldaan)],
    ["Openstaand restbedrag", fmtEur(data.restbedrag)],
    ["Uiterlijk te voldoen op", datumStr || "—"],
    ["Betalingswijze restbedrag", data.betaalwijze === "cash" ? "Cash" : "Bank"],
  ];
  afspraak.forEach(([label, val]) => {
    checkPage(5);
    setFont("normal", 9);
    doc.setTextColor(100, 100, 100);
    doc.text(label + ":", ml + 4, y);
    doc.setTextColor(30, 30, 30);
    doc.text(val, ml + 70, y);
    y += 5;
  });
  y += 4;

  if (data.opmerking && data.opmerking.trim()) {
    checkPage(5);
    setFont("normal", 9);
    doc.setTextColor(100, 100, 100);
    doc.text("Afspraak / opmerking:", ml + 4, y);
    y += 5;
    doc.setTextColor(30, 30, 30);
    const opmLines = doc.splitTextToSize(data.opmerking.trim(), cw - 4);
    checkPage(opmLines.length * 4 + 2);
    doc.text(opmLines, ml + 4, y);
    y += opmLines.length * 4 + 4;
  }
  y += 2;

  // ─── Slottekst ───
  addArtikel("Artikel 3 — Slotbepaling");
  const slot =
    "Dit document bevestigt de betalingsafspraak tussen Platin Automotive en de koper. Bij niet-nakoming behoudt Platin Automotive zich het recht voor juridische stappen te ondernemen.";
  const slotLines = doc.splitTextToSize(slot, cw);
  checkPage(slotLines.length * 4 + 4);
  doc.text(slotLines, ml, y);
  y += slotLines.length * 4 + 10;

  // ─── Ondertekening ───
  checkPage(55);
  const colW = (cw - 10) / 2;
  setFont("bold", 9);
  doc.setTextColor(30, 30, 30);
  doc.text("Platin Automotive", ml, y);
  doc.text("Koper", ml + colW + 10, y);
  y += 5;
  setFont("normal", 9);
  doc.setTextColor(80, 80, 80);
  doc.text("Naam: Emir Gamsiz", ml, y);
  doc.text(
    `Naam: ${`${data.klant.voornaam} ${data.klant.achternaam}`.trim() || "—"}`,
    ml + colW + 10,
    y,
  );
  y += 5;
  doc.text(`Datum: ${fmtDate(data.datum)}`, ml, y);
  doc.text(`Datum: ${fmtDate(data.datum)}`, ml + colW + 10, y);
  y += 4;
  doc.text("Handtekening:", ml, y);
  doc.text("Handtekening:", ml + colW + 10, y);
  y += 3;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(ml, y + 22, ml + colW, y + 22);
  doc.line(ml + colW + 10, y + 22, ml + colW + 10 + colW, y + 22);

  return doc;
}

export function generateRestbetalingBlob(data: RestbetalingPdfData): Blob {
  const doc = buildDoc(data);
  return doc.output("blob");
}

export function generateRestbetalingPDF(data: RestbetalingPdfData): {
  blob: Blob;
  fileName: string;
} {
  const doc = buildDoc(data);
  const fileName = `Betalingsafspraak_${data.voertuig.merk || ""}_${data.voertuig.model || ""}_${
    data.voertuig.kenteken || "onbekend"
  }.pdf`.replace(/\s+/g, "_");
  return { blob: doc.output("blob"), fileName };
}

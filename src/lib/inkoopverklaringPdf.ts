import jsPDF from "jspdf";

export interface InkoopverklaringPdfData {
  verkoper: {
    naam: string;
    email?: string;
    telefoon: string;
    adres: string;
    woonplaats: string;
  };
  voertuig: {
    kenteken?: string;
    merk: string;
    model: string;
    bouwjaar?: number;
    kilometerstand?: number;
    chassisnummer?: string;
  };
  legitimatie: {
    type: string;
    nummer: string;
  };
  inkoopprijs: number;
  datum: string;
  handtekeningDataUrl?: string;
  documentNaam: string;
}

const DARK = { r: 45, g: 45, b: 45 };
const BODY = { r: 80, g: 80, b: 80 };
const LIGHT = { r: 140, g: 140, b: 140 };
const LINE = { r: 190, g: 190, b: 190 };
const PAGE_BG = { r: 245, g: 245, b: 243 };

const formatEur = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);

const formatDate = (d: string) => {
  if (!d) return "";
  const parts = d.split("-");
  if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return d;
};

export function buildInkoopverklaringPdf(data: InkoopverklaringPdfData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = 210;
  const ml = 22;
  const mr = 22;
  const cw = pw - ml - mr;

  const setColor = (c: { r: number; g: number; b: number }) => doc.setTextColor(c.r, c.g, c.b);
  const setFont = (style: "normal" | "bold" | "italic", size: number) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
  };

  // Background
  doc.setFillColor(PAGE_BG.r, PAGE_BG.g, PAGE_BG.b);
  doc.rect(0, 0, pw, 297, "F");

  let y = 20;

  // Header
  setFont("bold", 18);
  setColor(DARK);
  doc.text("INKOOPVERKLARING", ml, y);
  
  setFont("normal", 9);
  setColor(LIGHT);
  doc.text("Platin Automotive", pw - mr, y - 4, { align: "right" });
  doc.text("Herenweg 21, 2361 EA Warmond", pw - mr, y, { align: "right" });
  
  y += 4;
  doc.setDrawColor(LINE.r, LINE.g, LINE.b);
  doc.setLineWidth(0.3);
  doc.line(ml, y, pw - mr, y);
  y += 10;

  // Document info
  setFont("normal", 9);
  setColor(LIGHT);
  doc.text(`Document: ${data.documentNaam}`, ml, y);
  doc.text(`Datum: ${formatDate(data.datum)}`, pw - mr, y, { align: "right" });
  y += 12;

  // Section: Verkoper
  setFont("bold", 11);
  setColor(DARK);
  doc.text("GEGEVENS VERKOPER", ml, y);
  y += 7;

  const labelVal = (label: string, value: string, yPos: number) => {
    setFont("normal", 9);
    setColor(LIGHT);
    doc.text(label, ml, yPos);
    setColor(BODY);
    doc.text(value || "—", ml + 45, yPos);
  };

  labelVal("Naam", data.verkoper.naam, y); y += 6;
  labelVal("Adres", data.verkoper.adres, y); y += 6;
  labelVal("Woonplaats", data.verkoper.woonplaats, y); y += 6;
  labelVal("Telefoon", data.verkoper.telefoon, y); y += 6;
  if (data.verkoper.email) { labelVal("E-mail", data.verkoper.email, y); y += 6; }
  labelVal("Legitimatie", `${data.legitimatie.type} — nr. ${data.legitimatie.nummer}`, y); y += 10;

  // Section: Voertuig
  doc.setDrawColor(LINE.r, LINE.g, LINE.b);
  doc.line(ml, y, pw - mr, y);
  y += 8;

  setFont("bold", 11);
  setColor(DARK);
  doc.text("GEGEVENS VOERTUIG", ml, y);
  y += 7;

  labelVal("Merk", data.voertuig.merk, y); y += 6;
  labelVal("Model", data.voertuig.model, y); y += 6;
  if (data.voertuig.bouwjaar) { labelVal("Bouwjaar", String(data.voertuig.bouwjaar), y); y += 6; }
  if (data.voertuig.kenteken) { labelVal("Kenteken", data.voertuig.kenteken, y); y += 6; }
  if (data.voertuig.kilometerstand) { labelVal("Kilometerstand", `${data.voertuig.kilometerstand.toLocaleString("nl-NL")} km`, y); y += 6; }
  if (data.voertuig.chassisnummer) { labelVal("Chassisnummer", data.voertuig.chassisnummer, y); y += 6; }
  y += 4;

  // Section: Transactie
  doc.line(ml, y, pw - mr, y);
  y += 8;

  setFont("bold", 11);
  setColor(DARK);
  doc.text("TRANSACTIE", ml, y);
  y += 7;

  labelVal("Inkoopprijs", formatEur(data.inkoopprijs), y); y += 6;
  labelVal("Datum", formatDate(data.datum), y); y += 12;

  // Wettelijke verklaring
  doc.line(ml, y, pw - mr, y);
  y += 8;

  setFont("bold", 10);
  setColor(DARK);
  doc.text("VERKLARING", ml, y);
  y += 7;

  setFont("normal", 8.5);
  setColor(BODY);
  const verklaring = `Ondergetekende verklaart hierbij dat het hierboven beschreven voertuig zijn/haar eigendom is en vrij is van financiële verplichtingen, beslagen, eigendomsvoorbehoud of andere zakelijke rechten van derden. Ondergetekende verklaart dat alle opgegeven gegevens naar waarheid zijn ingevuld en dat het voertuig geen onderdeel uitmaakt van enig geschil of juridische procedure.`;
  const lines = doc.splitTextToSize(verklaring, cw);
  doc.text(lines, ml, y);
  y += lines.length * 4.5 + 10;

  // Handtekening
  setFont("normal", 9);
  setColor(LIGHT);
  doc.text("Handtekening verkoper:", ml, y);
  y += 3;

  if (data.handtekeningDataUrl) {
    try {
      doc.addImage(data.handtekeningDataUrl, "PNG", ml, y, 60, 25);
    } catch (e) {
      console.warn("Kon handtekening niet toevoegen aan PDF");
    }
    y += 28;
  } else {
    // Lege lijn voor handtekening
    doc.line(ml, y + 20, ml + 60, y + 20);
    y += 25;
  }

  // Datumstempel onderaan
  setFont("normal", 8);
  setColor(LIGHT);
  doc.text(`Opgemaakt te Roelofarendsveen, ${formatDate(data.datum)}`, ml, y);

  return doc;
}

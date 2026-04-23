import jsPDF from "jspdf";

export interface InkoopfactuurPdfData {
  bedrijf: {
    naam: string;
    kvk: string;
    btw?: string;
    contactpersoon?: string;
    adres: string;
    postcode: string;
    woonplaats: string;
    telefoon?: string;
  };
  voertuig: {
    kenteken?: string;
    merk: string;
    model: string;
    bouwjaar?: number;
    kilometerstand?: number;
    chassisnummer?: string;
    kleur?: string;
  };
  bedragInclBtw: number;
  btwPercentage: number; // 21
  betaalwijze: string;
  datum: string;
  factuurnummer: string;
}

const DARK = { r: 26, g: 26, b: 26 };
const BODY = { r: 70, g: 70, b: 70 };
const LIGHT = { r: 130, g: 130, b: 130 };
const LINE = { r: 200, g: 200, b: 200 };

const formatEur = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);

const formatDate = (d: string) => {
  if (!d) return "";
  const parts = d.split("-");
  if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return d;
};

export function buildInkoopfactuurPdf(data: InkoopfactuurPdfData): jsPDF {
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

  let y = 22;

  // Header: PLATIN AUTOMOTIVE
  setFont("bold", 18);
  setColor(DARK);
  doc.text("PLATIN", ml, y);
  setFont("normal", 8);
  setColor(LIGHT);
  doc.setCharSpace(2);
  doc.text("AUTOMOTIVE", ml, y + 4);
  doc.setCharSpace(0);

  // Document titel rechts
  setFont("bold", 13);
  setColor(DARK);
  doc.setCharSpace(1.5);
  doc.text("INKOOPFACTUUR", pw - mr, y, { align: "right" });
  doc.setCharSpace(0);
  setFont("normal", 9);
  setColor(LIGHT);
  doc.text(`Nr: ${data.factuurnummer}`, pw - mr, y + 5, { align: "right" });
  doc.text(`Datum: ${formatDate(data.datum)}`, pw - mr, y + 9.5, { align: "right" });

  y += 14;
  doc.setDrawColor(DARK.r, DARK.g, DARK.b);
  doc.setLineWidth(0.5);
  doc.line(ml, y, pw - mr, y);

  // Bedrijfsgegevens onder lijn
  y += 4.5;
  setFont("normal", 7.5);
  setColor(LIGHT);
  doc.text("Cilinderweg 99 | 2371 DZ Roelofarendsveen", ml, y);
  doc.text("KVK: 99146193 | BTW: NL867819502B01", ml, y + 3.5);
  doc.text("info@platinautomotive.nl | platinautomotive.nl", ml, y + 7);

  y += 14;

  // Verkopende partij (= leverancier)
  setFont("bold", 9);
  setColor(LIGHT);
  doc.setCharSpace(1);
  doc.text("VERKOPENDE PARTIJ (LEVERANCIER)", ml, y);
  doc.setCharSpace(0);
  y += 5;

  setFont("bold", 10.5);
  setColor(DARK);
  doc.text(data.bedrijf.naam, ml, y);
  y += 4.5;

  setFont("normal", 9);
  setColor(BODY);
  doc.text(data.bedrijf.adres, ml, y); y += 4;
  doc.text(`${data.bedrijf.postcode} ${data.bedrijf.woonplaats}`, ml, y); y += 4;
  doc.text(`KVK: ${data.bedrijf.kvk}`, ml, y); y += 4;
  if (data.bedrijf.btw) { doc.text(`BTW: ${data.bedrijf.btw}`, ml, y); y += 4; }
  if (data.bedrijf.contactpersoon) { doc.text(`Contactpersoon: ${data.bedrijf.contactpersoon}`, ml, y); y += 4; }
  if (data.bedrijf.telefoon) { doc.text(`Tel: ${data.bedrijf.telefoon}`, ml, y); y += 4; }
  y += 4;

  doc.setDrawColor(LINE.r, LINE.g, LINE.b);
  doc.setLineWidth(0.3);
  doc.line(ml, y, pw - mr, y);
  y += 6;

  // Voertuig
  setFont("bold", 9);
  setColor(LIGHT);
  doc.setCharSpace(1);
  doc.text("INGEKOCHT VOERTUIG", ml, y);
  doc.setCharSpace(0);
  y += 5;

  const labelVal = (label: string, value: string, yPos: number, xOffset = 0) => {
    setFont("normal", 8.5);
    setColor(LIGHT);
    doc.text(label, ml + xOffset, yPos);
    setFont("normal", 9.5);
    setColor(DARK);
    doc.text(value || "—", ml + xOffset, yPos + 4);
  };

  const colW = cw / 3;
  labelVal("Merk & Model", `${data.voertuig.merk} ${data.voertuig.model}`, y, 0);
  labelVal("Kenteken", data.voertuig.kenteken || "—", y, colW);
  labelVal("Bouwjaar", data.voertuig.bouwjaar ? String(data.voertuig.bouwjaar) : "—", y, colW * 2);
  y += 11;
  labelVal("Kilometerstand", data.voertuig.kilometerstand ? `${data.voertuig.kilometerstand.toLocaleString("nl-NL")} km` : "—", y, 0);
  labelVal("Kleur", data.voertuig.kleur || "—", y, colW);
  labelVal("Chassisnummer", data.voertuig.chassisnummer || "—", y, colW * 2);
  y += 12;

  doc.setDrawColor(LINE.r, LINE.g, LINE.b);
  doc.line(ml, y, pw - mr, y);
  y += 6;

  // Financieel
  setFont("bold", 9);
  setColor(LIGHT);
  doc.setCharSpace(1);
  doc.text("FINANCIEEL", ml, y);
  doc.setCharSpace(0);
  y += 6;

  const btwBedrag = data.bedragInclBtw - (data.bedragInclBtw / (1 + data.btwPercentage / 100));
  const exclBtw = data.bedragInclBtw - btwBedrag;

  const rightX = pw - mr;
  setFont("normal", 9.5);
  setColor(BODY);
  doc.text("Inkoopprijs excl. BTW", ml, y);
  doc.text(formatEur(exclBtw), rightX, y, { align: "right" });
  y += 5;
  doc.text(`BTW (${data.btwPercentage}%)`, ml, y);
  doc.text(formatEur(btwBedrag), rightX, y, { align: "right" });
  y += 3;
  doc.setDrawColor(DARK.r, DARK.g, DARK.b);
  doc.setLineWidth(0.3);
  doc.line(ml, y, rightX, y);
  y += 5;
  setFont("bold", 11);
  setColor(DARK);
  doc.text("Totaal incl. BTW", ml, y);
  doc.text(formatEur(data.bedragInclBtw), rightX, y, { align: "right" });
  y += 8;

  setFont("normal", 9);
  setColor(LIGHT);
  doc.text(`Betaalwijze: ${data.betaalwijze}`, ml, y);
  y += 10;

  // Verklaring
  doc.setDrawColor(LINE.r, LINE.g, LINE.b);
  doc.line(ml, y, pw - mr, y);
  y += 6;
  setFont("normal", 8.5);
  setColor(BODY);
  const verklaring = `Ondergetekende verklaart het bovenstaand voertuig te hebben verkocht aan Platin Automotive voor bovengenoemd bedrag. Het voertuig is vrij van financiële verplichtingen en eigendomsvoorbehoud van derden.`;
  const lines = doc.splitTextToSize(verklaring, cw);
  doc.text(lines, ml, y);
  y += lines.length * 4.2 + 12;

  // Handtekeningen
  const colWidth = (cw - 10) / 2;
  setFont("normal", 8.5);
  setColor(LIGHT);
  doc.text("Voor Platin Automotive:", ml, y);
  doc.text(`Voor ${data.bedrijf.naam}:`, ml + colWidth + 10, y);
  y += 18;
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.3);
  doc.line(ml, y, ml + colWidth, y);
  doc.line(ml + colWidth + 10, y, ml + colWidth * 2 + 10, y);
  y += 4;
  setFont("normal", 8);
  setColor(LIGHT);
  doc.text("Datum: ____________________", ml, y);
  doc.text("Datum: ____________________", ml + colWidth + 10, y);

  // Footer
  const footerY = 285;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(ml, footerY, pw - mr, footerY);
  setFont("normal", 7);
  setColor(LIGHT);
  doc.text(
    "Platin Automotive | platinautomotive.nl | KVK: 99146193 | IBAN: NL54 INGB 0117 0493 36",
    pw / 2,
    footerY + 4,
    { align: "center" }
  );

  return doc;
}

import jsPDF from "jspdf";

export interface AanbetalingsbewijsData {
  voertuig: {
    merk: string;
    model: string;
    bouwjaar?: number | null;
    kenteken?: string | null;
  };
  klantNaam?: string;
  aanbetalingsbedrag: number;
  verkoopprijs: number;
  restbedrag: number;
  betaalwijze?: string;
  leverdatum?: string; // ISO yyyy-mm-dd
  datum: string; // ISO yyyy-mm-dd
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

export function generateAanbetalingsbewijsPdf(data: AanbetalingsbewijsData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = 210;
  const ml = 20;
  const mr = 20;
  const cw = pw - ml - mr;
  let y = 20;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("PLATIN AUTOMOTIVE", ml, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text("Cilinderweg 99, 2371 DZ Roelofarendsveen", ml, y);
  y += 4;
  doc.text("Tel: 06 8282 3050", ml, y);
  doc.setTextColor(0);
  y += 10;

  // Lijn
  doc.setDrawColor(180);
  doc.line(ml, y, ml + cw, y);
  y += 10;

  // Titel
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("AANBETALINGSBEWIJS", ml, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Datum: ${formatDate(data.datum)}`, ml, y);
  y += 10;

  // Voertuig
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Voertuig", ml, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const v = data.voertuig;
  const voertuigText = `${v.merk || ""} ${v.model || ""}${v.bouwjaar ? ` (${v.bouwjaar})` : ""}`;
  doc.text(voertuigText.trim() || "-", ml, y);
  y += 5;
  doc.text(`Kenteken: ${v.kenteken || "-"}`, ml, y);
  y += 10;

  // Bedragen
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Financieel", ml, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const drawRow = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(label, ml, y);
    doc.text(value, ml + cw, y, { align: "right" });
    y += 6;
  };
  drawRow("Verkoopprijs", formatEur(data.verkoopprijs));
  drawRow("Aanbetalingsbedrag", formatEur(data.aanbetalingsbedrag), true);
  if (data.betaalwijze) drawRow("Betaalmethode", data.betaalwijze);
  drawRow("Restbedrag", formatEur(data.restbedrag), true);
  drawRow("Verwachte leverdatum", formatDate(data.leverdatum));
  y += 6;

  // Klant naam
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Klantgegevens", ml, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Naam klant:", ml, y);
  doc.line(ml + 30, y + 1, ml + cw, y + 1);
  if (data.klantNaam) doc.text(data.klantNaam, ml + 32, y);
  y += 20;

  // Handtekeningen
  const sigW = (cw - 10) / 2;
  doc.setFontSize(10);
  doc.text("Handtekening klant:", ml, y);
  doc.text("Handtekening Platin Automotive:", ml + sigW + 10, y);
  y += 22;
  doc.line(ml, y, ml + sigW, y);
  doc.line(ml + sigW + 10, y, ml + cw, y);
  y += 20;

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    "Dit bewijs is opgesteld door Platin Automotive",
    pw / 2,
    285,
    { align: "center" }
  );

  return doc;
}

export function openAanbetalingsbewijsPdf(data: AanbetalingsbewijsData) {
  const doc = generateAanbetalingsbewijsPdf(data);
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

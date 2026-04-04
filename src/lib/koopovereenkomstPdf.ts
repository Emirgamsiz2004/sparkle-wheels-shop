import jsPDF from "jspdf";

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
  };
  financieel: {
    verkoopprijs: number;
    betaalwijze: string;
    contantBedrag?: number;
    overboekingBedrag?: number;
    financieringBedrag?: number;
    eigenBijdrage?: number;
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
  wwftBevestigd: boolean;
  datum: string;
  plaats: string;
  afleverDatum?: string;
  opmerkingen?: string;
}

const formatEur = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);

const formatDate = (d: string) => {
  if (!d) return "";
  const parts = d.split("-");
  if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return d;
};

// Brand colors — matching the light/clean template
const DARK = { r: 45, g: 45, b: 45 };         // #2d2d2d — headings & bold labels
const BODY = { r: 80, g: 80, b: 80 };         // #505050 — body text
const LIGHT = { r: 140, g: 140, b: 140 };     // #8c8c8c — subtle text
const LINE = { r: 190, g: 190, b: 190 };      // #bebebe — separator lines
const PAGE_BG = { r: 245, g: 245, b: 243 };   // #f5f5f3 — page background tint

export function buildKoopovereenkomstDoc(data: KoopovereenkomstData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = 210;
  const ph = 297;
  const ml = 22;
  const mr = 22;
  const cw = pw - ml - mr;
  let y = 0;

  const setColor = (c: { r: number; g: number; b: number }) => doc.setTextColor(c.r, c.g, c.b);
  const setFont = (style: "normal" | "bold" | "italic", size: number) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
  };
  const checkPage = (needed: number) => {
    if (y + needed > 275) { doc.addPage(); drawPageBg(); y = 22; }
  };

  const drawPageBg = () => {
    doc.setFillColor(PAGE_BG.r, PAGE_BG.g, PAGE_BG.b);
    doc.rect(0, 0, pw, ph, "F");
  };

  const drawSeparator = () => {
    doc.setDrawColor(LINE.r, LINE.g, LINE.b);
    doc.setLineWidth(0.3);
    doc.line(ml, y, pw - mr, y);
  };

  const sectionTitle = (title: string) => {
    checkPage(14);
    setFont("bold", 12);
    setColor(DARK);
    doc.text(title, ml, y);
    y += 8;
  };

  // Two-column field: bold label + value on each side
  const fieldRow = (label1: string, val1: string, label2?: string, val2?: string) => {
    checkPage(6);
    const col2X = pw / 2 + 8;

    setFont("bold", 9);
    setColor(DARK);
    doc.text(label1, ml, y);

    if (val1) {
      setFont("normal", 9);
      setColor(BODY);
      // Place value after label on same line with some offset
      const labelW1 = doc.getTextWidth(label1) + 3;
      doc.text(val1, ml + labelW1, y);
    }

    if (label2) {
      setFont("bold", 9);
      setColor(DARK);
      doc.text(label2, col2X, y);

      if (val2) {
        setFont("normal", 9);
        setColor(BODY);
        const labelW2 = doc.getTextWidth(label2) + 3;
        doc.text(val2, col2X + labelW2, y);
      }
    }
    y += 6;
  };

  // ── PAGE BACKGROUND ──
  drawPageBg();

  // ── HEADER — company info left, logo text right ──
  y = 22;

  // Left: Company name bold
  setFont("bold", 14);
  setColor(DARK);
  doc.text("Platin Automotive", ml, y);
  y += 5;

  // Left: Address line
  setFont("normal", 8.5);
  setColor(BODY);
  doc.text("Cilinderweg 99 | 2371DZ ROELOFARENDSVEEN | 06-12693825 |", ml, y);
  y += 4;
  doc.text("Info@platinautomotive.nl | platinautomotive.nl", ml, y);
  y += 7;

  // IBAN
  setFont("bold", 9);
  setColor(DARK);
  doc.text("IBAN: NL54 INGB 0117 0493 36", ml, y);

  // Right: Logo text "PLATIN AUTOMOTIVE"
  const logoX = pw - mr;
  setFont("bold", 22);
  setColor(DARK);
  doc.text("PLATIN", logoX, 24, { align: "right" });

  // Decorative line under PLATIN
  const platinW = doc.getTextWidth("PLATIN");
  doc.setDrawColor(DARK.r, DARK.g, DARK.b);
  doc.setLineWidth(0.8);
  // small stripes effect
  for (let i = 0; i < 8; i++) {
    const sx = logoX - platinW + i * (platinW / 8);
    doc.line(sx, 26, sx + platinW / 12, 26);
  }

  setFont("normal", 7);
  setColor(DARK);
  doc.text("A U T O M O T I V E", logoX, 30, { align: "right" });

  y += 5;

  // Separator
  drawSeparator();
  y += 10;

  // ── TITLE ──
  setFont("bold", 16);
  setColor(DARK);
  doc.text("KOOPOVEREENKOMST", ml, y);
  y += 12;

  // ── GEGEVENS VERKOPER ──
  sectionTitle("Gegevens verkoper");
  fieldRow("Naam:", "Platin Automotive", "Telefoon:", "06-12693825");
  fieldRow("Land:", "Nederland", "Email:", "info@platinautomotive.nl");
  fieldRow("Adres:", "Cilinderweg 99", "Geboortedatum:", "");
  fieldRow("Postcode / woonplaats:", "2371 DZ Roelofarendsveen");
  y += 2;
  drawSeparator();
  y += 8;

  // ── GEGEVENS KOPER ──
  sectionTitle("Gegevens koper");
  fieldRow(
    "Naam:", `${data.klant.voornaam} ${data.klant.achternaam}`,
    "Telefoon:", data.klant.telefoon
  );
  fieldRow("Land:", "Nederland", "Email:", data.klant.email || "");
  fieldRow(
    "Adres:", data.klant.adres,
    "Geboortedatum:", data.klant.geboortedatum ? formatDate(data.klant.geboortedatum) : ""
  );
  fieldRow("Postcode / woonplaats:", `${data.klant.postcode} ${data.klant.woonplaats}`);
  y += 2;
  drawSeparator();
  y += 8;

  // ── VOERTUIGGEGEVENS ──
  sectionTitle("Voertuiggegevens");
  fieldRow("Merk:", data.voertuig.merk, "Kleur:", data.voertuig.kleur || "—");
  fieldRow("Model:", data.voertuig.model, "Km-stand:", `${(data.voertuig.kilometerstand || 0).toLocaleString("nl-NL")} km`);
  fieldRow(
    "Uitvoering:",
    data.voertuig.uitvoering || `${data.voertuig.brandstof || ""} | ${data.voertuig.bouwjaar || ""}`.replace(/^\||\|$/g, "").trim(),
    "Bouwjaar:",
    String(data.voertuig.bouwjaar || "")
  );
  fieldRow("Kenteken:", data.voertuig.kenteken || "—");
  fieldRow("Chassisnr:", data.voertuig.vin || "—");
  y += 2;
  drawSeparator();
  y += 8;

  // ── BETALINGSWIJZE ──
  checkPage(40);
  sectionTitle("Betalingswijze");

  const tableW = cw;
  const col1W = tableW * 0.6;
  const rowH = 7;

  const drawTableRow = (label: string, value: string, isBold = false) => {
    checkPage(rowH + 2);
    doc.setDrawColor(LINE.r, LINE.g, LINE.b);
    doc.setLineWidth(0.15);
    doc.line(ml, y + rowH - 0.5, ml + tableW, y + rowH - 0.5);

    setFont(isBold ? "bold" : "normal", 9);
    setColor(DARK);
    doc.text(label, ml, y + 4.5);
    doc.text(value, ml + tableW, y + 4.5, { align: "right" });
    y += rowH;
  };

  // Payment rows
  if (data.financieel.betaalwijze === "combinatie") {
    if (data.financieel.contantBedrag) drawTableRow("Contant:", formatEur(data.financieel.contantBedrag));
    if (data.financieel.overboekingBedrag) drawTableRow("Per bank *:", formatEur(data.financieel.overboekingBedrag));
  } else if (data.financieel.betaalwijze === "financiering") {
    if (data.financieel.financieringBedrag) drawTableRow("Financiering:", formatEur(data.financieel.financieringBedrag));
    if (data.financieel.eigenBijdrage) drawTableRow("Eigen bijdrage:", formatEur(data.financieel.eigenBijdrage));
    if (!data.financieel.financieringBedrag && !data.financieel.eigenBijdrage) {
      drawTableRow("Financiering:", formatEur(data.financieel.verkoopprijs));
    }
  } else {
    const label = data.financieel.betaalwijze === "overboeking" ? "Per bank *:" : "Contant:";
    drawTableRow(label, formatEur(data.financieel.verkoopprijs));
  }
  drawTableRow("Totaal:", formatEur(data.financieel.verkoopprijs), true);
  y += 2;

  // Bank footnote
  if (data.financieel.betaalwijze === "overboeking" || data.financieel.betaalwijze === "combinatie") {
    setFont("italic", 7);
    setColor(LIGHT);
    const note = "* Bij betaling per bank dient het bedrag op de dag van aflevering op onze bankrekening onder vermelding van het aangekochte kenteken, te zijn bijgeschreven.";
    const noteLines = doc.splitTextToSize(note, cw);
    doc.text(noteLines, ml, y + 2);
    y += noteLines.length * 3 + 4;
  }

  y += 6;

  // ── OVERZICHT ──
  checkPage(40);
  sectionTitle("Overzicht");

  const margeText = " (marge)";
  drawTableRow("Voertuig:", `${formatEur(data.financieel.verkoopprijs)}${margeText}`);

  if (data.garantie.kosten && data.garantie.kosten > 0 && data.garantie.betaler !== "dealer") {
    const gLabel = data.garantie.type === "autotrust" ? "AutoTrust garantie:" : "Garantie:";
    drawTableRow(gLabel, formatEur(data.garantie.kosten));
  }

  const extraKosten = data.garantie.kosten && data.garantie.betaler !== "dealer" ? data.garantie.kosten : 0;
  const subtotaal = data.financieel.verkoopprijs + extraKosten;

  drawTableRow("Subtotaal:", formatEur(subtotaal));
  drawTableRow("Totaal te voldoen:", formatEur(subtotaal), true);

  if (data.financieel.aanbetalingActief && data.financieel.aanbetalingsbedrag) {
    drawTableRow("Aanbetaling:", `- ${formatEur(data.financieel.aanbetalingsbedrag)}`);
    const nog = subtotaal - (data.financieel.aanbetalingsbedrag || 0);
    drawTableRow("Nog te voldoen:", formatEur(nog), true);
  }
  y += 4;

  // ── OPMERKING ──
  checkPage(16);
  let opmerking = "";
  if (data.garantie.type === "geen") {
    opmerking = "Het voertuig wordt verkocht zonder garantie, in de staat zoals bezichtigd en geaccepteerd door koper.";
  } else if (data.garantie.type === "autotrust") {
    opmerking = `Op het voertuig is een AutoTrust garantie van toepassing voor een periode van ${data.garantie.maanden || 3} maanden na aflevering. De garantievoorwaarden zijn vastgelegd in een separaat garantiecertificaat.`;
  } else {
    opmerking = `Op het voertuig is een garantie van Platin Automotive van toepassing voor een periode van ${data.garantie.maanden || 3} maanden na aflevering.`;
  }
  if (data.garantie.kosten && data.garantie.kosten > 0) {
    const betalerTxt = data.garantie.betaler === "klant" ? "De kosten zijn voor rekening van koper." : data.garantie.betaler === "gedeeld" ? "De kosten worden gedeeld tussen verkoper en koper." : "De kosten zijn voor rekening van verkoper.";
    opmerking += ` ${betalerTxt}`;
  }
  if (data.opmerkingen) opmerking += ` ${data.opmerkingen}`;

  setFont("bold", 9);
  setColor(DARK);
  doc.text("Opmerking:", ml, y);
  setFont("italic", 8.5);
  setColor(BODY);
  const opmLines = doc.splitTextToSize(opmerking, cw);
  doc.text(opmLines, ml, y + 5);
  y += 5 + opmLines.length * 4 + 4;

  // ── VERWACHTE DATUM LEVERING ──
  checkPage(16);
  sectionTitle("Verwachte datum levering:");
  setFont("normal", 9);
  setColor(BODY);
  doc.text(data.afleverDatum ? formatDate(data.afleverDatum) : "Nader overeen te komen", ml, y);
  y += 10;

  // ── Wwft note ──
  if (data.wwftBevestigd || (data.financieel.contantBedrag && data.financieel.contantBedrag > 3000)) {
    checkPage(14);
    setFont("italic", 7);
    setColor(LIGHT);
    const wwft = "In het kader van de Wwft is het wettelijk maximum voor contante betalingen bij aankoop van een voertuig € 3.000. Bedragen boven € 3.000 dienen per bankoverschrijving te worden voldaan.";
    const wwftLines = doc.splitTextToSize(wwft, cw);
    doc.text(wwftLines, ml, y);
    y += wwftLines.length * 3 + 6;
  }

  // ── ONDERTEKENING ──
  checkPage(45);
  y += 4;

  setFont("normal", 9);
  setColor(BODY);
  doc.text("Datum: ...............................", ml, y);
  y += 12;

  setFont("normal", 9);
  setColor(BODY);
  doc.text("Verkoper: ...............................", ml, y);

  const col2X = pw / 2 + 8;
  doc.text("Koper: ...............................", col2X, y);
  y += 16;

  // Algemene voorwaarden
  setFont("italic", 7.5);
  setColor(LIGHT);
  doc.text("Op deze overeenkomst zijn onze algemene voorwaarden van toepassing.", ml, y);

  return doc;
}

export function printKoopovereenkomst(data: KoopovereenkomstData) {
  const doc = buildKoopovereenkomstDoc(data);
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url);
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

export function downloadKoopovereenkomst(data: KoopovereenkomstData) {
  const doc = buildKoopovereenkomstDoc(data);
  doc.save(`Koopovereenkomst_${data.voertuig.merk}_${data.voertuig.model}_${data.voertuig.kenteken || "onbekend"}.pdf`);
}

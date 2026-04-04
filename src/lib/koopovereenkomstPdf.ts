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

// Brand colors
const DARK = { r: 26, g: 26, b: 30 };        // #1a1a1e
const MID_GRAY = { r: 100, g: 100, b: 100 };
const LIGHT_GRAY = { r: 160, g: 160, b: 160 };
const LINE_COLOR = { r: 200, g: 200, b: 200 };
const BG_LIGHT = { r: 248, g: 248, b: 248 };

export function buildKoopovereenkomstDoc(data: KoopovereenkomstData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = 210;
  const ml = 18;
  const mr = 18;
  const cw = pw - ml - mr;
  let y = 0;

  const setColor = (c: { r: number; g: number; b: number }) => doc.setTextColor(c.r, c.g, c.b);
  const setFont = (style: "normal" | "bold" | "italic", size: number) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
  };

  const checkPage = (needed: number) => {
    if (y + needed > 278) { doc.addPage(); y = 18; }
  };

  const drawLine = () => {
    doc.setDrawColor(LINE_COLOR.r, LINE_COLOR.g, LINE_COLOR.b);
    doc.setLineWidth(0.3);
    doc.line(ml, y, pw - mr, y);
  };

  const sectionTitle = (title: string) => {
    checkPage(14);
    setFont("bold", 11);
    setColor(DARK);
    doc.text(title, ml, y);
    y += 7;
  };

  const fieldRow = (label1: string, val1: string, label2?: string, val2?: string) => {
    checkPage(6);
    const col2X = ml + cw / 2 + 5;

    setFont("bold", 8.5);
    setColor(DARK);
    doc.text(label1, ml, y);
    setFont("normal", 8.5);
    setColor(MID_GRAY);
    doc.text(val1 || "—", ml + 38, y);

    if (label2) {
      setFont("bold", 8.5);
      setColor(DARK);
      doc.text(label2, col2X, y);
      setFont("normal", 8.5);
      setColor(MID_GRAY);
      doc.text(val2 || "—", col2X + 38, y);
    }
    y += 5.5;
  };

  // ── HEADER ──
  doc.setFillColor(DARK.r, DARK.g, DARK.b);
  doc.rect(0, 0, pw, 28, "F");

  setFont("bold", 18);
  doc.setTextColor(255, 255, 255);
  doc.text("PLATIN", ml, 13);
  setFont("normal", 18);
  doc.text("AUTOMOTIVE", ml + doc.getTextWidth("PLATIN") + 2, 13);

  setFont("normal", 7.5);
  doc.setTextColor(180, 180, 180);
  doc.text("Cilinderweg 99 | 2371 DZ Roelofarendsveen | 06-12693825", ml, 20);
  doc.text("info@platinautomotive.nl | platinautomotive.nl", ml, 24);

  // IBAN line
  y = 32;
  setFont("bold", 8);
  setColor(DARK);
  doc.text("IBAN: NL54 INGB 0117 0493 36", ml, y);
  y += 4;

  drawLine();
  y += 8;

  // ── TITLE ──
  setFont("bold", 14);
  setColor(DARK);
  doc.text("KOOPOVEREENKOMST", ml, y);
  y += 10;

  // ── GEGEVENS KOPER ──
  sectionTitle("Gegevens koper");
  fieldRow("Naam:", `${data.klant.voornaam} ${data.klant.achternaam}`, "Telefoon:", data.klant.telefoon);
  fieldRow("Adres:", data.klant.adres, "Email:", data.klant.email || "");
  fieldRow("Postcode / woonplaats:", `${data.klant.postcode} ${data.klant.woonplaats}`, "Geboortedatum:", data.klant.geboortedatum ? formatDate(data.klant.geboortedatum) : "");
  y += 2;
  drawLine();
  y += 8;

  // ── VOERTUIGGEGEVENS ──
  sectionTitle("Voertuiggegevens");
  fieldRow("Merk:", data.voertuig.merk, "Kleur:", data.voertuig.kleur || "—");
  fieldRow("Model:", data.voertuig.model, "Km-stand:", `${(data.voertuig.kilometerstand || 0).toLocaleString("nl-NL")} km`);
  if (data.voertuig.uitvoering) {
    fieldRow("Uitvoering:", data.voertuig.uitvoering, "Bouwjaar:", String(data.voertuig.bouwjaar || ""));
  } else {
    fieldRow("Bouwjaar:", String(data.voertuig.bouwjaar || ""), "Brandstof:", data.voertuig.brandstof || "—");
  }
  fieldRow("Kenteken:", data.voertuig.kenteken || "—");
  fieldRow("Chassisnr:", data.voertuig.vin || "—");
  y += 2;
  drawLine();
  y += 8;

  // ── BETALINGSWIJZE ──
  sectionTitle("Betalingswijze");

  const tableStartY = y;
  const tableW = cw;
  const col1W = tableW * 0.65;
  const col2W = tableW * 0.35;
  const rowH = 7;

  const drawTableRow = (label: string, value: string, isBold = false, hasBg = false) => {
    checkPage(rowH + 2);
    if (hasBg) {
      doc.setFillColor(BG_LIGHT.r, BG_LIGHT.g, BG_LIGHT.b);
      doc.rect(ml, y - 0.5, tableW, rowH, "F");
    }
    doc.setDrawColor(LINE_COLOR.r, LINE_COLOR.g, LINE_COLOR.b);
    doc.setLineWidth(0.2);
    doc.line(ml, y + rowH - 0.5, ml + tableW, y + rowH - 0.5);

    setFont(isBold ? "bold" : "normal", 8.5);
    setColor(DARK);
    doc.text(label, ml + 3, y + 4.5);
    doc.text(value, ml + col1W + col2W - 3, y + 4.5, { align: "right" });
    y += rowH;
  };

  // Betaling rijen
  const betaalwijzeLabel = {
    contant: "Contant",
    overboeking: "Per bank *",
    financiering: "Financiering",
    combinatie: "Combinatie",
  }[data.financieel.betaalwijze] || data.financieel.betaalwijze;

  if (data.financieel.betaalwijze === "combinatie") {
    if (data.financieel.contantBedrag) {
      drawTableRow("Contant:", formatEur(data.financieel.contantBedrag));
    }
    if (data.financieel.overboekingBedrag) {
      drawTableRow("Per bank *:", formatEur(data.financieel.overboekingBedrag));
    }
  } else if (data.financieel.betaalwijze === "financiering") {
    if (data.financieel.financieringBedrag) {
      drawTableRow("Financiering:", formatEur(data.financieel.financieringBedrag));
    }
    if (data.financieel.eigenBijdrage) {
      drawTableRow("Eigen bijdrage:", formatEur(data.financieel.eigenBijdrage));
    }
    if (!data.financieel.financieringBedrag && !data.financieel.eigenBijdrage) {
      drawTableRow(`${betaalwijzeLabel}:`, formatEur(data.financieel.verkoopprijs));
    }
  } else {
    drawTableRow(`${betaalwijzeLabel}:`, formatEur(data.financieel.verkoopprijs));
  }

  drawTableRow("Totaal:", formatEur(data.financieel.verkoopprijs), true, true);
  y += 2;

  // Footnote for bank
  if (data.financieel.betaalwijze === "overboeking" || data.financieel.betaalwijze === "combinatie") {
    setFont("italic", 7);
    setColor(LIGHT_GRAY);
    const note = "* Bij betaling per bank dient het bedrag op de dag van aflevering op onze bankrekening onder vermelding van het kenteken, te zijn bijgeschreven.";
    const noteLines = doc.splitTextToSize(note, cw);
    doc.text(noteLines, ml, y + 3);
    y += noteLines.length * 3.5 + 2;
  }

  y += 4;
  drawLine();
  y += 8;

  // ── OVERZICHT ──
  sectionTitle("Overzicht");

  const margeText = data.financieel.betaalwijze !== "financiering" ? " (marge)" : "";
  drawTableRow("Voertuig:", `${formatEur(data.financieel.verkoopprijs)}${margeText}`);

  // Garantiekosten apart als klant betaalt
  if (data.garantie.kosten && data.garantie.kosten > 0 && data.garantie.betaler !== "dealer") {
    const garantieLabel = data.garantie.betaler === "gedeeld"
      ? `Garantie (${data.garantie.type === "autotrust" ? "AutoTrust" : "eigen"}, gedeeld):`
      : `Garantie (${data.garantie.type === "autotrust" ? "AutoTrust" : "eigen"}):`;
    drawTableRow(garantieLabel, formatEur(data.garantie.kosten));
  }

  const subtotaal = data.financieel.verkoopprijs + (
    data.garantie.kosten && data.garantie.betaler !== "dealer" ? data.garantie.kosten : 0
  );
  drawTableRow("Subtotaal:", formatEur(subtotaal));
  drawTableRow("Totaal te voldoen:", formatEur(subtotaal), true, true);

  if (data.financieel.aanbetalingActief && data.financieel.aanbetalingsbedrag) {
    drawTableRow("Aanbetaling:", `€ -${Math.abs(data.financieel.aanbetalingsbedrag).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}`);
    const nog = subtotaal - (data.financieel.aanbetalingsbedrag || 0);
    drawTableRow("Nog te voldoen:", formatEur(nog), true, true);
  }

  y += 4;

  // ── OPMERKING (garantie) ──
  checkPage(16);
  let opmerking = "";
  if (data.garantie.type === "geen") {
    opmerking = "Het voertuig wordt verkocht zonder garantie, in de staat zoals bezichtigd en geaccepteerd door koper.";
  } else if (data.garantie.type === "autotrust") {
    opmerking = `Op het voertuig is een AutoTrust garantie van toepassing voor een periode van ${data.garantie.maanden || 3} maanden na aflevering. De garantievoorwaarden zijn vastgelegd in een separaat garantiecertificaat.`;
  } else {
    opmerking = `Op het voertuig is een garantie van Platin Automotive van toepassing voor een periode van ${data.garantie.maanden || 3} maanden na aflevering.`;
  }

  if (data.opmerkingen) {
    opmerking += ` ${data.opmerkingen}`;
  }

  setFont("bold", 8.5);
  setColor(DARK);
  doc.text("Opmerking:", ml, y);
  setFont("normal", 8.5);
  setColor(MID_GRAY);
  const opmLines = doc.splitTextToSize(opmerking, cw - 24);
  doc.text(opmLines, ml + 24, y);
  y += Math.max(opmLines.length * 4, 5) + 4;

  // ── VERWACHTE DATUM LEVERING ──
  if (data.afleverDatum) {
    y += 2;
    sectionTitle("Verwachte datum levering:");
    setFont("normal", 9);
    setColor(MID_GRAY);
    doc.text(formatDate(data.afleverDatum), ml, y);
    y += 8;
  }

  // ── Wwft ──
  if (data.wwftBevestigd || (data.financieel.contantBedrag && data.financieel.contantBedrag > 3000)) {
    checkPage(20);
    setFont("italic", 7.5);
    setColor(MID_GRAY);
    const wwft = "In het kader van de Wwft is het wettelijk maximum voor contante betalingen bij aankoop van een voertuig € 3.000. Bedragen boven € 3.000 dienen per bankoverschrijving te worden voldaan.";
    const wwftLines = doc.splitTextToSize(wwft, cw);
    doc.text(wwftLines, ml, y);
    y += wwftLines.length * 3.5 + 6;
  }

  // ── ONDERTEKENING ──
  checkPage(50);
  y += 4;
  drawLine();
  y += 10;

  const colW = (cw - 16) / 2;

  // Datum lijn
  setFont("normal", 9);
  setColor(MID_GRAY);
  doc.text("Datum: ...............................", ml, y);
  y += 12;

  // Verkoper
  setFont("bold", 9);
  setColor(DARK);
  doc.text("Verkoper:", ml, y);
  doc.text("Koper:", ml + colW + 16, y);
  y += 8;

  setFont("normal", 8.5);
  setColor(MID_GRAY);
  doc.text("...............................", ml, y);
  doc.text("...............................", ml + colW + 16, y);
  y += 14;

  // Algemene voorwaarden
  setFont("italic", 7);
  setColor(LIGHT_GRAY);
  doc.text("Op deze overeenkomst zijn de algemene voorwaarden van Platin Automotive van toepassing.", ml, y);

  // Footer lijn
  doc.setDrawColor(DARK.r, DARK.g, DARK.b);
  doc.setLineWidth(0.5);
  doc.line(0, 290, pw, 290);
  setFont("normal", 6.5);
  doc.setTextColor(LIGHT_GRAY.r, LIGHT_GRAY.g, LIGHT_GRAY.b);
  doc.text("Platin Automotive · Cilinderweg 99 · 2371 DZ Roelofarendsveen · KvK 99146193", pw / 2, 294, { align: "center" });

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

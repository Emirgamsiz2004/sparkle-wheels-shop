import jsPDF from "jspdf";

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

const formatKenteken = (k?: string | null) => {
  if (!k) return "-";
  return k.toUpperCase().replace(/\s+/g, "");
};

export function generateAanbetalingsbewijsPdf(data: AanbetalingsbewijsData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = 210;
  const ph = 297;
  const ml = 18;
  const mr = 18;
  const cw = pw - ml - mr;

  // ─── Brand colors ───────────────────────────
  const ink = [17, 17, 17] as const;          // near-black
  const subtle = [110, 110, 110] as const;    // muted grey
  const line = [225, 225, 225] as const;      // hairline
  const accentBg = [245, 245, 245] as const;  // soft grey card
  const success = [34, 134, 58] as const;     // confirmation green

  // ═══════════════════════════════════════════
  // HEADER BAR (full-width black)
  // ═══════════════════════════════════════════
  doc.setFillColor(...ink);
  doc.rect(0, 0, pw, 32, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("PLATIN AUTOMOTIVE", ml, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(190, 190, 190);
  doc.text("Cilinderweg 99  ·  2371 DZ Roelofarendsveen  ·  06 8282 3050", ml, 22);
  doc.text("info@platinautomotive.nl  ·  www.platinautomotive.nl  ·  KvK 99146193", ml, 27);

  // Document label (right side of header)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("AANBETALINGSBEWIJS", pw - mr, 15, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(190, 190, 190);
  if (data.bewijsNummer) {
    doc.text(`Nr. ${data.bewijsNummer}`, pw - mr, 22, { align: "right" });
  }
  doc.text(formatDate(data.datum), pw - mr, 27, { align: "right" });

  // ═══════════════════════════════════════════
  let y = 48;

  // Title block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...ink);
  doc.text("Aanbetaling ontvangen", ml, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...subtle);
  doc.text(
    "Hierbij bevestigen wij de ontvangst van uw aanbetaling voor het hieronder",
    ml,
    y,
  );
  y += 4.5;
  doc.text("vermelde voertuig. Dit document dient als officieel ontvangstbewijs.", ml, y);
  y += 14;

  // ═══════════════════════════════════════════
  // BEDRAG HIGHLIGHT CARD
  // ═══════════════════════════════════════════
  const cardH = 28;
  doc.setFillColor(...accentBg);
  doc.roundedRect(ml, y, cw, cardH, 2, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...subtle);
  doc.text("ONTVANGEN AANBETALING", ml + 6, y + 9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...ink);
  doc.text(formatEur(data.aanbetalingsbedrag), ml + 6, y + 21);

  // Status badge (right side)
  const badgeText = "BETAALD";
  const badgeW = 28;
  const badgeH = 8;
  const badgeX = ml + cw - badgeW - 6;
  const badgeY = y + 9;
  doc.setFillColor(...success);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(badgeText, badgeX + badgeW / 2, badgeY + 5.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...subtle);
  doc.text(`Ontvangen op ${formatDate(data.datum)}`, ml + cw - 6, y + 21, {
    align: "right",
  });

  y += cardH + 12;

  // ═══════════════════════════════════════════
  // TWO COLUMN INFO: KLANT + VOERTUIG
  // ═══════════════════════════════════════════
  const colGap = 8;
  const colW = (cw - colGap) / 2;
  const colTop = y;

  // Helper for section label
  const sectionLabel = (text: string, x: number, yy: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...subtle);
    doc.text(text.toUpperCase(), x, yy);
    doc.setDrawColor(...line);
    doc.setLineWidth(0.3);
    doc.line(x, yy + 2, x + colW, yy + 2);
  };

  const kvRow = (label: string, value: string, x: number, yy: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...subtle);
    doc.text(label, x, yy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...ink);
    doc.text(value || "-", x, yy + 4.5);
  };

  // Linker kolom: Klantgegevens
  let yL = colTop;
  sectionLabel("Klantgegevens", ml, yL);
  yL += 8;
  kvRow("Naam", data.klantNaam || "-", ml, yL);
  yL += 11;
  if (data.klantEmail) {
    kvRow("E-mail", data.klantEmail, ml, yL);
    yL += 11;
  }

  // Rechter kolom: Voertuig
  let yR = colTop;
  const xR = ml + colW + colGap;
  sectionLabel("Voertuig", xR, yR);
  yR += 8;
  const v = data.voertuig;
  const voertuigText = `${v.merk || ""} ${v.model || ""}`.trim() || "-";
  kvRow("Merk & model", voertuigText, xR, yR);
  yR += 11;
  kvRow("Kenteken", formatKenteken(v.kenteken), xR, yR);
  yR += 11;
  if (v.bouwjaar) {
    kvRow("Bouwjaar", String(v.bouwjaar), xR, yR);
    yR += 11;
  }

  y = Math.max(yL, yR) + 8;

  // ═══════════════════════════════════════════
  // INRUIL (optioneel)
  // ═══════════════════════════════════════════
  if (data.inruil) {
    sectionLabel("Inruilvoertuig", ml, y);
    y += 8;
    const inrText = `${data.inruil.merk || ""} ${data.inruil.model || ""}`.trim();
    if (inrText) {
      kvRow("Voertuig", inrText, ml, y);
    }
    if (data.inruil.kenteken) {
      kvRow("Kenteken", formatKenteken(data.inruil.kenteken), ml + colW + colGap, y);
    }
    y += 11;
    kvRow("Inruilwaarde", formatEur(data.inruil.waarde), ml, y);
    y += 14;
  }

  // ═══════════════════════════════════════════
  // FINANCIEEL OVERZICHT (tabel)
  // ═══════════════════════════════════════════
  sectionLabel("Financieel overzicht", ml, y);
  y += 10;

  const fRow = (label: string, value: string, opts: { bold?: boolean; muted?: boolean; total?: boolean } = {}) => {
    if (opts.total) {
      doc.setFillColor(...accentBg);
      doc.rect(ml, y - 4, cw, 8, "F");
    }
    doc.setFont("helvetica", opts.bold || opts.total ? "bold" : "normal");
    doc.setFontSize(opts.total ? 11 : 9.5);
    doc.setTextColor(...(opts.muted ? subtle : ink));
    doc.text(label, ml + 3, y + 1);
    doc.text(value, ml + cw - 3, y + 1, { align: "right" });
    y += 7;

    if (!opts.total) {
      doc.setDrawColor(...line);
      doc.setLineWidth(0.2);
      doc.line(ml, y - 2, ml + cw, y - 2);
    }
  };

  fRow("Verkoopprijs voertuig", formatEur(data.verkoopprijs));
  if (data.inruil) {
    fRow("Inruilwaarde", `− ${formatEur(data.inruil.waarde)}`, { muted: true });
  }
  fRow("Reeds aanbetaald", `− ${formatEur(data.aanbetalingsbedrag)}`, { bold: true });
  if (data.betaalwijze) {
    fRow("Betaalmethode", data.betaalwijze, { muted: true });
  }
  y += 1;
  fRow("Resterend te voldoen bij levering", formatEur(data.restbedrag), { total: true });

  if (data.leverdatum) {
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...subtle);
    doc.text("Verwachte leverdatum", ml + 3, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ink);
    doc.text(formatDate(data.leverdatum), ml + cw - 3, y, { align: "right" });
    y += 6;
  }

  y += 12;

  // ═══════════════════════════════════════════
  // DIGITALE BEVESTIGING (vervangt handtekeningen)
  // ═══════════════════════════════════════════
  const confH = 26;
  doc.setDrawColor(...line);
  doc.setLineWidth(0.3);
  doc.roundedRect(ml, y, cw, confH, 2, 2, "S");

  // Linker kant: checkmark + label
  doc.setFillColor(...success);
  doc.circle(ml + 8, y + confH / 2, 3.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("✓", ml + 8, y + confH / 2 + 1.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...ink);
  doc.text("Digitaal bevestigd", ml + 16, y + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...subtle);
  doc.text(
    "Deze aanbetaling is op afstand voldaan en automatisch verwerkt.",
    ml + 16,
    y + 16,
  );
  doc.text(
    "Een fysieke handtekening is daarom niet vereist.",
    ml + 16,
    y + 20,
  );

  // Rechter kant: timestamp
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...subtle);
  doc.text("Bevestigd op", ml + cw - 6, y + 11, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...ink);
  doc.text(formatDate(data.datum), ml + cw - 6, y + 16, { align: "right" });

  y += confH + 10;

  // ═══════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════
  doc.setDrawColor(...line);
  doc.setLineWidth(0.3);
  doc.line(ml, ph - 18, pw - mr, ph - 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...subtle);
  doc.text(
    "Platin Automotive  ·  Cilinderweg 99, 2371 DZ Roelofarendsveen  ·  KvK 99146193",
    pw / 2,
    ph - 13,
    { align: "center" },
  );
  doc.text(
    "Dit is een automatisch gegenereerd document en is geldig zonder handtekening.",
    pw / 2,
    ph - 9,
    { align: "center" },
  );

  return doc;
}

export function openAanbetalingsbewijsPdf(data: AanbetalingsbewijsData) {
  const doc = generateAanbetalingsbewijsPdf(data);
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

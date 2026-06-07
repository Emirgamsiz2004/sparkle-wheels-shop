import jsPDF from "jspdf";

interface AanbetalingPdfData {
  voertuig: {
    merk: string;
    model: string;
    bouwjaar: number;
    kenteken: string;
    kilometerstand: number;
    vin: string;
  };
  klant: {
    voornaam: string;
    achternaam: string;
    adres: string;
    postcode: string;
    woonplaats: string;
    telefoon: string;
    email: string;
  };
  financieel: {
    verkoopprijs: number;
    aanbetalingsbedrag: number;
    restbedrag: number;
    uiterlijkeDatum: string;
  };
  betaalwijze?: "bank" | "contant" | "combinatie";
  contantBedrag?: number;
  datum: string;
  plaats: string;
  verkoperHandtekeningDataUrl?: string;
}

const formatEur = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);

const formatDate = (d: string) => {
  if (!d) return "";
  const parts = d.split("-");
  if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return d;
};

function buildDoc(data: AanbetalingPdfData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = 210;
  const ph = 297;
  const ml = 22;
  const mr = 22;
  const cw = pw - ml - mr;
  let y = 26;

  doc.setTextColor(0, 0, 0);

  const setFont = (style: "normal" | "bold", size: number) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
  };

  const checkPage = (needed: number) => {
    if (y + needed > ph - 22) {
      doc.addPage();
      y = 22;
    }
  };

  // ───── Titel
  setFont("bold", 30);
  doc.text("AANBETALINGS-", ml, y);
  y += 11;
  doc.text("OVEREENKOMST", ml, y);
  y += 10;

  setFont("normal", 9);
  doc.text(`Datum ${formatDate(data.datum)}   ·   ${data.plaats || "Roelofarendsveen"}`, ml, y);
  y += 12;

  // ───── Partijen
  setFont("bold", 11);
  doc.text("PARTIJEN", ml, y);
  y += 7;
  setFont("normal", 10);
  const verkoper = "Verkoper: Platin Automotive, Cilinderweg 99, 2371 DZ Roelofarendsveen, ingeschreven bij de Kamer van Koophandel onder nummer 99146193.";
  const vLines = doc.splitTextToSize(verkoper, cw);
  doc.text(vLines, ml, y);
  y += vLines.length * 5 + 2;

  const koper = `Koper: ${data.klant.voornaam} ${data.klant.achternaam}, wonende te ${data.klant.adres}, ${data.klant.postcode} ${data.klant.woonplaats}. Tel ${data.klant.telefoon}${data.klant.email ? ` · ${data.klant.email}` : ""}.`;
  const kLines = doc.splitTextToSize(koper, cw);
  doc.text(kLines, ml, y);
  y += kLines.length * 5 + 4;

  const addArtikel = (title: string) => {
    checkPage(14);
    y += 4;
    setFont("bold", 11);
    doc.text(title.toUpperCase(), ml, y);
    y += 7;
    setFont("normal", 10);
  };

  const addParagraph = (text: string) => {
    const lines = doc.splitTextToSize(text, cw);
    checkPage(lines.length * 5 + 2);
    doc.text(lines, ml, y);
    y += lines.length * 5 + 2;
  };

  // Artikel 1
  addArtikel("Artikel 1 – Voertuig");
  const rows: Array<[string, string]> = [
    ["Merk & model", `${data.voertuig.merk} ${data.voertuig.model}`],
    ["Bouwjaar", String(data.voertuig.bouwjaar || "—")],
    ["Kenteken", data.voertuig.kenteken || "—"],
    ["Kilometerstand", `${(data.voertuig.kilometerstand || 0).toLocaleString("nl-NL")} km`],
    ["Chassisnummer", data.voertuig.vin || "—"],
  ];
  rows.forEach(([label, val]) => {
    checkPage(6);
    setFont("normal", 10);
    doc.text(label, ml, y);
    setFont("bold", 10);
    doc.text(val, ml + 55, y);
    y += 5.5;
  });
  y += 2;

  // Artikel 2
  addArtikel("Artikel 2 – Koopprijs en aanbetaling");
  const datumStr = formatDate(data.financieel.uiterlijkeDatum);
  addParagraph(
    `De overeengekomen verkoopprijs bedraagt ${formatEur(data.financieel.verkoopprijs)}. Koper voldoet bij ondertekening een aanbetaling van ${formatEur(data.financieel.aanbetalingsbedrag)}. Het restbedrag van ${formatEur(data.financieel.restbedrag)} dient uiterlijk op ${datumStr} voorafgaand aan de levering te zijn voldaan. Het voertuig wordt niet geleverd voordat de volledige betaling is ontvangen.`
  );

  // Artikel 3
  addArtikel("Artikel 3 – Reservering");
  addParagraph(
    `Door ondertekening en voldoening van de aanbetaling wordt het voertuig gereserveerd voor koper tot uiterlijk ${datumStr}. Na deze datum vervalt de reservering indien het restbedrag niet is voldaan.`
  );

  // Artikel 4
  addArtikel("Artikel 4 – Annulering");
  addParagraph(
    "Bij annulering door koper vervalt de aanbetaling aan Platin Automotive als vergoeding voor gemaakte kosten en gederfde inkomsten. Bij annulering door Platin Automotive wordt de aanbetaling binnen 5 werkdagen teruggestort."
  );

  // Artikel 5
  addArtikel("Artikel 5 – Algemene voorwaarden");
  addParagraph(
    "Op deze overeenkomst zijn de algemene voorwaarden van Platin Automotive van toepassing. Deze zijn overhandigd aan koper en hiervan is kennis genomen."
  );

  // Artikel 6
  addArtikel("Artikel 6 – Toepasselijk recht");
  addParagraph(
    "Op deze overeenkomst is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in het arrondissement waar Platin Automotive is gevestigd."
  );

  // Artikel 7 — Betaalwijze
  addArtikel("Artikel 7 – Betaalwijze (Wwft)");
  let art7 = "Conform de Wet ter voorkoming van witwassen en financieren van terrorisme (Wwft) is het wettelijk maximum voor contante betalingen bij de aankoop van een voertuig vastgesteld op € 3.000. Bedragen boven € 3.000 dienen per bankoverschrijving te worden voldaan.";
  if (data.betaalwijze) {
    const label =
      data.betaalwijze === "bank"
        ? "volledig per bank"
        : data.betaalwijze === "contant"
        ? "volledig contant"
        : "combinatie contant + bank";
    art7 += ` Gekozen betaalwijze: ${label}.`;
    if (data.betaalwijze === "combinatie") {
      art7 += ` Contant ${formatEur(data.contantBedrag || 0)}, per bank ${formatEur(
        data.financieel.verkoopprijs - (data.contantBedrag || 0)
      )}.`;
    }
  }
  addParagraph(art7);

  // Artikel 8 — Ondertekening
  addArtikel("Artikel 8 – Ondertekening");
  addParagraph(
    `Aldus overeengekomen en in tweevoud opgemaakt te ${data.plaats || "Roelofarendsveen"} op ${formatDate(data.datum)}.`
  );

  // Signaturen
  y += 8;
  checkPage(40);
  const colW = (cw - 16) / 2;

  setFont("bold", 11);
  doc.text("VERKOPER", ml, y);
  doc.text("KOPER", ml + colW + 16, y);
  y += 16;

  if (data.verkoperHandtekeningDataUrl) {
    try {
      doc.addImage(data.verkoperHandtekeningDataUrl, "PNG", ml, y - 14, 55, 18);
    } catch {
      // ignore
    }
  }

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(ml, y, ml + colW, y);
  doc.line(ml + colW + 16, y, ml + colW + 16 + colW, y);
  y += 5;
  setFont("normal", 9);
  doc.text("Platin Automotive — Naam & handtekening", ml, y);
  doc.text(`${data.klant.voornaam} ${data.klant.achternaam} — Naam & handtekening`, ml + colW + 16, y);

  return doc;
}

export function generateAanbetalingPDF(data: AanbetalingPdfData) {
  const doc = buildDoc(data);
  const fileName = `Aanbetalingsovereenkomst_${data.voertuig.merk}_${data.voertuig.model}_${
    data.voertuig.kenteken || "onbekend"
  }.pdf`;
  doc.save(fileName);
}

export function generateAanbetalingBlob(data: AanbetalingPdfData): Blob {
  const doc = buildDoc(data);
  return doc.output("blob");
}

export type { AanbetalingPdfData };

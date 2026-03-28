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
  datum: string;
  plaats: string;
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
  const ml = 20;
  const mr = 20;
  const cw = pw - ml - mr;
  let y = 20;

  const setFont = (style: "normal" | "bold" | "italic", size: number) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
  };

  const checkPage = (needed: number) => {
    if (y + needed > 275) { doc.addPage(); y = 20; }
  };

  // Header
  setFont("bold", 18);
  doc.setTextColor(30, 30, 30);
  doc.text("AANBETALINGSOVEREENKOMST", pw / 2, y, { align: "center" });
  y += 4;
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.5);
  doc.line(ml, y, pw - mr, y);
  y += 10;

  // Platin Automotive
  setFont("bold", 10);
  doc.text("Platin Automotive", ml, y);
  y += 5;
  setFont("normal", 9);
  doc.setTextColor(80, 80, 80);
  doc.text("Cilinderweg 99, 2371 DZ Roelofarendsveen", ml, y);
  y += 4;
  doc.text("KvK: 99146193", ml, y);
  y += 4;
  doc.text('Hierna te noemen: "Verkoper"', ml, y);
  y += 8;

  // Koper
  setFont("bold", 10);
  doc.setTextColor(30, 30, 30);
  doc.text("Koper:", ml, y);
  y += 5;
  setFont("normal", 9);
  doc.setTextColor(80, 80, 80);
  doc.text(`${data.klant.voornaam} ${data.klant.achternaam}`, ml, y); y += 4;
  doc.text(`${data.klant.adres}, ${data.klant.postcode} ${data.klant.woonplaats}`, ml, y); y += 4;
  doc.text(`${data.klant.telefoon} | ${data.klant.email}`, ml, y); y += 4;
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

  // Artikel 1
  addArtikel("Artikel 1 — Voertuig");
  doc.text("Koper en verkoper komen overeen dat koper het volgende voertuig aankoopt:", ml, y, { maxWidth: cw });
  y += 7;
  const rows = [
    ["Merk / Model", `${data.voertuig.merk} ${data.voertuig.model}`],
    ["Bouwjaar", String(data.voertuig.bouwjaar || "")],
    ["Kenteken", data.voertuig.kenteken || ""],
    ["Kilometerstand", `${data.voertuig.kilometerstand?.toLocaleString("nl-NL")} km`],
    ["Chassisnummer", data.voertuig.vin || "—"],
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

  // Artikel 2
  addArtikel("Artikel 2 — Koopprijs en aanbetaling");
  const datumStr = formatDate(data.financieel.uiterlijkeDatum);
  const art2 = `De overeengekomen verkoopprijs bedraagt ${formatEur(data.financieel.verkoopprijs)}. Koper voldoet bij ondertekening van deze overeenkomst een aanbetaling van ${formatEur(data.financieel.aanbetalingsbedrag)}. Het restbedrag van ${formatEur(data.financieel.restbedrag)} dient te worden voldaan uiterlijk op ${datumStr} voorafgaand aan de levering van het voertuig. Het voertuig wordt niet geleverd voordat de volledige betaling is ontvangen.`;
  const art2Lines = doc.splitTextToSize(art2, cw);
  checkPage(art2Lines.length * 4 + 4);
  doc.text(art2Lines, ml, y);
  y += art2Lines.length * 4 + 6;

  // Artikel 3
  addArtikel("Artikel 3 — Reservering");
  const art3 = `Door ondertekening van deze overeenkomst en voldoening van de aanbetaling wordt het voertuig gereserveerd voor koper tot uiterlijk ${datumStr}. Na deze datum vervalt de reservering indien het restbedrag niet is voldaan.`;
  const art3Lines = doc.splitTextToSize(art3, cw);
  checkPage(art3Lines.length * 4 + 4);
  doc.text(art3Lines, ml, y);
  y += art3Lines.length * 4 + 6;

  // Artikel 4
  addArtikel("Artikel 4 — Annulering");
  const art4 = "Bij annulering door de koper vervalt de aanbetaling aan Platin Automotive als vergoeding voor de gemaakte kosten en gederfde inkomsten. Bij annulering door Platin Automotive wordt de aanbetaling binnen 5 werkdagen teruggestort aan de koper.";
  const art4Lines = doc.splitTextToSize(art4, cw);
  checkPage(art4Lines.length * 4 + 4);
  doc.text(art4Lines, ml, y);
  y += art4Lines.length * 4 + 6;

  // Artikel 5
  addArtikel("Artikel 5 — Algemene voorwaarden");
  const art5 = "Op deze overeenkomst zijn de algemene voorwaarden van Platin Automotive van toepassing. De algemene voorwaarden zijn overhandigd aan de koper en hiervan is kennis genomen.";
  const art5Lines = doc.splitTextToSize(art5, cw);
  checkPage(art5Lines.length * 4 + 4);
  doc.text(art5Lines, ml, y);
  y += art5Lines.length * 4 + 6;

  // Artikel 6
  addArtikel("Artikel 6 — Toepasselijk recht");
  const art6 = "Op deze overeenkomst is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in het arrondissement waar Platin Automotive is gevestigd.";
  const art6Lines = doc.splitTextToSize(art6, cw);
  checkPage(art6Lines.length * 4 + 4);
  doc.text(art6Lines, ml, y);
  y += art6Lines.length * 4 + 6;

  // Artikel 7 — Betaalwijze
  addArtikel("Artikel 7 — Betaalwijze en wettelijk maximum contante betaling");
  const art7 = `In het kader van de Wet ter voorkoming van witwassen en financieren van terrorisme (Wwft) is het wettelijk maximum voor contante betalingen bij de aankoop van een voertuig vastgesteld op € 3.000. Bedragen boven € 3.000 dienen te worden voldaan per bankoverschrijving op IBAN NL00BANK0000000000 ten name van Platin Automotive onder vermelding van het factuurnummer. Platin Automotive is wettelijk verplicht ongebruikelijke transacties te melden bij de autoriteiten.${data.betaalwijze ? `\n\nGekozen betaalwijze: ${data.betaalwijze === "bank" ? "Volledig per bank" : data.betaalwijze === "contant" ? "Volledig contant" : "Combinatie contant + bank"}${data.betaalwijze === "combinatie" ? `. Contant: ${formatEur(data.contantBedrag || 0)}, per bank: ${formatEur((data.financieel.verkoopprijs - (data.contantBedrag || 0)))}` : ""}` : ""}`;
  const art7Lines = doc.splitTextToSize(art7, cw);
  checkPage(art7Lines.length * 4 + 4);
  doc.text(art7Lines, ml, y);
  y += art7Lines.length * 4 + 6;

  // Artikel 8 — Ondertekening
  addArtikel("Artikel 8 — Ondertekening");
  const ondDatum = formatDate(data.datum);
  doc.text(`Aldus overeengekomen en in tweevoud opgemaakt te ${data.plaats} op ${ondDatum}.`, ml, y, { maxWidth: cw });
  y += 14;

  checkPage(50);
  const colW = (cw - 10) / 2;
  setFont("bold", 9);
  doc.setTextColor(30, 30, 30);
  doc.text("Platin Automotive", ml, y);
  y += 5;
  setFont("normal", 9);
  doc.setTextColor(80, 80, 80);
  doc.text("Naam: Emir Gamsiz", ml, y);
  setFont("bold", 9);
  doc.setTextColor(30, 30, 30);
  doc.text("Koper", ml + colW + 10, y - 5);
  setFont("normal", 9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Naam: ${data.klant.voornaam} ${data.klant.achternaam}`, ml + colW + 10, y);
  y += 6;
  doc.text("Handtekening:", ml, y);
  doc.text("Handtekening:", ml + colW + 10, y);
  y += 3;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(ml, y + 20, ml + colW, y + 20);
  doc.line(ml + colW + 10, y + 20, ml + colW + 10 + colW, y + 20);

  return doc;
}

export function generateAanbetalingPDF(data: AanbetalingPdfData) {
  const doc = buildDoc(data);
  const fileName = `Aanbetalingsovereenkomst_${data.voertuig.merk}_${data.voertuig.model}_${data.voertuig.kenteken || "onbekend"}.pdf`;
  doc.save(fileName);
}

export function generateAanbetalingBlob(data: AanbetalingPdfData): Blob {
  const doc = buildDoc(data);
  return doc.output("blob");
}

export type { AanbetalingPdfData };

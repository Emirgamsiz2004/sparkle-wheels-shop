import jsPDF from "jspdf";

export interface KoopovereenkomstData {
  voertuig: {
    merk: string;
    model: string;
    bouwjaar: number;
    kenteken: string;
    kilometerstand: number;
    vin?: string;
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
}

const formatEur = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);

const formatDate = (d: string) => {
  if (!d) return "";
  const parts = d.split("-");
  if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return d;
};

export function buildKoopovereenkomstDoc(data: KoopovereenkomstData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = 210;
  const ml = 20;
  const mr = 20;
  const cw = pw - ml - mr;
  let y = 0;

  const setFont = (style: "normal" | "bold" | "italic", size: number) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
  };

  const checkPage = (needed: number) => {
    if (y + needed > 275) { doc.addPage(); y = 20; }
  };

  // Header bar - anthracite
  doc.setFillColor(35, 35, 40);
  doc.rect(0, 0, pw, 32, "F");
  setFont("bold", 16);
  doc.setTextColor(255, 255, 255);
  doc.text("PLATIN AUTOMOTIVE", ml, 14);
  setFont("normal", 8);
  doc.setTextColor(180, 180, 180);
  doc.text("Cilinderweg 99, 2371 DZ Roelofarendsveen  |  KvK: 99146193", ml, 22);
  doc.text("info@platinautomotive.nl  |  platinautomotive.nl", ml, 27);

  y = 42;

  // Title
  setFont("bold", 14);
  doc.setTextColor(35, 35, 40);
  doc.text("KOOPOVEREENKOMST", pw / 2, y, { align: "center" });
  y += 3;
  doc.setDrawColor(35, 35, 40);
  doc.setLineWidth(0.5);
  doc.line(ml, y, pw - mr, y);
  y += 10;

  // Verkoper
  setFont("bold", 10);
  doc.setTextColor(35, 35, 40);
  doc.text("Verkoper", ml, y);
  y += 5;
  setFont("normal", 9);
  doc.setTextColor(80, 80, 80);
  doc.text("Platin Automotive", ml, y); y += 4;
  doc.text("Cilinderweg 99, 2371 DZ Roelofarendsveen", ml, y); y += 4;
  doc.text("KvK: 99146193", ml, y); y += 4;
  doc.text('Hierna te noemen: "Verkoper"', ml, y);
  y += 8;

  // Koper
  setFont("bold", 10);
  doc.setTextColor(35, 35, 40);
  doc.text("Koper", ml, y);
  y += 5;
  setFont("normal", 9);
  doc.setTextColor(80, 80, 80);
  doc.text(`${data.klant.voornaam} ${data.klant.achternaam}`, ml, y); y += 4;
  doc.text(`${data.klant.adres}, ${data.klant.postcode} ${data.klant.woonplaats}`, ml, y); y += 4;
  doc.text(`Tel: ${data.klant.telefoon}${data.klant.email ? ` | ${data.klant.email}` : ""}`, ml, y); y += 4;
  if (data.klant.geboortedatum) {
    doc.text(`Geboortedatum: ${formatDate(data.klant.geboortedatum)}`, ml, y); y += 4;
  }
  doc.text('Hierna te noemen: "Koper"', ml, y);
  y += 10;

  const addArtikel = (title: string) => {
    checkPage(14);
    setFont("bold", 10);
    doc.setTextColor(35, 35, 40);
    doc.text(title, ml, y);
    y += 6;
    setFont("normal", 9);
    doc.setTextColor(60, 60, 60);
  };

  // Artikel 1 — Voertuig
  addArtikel("Artikel 1 — Voertuig");
  doc.text("Verkoper verkoopt en koper koopt het volgende voertuig:", ml, y); y += 7;
  const rows = [
    ["Merk / Model", `${data.voertuig.merk} ${data.voertuig.model}`],
    ["Bouwjaar", String(data.voertuig.bouwjaar || "")],
    ["Kenteken", data.voertuig.kenteken || ""],
    ["Kilometerstand", `${(data.voertuig.kilometerstand || 0).toLocaleString("nl-NL")} km`],
    ["Chassisnummer", data.voertuig.vin || "—"],
  ];
  rows.forEach(([label, val]) => {
    checkPage(5);
    setFont("normal", 9);
    doc.setTextColor(100, 100, 100);
    doc.text(label + ":", ml + 4, y);
    doc.setTextColor(35, 35, 40);
    doc.text(val, ml + 55, y);
    y += 5;
  });
  y += 5;

  // Artikel 2 — Koopprijs
  addArtikel("Artikel 2 — Koopprijs en betaling");
  let betaalTekst = `De overeengekomen koopprijs bedraagt ${formatEur(data.financieel.verkoopprijs)}.`;
  if (data.financieel.betaalwijze === "contant") {
    betaalTekst += " De betaling geschiedt volledig contant bij aflevering.";
  } else if (data.financieel.betaalwijze === "overboeking") {
    betaalTekst += " De betaling geschiedt per bankoverschrijving op IBAN NL00BANK0000000000 t.n.v. Platin Automotive.";
  } else if (data.financieel.betaalwijze === "financiering") {
    betaalTekst += " De betaling geschiedt via financiering.";
  } else if (data.financieel.betaalwijze === "combinatie") {
    betaalTekst += ` De betaling geschiedt als volgt: ${formatEur(data.financieel.contantBedrag || 0)} contant en ${formatEur(data.financieel.overboekingBedrag || 0)} per bankoverschrijving.`;
  }
  if (data.financieel.aanbetalingActief && data.financieel.aanbetalingsbedrag) {
    betaalTekst += ` Er is een aanbetaling gedaan van ${formatEur(data.financieel.aanbetalingsbedrag)}. Het restbedrag van ${formatEur(data.financieel.restbedrag || 0)} dient te worden voldaan voor aflevering.`;
  }
  const art2Lines = doc.splitTextToSize(betaalTekst, cw);
  checkPage(art2Lines.length * 4 + 4);
  doc.text(art2Lines, ml, y);
  y += art2Lines.length * 4 + 6;

  // Artikel 3 — Garantie
  addArtikel("Artikel 3 — Garantie");
  let garantieTekst = "";
  if (data.garantie.type === "geen") {
    garantieTekst = "Het voertuig wordt verkocht zonder garantie. Koper verklaart het voertuig te hebben geïnspecteerd en accepteert het voertuig in de huidige staat.";
  } else if (data.garantie.type === "autotrust") {
    garantieTekst = `Op het voertuig is een AutoTrust garantie van toepassing voor een periode van ${data.garantie.maanden || 3} maanden na aflevering. De garantievoorwaarden zijn vastgelegd in een separaat garantiecertificaat.`;
  } else {
    garantieTekst = `Op het voertuig is een garantie van Platin Automotive van toepassing voor een periode van ${data.garantie.maanden || 3} maanden na aflevering.`;
  }
  const art3Lines = doc.splitTextToSize(garantieTekst, cw);
  checkPage(art3Lines.length * 4 + 4);
  doc.text(art3Lines, ml, y);
  y += art3Lines.length * 4 + 6;

  // Artikel 4 — Levering
  addArtikel("Artikel 4 — Levering en risico-overgang");
  const art4 = "Het risico van het voertuig gaat over op koper op het moment van aflevering. Koper is verplicht het voertuig op het afgesproken tijdstip af te halen. Bij niet-afhaling binnen 7 dagen na de afgesproken datum is verkoper gerechtigd opslagkosten in rekening te brengen.";
  const art4Lines = doc.splitTextToSize(art4, cw);
  checkPage(art4Lines.length * 4 + 4);
  doc.text(art4Lines, ml, y);
  y += art4Lines.length * 4 + 6;

  // Artikel 5 — Algemene voorwaarden
  addArtikel("Artikel 5 — Algemene voorwaarden");
  const art5 = "Op deze overeenkomst zijn de algemene voorwaarden van Platin Automotive van toepassing. Een exemplaar van de algemene voorwaarden is aan de koper overhandigd.";
  const art5Lines = doc.splitTextToSize(art5, cw);
  checkPage(art5Lines.length * 4 + 4);
  doc.text(art5Lines, ml, y);
  y += art5Lines.length * 4 + 6;

  // Artikel 6 — Toepasselijk recht
  addArtikel("Artikel 6 — Toepasselijk recht");
  const art6 = "Op deze overeenkomst is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in het arrondissement waar Platin Automotive is gevestigd.";
  const art6Lines = doc.splitTextToSize(art6, cw);
  checkPage(art6Lines.length * 4 + 4);
  doc.text(art6Lines, ml, y);
  y += art6Lines.length * 4 + 6;

  // Wwft artikel if applicable
  if (data.wwftBevestigd || (data.financieel.contantBedrag && data.financieel.contantBedrag > 3000)) {
    addArtikel("Artikel 7 — Wwft en contante betaling");
    const art7 = "In het kader van de Wet ter voorkoming van witwassen en financieren van terrorisme (Wwft) is het wettelijk maximum voor contante betalingen bij de aankoop van een voertuig vastgesteld op € 3.000. Bedragen boven € 3.000 dienen te worden voldaan per bankoverschrijving. Platin Automotive is wettelijk verplicht ongebruikelijke transacties te melden bij de autoriteiten. Koper verklaart kennis te hebben genomen van deze verplichting.";
    const art7Lines = doc.splitTextToSize(art7, cw);
    checkPage(art7Lines.length * 4 + 4);
    doc.text(art7Lines, ml, y);
    y += art7Lines.length * 4 + 6;
  }

  // Ondertekening
  const artNr = data.wwftBevestigd ? "Artikel 8" : "Artikel 7";
  addArtikel(`${artNr} — Ondertekening`);
  doc.text(`Aldus overeengekomen en in tweevoud opgemaakt te ${data.plaats} op ${formatDate(data.datum)}.`, ml, y, { maxWidth: cw });
  y += 14;

  checkPage(55);
  const colW = (cw - 10) / 2;

  // Left - Verkoper
  setFont("bold", 9);
  doc.setTextColor(35, 35, 40);
  doc.text("Verkoper", ml, y);
  y += 5;
  setFont("normal", 9);
  doc.setTextColor(80, 80, 80);
  doc.text("Naam: Platin Automotive", ml, y);
  doc.text(`Datum: ${formatDate(data.datum)}`, ml, y + 5);

  // Right - Koper
  setFont("bold", 9);
  doc.setTextColor(35, 35, 40);
  doc.text("Koper", ml + colW + 10, y - 5);
  setFont("normal", 9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Naam: ${data.klant.voornaam} ${data.klant.achternaam}`, ml + colW + 10, y);
  doc.text(`Datum: ${formatDate(data.datum)}`, ml + colW + 10, y + 5);

  y += 12;
  doc.text("Handtekening:", ml, y);
  doc.text("Handtekening:", ml + colW + 10, y);
  y += 3;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(ml, y + 20, ml + colW, y + 20);
  doc.line(ml + colW + 10, y + 20, ml + colW + 10 + colW, y + 20);

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

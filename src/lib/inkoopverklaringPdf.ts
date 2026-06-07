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

  const setFont = (style: "normal" | "bold", size: number) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
  };

  doc.setTextColor(0, 0, 0);
  let y = 26;

  // ───── Titel
  setFont("bold", 30);
  doc.text("INKOOP-", ml, y);
  y += 11;
  doc.text("VERKLARING", ml, y);
  y += 10;

  setFont("normal", 9);
  doc.text(`Document ${data.documentNaam}   ·   Datum ${formatDate(data.datum)}   ·   Roelofarendsveen`, ml, y);
  y += 12;

  // ───── Inleidende alinea
  setFont("normal", 10);
  const intro = `Ondergetekende verklaart hierbij het hieronder omschreven voertuig te hebben verkocht en geleverd aan Platin Automotive, Cilinderweg 99, 2371 DZ Roelofarendsveen, ingeschreven bij de Kamer van Koophandel onder nummer 99146193.`;
  const introLines = doc.splitTextToSize(intro, cw);
  doc.text(introLines, ml, y);
  y += introLines.length * 5 + 4;

  const h2 = (label: string) => {
    y += 4;
    setFont("bold", 11);
    doc.text(label.toUpperCase(), ml, y);
    y += 7;
    setFont("normal", 10);
  };

  const kv = (label: string, value: string) => {
    setFont("normal", 10);
    doc.text(label, ml, y);
    setFont("bold", 10);
    doc.text(value || "—", ml + 55, y);
    y += 5.5;
  };

  // ───── ARTIKEL 1 — Verkoper
  h2("Artikel 1 – Verkoper");
  kv("Naam", data.verkoper.naam);
  kv("Adres", data.verkoper.adres);
  kv("Woonplaats", data.verkoper.woonplaats);
  kv("Telefoon", data.verkoper.telefoon);
  if (data.verkoper.email) kv("E-mail", data.verkoper.email);
  kv("Legitimatie", `${data.legitimatie.type} — nr. ${data.legitimatie.nummer}`);

  // ───── ARTIKEL 2 — Voertuig
  h2("Artikel 2 – Voertuig");
  kv("Merk & model", `${data.voertuig.merk} ${data.voertuig.model}`.trim());
  if (data.voertuig.bouwjaar) kv("Bouwjaar", String(data.voertuig.bouwjaar));
  if (data.voertuig.kenteken) kv("Kenteken", data.voertuig.kenteken);
  if (data.voertuig.kilometerstand) kv("Kilometerstand", `${data.voertuig.kilometerstand.toLocaleString("nl-NL")} km`);
  if (data.voertuig.chassisnummer) kv("Chassisnummer", data.voertuig.chassisnummer);

  // ───── ARTIKEL 3 — Inkoopprijs
  h2("Artikel 3 – Inkoopprijs");
  kv("Inkoopprijs", formatEur(data.inkoopprijs));
  kv("Datum transactie", formatDate(data.datum));

  // ───── ARTIKEL 4 — Verklaring
  h2("Artikel 4 – Verklaring");
  setFont("normal", 10);
  const verklaring = `Ondergetekende verklaart dat het voertuig zijn/haar eigendom is en vrij is van financiële verplichtingen, beslagen, eigendomsvoorbehoud of andere zakelijke rechten van derden. Alle opgegeven gegevens zijn naar waarheid ingevuld. Het voertuig maakt geen onderdeel uit van enig geschil of juridische procedure.`;
  const vLines = doc.splitTextToSize(verklaring, cw);
  doc.text(vLines, ml, y);
  y += vLines.length * 5 + 12;

  // ───── Handtekening
  setFont("bold", 11);
  doc.text("VERKOPER", ml, y);
  y += 14;

  if (data.handtekeningDataUrl) {
    try {
      doc.addImage(data.handtekeningDataUrl, "PNG", ml, y - 12, 60, 22);
    } catch {
      // ignore
    }
  }
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(ml, y, ml + 90, y);
  y += 5;
  setFont("normal", 9);
  doc.text("Naam & handtekening", ml, y);

  return doc;
}

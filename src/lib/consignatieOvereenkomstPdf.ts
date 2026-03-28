import jsPDF from "jspdf";
import { Vehicle } from "@/types/vehicle";

interface PdfData {
  vehicle: Vehicle;
  form: {
    voornaam: string;
    achternaam: string;
    adres: string;
    postcode: string;
    woonplaats: string;
    telefoon: string;
    email: string;
    iban: string;
    vin: string;
    apkTot: string;
    vraagprijs: number;
    minimumprijs: number;
    commissiePercentage: number;
    garantie: "geen" | "platin" | "autotrust";
    aangepastCommissiePercentage: number;
    advertentiekosten: number;
    poetskosten: number;
    overigeKosten: number;
    datum: string;
    plaats: string;
  };
  effectiveCommissie: number;
}

const formatEur = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);

const formatDate = (d: string) => {
  if (!d) return "";
  const parts = d.split("-");
  if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return d;
};

export function generateConsignatieOvereenkomstPDF({ vehicle, form, effectiveCommissie }: PdfData) {
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

  const addText = (text: string, x: number, yPos: number, opts?: { maxWidth?: number; align?: "left" | "center" | "right" }) => {
    doc.text(text, x, yPos, { maxWidth: opts?.maxWidth, align: opts?.align });
  };

  const checkPage = (needed: number) => {
    if (y + needed > 275) {
      doc.addPage();
      y = 20;
    }
  };

  // === Header ===
  setFont("bold", 18);
  doc.setTextColor(30, 30, 30);
  addText("CONSIGNATIEOVEREENKOMST", pw / 2, y, { align: "center" });
  y += 4;

  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.5);
  doc.line(ml, y, pw - mr, y);
  y += 10;

  // === Platin Automotive ===
  setFont("bold", 10);
  addText("Platin Automotive", ml, y);
  y += 5;
  setFont("normal", 9);
  doc.setTextColor(80, 80, 80);
  addText("Cilinderweg 99, 2371 DZ Roelofarendsveen", ml, y);
  y += 4;
  addText("KvK: 99146193", ml, y);
  y += 4;
  addText("Hierna te noemen: \"Platin Automotive\"", ml, y);
  y += 8;

  // === Eigenaar ===
  setFont("bold", 10);
  doc.setTextColor(30, 30, 30);
  addText("Eigenaar:", ml, y);
  y += 5;
  setFont("normal", 9);
  doc.setTextColor(80, 80, 80);
  addText(`${form.voornaam} ${form.achternaam}`, ml, y);
  y += 4;
  addText(`${form.adres}, ${form.postcode} ${form.woonplaats}`, ml, y);
  y += 4;
  addText(`${form.telefoon} | ${form.email}`, ml, y);
  y += 4;
  addText(`IBAN: ${form.iban}`, ml, y);
  y += 4;
  addText("Hierna te noemen: \"Eigenaar\"", ml, y);
  y += 10;

  // === Artikel 1 — Voertuig ===
  const addArtikel = (title: string) => {
    checkPage(12);
    setFont("bold", 10);
    doc.setTextColor(30, 30, 30);
    addText(title, ml, y);
    y += 6;
    setFont("normal", 9);
    doc.setTextColor(60, 60, 60);
  };

  addArtikel("Artikel 1 — Voertuig");
  addText("Eigenaar geeft het volgende voertuig in consignatie aan Platin Automotive:", ml, y, { maxWidth: cw });
  y += 7;

  const voertuigRows = [
    ["Merk / Model", `${vehicle.merk} ${vehicle.model}`],
    ["Bouwjaar", String(vehicle.bouwjaar || "")],
    ["Kenteken", vehicle.kenteken || ""],
    ["Kilometerstand", `${vehicle.kilometerstand?.toLocaleString("nl-NL")} km`],
    ["Chassisnummer", form.vin || "—"],
    ["Kleur", vehicle.kleur || ""],
    ["APK geldig tot", form.apkTot || "—"],
  ];

  voertuigRows.forEach(([label, val]) => {
    checkPage(5);
    setFont("normal", 9);
    doc.setTextColor(100, 100, 100);
    addText(label + ":", ml + 4, y);
    doc.setTextColor(30, 30, 30);
    addText(val, ml + 55, y);
    y += 5;
  });
  y += 5;

  // === Artikel 2 — Verkoopprijs ===
  addArtikel("Artikel 2 — Verkoopprijs");
  const art2 = `De eigenaar stelt een vraagprijs vast van ${formatEur(form.vraagprijs)} en een minimumprijs van ${formatEur(form.minimumprijs)}. Platin Automotive zal het voertuig nooit verkopen onder de overeengekomen minimumprijs. Bij serieuze biedingen zal Platin Automotive altijd eerst overleg plegen met de eigenaar. De eigenaar beslist te allen tijde zelf over de uiteindelijke verkoop.`;
  const art2Lines = doc.splitTextToSize(art2, cw);
  checkPage(art2Lines.length * 4 + 4);
  doc.text(art2Lines, ml, y);
  y += art2Lines.length * 4 + 6;

  // === Artikel 3 — Commissie ===
  addArtikel("Artikel 3 — Commissie");
  const art3 = `Bij verkoop van het voertuig ontvangt Platin Automotive een commissie van ${effectiveCommissie}% over de uiteindelijke verkoopprijs. De eigenaar ontvangt het resterende bedrag zo spoedig mogelijk na ontvangst van de betaling van de koper.`;
  const art3Lines = doc.splitTextToSize(art3, cw);
  checkPage(art3Lines.length * 4 + 4);
  doc.text(art3Lines, ml, y);
  y += art3Lines.length * 4 + 6;

  // === Artikel 4 — Looptijd ===
  addArtikel("Artikel 4 — Looptijd en opzegging");
  const art4a = "Deze overeenkomst wordt aangegaan voor onbepaalde tijd. De eigenaar kan de overeenkomst te allen tijde opzeggen. Bij opzegging door de eigenaar worden de volgende gemaakte kosten in rekening gebracht:";
  const art4aLines = doc.splitTextToSize(art4a, cw);
  checkPage(art4aLines.length * 4 + 20);
  doc.text(art4aLines, ml, y);
  y += art4aLines.length * 4 + 4;

  const opzegRows = [
    ["Advertentiekosten", formatEur(form.advertentiekosten)],
    ["Poetskosten", formatEur(form.poetskosten)],
    ["Overige kosten", formatEur(form.overigeKosten)],
  ];
  opzegRows.forEach(([label, val]) => {
    addText(`• ${label}: ${val}`, ml + 4, y);
    y += 5;
  });
  y += 2;
  const art4b = "Deze kosten zijn niet verschuldigd indien het voertuig via Platin Automotive wordt verkocht.";
  const art4bLines = doc.splitTextToSize(art4b, cw);
  doc.text(art4bLines, ml, y);
  y += art4bLines.length * 4 + 6;

  // === Artikel 5 — Verantwoordelijkheid ===
  addArtikel("Artikel 5 — Verantwoordelijkheid en schade");
  const art5 = "Zolang het voertuig zich bevindt op het terrein van Platin Automotive, is Platin Automotive verantwoordelijk voor eventuele schade aan het voertuig. De staat van het voertuig bij binnenkomst wordt vastgelegd middels foto's en/of een schaderapport. APK-keuring en technische gebreken zijn te allen tijde de verantwoordelijkheid van de eigenaar.";
  const art5Lines = doc.splitTextToSize(art5, cw);
  checkPage(art5Lines.length * 4 + 4);
  doc.text(art5Lines, ml, y);
  y += art5Lines.length * 4 + 6;

  // === Artikel 6 — Garantie ===
  addArtikel("Artikel 6 — Garantie");
  let art6 = "";
  if (form.garantie === "geen") {
    art6 = "De garantieverantwoordelijkheid ligt volledig bij de eigenaar. Platin Automotive aanvaardt geen aansprakelijkheid voor garantieclaims na verkoop.";
  } else if (form.garantie === "platin") {
    art6 = `Platin Automotive neemt de garantieverantwoordelijkheid op zich. Hiervoor geldt een aangepast commissiepercentage van ${form.aangepastCommissiePercentage}%.`;
  } else {
    art6 = "Op dit voertuig wordt een AutoTrust garantiepakket afgesloten. De kosten hiervan zijn voor rekening van de eigenaar. Voor garantieclaims dient de koper rechtstreeks contact op te nemen met AutoTrust. Platin Automotive is geen partij in de garantieovereenkomst.";
  }
  const art6Lines = doc.splitTextToSize(art6, cw);
  checkPage(art6Lines.length * 4 + 4);
  doc.text(art6Lines, ml, y);
  y += art6Lines.length * 4 + 6;

  // === Artikel 7 — Ondertekening ===
  addArtikel("Artikel 7 — Ondertekening");
  const datumStr = formatDate(form.datum);
  addText(`Aldus overeengekomen en in tweevoud opgemaakt te ${form.plaats} op ${datumStr}.`, ml, y, { maxWidth: cw });
  y += 14;

  // Signature boxes
  checkPage(50);
  const colW = (cw - 10) / 2;

  // Left - Platin
  setFont("bold", 9);
  doc.setTextColor(30, 30, 30);
  addText("Platin Automotive", ml, y);
  y += 5;
  setFont("normal", 9);
  doc.setTextColor(80, 80, 80);
  addText("Naam: Emir Gamsiz", ml, y);
  
  // Right - Eigenaar
  setFont("bold", 9);
  doc.setTextColor(30, 30, 30);
  addText("Eigenaar", ml + colW + 10, y - 5);
  setFont("normal", 9);
  doc.setTextColor(80, 80, 80);
  addText(`Naam: ${form.voornaam} ${form.achternaam}`, ml + colW + 10, y);
  y += 6;

  addText("Handtekening:", ml, y);
  addText("Handtekening:", ml + colW + 10, y);
  y += 3;

  // Signature lines
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(ml, y + 20, ml + colW, y + 20);
  doc.line(ml + colW + 10, y + 20, ml + colW + 10 + colW, y + 20);

  // Save
  const fileName = `Consignatieovereenkomst_${vehicle.merk}_${vehicle.model}_${vehicle.kenteken || "onbekend"}.pdf`;
  doc.save(fileName);
}

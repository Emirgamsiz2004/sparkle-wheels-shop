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

function buildConsignatieDoc({ vehicle, form, effectiveCommissie, verkoperHandtekeningDataUrl }: PdfData) {
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

  const addArtikel = (title: string) => {
    checkPage(12);
    setFont("bold", 10);
    doc.setTextColor(30, 30, 30);
    addText(title, ml, y);
    y += 6;
    setFont("normal", 9);
    doc.setTextColor(60, 60, 60);
  };

  // Artikel 1
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

  // Artikel 2
  addArtikel("Artikel 2 — Verkoopprijs");
  const art2 = `De eigenaar stelt een vraagprijs vast van ${formatEur(form.vraagprijs)} en een minimumprijs van ${formatEur(form.minimumprijs)}. Platin Automotive zal het voertuig nooit verkopen onder de overeengekomen minimumprijs. Bij serieuze biedingen zal Platin Automotive altijd eerst overleg plegen met de eigenaar. De eigenaar beslist te allen tijde zelf over de uiteindelijke verkoop.`;
  const art2Lines = doc.splitTextToSize(art2, cw);
  checkPage(art2Lines.length * 4 + 4);
  doc.text(art2Lines, ml, y);
  y += art2Lines.length * 4 + 6;

  // Artikel 3
  addArtikel("Artikel 3 — Commissie");
  const art3 = `Bij verkoop van het voertuig ontvangt Platin Automotive een commissie van ${effectiveCommissie}% over de uiteindelijke verkoopprijs. De eigenaar ontvangt het resterende bedrag zo spoedig mogelijk na ontvangst van de betaling van de koper.`;
  const art3Lines = doc.splitTextToSize(art3, cw);
  checkPage(art3Lines.length * 4 + 4);
  doc.text(art3Lines, ml, y);
  y += art3Lines.length * 4 + 6;

  // Artikel 4
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

  // Artikel 5
  addArtikel("Artikel 5 — Verantwoordelijkheid en schade");
  const art5 = "Zolang het voertuig zich bevindt op het terrein van Platin Automotive, is Platin Automotive verantwoordelijk voor eventuele schade aan het voertuig. De staat van het voertuig bij binnenkomst wordt vastgelegd middels foto's en/of een schaderapport. APK-keuring en technische gebreken zijn te allen tijde de verantwoordelijkheid van de eigenaar.";
  const art5Lines = doc.splitTextToSize(art5, cw);
  checkPage(art5Lines.length * 4 + 4);
  doc.text(art5Lines, ml, y);
  y += art5Lines.length * 4 + 6;

  // Artikel 6
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

  // Artikel 7
  addArtikel("Artikel 7 — Wijzigingen");
  const art7 = "Wijzigingen op deze overeenkomst zijn alleen geldig indien schriftelijk overeengekomen en ondertekend door beide partijen.";
  const art7Lines = doc.splitTextToSize(art7, cw);
  checkPage(art7Lines.length * 4 + 4);
  doc.text(art7Lines, ml, y);
  y += art7Lines.length * 4 + 6;

  // Artikel 8
  addArtikel("Artikel 8 — Algemene voorwaarden");
  const art8 = "Op deze overeenkomst zijn de algemene voorwaarden van Platin Automotive van toepassing. De algemene voorwaarden zijn overhandigd aan de eigenaar en hiervan is kennis genomen.";
  const art8Lines = doc.splitTextToSize(art8, cw);
  checkPage(art8Lines.length * 4 + 4);
  doc.text(art8Lines, ml, y);
  y += art8Lines.length * 4 + 6;

  // Artikel 9
  addArtikel("Artikel 9 — Toepasselijk recht");
  const art9 = "Op deze overeenkomst is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in het arrondissement waar Platin Automotive is gevestigd.";
  const art9Lines = doc.splitTextToSize(art9, cw);
  checkPage(art9Lines.length * 4 + 4);
  doc.text(art9Lines, ml, y);
  y += art9Lines.length * 4 + 6;

  // Artikel 10 — Betaalwijze
  addArtikel("Artikel 10 — Betaalwijze en wettelijk maximum contante betaling");
  const art10 = "In het kader van de Wet ter voorkoming van witwassen en financieren van terrorisme (Wwft) is het wettelijk maximum voor contante betalingen bij de aankoop van een voertuig vastgesteld op € 3.000. Bedragen boven € 3.000 dienen te worden voldaan per bankoverschrijving op IBAN NL00BANK0000000000 ten name van Platin Automotive onder vermelding van het factuurnummer. Platin Automotive is wettelijk verplicht ongebruikelijke transacties te melden bij de autoriteiten.";
  const art10Lines = doc.splitTextToSize(art10, cw);
  checkPage(art10Lines.length * 4 + 4);
  doc.text(art10Lines, ml, y);
  y += art10Lines.length * 4 + 6;

  // Artikel 11 — Ondertekening
  addArtikel("Artikel 11 — Ondertekening");
  const datumStr = formatDate(form.datum);
  addText(`Aldus overeengekomen en in tweevoud opgemaakt te ${form.plaats} op ${datumStr}.`, ml, y, { maxWidth: cw });
  y += 14;

  checkPage(50);
  const colW = (cw - 10) / 2;
  setFont("bold", 9);
  doc.setTextColor(30, 30, 30);
  addText("Platin Automotive", ml, y);
  y += 5;
  setFont("normal", 9);
  doc.setTextColor(80, 80, 80);
  addText("Naam: Emir Gamsiz", ml, y);
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
  if (verkoperHandtekeningDataUrl) {
    try { doc.addImage(verkoperHandtekeningDataUrl, "PNG", ml, y, 50, 18); } catch {}
  }
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(ml, y + 20, ml + colW, y + 20);
  doc.line(ml + colW + 10, y + 20, ml + colW + 10 + colW, y + 20);

  return doc;
}

export function generateConsignatieOvereenkomstPDF(data: PdfData) {
  const doc = buildConsignatieDoc(data);
  const fileName = `Consignatieovereenkomst_${data.vehicle.merk}_${data.vehicle.model}_${data.vehicle.kenteken || "onbekend"}.pdf`;
  doc.save(fileName);
}

export function generateConsignatieOvereenkomstBlob(data: PdfData): Blob {
  const doc = buildConsignatieDoc(data);
  return doc.output("blob");
}

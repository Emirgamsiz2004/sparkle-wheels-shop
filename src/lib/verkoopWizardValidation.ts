// Centrale validatielogica voor de verkoopwizard.
// Per stap een functie die een array met menselijk leesbare ontbrekende-veld
// meldingen teruggeeft. Lege array = geen blokkerende fouten.

export interface WizardState {
  // Stap 1
  verkoopprijs: number | "";
  voertuigType: "marge" | "btw" | "consignatie" | "";
  kmStand: number | "";
  inruil: boolean;
  inruilKenteken: string;
  inruilMerk: string;
  inruilModel: string;
  inruilWaarde: number | "";
  inruilVerkoper: "particulier" | "zakelijk";
  inruilBedrijfsnaam: string;
  inruilKvk: string;

  // Stap 2
  afleverwijze: "vandaag" | "later" | "aflevering" | "";
  leverdatum: string;
  afleveradres: string;
  aanbetalingBedrag: number | "";
  aanbetalingBetaalwijze: "cash" | "pin" | "ideal" | "overboeking" | "";

  // Stap 3
  klantVoornaam: string;
  klantAchternaam: string;
  klantGeboortedatum: string;
  klantAdres: string;
  klantPostcode: string;
  klantWoonplaats: string;
  klantTelefoon: string;
  klantEmail: string;
  klantZakelijk: boolean;
  klantBedrijfsnaam: string;
  klantKvk: string;

  // Stap 4
  garantieType: "geen" | "autotrust";
  garantiePakket: string;
  garantieLooptijd: number | "";
  garantiePrijs: number | "";

  // Stap 5
  pdfGenereerd: boolean;
  contractGetekend: boolean;
  restBetaalwijze: "cash" | "pin" | "ideal" | "overboeking" | "financiering" | "";
  betaalwijzeDetails: Array<{ methode: string; bedrag: number }>;
  restbedrag: number;

  // Stap 6 (alleen relevant met inruil)
  inrVerkVoornaam: string;
  inrVerkAchternaam: string;
  inrVerkAdres: string;
  inrBetaalwijze: "verrekend" | "contant" | "overboeking" | "";
  inkoopverklaringId: string | null;

  // Stap 7
  factuurMbId: string | null;
  factuurVerstuurd: boolean;
}

const isFilled = (s: string | undefined | null) => !!(s && s.trim().length > 0);
const isPositive = (n: number | "") => n !== "" && Number(n) > 0;

export function validateStap1(s: WizardState): string[] {
  const errors: string[] = [];
  if (!isPositive(s.verkoopprijs)) errors.push("Verkoopprijs is niet ingevuld");
  if (!s.voertuigType) errors.push("Voertuigtype (Marge/BTW/Consignatie) is niet geselecteerd");
  if (s.kmStand === "" || Number(s.kmStand) < 0) errors.push("Kilometerstand is niet ingevuld");

  if (s.inruil) {
    if (!isFilled(s.inruilKenteken)) errors.push("Kenteken inruil is niet ingevuld");
    if (!isFilled(s.inruilMerk) || !isFilled(s.inruilModel))
      errors.push("Merk en model van inruil zijn niet ingevuld");
    if (!isPositive(s.inruilWaarde)) errors.push("Inruilwaarde is niet ingevuld");
    if (s.inruilVerkoper === "zakelijk") {
      if (!isFilled(s.inruilBedrijfsnaam)) errors.push("Bedrijfsnaam inruil is verplicht");
      if (!isFilled(s.inruilKvk)) errors.push("KVK-nummer inruil is verplicht");
    }
  }
  return errors;
}

export function validateStap2(s: WizardState): string[] {
  const errors: string[] = [];
  if (!s.afleverwijze) errors.push("Afleveroptie is niet geselecteerd");
  if (s.afleverwijze === "later" || s.afleverwijze === "aflevering") {
    if (!isFilled(s.leverdatum)) errors.push("Leverdatum is niet ingevuld");
  }
  if (s.afleverwijze === "aflevering" && !isFilled(s.afleveradres)) {
    errors.push("Afleveradres is niet ingevuld");
  }
  if (isPositive(s.aanbetalingBedrag) && !s.aanbetalingBetaalwijze) {
    errors.push("Betaalmethode aanbetaling is niet geselecteerd");
  }
  return errors;
}

export function validateStap3(s: WizardState): string[] {
  const errors: string[] = [];
  if (s.klantZakelijk) {
    if (!isFilled(s.klantBedrijfsnaam)) errors.push("Bedrijfsnaam is verplicht");
    if (!isFilled(s.klantKvk)) errors.push("KVK-nummer is verplicht");
  }
  if (!isFilled(s.klantVoornaam) || !isFilled(s.klantAchternaam))
    errors.push(
      s.klantZakelijk
        ? "Contactpersoon voor- en achternaam zijn verplicht"
        : "Voor- en achternaam zijn verplicht",
    );
  if (!isFilled(s.klantAdres)) errors.push("Adres is niet ingevuld");
  if (!isFilled(s.klantPostcode)) errors.push("Postcode is niet ingevuld");
  if (!isFilled(s.klantWoonplaats)) errors.push("Woonplaats is niet ingevuld");
  if (!isFilled(s.klantTelefoon)) errors.push("Telefoonnummer is niet ingevuld");
  if (!s.klantZakelijk && !isFilled(s.klantGeboortedatum))
    errors.push("Geboortedatum is niet ingevuld");
  return errors;
}

export function validateStap4(s: WizardState): string[] {
  const errors: string[] = [];
  if (!s.garantieType) errors.push("Garantie type is niet geselecteerd");
  if (s.garantieType === "autotrust") {
    if (!isFilled(s.garantiePakket)) errors.push("Garantiepakket is niet ingevuld");
    if (!isPositive(s.garantieLooptijd)) errors.push("Looptijd garantie is niet ingevuld");
    if (s.garantiePrijs === "" || Number(s.garantiePrijs) < 0)
      errors.push("Garantieprijs is niet ingevuld");
  }
  return errors;
}

export function validateStap5(s: WizardState): string[] {
  const errors: string[] = [];
  if (!s.pdfGenereerd) errors.push("Koopovereenkomst is nog niet gegenereerd");
  if (!s.contractGetekend) errors.push("Bevestig dat de koopovereenkomst getekend is");
  if (!s.restBetaalwijze) errors.push("Betaalwijze restbedrag is niet ingevuld");
  const totaal = (s.betaalwijzeDetails || []).reduce((a, b) => a + (Number(b.bedrag) || 0), 0);
  if (s.betaalwijzeDetails && s.betaalwijzeDetails.length > 0 && Math.abs(totaal - s.restbedrag) > 0.5) {
    errors.push(
      `Totaal van betaalwijzen (€ ${totaal.toFixed(2)}) komt niet overeen met restbedrag (€ ${s.restbedrag.toFixed(2)})`,
    );
  }
  return errors;
}

export function validateStap6(s: WizardState): string[] {
  const errors: string[] = [];
  if (!s.inruil) return errors; // Niet van toepassing
  if (!isFilled(s.inrVerkVoornaam) || !isFilled(s.inrVerkAchternaam))
    errors.push("Verkoper voor- en achternaam zijn verplicht");
  if (!isFilled(s.inrVerkAdres)) errors.push("Verkoperadres is niet ingevuld");
  if (!s.inrBetaalwijze) errors.push("Verrekenwijze inruil is niet geselecteerd");
  if (!s.inkoopverklaringId) errors.push("Inruil document is nog niet gegenereerd");
  return errors;
}

export function validateStap7(s: WizardState): string[] {
  const errors: string[] = [];
  if (!s.factuurMbId) errors.push("Factuur is nog niet aangemaakt in Moneybird");
  if (s.factuurMbId && !s.factuurVerstuurd)
    errors.push("Factuur is nog niet verstuurd of handmatig bevestigd");
  return errors;
}

export function validateStap(stap: number, s: WizardState): string[] {
  switch (stap) {
    case 1:
      return validateStap1(s);
    case 2:
      return validateStap2(s);
    case 3:
      return validateStap3(s);
    case 4:
      return validateStap4(s);
    case 5:
      return validateStap5(s);
    case 6:
      return validateStap6(s);
    case 7:
      return validateStap7(s);
    default:
      return [];
  }
}

// Optionele waarschuwingen (geen blokkering)
export function getStapWarnings(stap: number, s: WizardState): string[] {
  const warnings: string[] = [];
  if (stap === 3 && !isFilled(s.klantEmail)) {
    warnings.push("Geen e-mailadres — factuur kan niet per mail verstuurd worden");
  }
  return warnings;
}

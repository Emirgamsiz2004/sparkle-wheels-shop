/**
 * TIJDELIJKE MELDING — "alleen geopend op afspraak"
 *
 * Uitzetten? Zet `enabled` op false. Klaar.
 * Andere periode? Pas `startDate` / `endDate` aan (YYYY-MM-DD, beide inclusief).
 * Andere tekst? Pas `title` / `body` aan.
 */
export const APPOINTMENT_ONLY = {
  enabled: true,
  startDate: "2026-08-27",
  endDate: "2026-09-07",
  title: "Tijdelijk alleen op afspraak",
  periodLabel: "t/m maandag 7 september",
  body:
    "Wegens vakantie zijn wij tijdelijk uitsluitend geopend op afspraak. Plan eenvoudig een moment in dat jou uitkomt — we helpen je graag persoonlijk verder.",
  ctaLabel: "Afspraak maken",
  ctaHref: "/afspraak",
  /** Korte variant voor de balk bovenaan en compacte plekken. */
  shortLabel: "Tijdelijk alleen op afspraak",
} as const;

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

/** Actief vandaag: melding tonen en openingstijden overschrijven. */
export const isAppointmentOnlyActive = () => {
  if (!APPOINTMENT_ONLY.enabled) return false;
  const today = todayStr();
  return today >= APPOINTMENT_ONLY.startDate && today <= APPOINTMENT_ONLY.endDate;
};

/** Actief of nog komend — voor de popup, zodat mensen het vooraf al zien. */
export const isAppointmentOnlyUpcoming = () => {
  if (!APPOINTMENT_ONLY.enabled) return false;
  return todayStr() <= APPOINTMENT_ONLY.endDate;
};

/** Wijzigt automatisch mee met de periode, zodat de popup opnieuw verschijnt. */
export const appointmentOnlySignature = `${APPOINTMENT_ONLY.startDate}_${APPOINTMENT_ONLY.endDate}`;

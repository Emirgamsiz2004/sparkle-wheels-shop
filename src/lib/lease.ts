// Financial lease helper — pure client-side calculation.
// Annuïteitenformule met optionele slottermijn (balloon).
// Werkt volgens hetzelfde principe als de calculator van financiallease.nl.

export const LEASE_DEFAULTS = {
  rente: 0.079, // 7,9% jaarrente (financial lease)
  halalVergoeding: 0.095, // 9,5% kredietvergoeding p/j (halal lease, indicatief)
  looptijd: 72, // maanden
  aanbetalingPct: 0.10, // 10%
  slottermijnPct: 0.30, // 30% slottermijn
  minPrijs: 2500,
  partnerUrl: "https://www.financiallease.nl",
};

export const LOOPTIJDEN = [12, 24, 36, 48, 60, 72];
export const MAX_AANBETALING_PCT = 50; // cf. financiallease.nl
export const MAX_SLOTTERMIJN_PCT = 50;

export type LeaseMode = "financial" | "halal";

export interface LeaseInput {
  prijs: number;
  aanbetalingPct?: number; // 0 - 0.50
  slottermijnPct?: number; // 0 - 0.50
  looptijd?: number;
  rente?: number;
  mode?: LeaseMode;
}

export interface LeaseResult {
  maandbedrag: number;
  aanbetaling: number;
  slottermijn: number;
  leasebedrag: number;       // prijs - aanbetaling (= bedrag dat gefinancierd wordt)
  totaalKosten: number;      // totale rente of kredietvergoeding
  totaalTeBetalen: number;   // som van alle termijnen + aanbetaling + slottermijn
}

/**
 * Annuïteit met restwaarde (balloon).
 *  PMT = i * (PV - FV/(1+i)^n) / (1 - (1+i)^-n)
 *  PV = leasebedrag, FV = slottermijn (open te laten staan), i = maandrente
 */
function annuiteitBalloon(pv: number, fv: number, i: number, n: number): number {
  if (n <= 0) return 0;
  if (i === 0) return Math.max(0, (pv - fv) / n);
  const disc = Math.pow(1 + i, -n);
  return (i * (pv - fv * disc)) / (1 - disc);
}

export function berekenLeaseDetail({
  prijs,
  aanbetalingPct = LEASE_DEFAULTS.aanbetalingPct,
  slottermijnPct = LEASE_DEFAULTS.slottermijnPct,
  looptijd = LEASE_DEFAULTS.looptijd,
  rente,
  mode = "financial",
}: LeaseInput): LeaseResult {
  const safePrijs = Math.max(0, prijs || 0);
  const aPct = clamp(aanbetalingPct, 0, MAX_AANBETALING_PCT / 100);
  // slottermijn kan nooit hoger zijn dan wat er na aanbetaling overblijft
  const maxSlot = Math.min(MAX_SLOTTERMIJN_PCT / 100, Math.max(0, 1 - aPct - 0.05));
  const sPct = clamp(slottermijnPct, 0, maxSlot);

  const aanbetaling = Math.round(safePrijs * aPct);
  const slottermijn = Math.round(safePrijs * sPct);
  const leasebedrag = Math.max(0, safePrijs - aanbetaling);

  if (mode === "halal") {
    // Halal: geen rente, maar een vaste kredietvergoeding/markup (murabaha-principe).
    // Totale vergoeding wordt vooraf bepaald en gelijkmatig over de looptijd verdeeld.
    const vergoedingPj = rente ?? LEASE_DEFAULTS.halalVergoeding;
    const totaalVergoeding = (leasebedrag - slottermijn) * vergoedingPj * (looptijd / 12);
    const maandbedrag = looptijd > 0
      ? (leasebedrag - slottermijn + totaalVergoeding) / looptijd
      : 0;
    return {
      maandbedrag: Math.ceil(maandbedrag),
      aanbetaling,
      slottermijn,
      leasebedrag,
      totaalKosten: Math.round(totaalVergoeding),
      totaalTeBetalen: Math.round(aanbetaling + maandbedrag * looptijd + slottermijn),
    };
  }

  const jaarRente = rente ?? LEASE_DEFAULTS.rente;
  const maandRente = jaarRente / 12;
  const maandbedrag = annuiteitBalloon(leasebedrag, slottermijn, maandRente, looptijd);
  const totaalRente = Math.max(0, maandbedrag * looptijd + slottermijn - leasebedrag);

  return {
    maandbedrag: Math.ceil(maandbedrag),
    aanbetaling,
    slottermijn,
    leasebedrag,
    totaalKosten: Math.round(totaalRente),
    totaalTeBetalen: Math.round(aanbetaling + maandbedrag * looptijd + slottermijn),
  };
}

export function berekenLease(input: LeaseInput): number {
  return berekenLeaseDetail(input).maandbedrag;
}

export function berekenLeaseVanaf(verkoopprijs: number): number {
  return berekenLease({ prijs: verkoopprijs });
}

export function berekenSlottermijn(prijs: number, slottermijnPct = LEASE_DEFAULTS.slottermijnPct): number {
  return Math.round(prijs * slottermijnPct);
}

export function isLeaseEligible(prijs: number): boolean {
  return prijs > LEASE_DEFAULTS.minPrijs;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export const formatEuro = (n: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

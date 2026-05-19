// Financial lease helper — pure client-side calculation.
// Annuïteitenformule met optionele slottermijn (balloon).

export const LEASE_DEFAULTS = {
  rente: 0.079, // 7,9% jaarrente
  looptijd: 72, // maanden
  aanbetalingPct: 0.10, // 10%
  slottermijnPct: 0.30, // 30% slottermijn
  minPrijs: 2500,
  partnerUrl: "https://www.financiallease.nl",
};

export interface LeaseInput {
  prijs: number;
  aanbetalingPct?: number; // 0.10 - 0.50
  slottermijnPct?: number; // 0 - 0.30
  looptijd?: number;
  rente?: number;
}

export function berekenLeaseVanaf(verkoopprijs: number): number {
  return berekenLease({ prijs: verkoopprijs });
}

export function berekenLease({
  prijs,
  aanbetalingPct = LEASE_DEFAULTS.aanbetalingPct,
  slottermijnPct = LEASE_DEFAULTS.slottermijnPct,
  looptijd = LEASE_DEFAULTS.looptijd,
  rente = LEASE_DEFAULTS.rente,
}: LeaseInput): number {
  if (!prijs || prijs <= 0) return 0;
  const aanbetaling = prijs * aanbetalingPct;
  const slottermijn = prijs * slottermijnPct;
  const leasebedrag = prijs - aanbetaling - slottermijn;
  const maandrente = rente / 12;
  const maandAflossing =
    maandrente === 0
      ? leasebedrag / looptijd
      : (leasebedrag * maandrente) / (1 - Math.pow(1 + maandrente, -looptijd));
  const renteSlottermijn = slottermijn * maandrente;
  const maandtermijn = maandAflossing + renteSlottermijn;
  return Math.ceil(maandtermijn);
}

export function berekenSlottermijn(prijs: number, slottermijnPct = LEASE_DEFAULTS.slottermijnPct): number {
  return Math.round(prijs * slottermijnPct);
}

export function isLeaseEligible(prijs: number): boolean {
  return prijs > LEASE_DEFAULTS.minPrijs;
}

export const formatEuro = (n: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

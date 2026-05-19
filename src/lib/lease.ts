// Financial lease helper — pure client-side calculation.
// Annuïteitenformule. Geen externe libraries, geen API calls.

export const LEASE_DEFAULTS = {
  rente: 0.079, // 7,9% jaarrente
  looptijd: 72, // maanden
  aanbetalingPct: 0.10, // 10%
  minPrijs: 2500, // onder deze prijs tonen we geen lease
  partnerUrl: "https://www.financiallease.nl",
};

export interface LeaseInput {
  prijs: number;
  aanbetalingPct?: number; // 0.10 - 0.50
  looptijd?: number; // maanden
  rente?: number; // jaarrente (decimaal)
}

export function berekenLeaseVanaf(verkoopprijs: number): number {
  return berekenLease({ prijs: verkoopprijs });
}

export function berekenLease({
  prijs,
  aanbetalingPct = LEASE_DEFAULTS.aanbetalingPct,
  looptijd = LEASE_DEFAULTS.looptijd,
  rente = LEASE_DEFAULTS.rente,
}: LeaseInput): number {
  if (!prijs || prijs <= 0) return 0;
  const aanbetaling = prijs * aanbetalingPct;
  const leasebedrag = prijs - aanbetaling;
  const maandrente = rente / 12;
  if (maandrente === 0) return Math.ceil(leasebedrag / looptijd);
  const maandtermijn =
    (leasebedrag * maandrente) / (1 - Math.pow(1 + maandrente, -looptijd));
  return Math.ceil(maandtermijn);
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

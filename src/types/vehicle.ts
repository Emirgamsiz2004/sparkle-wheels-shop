export interface CostItem {
  id: string;
  description: string;
  amount: number;
  category: 'transport' | 'veilingkosten' | 'taxatie_keuring' | 'poetsen_detailing' | 'onderhoud_reparatie' | 'marketing' | 'overig';
  date: string;
  invoiceRef?: string;
  btwPercentage?: number;
}

export interface Vehicle {
  id: string;
  kenteken: string;
  merk: string;
  model: string;
  bouwjaar: number;
  brandstof: 'benzine' | 'diesel' | 'elektrisch' | 'hybride' | 'lpg';
  kilometerstand: number;
  kleur: string;
  inkoopprijs: number;
  verkoopprijs: number;
  kosten: CostItem[];
  status: 'inkoop' | 'in_behandeling' | 'te_koop' | 'verkocht';
  inkoopDatum: string;
  verkoopDatum?: string;
  opmerkingen?: string;
  koperNaam?: string;
  koperEmail?: string;
  koperTelefoon?: string;
  googleDriveFolderId?: string | null;
  googleDriveFolderUrl?: string | null;
  googleDriveSynced?: boolean;
}

export const calcKostprijs = (vehicle: Vehicle): number => {
  const totalKosten = vehicle.kosten.reduce((sum, k) => sum + k.amount, 0);
  return vehicle.inkoopprijs + totalKosten;
};

export const calcTotalKosten = (vehicle: Vehicle): number => {
  return vehicle.kosten.reduce((sum, k) => sum + k.amount, 0);
};

export const calcWinst = (vehicle: Vehicle): number => {
  return vehicle.verkoopprijs - calcKostprijs(vehicle);
};

export const calcMarge = (vehicle: Vehicle): number => {
  const kostprijs = calcKostprijs(vehicle);
  if (kostprijs === 0) return 0;
  return (calcWinst(vehicle) / kostprijs) * 100;
};

export const calcBtwMarge = (vehicle: Vehicle): number => {
  const winst = calcWinst(vehicle);
  if (winst <= 0) return 0;
  return winst * (21 / 121);
};

export const calcNettoMarge = (vehicle: Vehicle): number => {
  return calcWinst(vehicle) - calcBtwMarge(vehicle);
};

export const formatEuro = (amount: number): string => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatEuroDecimal = (amount: number): string => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const statusLabels: Record<Vehicle['status'], string> = {
  inkoop: 'Inkoop',
  in_behandeling: 'In behandeling',
  te_koop: 'Te koop',
  verkocht: 'Verkocht',
};

export const statusColors: Record<Vehicle['status'], string> = {
  inkoop: 'bg-blue-100 text-blue-700 border-blue-200',
  in_behandeling: 'bg-amber-100 text-amber-700 border-amber-200',
  te_koop: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  verkocht: 'bg-gray-100 text-gray-600 border-gray-200',
};

export const brandstofLabels: Record<Vehicle['brandstof'], string> = {
  benzine: 'Benzine',
  diesel: 'Diesel',
  elektrisch: 'Elektrisch',
  hybride: 'Hybride',
  lpg: 'LPG',
};

export const costCategories: Record<CostItem['category'], string> = {
  transport: 'Transport',
  veilingkosten: 'Veilingkosten',
  taxatie_keuring: 'Taxatie / Keuring',
  poetsen_detailing: 'Poetsen / Detailing',
  onderhoud_reparatie: 'Onderhoud / Reparatie',
  marketing: 'Marketing',
  overig: 'Overig',
};

// Inkoop kandidaat
export interface InkoopCandidate {
  id: string;
  bron: 'marktplaats' | 'autoscout' | 'veiling' | 'particulier' | 'dealer' | 'overig';
  bronLink?: string;
  kenteken?: string;
  merk: string;
  model: string;
  bouwjaar: number;
  brandstof: 'benzine' | 'diesel' | 'elektrisch' | 'hybride' | 'lpg';
  kilometerstand: number;
  kleur?: string;
  transmissie?: 'handgeschakeld' | 'automaat';
  vraagprijs: number;
  geschatteInkoopprijs: number;
  geschatteKosten: number;
  geschatteVerkoopprijs: number;
  interesseStatus: 'nieuw' | 'interessant' | 'bod_gedaan' | 'afgewezen' | 'ingekocht';
  opmerkingen?: string;
  datumToegevoegd: string;
}

export const calcInkoopKostprijs = (c: InkoopCandidate): number =>
  c.geschatteInkoopprijs + c.geschatteKosten;

export const calcInkoopWinst = (c: InkoopCandidate): number =>
  c.geschatteVerkoopprijs - calcInkoopKostprijs(c);

export const calcInkoopMarge = (c: InkoopCandidate): number => {
  const kost = calcInkoopKostprijs(c);
  if (kost === 0) return 0;
  return (calcInkoopWinst(c) / kost) * 100;
};

export const bronLabels: Record<InkoopCandidate['bron'], string> = {
  marktplaats: 'Marktplaats',
  autoscout: 'AutoScout24',
  veiling: 'Veiling',
  particulier: 'Particulier',
  dealer: 'Dealer',
  overig: 'Overig',
};

export const voorkeurMerken = [
  'Volkswagen', 'Toyota', 'Kia', 'Hyundai', 'Opel',
  'Ford', 'Seat', 'Skoda', 'Suzuki', 'Mazda',
] as const;

export const voorkeurModellen: Record<string, string[]> = {
  Volkswagen: ['Polo', 'Up!', 'Golf'],
  Toyota: ['Aygo', 'Yaris'],
  Kia: ['Picanto', 'Rio'],
  Hyundai: ['i10', 'i20'],
  Opel: ['Corsa', 'Karl', 'Adam'],
  Ford: ['Fiesta', 'Ka'],
  Seat: ['Ibiza', 'Mii'],
  Skoda: ['Fabia', 'Citigo'],
  Suzuki: ['Swift', 'Celerio', 'Alto'],
  Mazda: ['2', 'Demio'],
};

export const interesseLabels: Record<InkoopCandidate['interesseStatus'], string> = {
  nieuw: 'Nieuw',
  interessant: 'Interessant',
  bod_gedaan: 'Bod gedaan',
  afgewezen: 'Afgewezen',
  ingekocht: 'Ingekocht',
};

export const interesseColors: Record<InkoopCandidate['interesseStatus'], string> = {
  nieuw: 'bg-blue-100 text-blue-700 border-blue-200',
  interessant: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  bod_gedaan: 'bg-amber-100 text-amber-700 border-amber-200',
  afgewezen: 'bg-red-100 text-red-700 border-red-200',
  ingekocht: 'bg-purple-100 text-purple-700 border-purple-200',
};

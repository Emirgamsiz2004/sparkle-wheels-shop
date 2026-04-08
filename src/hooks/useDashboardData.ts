import { useMemo } from 'react';
import { Vehicle, isConsignatie, calcWinst, calcKostprijs, calcConsignatieCommissie, calcBtwMarge } from '@/types/vehicle';
import { TestDrive } from '@/hooks/useTestDrives';
import { startOfDay, startOfWeek, startOfMonth, startOfQuarter, startOfYear, isWithinInterval, parseISO, differenceInDays, format, getDay } from 'date-fns';
import { nl } from 'date-fns/locale';

export type PeriodKey = 'gisteren' | 'vandaag' | '7dagen' | '30dagen' | 'maand' | 'kwartaal' | 'jaar' | 'custom';

export interface PeriodRange { from: Date; to: Date; }

export function getPeriodRange(key: PeriodKey, customFrom?: Date, customTo?: Date): PeriodRange {
  const now = new Date();
  const today = startOfDay(now);
  switch (key) {
    case 'gisteren': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: yesterday, to: today };
    }
    case 'vandaag': return { from: today, to: now };
    case '7dagen': {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return { from: d, to: now };
    }
    case '30dagen': {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      return { from: d, to: now };
    }
    case 'maand': return { from: startOfMonth(now), to: now };
    case 'kwartaal': return { from: startOfQuarter(now), to: now };
    case 'jaar': return { from: startOfYear(now), to: now };
    case 'custom': return { from: customFrom || today, to: customTo || now };
  }
}

export function getPreviousPeriodRange(range: PeriodRange): PeriodRange {
  const duration = range.to.getTime() - range.from.getTime();
  return { from: new Date(range.from.getTime() - duration), to: new Date(range.from.getTime() - 1) };
}

function inRange(dateStr: string | undefined | null, range: PeriodRange): boolean {
  if (!dateStr) return false;
  try { return isWithinInterval(parseISO(dateStr), { start: range.from, end: range.to }); } catch { return false; }
}

export function calcTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

// ─── Types ──────────────────────────────────────────────
export interface DashboardKPIs {
  omzet: number; omzetPrev: number;
  brutowinst: number; brutwinstPrev: number;
  verkocht: number; verkochtPrev: number;
  gemiddeldeMarge: number; gemiddeldeMargePerc: number;
  gemiddeldeMargePrev: number;
  voorraad: number; voorraadPrev: number;
  proefriten: number; proefritenPrev: number;
  conversie: number; conversiePrev: number;
  gemStageDagen: number; gemStageDagenPrev: number;
}

export interface ChartDataPoint { label: string; omzet: number; inkoop: number; verkoop: number; }

export interface VoorraadStats {
  gemInkoop: number; gemVerkoop: number; gemDagen: number;
  langstStaand: Vehicle[];
  snelVerkocht: number; normaal: number; langstanders: number;
  doorlooptijdPerMerk: { merk: string; dagen: number }[];
  doorlooptijdPerPrijsklasse: { klasse: string; dagen: number }[];
  top10Langst: (Vehicle & { dagen: number })[];
}

export interface PopulariteitStats {
  merkVerkopen: { naam: string; aantal: number }[];
  modelVerkopen: { naam: string; aantal: number }[];
  brandstofVerkopen: { naam: string; aantal: number }[];
  transmissieVerkopen: { naam: string; aantal: number }[];
  bouwjaarVerkopen: { naam: string; aantal: number }[];
  prijsklasseVerkopen: { naam: string; aantal: number }[];
  kleurVerkopen: { naam: string; aantal: number }[];
}

export interface MargeAnalyse {
  margePerMerk: { merk: string; marge: number; margePerc: number }[];
  margePerBrandstof: { naam: string; marge: number }[];
  margePerPrijsklasse: { klasse: string; marge: number }[];
  margePerBouwjaargroep: { groep: string; marge: number }[];
  top5: { vehicle: Vehicle; winst: number; margePerc: number }[];
  bottom5: { vehicle: Vehicle; winst: number; margePerc: number }[];
  gemKostenPerVoertuig: number;
}

export interface InkoopAnalyse {
  inkoopPerPeriode: { label: string; aantal: number; gemPrijs: number }[];
  gemInkoopprijs: number;
  merkInkopen: { naam: string; aantal: number }[];
  inkoopVsVerkoopPerMerk: { merk: string; inkoop: number; verkoop: number }[];
}

export interface VerkoopAnalyse {
  omzetPerPeriode: { label: string; omzet: number; aantal: number; gemPrijs: number }[];
  dagVerkopen: { dag: string; aantal: number }[];
  maandVerkopen: { maand: string; aantal: number }[];
}

export interface ProefritAnalyse {
  aantalPerPeriode: { label: string; aantal: number }[];
  conversiePerMerk: { merk: string; conversie: number; proefriten: number }[];
  tijdstipVerdeling: { tijdstip: string; aantal: number }[];
  proefritenPerVoertuig: number;
}

export interface FinancieelOverzicht {
  totaleInkoop: number; totaleKosten: number; totaleOmzet: number;
  brutowinst: number; nettoMarge: number; nettoMargePerc: number;
  maandOverzicht: { maand: string; inkoop: number; kosten: number; omzet: number; winst: number; marge: number }[];
  transacties: { id: string; datum: string; voertuig: string; type: string; inkoop: number; kosten: number; verkoop: number; winst: number }[];
}

export interface ActivityItem {
  id: string; type: 'proefrit' | 'verkocht' | 'ingekocht';
  label: string; time: string; timeRaw: string; vehicleId?: string; testDriveId?: string;
}

export interface WinstVerkoop { vehicle: Vehicle; winst: number; }

// ─── Helpers ────────────────────────────────────────────
function getPrijsklasse(prijs: number): string {
  if (prijs < 10000) return '< €10k';
  if (prijs <= 25000) return '€10k - €25k';
  return '> €25k';
}

function getBouwjaarGroep(bouwjaar: number): string {
  const leeftijd = new Date().getFullYear() - bouwjaar;
  if (leeftijd <= 5) return '< 5 jaar';
  if (leeftijd <= 10) return '5-10 jaar';
  return '> 10 jaar';
}

function groupBy<T>(items: T[], keyFn: (i: T) => string): Record<string, T[]> {
  const map: Record<string, T[]> = {};
  items.forEach(i => { const k = keyFn(i); (map[k] ||= []).push(i); });
  return map;
}

function avg(nums: number[]): number {
  return nums.length > 0 ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;
}

const dagNamen = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
const maandNamen = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];

// ─── Hook ───────────────────────────────────────────────
export function useDashboardData(vehicles: Vehicle[], testDrives: TestDrive[], range: PeriodRange, compare: boolean) {
  const prevRange = useMemo(() => getPreviousPeriodRange(range), [range]);
  const durationDays = useMemo(() => differenceInDays(range.to, range.from) + 1, [range]);

  // Base filters
  const verkochtInRange = useMemo(() => vehicles.filter(v => v.status === 'verkocht' && inRange(v.verkoopDatum, range)), [vehicles, range]);
  const verkochtPrev = useMemo(() => vehicles.filter(v => v.status === 'verkocht' && inRange(v.verkoopDatum, prevRange)), [vehicles, prevRange]);
  const ingekocht = useMemo(() => vehicles.filter(v => inRange(v.inkoopDatum, range)), [vehicles, range]);
  const actief = useMemo(() => vehicles.filter(v => v.status !== 'verkocht'), [vehicles]);
  const tdInRange = useMemo(() => testDrives.filter(td => inRange(td.start_tijd, range)), [testDrives, range]);
  const tdPrev = useMemo(() => testDrives.filter(td => inRange(td.start_tijd, prevRange)), [testDrives, prevRange]);

  // Sold vehicle IDs for conversion calc
  const soldIds = useMemo(() => new Set(verkochtInRange.map(v => v.id)), [verkochtInRange]);
  const soldIdsPrev = useMemo(() => new Set(verkochtPrev.map(v => v.id)), [verkochtPrev]);

  // Stage days for sold vehicles
  const stageDagen = useMemo(() => verkochtInRange.filter(v => v.verkoopDatum).map(v => differenceInDays(parseISO(v.verkoopDatum!), parseISO(v.inkoopDatum))), [verkochtInRange]);
  const stageDagenPrev = useMemo(() => verkochtPrev.filter(v => v.verkoopDatum).map(v => differenceInDays(parseISO(v.verkoopDatum!), parseISO(v.inkoopDatum))), [verkochtPrev]);

  // ─── KPIs ───
  const kpis = useMemo((): DashboardKPIs => {
    const omzet = verkochtInRange.reduce((s, v) => s + v.verkoopprijs, 0);
    const omzetPrev = verkochtPrev.reduce((s, v) => s + v.verkoopprijs, 0);
    const brutowinst = verkochtInRange.reduce((s, v) => s + calcWinst(v), 0);
    const brutwinstPrev = verkochtPrev.reduce((s, v) => s + calcWinst(v), 0);
    const gemMarge = avg(verkochtInRange.map(v => calcWinst(v)));
    const gemMargePrev = avg(verkochtPrev.map(v => calcWinst(v)));
    const gemMargePerc = omzet > 0 ? (brutowinst / omzet) * 100 : 0;

    const afgesloten = tdInRange.filter(td => td.status === 'afgesloten');
    const converted = afgesloten.filter(td => td.vehicle_id && soldIds.has(td.vehicle_id)).length;
    const conversie = afgesloten.length > 0 ? (converted / afgesloten.length) * 100 : 0;

    const afgPrev = tdPrev.filter(td => td.status === 'afgesloten');
    const convPrev = afgPrev.filter(td => td.vehicle_id && soldIdsPrev.has(td.vehicle_id)).length;
    const conversiePrev = afgPrev.length > 0 ? (convPrev / afgPrev.length) * 100 : 0;

    return {
      omzet, omzetPrev, brutowinst, brutwinstPrev,
      verkocht: verkochtInRange.length, verkochtPrev: verkochtPrev.length,
      gemiddeldeMarge: gemMarge, gemiddeldeMargePerc: gemMargePerc, gemiddeldeMargePrev: gemMargePrev,
      voorraad: actief.length, voorraadPrev: actief.length,
      proefriten: tdInRange.length, proefritenPrev: tdPrev.length,
      conversie, conversiePrev,
      gemStageDagen: avg(stageDagen), gemStageDagenPrev: avg(stageDagenPrev),
    };
  }, [verkochtInRange, verkochtPrev, actief, tdInRange, tdPrev, soldIds, soldIdsPrev, stageDagen, stageDagenPrev]);

  // ─── Chart data ───
  const chartData = useMemo((): ChartDataPoint[] => {
    if (verkochtInRange.length === 0) return [];
    if (durationDays <= 1) {
      const omzet = verkochtInRange.reduce((s, v) => s + v.verkoopprijs, 0);
      const inkoop = verkochtInRange.reduce((s, v) => s + (isConsignatie(v) ? 0 : v.inkoopprijs), 0);
      return [{ label: 'Vandaag', omzet, inkoop, verkoop: omzet }];
    }
    const grouped: Record<string, { omzet: number; inkoop: number }> = {};
    const fmt = durationDays <= 31 ? 'dd MMM' : durationDays <= 92 ? "'W'w" : 'MMM yyyy';
    verkochtInRange.forEach(v => {
      if (!v.verkoopDatum) return;
      const key = format(parseISO(v.verkoopDatum), fmt, { locale: nl });
      if (!grouped[key]) grouped[key] = { omzet: 0, inkoop: 0 };
      grouped[key].omzet += v.verkoopprijs;
      grouped[key].inkoop += isConsignatie(v) ? 0 : v.inkoopprijs;
    });
    return Object.entries(grouped).map(([label, d]) => ({ label, omzet: d.omzet, inkoop: d.inkoop, verkoop: d.omzet }));
  }, [verkochtInRange, durationDays]);

  // ─── Voorraad & doorlooptijd ───
  const voorraadStats = useMemo((): VoorraadStats => {
    const eigenActief = actief.filter(v => !isConsignatie(v));
    const gemInkoop = avg(eigenActief.map(v => v.inkoopprijs));
    const gemVerkoop = avg(actief.map(v => v.verkoopprijs));
    const now = new Date();
    const dagenList = actief.map(v => differenceInDays(now, parseISO(v.inkoopDatum)));
    const gemDagen = avg(dagenList);

    // Sold stage days distribution
    const snelVerkocht = stageDagen.filter(d => d < 30).length;
    const normaal = stageDagen.filter(d => d >= 30 && d <= 90).length;
    const langstanders = stageDagen.filter(d => d > 90).length;

    // Top 10 langst staand (actief)
    const top10Langst = [...actief]
      .map(v => ({ ...v, dagen: differenceInDays(now, parseISO(v.inkoopDatum)) }))
      .sort((a, b) => b.dagen - a.dagen)
      .slice(0, 10);

    const langstStaand = top10Langst.slice(0, 5);

    // Doorlooptijd per merk (from sold vehicles)
    const soldByMerk = groupBy(verkochtInRange.filter(v => v.verkoopDatum), v => v.merk);
    const doorlooptijdPerMerk = Object.entries(soldByMerk)
      .map(([merk, vs]) => ({ merk, dagen: Math.round(avg(vs.map(v => differenceInDays(parseISO(v.verkoopDatum!), parseISO(v.inkoopDatum))))) }))
      .sort((a, b) => a.dagen - b.dagen);

    // Doorlooptijd per prijsklasse
    const soldByPrijs = groupBy(verkochtInRange.filter(v => v.verkoopDatum), v => getPrijsklasse(v.verkoopprijs));
    const doorlooptijdPerPrijsklasse = ['< €10k', '€10k - €25k', '> €25k']
      .map(klasse => ({ klasse, dagen: Math.round(avg((soldByPrijs[klasse] || []).map(v => differenceInDays(parseISO(v.verkoopDatum!), parseISO(v.inkoopDatum))))) }));

    return { gemInkoop, gemVerkoop, gemDagen, langstStaand, snelVerkocht, normaal, langstanders, doorlooptijdPerMerk, doorlooptijdPerPrijsklasse, top10Langst };
  }, [actief, verkochtInRange, stageDagen]);

  // ─── Populariteit ───
  const populariteit = useMemo((): PopulariteitStats => {
    const count = (items: string[]) => {
      const map: Record<string, number> = {};
      items.forEach(i => { map[i] = (map[i] || 0) + 1; });
      return Object.entries(map).map(([naam, aantal]) => ({ naam, aantal })).sort((a, b) => b.aantal - a.aantal);
    };
    return {
      merkVerkopen: count(verkochtInRange.map(v => v.merk)),
      modelVerkopen: count(verkochtInRange.map(v => `${v.merk} ${v.model}`)),
      brandstofVerkopen: count(verkochtInRange.map(v => v.brandstof)),
      transmissieVerkopen: count(verkochtInRange.map(v => 'automaat')), // DB has no transmission field on vehicles yet
      bouwjaarVerkopen: count(verkochtInRange.map(v => String(v.bouwjaar))),
      prijsklasseVerkopen: count(verkochtInRange.map(v => getPrijsklasse(v.verkoopprijs))),
      kleurVerkopen: count(verkochtInRange.filter(v => v.kleur).map(v => v.kleur)),
    };
  }, [verkochtInRange]);

  // ─── Marge analyse ───
  const margeAnalyse = useMemo((): MargeAnalyse => {
    const byMerk = groupBy(verkochtInRange, v => v.merk);
    const margePerMerk = Object.entries(byMerk)
      .map(([merk, vs]) => {
        const m = avg(vs.map(v => calcWinst(v)));
        const totOmzet = vs.reduce((s, v) => s + v.verkoopprijs, 0);
        const totWinst = vs.reduce((s, v) => s + calcWinst(v), 0);
        return { merk, marge: Math.round(m), margePerc: totOmzet > 0 ? (totWinst / totOmzet) * 100 : 0 };
      }).sort((a, b) => b.marge - a.marge);

    const byBrandstof = groupBy(verkochtInRange, v => v.brandstof);
    const margePerBrandstof = Object.entries(byBrandstof)
      .map(([naam, vs]) => ({ naam, marge: Math.round(avg(vs.map(v => calcWinst(v)))) }))
      .sort((a, b) => b.marge - a.marge);

    const byPrijs = groupBy(verkochtInRange, v => getPrijsklasse(v.verkoopprijs));
    const margePerPrijsklasse = ['< €10k', '€10k - €25k', '> €25k']
      .map(klasse => ({ klasse, marge: Math.round(avg((byPrijs[klasse] || []).map(v => calcWinst(v)))) }));

    const byBouwjaar = groupBy(verkochtInRange, v => getBouwjaarGroep(v.bouwjaar));
    const margePerBouwjaargroep = ['< 5 jaar', '5-10 jaar', '> 10 jaar']
      .map(groep => ({ groep, marge: Math.round(avg((byBouwjaar[groep] || []).map(v => calcWinst(v)))) }));

    const sorted = verkochtInRange.map(v => {
      const winst = calcWinst(v);
      const kostprijs = isConsignatie(v) ? v.verkoopprijs : calcKostprijs(v);
      return { vehicle: v, winst, margePerc: kostprijs > 0 ? (winst / kostprijs) * 100 : 0 };
    }).sort((a, b) => b.winst - a.winst);

    const gemKosten = avg(verkochtInRange.map(v => v.kosten.reduce((s, c) => s + c.amount, 0)));

    return {
      margePerMerk, margePerBrandstof, margePerPrijsklasse, margePerBouwjaargroep,
      top5: sorted.slice(0, 5),
      bottom5: sorted.slice(-5).reverse(),
      gemKostenPerVoertuig: gemKosten,
    };
  }, [verkochtInRange]);

  // ─── Inkoop analyse ───
  const inkoopAnalyse = useMemo((): InkoopAnalyse => {
    const fmt = durationDays <= 31 ? 'dd MMM' : durationDays <= 92 ? "'W'w" : 'MMM yyyy';
    const grouped = groupBy(ingekocht, v => format(parseISO(v.inkoopDatum), fmt, { locale: nl }));
    const inkoopPerPeriode = Object.entries(grouped).map(([label, vs]) => ({
      label, aantal: vs.length, gemPrijs: Math.round(avg(vs.map(v => v.inkoopprijs))),
    }));
    const gemInkoopprijs = avg(ingekocht.map(v => v.inkoopprijs));
    const merkInkopen = Object.entries(groupBy(ingekocht, v => v.merk))
      .map(([naam, vs]) => ({ naam, aantal: vs.length }))
      .sort((a, b) => b.aantal - a.aantal);

    // Inkoop vs verkoop per merk
    const allMerken = new Set([...verkochtInRange.map(v => v.merk), ...ingekocht.map(v => v.merk)]);
    const inkoopVsVerkoopPerMerk = [...allMerken].map(merk => ({
      merk,
      inkoop: Math.round(avg(ingekocht.filter(v => v.merk === merk).map(v => v.inkoopprijs))),
      verkoop: Math.round(avg(verkochtInRange.filter(v => v.merk === merk).map(v => v.verkoopprijs))),
    })).filter(m => m.inkoop > 0 || m.verkoop > 0);

    return { inkoopPerPeriode, gemInkoopprijs, merkInkopen, inkoopVsVerkoopPerMerk };
  }, [ingekocht, verkochtInRange, durationDays]);

  // ─── Verkoop analyse ───
  const verkoopAnalyse = useMemo((): VerkoopAnalyse => {
    const fmt = durationDays <= 31 ? 'dd MMM' : durationDays <= 92 ? "'W'w" : 'MMM yyyy';
    const grouped = groupBy(verkochtInRange.filter(v => v.verkoopDatum), v => format(parseISO(v.verkoopDatum!), fmt, { locale: nl }));
    const omzetPerPeriode = Object.entries(grouped).map(([label, vs]) => ({
      label, omzet: vs.reduce((s, v) => s + v.verkoopprijs, 0), aantal: vs.length,
      gemPrijs: Math.round(avg(vs.map(v => v.verkoopprijs))),
    }));

    // Dag van de week
    const dagCounts: Record<number, number> = {};
    verkochtInRange.filter(v => v.verkoopDatum).forEach(v => {
      const d = getDay(parseISO(v.verkoopDatum!));
      dagCounts[d] = (dagCounts[d] || 0) + 1;
    });
    const dagVerkopen = [1, 2, 3, 4, 5, 6, 0].map(d => ({ dag: dagNamen[d], aantal: dagCounts[d] || 0 }));

    // Per maand (historisch, all sold vehicles)
    const maandCounts: Record<number, number> = {};
    vehicles.filter(v => v.status === 'verkocht' && v.verkoopDatum).forEach(v => {
      const m = parseISO(v.verkoopDatum!).getMonth();
      maandCounts[m] = (maandCounts[m] || 0) + 1;
    });
    const maandVerkopen = Array.from({ length: 12 }, (_, i) => ({ maand: maandNamen[i], aantal: maandCounts[i] || 0 }));

    return { omzetPerPeriode, dagVerkopen, maandVerkopen };
  }, [verkochtInRange, vehicles, durationDays]);

  // ─── Proefrit analyse ───
  const proefritAnalyse = useMemo((): ProefritAnalyse => {
    const fmt = durationDays <= 31 ? 'dd MMM' : durationDays <= 92 ? "'W'w" : 'MMM yyyy';
    const grouped = groupBy(tdInRange, td => format(parseISO(td.start_tijd), fmt, { locale: nl }));
    const aantalPerPeriode = Object.entries(grouped).map(([label, tds]) => ({ label, aantal: tds.length }));

    // Conversie per merk
    const byMerk = groupBy(tdInRange.filter(td => td.voertuig_merk), td => td.voertuig_merk!);
    const conversiePerMerk = Object.entries(byMerk).map(([merk, tds]) => {
      const afg = tds.filter(td => td.status === 'afgesloten');
      const conv = afg.filter(td => td.vehicle_id && soldIds.has(td.vehicle_id)).length;
      return { merk, conversie: afg.length > 0 ? (conv / afg.length) * 100 : 0, proefriten: tds.length };
    }).sort((a, b) => b.conversie - a.conversie);

    // Tijdstip verdeling
    const tijdCounts = { Ochtend: 0, Middag: 0, Avond: 0 };
    tdInRange.forEach(td => {
      const h = parseISO(td.start_tijd).getHours();
      if (h < 12) tijdCounts.Ochtend++;
      else if (h < 17) tijdCounts.Middag++;
      else tijdCounts.Avond++;
    });
    const tijdstipVerdeling = Object.entries(tijdCounts).map(([tijdstip, aantal]) => ({ tijdstip, aantal }));

    // Avg test drives per sold vehicle
    const soldVehicleIds = [...soldIds];
    const tdPerSold = soldVehicleIds.map(id => tdInRange.filter(td => td.vehicle_id === id).length);
    const proefritenPerVoertuig = avg(tdPerSold);

    return { aantalPerPeriode, conversiePerMerk, tijdstipVerdeling, proefritenPerVoertuig };
  }, [tdInRange, soldIds, durationDays]);

  // ─── Financieel ───
  const financieel = useMemo((): FinancieelOverzicht => {
    const totaleInkoop = verkochtInRange.filter(v => !isConsignatie(v)).reduce((s, v) => s + v.inkoopprijs, 0);
    const totaleKosten = verkochtInRange.reduce((s, v) => s + v.kosten.reduce((cs, c) => cs + c.amount, 0), 0);
    const totaleOmzet = verkochtInRange.reduce((s, v) => s + v.verkoopprijs, 0);
    const brutowinst = verkochtInRange.reduce((s, v) => s + calcWinst(v), 0);
    const btwMarge = verkochtInRange.reduce((s, v) => s + calcBtwMarge(v), 0);
    const nettoMarge = brutowinst - btwMarge;
    const nettoMargePerc = totaleOmzet > 0 ? (nettoMarge / totaleOmzet) * 100 : 0;

    // Maandoverzicht from all sold vehicles
    const byMonth = groupBy(verkochtInRange.filter(v => v.verkoopDatum), v => format(parseISO(v.verkoopDatum!), 'MMM yyyy', { locale: nl }));
    const maandOverzicht = Object.entries(byMonth).map(([maand, vs]) => ({
      maand,
      inkoop: vs.filter(v => !isConsignatie(v)).reduce((s, v) => s + v.inkoopprijs, 0),
      kosten: vs.reduce((s, v) => s + v.kosten.reduce((cs, c) => cs + c.amount, 0), 0),
      omzet: vs.reduce((s, v) => s + v.verkoopprijs, 0),
      winst: vs.reduce((s, v) => s + calcWinst(v), 0),
      marge: 0,
    })).map(m => ({ ...m, marge: m.omzet > 0 ? (m.winst / m.omzet) * 100 : 0 }));

    const transacties = verkochtInRange.map(v => ({
      id: v.id,
      datum: v.verkoopDatum || '',
      voertuig: `${v.merk} ${v.model}`,
      type: isConsignatie(v) ? 'Consignatie' : 'Eigen',
      inkoop: isConsignatie(v) ? 0 : v.inkoopprijs,
      kosten: v.kosten.reduce((s, c) => s + c.amount, 0),
      verkoop: v.verkoopprijs,
      winst: calcWinst(v),
    }));

    return { totaleInkoop, totaleKosten, totaleOmzet, brutowinst, nettoMarge, nettoMargePerc, maandOverzicht, transacties };
  }, [verkochtInRange]);

  // ─── Winst verkopen ───
  const winstVerkopen = useMemo(() => {
    const sorted = verkochtInRange.filter(v => v.verkoopprijs > 0)
      .map(v => ({ vehicle: v, winst: calcWinst(v) }))
      .sort((a, b) => b.winst - a.winst);
    return { top3: sorted.slice(0, 3), bottom3: sorted.slice(-3).reverse() };
  }, [verkochtInRange]);

  // ─── Activities ───
  const activities = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = [];
    tdInRange.forEach(td => items.push({
      id: `td-${td.id}`, type: 'proefrit',
      label: `Proefrit ${td.voertuig_merk || ''} ${td.voertuig_model || ''}`.trim(),
      time: td.start_tijd, timeRaw: td.start_tijd,
      vehicleId: td.vehicle_id, testDriveId: td.id,
    }));
    verkochtInRange.forEach(v => items.push({
      id: `sold-${v.id}`, type: 'verkocht',
      label: `${v.merk} ${v.model} verkocht`,
      time: v.verkoopDatum!, timeRaw: v.verkoopDatum!, vehicleId: v.id,
    }));
    ingekocht.forEach(v => items.push({
      id: `buy-${v.id}`, type: 'ingekocht',
      label: `${v.merk} ${v.model} ingekocht`,
      time: v.inkoopDatum, timeRaw: v.inkoopDatum, vehicleId: v.id,
    }));
    return items.sort((a, b) => new Date(b.timeRaw).getTime() - new Date(a.timeRaw).getTime()).slice(0, 15);
  }, [tdInRange, verkochtInRange, ingekocht]);

  // ─── Proefrit simple stats (kept for backward compat) ───
  const proefritStats = useMemo(() => {
    const afgesloten = tdInRange.filter(td => td.status === 'afgesloten');
    const convertedCount = afgesloten.filter(td => td.vehicle_id && soldIds.has(td.vehicle_id)).length;
    const conversie = afgesloten.length > 0 ? (convertedCount / afgesloten.length) * 100 : 0;
    return { conversie, recent: tdInRange.slice(0, 5), total: tdInRange.length };
  }, [tdInRange, soldIds]);

  return {
    kpis, chartData, voorraadStats, proefritStats, winstVerkopen, activities, financieel,
    populariteit, margeAnalyse, inkoopAnalyse, verkoopAnalyse, proefritAnalyse,
    compare, prevRange,
  };
}

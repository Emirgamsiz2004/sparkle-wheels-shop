import { useMemo } from 'react';
import { Vehicle, isConsignatie, calcWinst, calcKostprijs, calcConsignatieCommissie, calcBtwMarge } from '@/types/vehicle';
import { TestDrive } from '@/hooks/useTestDrives';
import { startOfDay, startOfWeek, startOfMonth, startOfQuarter, startOfYear, subDays, subWeeks, subMonths, subQuarters, subYears, isWithinInterval, parseISO, differenceInDays, format } from 'date-fns';
import { nl } from 'date-fns/locale';

export type PeriodKey = 'vandaag' | 'week' | 'maand' | 'kwartaal' | 'jaar' | 'custom';

export interface PeriodRange {
  from: Date;
  to: Date;
}

export function getPeriodRange(key: PeriodKey, customFrom?: Date, customTo?: Date): PeriodRange {
  const now = new Date();
  const today = startOfDay(now);
  switch (key) {
    case 'vandaag': return { from: today, to: now };
    case 'week': return { from: startOfWeek(now, { weekStartsOn: 1 }), to: now };
    case 'maand': return { from: startOfMonth(now), to: now };
    case 'kwartaal': return { from: startOfQuarter(now), to: now };
    case 'jaar': return { from: startOfYear(now), to: now };
    case 'custom': return { from: customFrom || today, to: customTo || now };
  }
}

export function getPreviousPeriodRange(range: PeriodRange): PeriodRange {
  const duration = range.to.getTime() - range.from.getTime();
  return {
    from: new Date(range.from.getTime() - duration),
    to: new Date(range.from.getTime() - 1),
  };
}

function inRange(dateStr: string | undefined | null, range: PeriodRange): boolean {
  if (!dateStr) return false;
  try {
    const d = parseISO(dateStr);
    return isWithinInterval(d, { start: range.from, end: range.to });
  } catch { return false; }
}

export function calcTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export interface DashboardKPIs {
  omzet: number;
  omzetPrev: number;
  brutowinst: number;
  brutwinstPrev: number;
  verkocht: number;
  verkochtPrev: number;
  gemiddeldeMarge: number;
  gemiddeldeMargePerc: number;
  gemiddeldeMargePrev: number;
  voorraad: number;
  voorraadPrev: number;
  proefriten: number;
  proefritenPrev: number;
}

export interface ChartDataPoint {
  label: string;
  omzet: number;
  inkoop: number;
  verkoop: number;
}

export interface VoorraadStats {
  gemInkoop: number;
  gemVerkoop: number;
  gemDagen: number;
  langstStaand: Vehicle[];
}

export interface WinstVerkoop {
  vehicle: Vehicle;
  winst: number;
}

export interface ActivityItem {
  id: string;
  type: 'proefrit' | 'verkocht' | 'ingekocht';
  label: string;
  time: string;
  timeRaw: string;
}

export interface FinancieelOverzicht {
  totaleInkoop: number;
  totaleKosten: number;
  totaleOmzet: number;
  nettoMarge: number;
  transacties: {
    id: string;
    datum: string;
    voertuig: string;
    type: string;
    inkoop: number;
    kosten: number;
    verkoop: number;
    winst: number;
  }[];
}

export function useDashboardData(
  vehicles: Vehicle[],
  testDrives: TestDrive[],
  range: PeriodRange,
  compare: boolean
) {
  const prevRange = useMemo(() => getPreviousPeriodRange(range), [range]);

  const kpis = useMemo((): DashboardKPIs => {
    const verkochtInRange = vehicles.filter(v => v.status === 'verkocht' && inRange(v.verkoopDatum, range));
    const verkochtPrev = vehicles.filter(v => v.status === 'verkocht' && inRange(v.verkoopDatum, prevRange));

    const omzet = verkochtInRange.reduce((s, v) => s + v.verkoopprijs, 0);
    const omzetPrev = verkochtPrev.reduce((s, v) => s + v.verkoopprijs, 0);

    const brutowinst = verkochtInRange.reduce((s, v) => s + calcWinst(v), 0);
    const brutwinstPrev = verkochtPrev.reduce((s, v) => s + calcWinst(v), 0);

    const gemMarge = verkochtInRange.length > 0
      ? verkochtInRange.reduce((s, v) => s + calcWinst(v), 0) / verkochtInRange.length
      : 0;
    const gemMargePrev = verkochtPrev.length > 0
      ? verkochtPrev.reduce((s, v) => s + calcWinst(v), 0) / verkochtPrev.length
      : 0;

    const actief = vehicles.filter(v => v.status !== 'verkocht');

    const tdInRange = testDrives.filter(td => inRange(td.start_tijd, range));
    const tdPrev = testDrives.filter(td => inRange(td.start_tijd, prevRange));

    return {
      omzet,
      omzetPrev,
      brutowinst,
      brutwinstPrev,
      verkocht: verkochtInRange.length,
      verkochtPrev: verkochtPrev.length,
      gemiddeldeMarge: gemMarge,
      gemiddeldeMargePerc: 0,
      gemiddeldeMargePrev: gemMargePrev,
      voorraad: actief.length,
      voorraadPrev: actief.length, // snapshot
      proefriten: tdInRange.length,
      proefritenPrev: tdPrev.length,
    };
  }, [vehicles, testDrives, range, prevRange]);

  const chartData = useMemo((): ChartDataPoint[] => {
    const verkochtInRange = vehicles.filter(v => v.status === 'verkocht' && inRange(v.verkoopDatum, range));
    const durationDays = differenceInDays(range.to, range.from) + 1;
    
    if (durationDays <= 1) {
      const omzet = verkochtInRange.reduce((s, v) => s + v.verkoopprijs, 0);
      const inkoop = verkochtInRange.reduce((s, v) => s + (isConsignatie(v) ? 0 : v.inkoopprijs), 0);
      return [{ label: 'Vandaag', omzet, inkoop, verkoop: omzet }];
    }

    // Group by appropriate interval
    const grouped: Record<string, { omzet: number; inkoop: number }> = {};
    
    const fmt = durationDays <= 31 ? 'dd MMM' : durationDays <= 92 ? "'W'w" : 'MMM yyyy';
    
    verkochtInRange.forEach(v => {
      if (!v.verkoopDatum) return;
      const d = parseISO(v.verkoopDatum);
      const key = format(d, fmt, { locale: nl });
      if (!grouped[key]) grouped[key] = { omzet: 0, inkoop: 0 };
      grouped[key].omzet += v.verkoopprijs;
      grouped[key].inkoop += isConsignatie(v) ? 0 : v.inkoopprijs;
    });

    return Object.entries(grouped).map(([label, data]) => ({
      label,
      omzet: data.omzet,
      inkoop: data.inkoop,
      verkoop: data.omzet,
    }));
  }, [vehicles, range]);

  const voorraadStats = useMemo((): VoorraadStats => {
    const actief = vehicles.filter(v => v.status !== 'verkocht');
    const eigenActief = actief.filter(v => !isConsignatie(v));

    const gemInkoop = eigenActief.length > 0
      ? eigenActief.reduce((s, v) => s + v.inkoopprijs, 0) / eigenActief.length : 0;
    const gemVerkoop = actief.length > 0
      ? actief.reduce((s, v) => s + v.verkoopprijs, 0) / actief.length : 0;

    const now = new Date();
    const dagenList = actief.map(v => differenceInDays(now, parseISO(v.inkoopDatum)));
    const gemDagen = dagenList.length > 0 ? dagenList.reduce((s, d) => s + d, 0) / dagenList.length : 0;

    const langstStaand = [...actief]
      .sort((a, b) => parseISO(a.inkoopDatum).getTime() - parseISO(b.inkoopDatum).getTime())
      .slice(0, 5);

    return { gemInkoop, gemVerkoop, gemDagen, langstStaand };
  }, [vehicles]);

  const proefritStats = useMemo(() => {
    const tdInRange = testDrives.filter(td => inRange(td.start_tijd, range));
    const afgesloten = tdInRange.filter(td => td.status === 'afgesloten');
    
    // Conversion: test drives that led to a sale (vehicle sold)
    const soldVehicleIds = new Set(
      vehicles.filter(v => v.status === 'verkocht' && inRange(v.verkoopDatum, range)).map(v => v.id)
    );
    const convertedCount = afgesloten.filter(td => td.vehicle_id && soldVehicleIds.has(td.vehicle_id)).length;
    const conversie = afgesloten.length > 0 ? (convertedCount / afgesloten.length) * 100 : 0;

    const recent = tdInRange.slice(0, 5);

    return { conversie, recent, total: tdInRange.length };
  }, [testDrives, vehicles, range]);

  const winstVerkopen = useMemo(() => {
    const verkochtInRange = vehicles
      .filter(v => v.status === 'verkocht' && inRange(v.verkoopDatum, range) && v.verkoopprijs > 0);

    const sorted = verkochtInRange
      .map(v => ({ vehicle: v, winst: calcWinst(v) }))
      .sort((a, b) => b.winst - a.winst);

    return {
      top3: sorted.slice(0, 3),
      bottom3: sorted.slice(-3).reverse(),
    };
  }, [vehicles, range]);

  const activities = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = [];

    // Proefriten
    testDrives.filter(td => inRange(td.start_tijd, range)).forEach(td => {
      items.push({
        id: `td-${td.id}`,
        type: 'proefrit',
        label: `Proefrit ${td.voertuig_merk || ''} ${td.voertuig_model || ''}`.trim(),
        time: td.start_tijd,
        timeRaw: td.start_tijd,
      });
    });

    // Verkocht
    vehicles.filter(v => v.status === 'verkocht' && inRange(v.verkoopDatum, range)).forEach(v => {
      items.push({
        id: `sold-${v.id}`,
        type: 'verkocht',
        label: `${v.merk} ${v.model} verkocht`,
        time: v.verkoopDatum!,
        timeRaw: v.verkoopDatum!,
      });
    });

    // Ingekocht
    vehicles.filter(v => inRange(v.inkoopDatum, range)).forEach(v => {
      items.push({
        id: `buy-${v.id}`,
        type: 'ingekocht',
        label: `${v.merk} ${v.model} ingekocht`,
        time: v.inkoopDatum,
        timeRaw: v.inkoopDatum,
      });
    });

    return items.sort((a, b) => new Date(b.timeRaw).getTime() - new Date(a.timeRaw).getTime()).slice(0, 10);
  }, [vehicles, testDrives, range]);

  const financieel = useMemo((): FinancieelOverzicht => {
    const verkochtInRange = vehicles.filter(v => v.status === 'verkocht' && inRange(v.verkoopDatum, range));
    
    const totaleInkoop = verkochtInRange.filter(v => !isConsignatie(v)).reduce((s, v) => s + v.inkoopprijs, 0);
    const totaleKosten = verkochtInRange.filter(v => !isConsignatie(v)).reduce((s, v) => s + v.kosten.reduce((cs, c) => cs + c.amount, 0), 0);
    const totaleOmzet = verkochtInRange.reduce((s, v) => s + v.verkoopprijs, 0);
    const brutoWinst = verkochtInRange.reduce((s, v) => s + calcWinst(v), 0);
    const btwMarge = verkochtInRange.reduce((s, v) => s + calcBtwMarge(v), 0);
    const nettoMarge = brutoWinst - btwMarge;

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

    return { totaleInkoop, totaleKosten, totaleOmzet, nettoMarge, transacties };
  }, [vehicles, range]);

  return { kpis, chartData, voorraadStats, proefritStats, winstVerkopen, activities, financieel, compare, prevRange };
}

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, TrendingUp, TrendingDown, Receipt, FileText, Wrench, Tag, Car, Calculator, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMoneybird } from "@/hooks/useMoneybird";
import { formatEuroDecimal } from "@/types/vehicle";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import VerkopenSheet from "./VerkopenSheet";

const MONTHS = [
  "Januari", "Februari", "Maart", "April", "Mei", "Juni",
  "Juli", "Augustus", "September", "Oktober", "November", "December",
];

const pad = (n: number) => String(n).padStart(2, "0");

interface Invoice {
  id: string;
  invoice_id?: string;
  invoice_date: string;
  total_price_incl_tax: string;
  total_price_excl_tax: string;
  state: string;
  contact?: { company_name?: string; firstname?: string; lastname?: string };
  reference?: string;
}

interface Receipt {
  id: string;
  date: string;
  reference?: string;
  total_price_incl_tax: string;
  total_price_excl_tax: string;
  contact?: { company_name?: string; firstname?: string; lastname?: string };
}

interface PurchaseInvoice {
  id: string;
  date: string;
  reference?: string;
  total_price_incl_tax: string;
  total_price_excl_tax: string;
  state?: string;
  contact?: { company_name?: string; firstname?: string; lastname?: string };
}

interface PlatinKost {
  id: string;
  naam: string;
  bedrag: number;
  datum: string;
  categorie: string;
  leverancier?: string | null;
  source: "kosten" | "vehicle";
  voertuig?: string;
}

// === Hybride categorisatie ===
type Categorie =
  | "huur"
  | "inkoop_voertuigen"
  | "transport"
  | "onderdelen"
  | "voertuigkosten"
  | "marketing"
  | "abonnementen"
  | "energie"
  | "personeel"
  | "kantoor"
  | "brandstof"
  | "verzekering"
  | "belasting"
  | "overig";

const CATEGORIE_LABELS: Record<Categorie, string> = {
  huur: "Huur",
  inkoop_voertuigen: "Inkoop voertuigen",
  transport: "Transport voertuigen",
  onderdelen: "Onderdelen",
  voertuigkosten: "Voertuigkosten",
  marketing: "Marketing & advertenties",
  abonnementen: "Abonnementen",
  energie: "Energie",
  personeel: "Personeel",
  kantoor: "Kantoor & materiaal",
  brandstof: "Brandstof",
  verzekering: "Verzekeringen",
  belasting: "Belastingen",
  overig: "Overig",
};

const CATEGORIE_KLEUREN: Record<Categorie, string> = {
  huur: "bg-purple-500",
  inkoop_voertuigen: "bg-blue-500",
  transport: "bg-sky-400",
  onderdelen: "bg-violet-500",
  voertuigkosten: "bg-cyan-500",
  marketing: "bg-pink-500",
  abonnementen: "bg-indigo-500",
  energie: "bg-yellow-500",
  personeel: "bg-orange-500",
  kantoor: "bg-teal-500",
  brandstof: "bg-amber-500",
  verzekering: "bg-emerald-500",
  belasting: "bg-red-500",
  overig: "bg-slate-500",
};

// Keyword-based classifier voor MB items (gebruikt leverancier + omschrijving + bedrag)
const classify = (text: string, bedrag = 0): Categorie => {
  const t = text.toLowerCase();

  // Specifieke leveranciers (eerst — meest betrouwbaar)
  if (/\balliance automotive\b|partspoint/.test(t)) return "onderdelen";
  if (/\belix\b/.test(t)) return "energie";
  if (/\bvwe\b|\brdw\b/.test(t)) return "abonnementen";
  if (/\bmito\b/.test(t)) return "huur";

  // "Auto 1" → inkoop OF transport afhankelijk van bedrag
  if (/\bauto\s*1\b|\bauto1\b/.test(t)) {
    return bedrag > 0 && bedrag < 250 ? "transport" : "inkoop_voertuigen";
  }

  // Advertentiekanalen
  if (/marktplaats|autoscout|autotrack|gaspedaal|google ads|meta ads|facebook ads|advertentie|advert|marketing/.test(t)) return "marketing";

  // Algemene patronen
  if (/huur|verhuur|rent|lease pand/.test(t)) return "huur";
  if (/inkoop voertuig|aankoop voertuig|auto inkoop|car purchase/.test(t)) return "inkoop_voertuigen";
  if (/transport|sleep|berging|takelen|vervoer auto/.test(t)) return "transport";
  if (/energie|stroom|gas|electric|eneco|essent|vattenfall|greenchoice/.test(t)) return "energie";
  if (/abonnement|subscription|spotify|adobe|microsoft|google workspace|google\b|saas|hosting/.test(t)) return "abonnementen";
  if (/salaris|loon|personeel|payroll|uitzend/.test(t)) return "personeel";
  if (/onderdeel|onderdelen|parts/.test(t)) return "onderdelen";
  if (/onderhoud|apk|reparatie|banden|olie|carwash|wasstraat|poets|detailing|reinig/.test(t)) return "voertuigkosten";
  if (/benzine|diesel|tank|shell\b|\bbp\b|esso|tinq|tango|brandstof/.test(t)) return "brandstof";
  if (/verzeker|insurance|polis/.test(t)) return "verzekering";
  if (/belasting|btw|mrb|wegenbelasting|fiscus/.test(t)) return "belasting";
  if (/kantoor|papier|printer|koffie|schoonmaak|inventaris/.test(t)) return "kantoor";
  return "overig";
};

const mapPlatinCategorie = (c: string): Categorie => {
  const t = (c || "").toLowerCase();
  if (t === "vaste_kosten") return "huur";
  if (t === "advertentiekosten") return "marketing";
  if (t === "abonnementen") return "abonnementen";
  if (t === "personeelskosten") return "personeel";
  if (t === "voertuigkosten") return "voertuigkosten";
  return classify(t);
};

const WinstVerliesTab = () => {
  const { getSalesInvoices, getReceipts, getPurchaseInvoices, loading } = useMoneybird();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [platinKosten, setPlatinKosten] = useState<PlatinKost[]>([]);
  const [inkoopverklaringBedragen, setInkoopverklaringBedragen] = useState<number[]>([]);
  const [soldVehicles, setSoldVehicles] = useState<Array<{
    id: string; merk: string; model: string; kenteken: string;
    verkoop_datum: string; inkoopprijs: number; verkoopprijs: number;
    kostenTotaal: number;
    bouwjaar?: number | null; kilometerstand?: number | null;
    brandstof?: string | null; verkoop_type?: string | null;
    btw_marge_type?: string | null; koper_naam?: string | null;
    inruil_waarde?: number | null;
  }>>([]);
  const [voorraad, setVoorraad] = useState<{ aantal: number; inkoop: number; kosten: number }>({ aantal: 0, inkoop: 0, kosten: 0 });
  const [error, setError] = useState<string | null>(null);


  const periodStart = `${year}${pad(month + 1)}01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const periodEnd = `${year}${pad(month + 1)}${pad(lastDay)}`;
  const filter = `period:${periodStart}..${periodEnd}`;

  const fetchAllPages = async <T,>(fn: (page: number, filter: string) => Promise<T[]>): Promise<T[]> => {
    const all: T[] = [];
    for (let page = 1; page <= 10; page++) {
      const data = await fn(page, filter);
      if (!Array.isArray(data) || data.length === 0) break;
      all.push(...data);
      if (data.length < 100) break;
    }
    return all;
  };

  const loadPlatinKosten = async () => {
    const dateFrom = `${year}-${pad(month + 1)}-01`;
    const dateTo = `${year}-${pad(month + 1)}-${pad(lastDay)}`;

    const { data: kostenData } = await supabase
      .from("kosten")
      .select("id, naam, bedrag, datum, categorie, leverancier")
      .gte("datum", dateFrom)
      .lte("datum", dateTo);

    const { data: vehiclesData } = await supabase
      .from("vehicles" as any)
      .select("id, merk, model, kenteken, kosten");

    const vehicleKosten: PlatinKost[] = [];
    (vehiclesData || []).forEach((v: any) => {
      (v.kosten || []).forEach((k: any) => {
        if (!k.date) return;
        if (k.date >= dateFrom && k.date <= dateTo) {
          vehicleKosten.push({
            id: `${v.id}-${k.id}`,
            naam: k.description || "Kost",
            bedrag: Number(k.amount) || 0,
            datum: k.date,
            categorie: k.category || "voertuigkosten",
            leverancier: k.leverancier || null,
            source: "vehicle",
            voertuig: `${v.merk || ""} ${v.model || ""} (${v.kenteken || "?"})`.trim(),
          });
        }
      });
    });

    const algemeenKosten: PlatinKost[] = (kostenData || []).map((k: any) => ({
      id: k.id,
      naam: k.naam,
      bedrag: Number(k.bedrag) || 0,
      datum: k.datum,
      categorie: k.categorie,
      leverancier: k.leverancier,
      source: "kosten",
    }));

    setPlatinKosten([...vehicleKosten, ...algemeenKosten]);
  };

  const loadInkoopverklaringen = async () => {
    const dateFrom = `${year}-${pad(month + 1)}-01`;
    const dateTo = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
    const { data } = await supabase
      .from("inkoopverklaringen")
      .select("inkoopprijs")
      .gte("datum", dateFrom)
      .lte("datum", dateTo);
    setInkoopverklaringBedragen((data || []).map((r: any) => Number(r.inkoopprijs) || 0).filter(n => n > 0));
  };

  const loadSoldVehicles = async () => {
    const dateFrom = `${year}-${pad(month + 1)}-01`;
    const dateTo = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
    const { data, error: vErr } = await supabase
      .from("vehicles" as any)
      .select("id, merk, model, kenteken, verkoop_datum, inkoopprijs, verkoopprijs, bouwjaar, kilometerstand, brandstof, verkoop_type, btw_marge_type, koper_naam, inruil_waarde")
      .gte("verkoop_datum", dateFrom)
      .lte("verkoop_datum", dateTo)
      .order("verkoop_datum", { ascending: true });
    if (vErr) console.error("loadSoldVehicles vehicles err", vErr);
    const vehicles = (data || []) as any[];
    const ids = vehicles.map(v => v.id);
    let costsByVehicle: Record<string, number> = {};
    if (ids.length > 0) {
      const { data: costs, error: cErr } = await supabase
        .from("vehicle_costs" as any)
        .select("vehicle_id, amount")
        .in("vehicle_id", ids);
      if (cErr) console.error("loadSoldVehicles costs err", cErr);
      for (const c of (costs || []) as any[]) {
        costsByVehicle[c.vehicle_id] = (costsByVehicle[c.vehicle_id] || 0) + (Number(c.amount) || 0);
      }
    }
    const mapped = vehicles.map((v: any) => ({
      id: v.id,
      merk: v.merk || "",
      model: v.model || "",
      kenteken: v.kenteken || "",
      verkoop_datum: v.verkoop_datum,
      inkoopprijs: Number(v.inkoopprijs) || 0,
      verkoopprijs: Number(v.verkoopprijs) || 0,
      kostenTotaal: costsByVehicle[v.id] || 0,
      bouwjaar: v.bouwjaar,
      kilometerstand: v.kilometerstand,
      brandstof: v.brandstof,
      verkoop_type: v.verkoop_type,
      btw_marge_type: v.btw_marge_type,
      koper_naam: v.koper_naam,
      inruil_waarde: Number(v.inruil_waarde) || 0,
    }));
    setSoldVehicles(mapped);
  };

  // Huidige voorraad: alle voertuigen die nog niet verkocht zijn (live snapshot)
  const loadVoorraad = async () => {
    const { data: vs, error: vErr } = await supabase
      .from("vehicles" as any)
      .select("id, inkoopprijs, status, verkoop_datum");
    if (vErr) { console.error("loadVoorraad err", vErr); return; }
    const inStock = (vs || []).filter((v: any) =>
      !v.verkoop_datum && (v.status || "").toLowerCase() !== "verkocht"
    );
    const ids = inStock.map((v: any) => v.id);
    let costSum = 0;
    if (ids.length > 0) {
      const { data: costs } = await supabase
        .from("vehicle_costs" as any)
        .select("amount, vehicle_id")
        .in("vehicle_id", ids);
      for (const c of (costs || []) as any[]) costSum += Number(c.amount) || 0;
    }
    const inkoopSum = inStock.reduce((s: number, v: any) => s + (Number(v.inkoopprijs) || 0), 0);
    setVoorraad({ aantal: inStock.length, inkoop: inkoopSum, kosten: costSum });
  };



  const load = async () => {
    setError(null);
    try {
      const [inv, rec, pi] = await Promise.all([
        fetchAllPages<Invoice>((p, f) => getSalesInvoices(p, f)),
        fetchAllPages<Receipt>((p, f) => getReceipts(p, f)),
        fetchAllPages<PurchaseInvoice>((p, f) => getPurchaseInvoices(p, f)),
      ]);
      setInvoices(inv);
      setReceipts(rec);
      setPurchaseInvoices(pi);
      await Promise.all([loadPlatinKosten(), loadInkoopverklaringen(), loadSoldVehicles(), loadVoorraad()]);
    } catch (e: any) {
      setError(e.message || "Onbekende fout");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const omzet = useMemo(() => {
    let incl = 0, excl = 0, paid = 0, open = 0;
    for (const inv of invoices) {
      const i = parseFloat(inv.total_price_incl_tax || "0");
      const e = parseFloat(inv.total_price_excl_tax || "0");
      incl += i; excl += e;
      if (inv.state === "paid") paid += i; else open += i;
    }
    return { incl, excl, btw: incl - excl, paid, open, count: invoices.length };
  }, [invoices]);

  // Gecategoriseerde kosten posten (alles gecombineerd)
  type KostPost = {
    id: string;
    bron: "bonnetje" | "inkoopfactuur" | "platin_alg" | "platin_voertuig";
    naam: string;
    leverancier: string;
    datum: string;
    bedrag: number;
    categorie: Categorie;
  };

  const kostPosten: KostPost[] = useMemo(() => {
    const posts: KostPost[] = [];

    const matchesInkoopverklaring = (bedrag: number) =>
      inkoopverklaringBedragen.some(iv => Math.abs(iv - bedrag) < 1);

    const decideCategorie = (text: string, bedrag: number, isParticulier: boolean): Categorie => {
      // 1. Match met bestaande inkoopverklaring in dezelfde maand → zeker inkoop voertuig
      if (bedrag >= 500 && matchesInkoopverklaring(bedrag)) return "inkoop_voertuigen";
      // 2. Particulier + groot bedrag → vermoedelijk voertuig inkoop
      if (isParticulier && bedrag >= 1500) return "inkoop_voertuigen";
      // 3. Standaard keyword classifier
      return classify(text, bedrag);
    };

    for (const r of receipts) {
      const company = r.contact?.company_name;
      const lev = company || [r.contact?.firstname, r.contact?.lastname].filter(Boolean).join(" ") || "";
      const text = `${lev} ${r.reference || ""}`;
      const bedrag = parseFloat(r.total_price_incl_tax || "0");
      posts.push({
        id: `rec-${r.id}`,
        bron: "bonnetje",
        naam: r.reference || "Bonnetje",
        leverancier: lev || "—",
        datum: r.date,
        bedrag,
        categorie: decideCategorie(text, bedrag, !company),
      });
    }

    for (const p of purchaseInvoices) {
      const company = p.contact?.company_name;
      const lev = company || [p.contact?.firstname, p.contact?.lastname].filter(Boolean).join(" ") || "";
      const text = `${lev} ${p.reference || ""}`;
      const bedrag = parseFloat(p.total_price_incl_tax || "0");
      posts.push({
        id: `pi-${p.id}`,
        bron: "inkoopfactuur",
        naam: p.reference || "Inkoopfactuur",
        leverancier: lev || "—",
        datum: p.date,
        bedrag,
        categorie: decideCategorie(text, bedrag, !company),
      });
    }

    for (const k of platinKosten) {
      posts.push({
        id: `plat-${k.id}`,
        bron: k.source === "vehicle" ? "platin_voertuig" : "platin_alg",
        naam: k.voertuig ? `${k.naam} · ${k.voertuig}` : k.naam,
        leverancier: k.leverancier || "—",
        datum: k.datum,
        bedrag: k.bedrag,
        categorie: mapPlatinCategorie(k.categorie),
      });
    }

    return posts;
  }, [receipts, purchaseInvoices, platinKosten, inkoopverklaringBedragen]);

  // === Matching principle (COGS): voertuiginkoop hoort bij de maand waarin de auto verkocht is ===
  // Operationele kosten = alles BEHALVE voertuiginkoop (MB) en voertuig-gebonden Platin kosten.
  // Die laatste twee zijn voorraad/COGS en horen niet thuis in de maandelijkse periode-kosten.
  const operationeleKostPosten = useMemo(
    () => kostPosten.filter(p =>
      p.categorie !== "inkoop_voertuigen" &&
      p.bron !== "platin_voertuig"
    ),
    [kostPosten]
  );
  const operationeleKosten = operationeleKostPosten.reduce((s, p) => s + p.bedrag, 0);

  // COGS = voor elke deze maand verkochte auto: inkoopprijs + alle eraan gekoppelde kosten
  const cogs = useMemo(() => {
    let inkoop = 0, voertuigKosten = 0, voertuigOmzet = 0, margeTotaal = 0;
    for (const v of soldVehicles) {
      inkoop += v.inkoopprijs;
      voertuigKosten += v.kostenTotaal;
      voertuigOmzet += v.verkoopprijs;
      margeTotaal += v.verkoopprijs - v.inkoopprijs - v.kostenTotaal;
    }
    return { inkoop, voertuigKosten, totaal: inkoop + voertuigKosten, voertuigOmzet, margeTotaal };
  }, [soldVehicles]);

  // Informatief: hoeveel is deze maand aan voorraad toegevoegd
  const voorraadAankopen = useMemo(() => {
    const mbInkoop = kostPosten
      .filter(p => p.categorie === "inkoop_voertuigen")
      .reduce((s, p) => s + p.bedrag, 0);
    const voertuigKostenMaand = kostPosten
      .filter(p => p.bron === "platin_voertuig")
      .reduce((s, p) => s + p.bedrag, 0);
    return { mbInkoop, voertuigKostenMaand, totaal: mbInkoop + voertuigKostenMaand };
  }, [kostPosten]);

  // === SIMPELE P&L ===
  // 1. Voertuigwinst = verkoopprijs - inkoop - kosten (per voertuig)
  const voertuigWinst = cogs.margeTotaal;

  // 2. Diensten = alle omzet die NIET van voertuigverkoop komt
  const dienstenOmzet = Math.max(0, omzet.incl - cogs.voertuigOmzet);
  const dienstenWinst = dienstenOmzet - operationeleKosten;

  // 3. Brutowinst = voertuigwinst + dienstenwinst
  const brutowinst = voertuigWinst + dienstenWinst;

  // 4. BTW: marge-BTW (21/121) over positieve voertuigmarge + BTW op diensten (uit Moneybird facturen)
  const margeBTW = Math.max(0, voertuigWinst) * (21 / 121);
  const totaalBTW = omzet.btw + margeBTW;

  // 5. Nettowinst
  const nettoResultaat = brutowinst - totaalBTW;


  // Groepering per categorie (alleen operationele)
  const perCategorie = useMemo(() => {
    const map = new Map<Categorie, { totaal: number; posten: KostPost[] }>();
    for (const p of operationeleKostPosten) {
      const cur = map.get(p.categorie) || { totaal: 0, posten: [] };
      cur.totaal += p.bedrag;
      cur.posten.push(p);
      map.set(p.categorie, cur);
    }
    return Array.from(map.entries())
      .map(([cat, v]) => ({ cat, ...v }))
      .sort((a, b) => b.totaal - a.totaal);
  }, [operationeleKostPosten]);

  const [openCat, setOpenCat] = useState<Categorie | null>(null);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const voorraadGroei = voorraadAankopen.totaal - cogs.totaal;
  const vermogensGroei = nettoResultaat + voorraadGroei;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header — month switcher + refresh, plat */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={prev} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium text-foreground min-w-[140px] text-center tabular-nums">
            {MONTHS[month]} {year}
          </div>
          <Button variant="ghost" size="icon" onClick={next} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          Ververs
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-400 border-l-2 border-red-500/60 pl-3">{error}</div>
      )}

      {/* KPI strip — 4 getallen, geen kaders */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
        <Metric label="Omzet" value={formatEuroDecimal(omzet.incl)} />
        <Metric label="Kosten" value={formatEuroDecimal(operationeleKosten + cogs.totaal)} />
        <Metric label="Nettowinst" value={formatEuroDecimal(nettoResultaat)} tone={nettoResultaat >= 0 ? "pos" : "neg"} />
        <Metric label="Vermogensgroei" value={formatEuroDecimal(vermogensGroei)} tone={vermogensGroei >= 0 ? "pos" : "neg"} subtle={`incl. voorraad ${voorraadGroei >= 0 ? "+" : "−"}${formatEuroDecimal(Math.abs(voorraadGroei))}`} />
      </div>

      {/* Verkochte voertuigen — de Excel-sheet */}
      <Section title="Verkochte voertuigen" hint={`${soldVehicles.length} deze maand`}>
        <VerkopenSheet vehicles={soldVehicles} monthLabel={`${MONTHS[month]} ${year}`} />
      </Section>

      {/* Operationele kosten — compacte lijst */}
      <Section
        title="Operationele kosten"
        hint={`${formatEuroDecimal(operationeleKosten)} totaal`}
      >
        {perCategorie.length === 0 ? (
          <div className="text-xs text-muted-foreground py-2">Geen kosten in deze periode</div>
        ) : (
          <div className="divide-y divide-border/60">
            {perCategorie.map(({ cat, totaal, posten }) => {
              const pct = operationeleKosten > 0 ? (totaal / operationeleKosten) * 100 : 0;
              const isOpen = openCat === cat;
              return (
                <div key={cat}>
                  <button
                    onClick={() => setOpenCat(isOpen ? null : cat)}
                    className="w-full py-2.5 flex items-center gap-3 text-left hover:text-foreground transition-colors"
                  >
                    <div className="flex-1 text-sm text-foreground">{CATEGORIE_LABELS[cat]}</div>
                    <div className="text-[11px] text-muted-foreground tabular-nums w-12 text-right">{pct.toFixed(0)}%</div>
                    <div className="text-sm text-foreground tabular-nums w-24 text-right">{formatEuroDecimal(totaal)}</div>
                  </button>
                  {isOpen && (
                    <div className="pb-3 pl-1 space-y-1.5">
                      {posten.sort((a, b) => b.bedrag - a.bedrag).map(p => (
                        <div key={p.id} className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="truncate mr-3">{p.leverancier} — {p.naam}</div>
                          <div className="tabular-nums">{formatEuroDecimal(p.bedrag)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Detail toggle — optioneel uitklappen */}
      <Details summary="Toon volledige berekening">
        <div className="space-y-4 text-xs">
          <Row k="Omzet voertuigen" v={formatEuroDecimal(cogs.voertuigOmzet)} />
          <Row k="− COGS (inkoop + kosten)" v={formatEuroDecimal(cogs.totaal)} />
          <Row k="= Voertuigwinst" v={formatEuroDecimal(voertuigWinst)} bold />
          <div className="border-t border-border/60 pt-3 space-y-2">
            <Row k="Omzet diensten" v={formatEuroDecimal(dienstenOmzet)} />
            <Row k="− Operationele kosten" v={formatEuroDecimal(operationeleKosten)} />
            <Row k="= Dienstenwinst" v={formatEuroDecimal(dienstenWinst)} bold />
          </div>
          <div className="border-t border-border/60 pt-3 space-y-2">
            <Row k="Brutowinst" v={formatEuroDecimal(brutowinst)} />
            <Row k={`− BTW (incl. marge-BTW ${formatEuroDecimal(margeBTW)})`} v={formatEuroDecimal(totaalBTW)} />
            <Row k="= Nettowinst" v={formatEuroDecimal(nettoResultaat)} bold />
          </div>
          <div className="border-t border-border/60 pt-3 space-y-2">
            <Row k="Voorraad ingekocht" v={formatEuroDecimal(voorraadAankopen.totaal)} />
            <Row k="Voorraad verkocht (COGS)" v={formatEuroDecimal(cogs.totaal)} />
            <Row k="= Voorraadgroei" v={`${voorraadGroei >= 0 ? "+" : "−"}${formatEuroDecimal(Math.abs(voorraadGroei))}`} bold />
          </div>
          <div className="border-t border-border/60 pt-3 space-y-2">
            <Row k="Huidige voorraad" v={`${voorraad.aantal} auto's · ${formatEuroDecimal(voorraad.inkoop + voorraad.kosten)}`} />
          </div>
        </div>
      </Details>
    </div>
  );
};

const Metric = ({ label, value, tone, subtle }: { label: string; value: string; tone?: "pos" | "neg"; subtle?: string }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
    <div className={cn(
      "text-2xl font-semibold tabular-nums",
      tone === "pos" && "text-emerald-500",
      tone === "neg" && "text-red-500",
      !tone && "text-foreground",
    )}>{value}</div>
    {subtle && <div className="text-[10px] text-muted-foreground mt-1">{subtle}</div>}
  </div>
);

const Section = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <div className="flex items-baseline justify-between border-b border-border/60 pb-1.5">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{title}</h3>
      {hint && <span className="text-[10px] text-muted-foreground tabular-nums">{hint}</span>}
    </div>
    {children}
  </section>
);

const Row = ({ k, v, bold }: { k: string; v: string; bold?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className={cn("text-muted-foreground", bold && "text-foreground font-medium")}>{k}</span>
    <span className={cn("tabular-nums text-foreground", bold && "font-semibold")}>{v}</span>
  </div>
);

const Details = ({ summary, children }: { summary: string; children: React.ReactNode }) => (
  <details className="group border-t border-border/60 pt-3">
    <summary className="cursor-pointer list-none text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5">
      <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
      {summary}
    </summary>
    <div className="mt-4">{children}</div>
  </details>
);

const bronLabel = (b: string) => {
  switch (b) {
    case "bonnetje": return "MB bonnetje";
    case "inkoopfactuur": return "MB inkoopfactuur";
    case "platin_alg": return "Platin algemeen";
    case "platin_voertuig": return "Platin voertuig";
    default: return b;
  }
};

const Stat = ({ label, value, highlight, color, small }: {
  label: string; value: string; highlight?: boolean; color?: "emerald" | "amber" | "red"; small?: boolean;
}) => (
  <div>
    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
    <div className={cn(
      "font-bold tabular-nums",
      small ? "text-lg" : highlight ? "text-3xl" : "text-2xl",
      color === "emerald" && "text-emerald-500",
      color === "amber" && "text-amber-500",
      color === "red" && "text-red-500",
      !color && "text-foreground",
    )}>{value}</div>
  </div>
);

const SourceStat = ({ icon, label, value, count }: { icon: React.ReactNode; label: string; value: string; count: number }) => (
  <div>
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider mb-1">
      {icon}
      {label}
    </div>
    <div className="text-lg font-bold text-foreground tabular-nums">{value}</div>
    <div className="text-xs text-muted-foreground mt-0.5">{count} {count === 1 ? "post" : "posten"}</div>
  </div>
);

export default WinstVerliesTab;

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, TrendingUp, TrendingDown, Receipt, FileText, Wrench, Tag, Car, Calculator, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMoneybird } from "@/hooks/useMoneybird";
import { formatEuroDecimal } from "@/types/vehicle";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

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
  }>>([]);
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
      .select("id, merk, model, kenteken, verkoop_datum, inkoopprijs, verkoopprijs")
      .gte("verkoop_datum", dateFrom)
      .lte("verkoop_datum", dateTo);
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
    }));
    setSoldVehicles(mapped);
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
      await Promise.all([loadPlatinKosten(), loadInkoopverklaringen(), loadSoldVehicles()]);
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

  // COGS van deze maand = voor elke deze maand verkochte auto: inkoopprijs + alle eraan gekoppelde kosten
  const cogs = useMemo(() => {
    let inkoop = 0, voertuigKosten = 0;
    for (const v of soldVehicles) {
      inkoop += v.inkoopprijs;
      voertuigKosten += v.kostenTotaal;
    }
    return { inkoop, voertuigKosten, totaal: inkoop + voertuigKosten };
  }, [soldVehicles]);

  // Informatief: hoeveel is deze maand aan voorraad toegevoegd (niet meegerekend in P&L)
  const voorraadAankopen = useMemo(() => {
    const mbInkoop = kostPosten
      .filter(p => p.categorie === "inkoop_voertuigen")
      .reduce((s, p) => s + p.bedrag, 0);
    const voertuigKostenMaand = kostPosten
      .filter(p => p.bron === "platin_voertuig")
      .reduce((s, p) => s + p.bedrag, 0);
    return { mbInkoop, voertuigKostenMaand, totaal: mbInkoop + voertuigKostenMaand };
  }, [kostPosten]);

  // Resultaat (alles incl BTW — BTW-correctie komt in stap 5)
  const brutowinst = omzet.incl - cogs.totaal;
  const nettoResultaat = brutowinst - operationeleKosten;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-card border border-border rounded-[3px] p-3">
        <Button variant="ghost" size="icon" onClick={prev} className="h-9 w-9">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <div className="text-lg font-semibold text-foreground font-['Poppins']">
            {MONTHS[month]} {year}
          </div>
          <div className="text-xs text-muted-foreground">
            {periodStart.slice(6, 8)}-{periodStart.slice(4, 6)} t/m {periodEnd.slice(6, 8)}-{periodEnd.slice(4, 6)}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={next} className="h-9 w-9">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-[3px]">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* OMZET */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Omzet (Moneybird verkoopfacturen)
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Stat label="Totaal incl. BTW" value={formatEuroDecimal(omzet.incl)} highlight color="emerald" />
            <Stat label="Totaal excl. BTW" value={formatEuroDecimal(omzet.excl)} />
            <Stat label="BTW" value={formatEuroDecimal(omzet.btw)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border">
            <Stat label="Betaald" value={formatEuroDecimal(omzet.paid)} color="emerald" small />
            <Stat label="Openstaand" value={formatEuroDecimal(omzet.open)} color="amber" small />
            <Stat label="Aantal facturen" value={String(omzet.count)} small />
          </div>
        </CardContent>
      </Card>

      {/* RESULTAAT */}
      <Card className="border-emerald-500/30">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Resultaat (matching: COGS bij verkoop)
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Stat label="Omzet" value={formatEuroDecimal(omzet.incl)} color="emerald" />
            <Stat label="− COGS" value={formatEuroDecimal(cogs.totaal)} color="red" />
            <Stat label="= Brutowinst" value={formatEuroDecimal(brutowinst)} color={brutowinst >= 0 ? "emerald" : "red"} />
            <Stat label="− Operationele kosten" value={formatEuroDecimal(operationeleKosten)} color="red" />
          </div>
          <div className="pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Nettoresultaat (incl. BTW — marge-BTW correctie volgt in stap 5)</div>
            <div className={cn("text-4xl font-bold tabular-nums", nettoResultaat >= 0 ? "text-emerald-500" : "text-red-500")}>
              {nettoResultaat >= 0 ? "+" : "−"}{formatEuroDecimal(Math.abs(nettoResultaat))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* COGS — Verkochte auto's deze maand */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-foreground" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Kostprijs verkochte auto's
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Stat label="Inkoopprijs" value={formatEuroDecimal(cogs.inkoop)} small />
            <Stat label="Bijkomende kosten" value={formatEuroDecimal(cogs.voertuigKosten)} small />
            <Stat label="Totaal COGS" value={formatEuroDecimal(cogs.totaal)} color="red" small />
          </div>
          <div className="pt-3 border-t border-border">
            {soldVehicles.length === 0 ? (
              <div className="text-xs text-muted-foreground py-2 text-center">Geen voertuigen verkocht deze maand</div>
            ) : (
              <div className="divide-y divide-border">
                {soldVehicles.map(v => {
                  const totaalKost = v.inkoopprijs + v.kostenTotaal;
                  const marge = v.verkoopprijs - totaalKost;
                  return (
                    <div key={v.id} className="py-2 grid grid-cols-12 gap-2 items-center text-xs">
                      <div className="col-span-5">
                        <div className="text-foreground font-medium truncate">{v.merk} {v.model}</div>
                        <div className="text-[10px] text-muted-foreground">{v.kenteken} · verkocht {v.verkoop_datum}</div>
                      </div>
                      <div className="col-span-2 text-right text-muted-foreground tabular-nums">
                        <div className="text-[10px]">Inkoop</div>
                        <div>{formatEuroDecimal(v.inkoopprijs)}</div>
                      </div>
                      <div className="col-span-2 text-right text-muted-foreground tabular-nums">
                        <div className="text-[10px]">+ Kosten</div>
                        <div>{formatEuroDecimal(v.kostenTotaal)}</div>
                      </div>
                      <div className="col-span-3 text-right tabular-nums">
                        <div className="text-[10px] text-muted-foreground">Marge</div>
                        <div className={cn("font-semibold", marge >= 0 ? "text-emerald-500" : "text-red-500")}>
                          {marge >= 0 ? "+" : "−"}{formatEuroDecimal(Math.abs(marge))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* OPERATIONELE KOSTEN */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Operationele kosten
            </h2>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Totaal (excl. voertuig-inkoop & voertuig-kosten)</div>
            <div className="text-3xl font-bold text-red-500 tabular-nums">
              {formatEuroDecimal(operationeleKosten)}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-border">
            <SourceStat
              icon={<Receipt className="h-4 w-4" />}
              label="Bonnetjes (MB)"
              value={formatEuroDecimal(operationeleKostPosten.filter(p => p.bron === "bonnetje").reduce((s, p) => s + p.bedrag, 0))}
              count={operationeleKostPosten.filter(p => p.bron === "bonnetje").length}
            />
            <SourceStat
              icon={<FileText className="h-4 w-4" />}
              label="Inkoopfacturen (MB)"
              value={formatEuroDecimal(operationeleKostPosten.filter(p => p.bron === "inkoopfactuur").reduce((s, p) => s + p.bedrag, 0))}
              count={operationeleKostPosten.filter(p => p.bron === "inkoopfactuur").length}
            />
            <SourceStat
              icon={<Wrench className="h-4 w-4" />}
              label="Platin algemeen"
              value={formatEuroDecimal(operationeleKostPosten.filter(p => p.bron === "platin_alg").reduce((s, p) => s + p.bedrag, 0))}
              count={operationeleKostPosten.filter(p => p.bron === "platin_alg").length}
            />
          </div>
        </CardContent>
      </Card>

      {/* CATEGORISATIE */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-foreground" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Verdeling operationele kosten
            </h2>
          </div>

          {operationeleKosten > 0 && (
            <div className="flex h-2 w-full overflow-hidden rounded-[3px] bg-muted">
              {perCategorie.map(({ cat, totaal }) => (
                <div
                  key={cat}
                  className={CATEGORIE_KLEUREN[cat]}
                  style={{ width: `${(totaal / operationeleKosten) * 100}%` }}
                  title={`${CATEGORIE_LABELS[cat]}: ${formatEuroDecimal(totaal)}`}
                />
              ))}
            </div>
          )}

          <div className="divide-y divide-border">
            {perCategorie.length === 0 && (
              <div className="text-xs text-muted-foreground py-4 text-center">Geen operationele kosten in deze periode</div>
            )}
            {perCategorie.map(({ cat, totaal, posten }) => {
              const pct = operationeleKosten > 0 ? (totaal / operationeleKosten) * 100 : 0;
              const isOpen = openCat === cat;
              return (
                <div key={cat}>
                  <button
                    onClick={() => setOpenCat(isOpen ? null : cat)}
                    className="w-full py-3 flex items-center gap-3 hover:bg-muted/30 px-2 -mx-2 rounded-[3px] transition-colors"
                  >
                    <div className={cn("h-3 w-3 rounded-[2px] flex-shrink-0", CATEGORIE_KLEUREN[cat])} />
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-foreground">{CATEGORIE_LABELS[cat]}</div>
                      <div className="text-[10px] text-muted-foreground">{posten.length} {posten.length === 1 ? "post" : "posten"} · {pct.toFixed(1)}%</div>
                    </div>
                    <div className="text-sm font-semibold text-red-500 tabular-nums">
                      −{formatEuroDecimal(totaal)}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="bg-muted/20 rounded-[3px] mb-2 divide-y divide-border">
                      {posten.sort((a, b) => b.bedrag - a.bedrag).map(p => (
                        <div key={p.id} className="px-3 py-2 flex items-center justify-between text-xs">
                          <div className="flex-1 min-w-0 mr-3">
                            <div className="text-foreground truncate">{p.leverancier} — {p.naam}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {p.datum} · <span className="uppercase">{bronLabel(p.bron)}</span>
                            </div>
                          </div>
                          <div className="text-red-400 tabular-nums font-medium">−{formatEuroDecimal(p.bedrag)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* VOORRAAD-MUTATIE (informatief, niet in P&L) */}
      <Card className="border-blue-500/20">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Voorraad-mutatie deze maand <span className="text-[10px] text-muted-foreground normal-case ml-2">(informatief — telt niet mee in resultaat)</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Stat label="Voertuiginkoop (MB)" value={formatEuroDecimal(voorraadAankopen.mbInkoop)} small />
            <Stat label="Kosten op auto's" value={formatEuroDecimal(voorraadAankopen.voertuigKostenMaand)} small />
            <Stat label="Totaal toegevoegd" value={formatEuroDecimal(voorraadAankopen.totaal)} small color="amber" />
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground text-center">
        Stap 4 van 6 — Matching principle: voertuig-inkoop telt pas mee als COGS in de maand waarin de auto verkocht is. Voorraad-aankopen worden apart getoond. Daarna: marge-BTW (21/121) correctie + voorraadwaarde.
      </div>
    </div>
  );
};

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

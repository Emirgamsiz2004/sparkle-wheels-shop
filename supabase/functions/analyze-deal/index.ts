import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const escapeXml = (str: string) =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const extractXmlValue = (xml: string, tag: string): string | null => {
  // Try multiple patterns: exact tag, case-insensitive
  const patterns = [
    new RegExp(`<${tag}>([^<]*)</${tag}>`, "i"),
    new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i"),
  ];
  for (const regex of patterns) {
    const match = xml.match(regex);
    if (match && match[1]?.trim()) return match[1].trim();
  }
  return null;
};

const extractAllXmlValues = (xml: string, tag: string): string[] => {
  const regex = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "gi");
  const matches: string[] = [];
  let m;
  while ((m = regex.exec(xml)) !== null) matches.push(m[1].trim());
  return matches;
};

// Helper to decode VWE SOAP response
function decodeVweResponse(responseText: string): string {
  const resultMatch = responseText.match(/<standaardDataRequestResult>([\s\S]*?)<\/standaardDataRequestResult>/i);
  return (resultMatch ? resultMatch[1] : responseText)
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

// ─── Step 1: RDW Open Data – basisgegevens ───
async function fetchRdwData(kenteken: string) {
  const clean = kenteken.toUpperCase().replace(/[^A-Z0-9]/g, "");
  console.log("RDW: fetching for", clean);

  const [voertuigRes, brandstofRes] = await Promise.all([
    fetch(`https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${clean}`),
    fetch(`https://opendata.rdw.nl/resource/8ys7-d773.json?kenteken=${clean}`),
  ]);

  const voertuigen = await voertuigRes.json();
  const brandstoffen = await brandstofRes.json();
  const v = voertuigen[0] || {};
  const b = brandstoffen[0] || {};

  return {
    merk: v.merk || null,
    handelsbenaming: v.handelsbenaming || null,
    inrichting: v.inrichting || null,
    eerste_kleur: v.eerste_kleur || null,
    datum_eerste_toelating: v.datum_eerste_toelating || null,
    datum_eerste_afgifte: v.datum_eerste_afgifte_nederland || null,
    catalogusprijs: v.catalogusprijs ? Number(v.catalogusprijs) : null,
    aantal_cilinders: v.aantal_cilinders || null,
    cilinderinhoud: v.cilinderinhoud || null,
    vermogen: v.vermogen_massarijklaar ? `${v.vermogen_massarijklaar} kW` : null,
    massa: v.massa_rijklaar || null,
    brandstof: b.brandstof_omschrijving || null,
    brandstof_verbruik: b.brandstof_verbruik_gecombineerd || null,
    co2_uitstoot: b.co2_uitstoot_gecombineerd || null,
    apk_vervaldatum: v.vervaldatum_apk || null,
    wam_verzekerd: v.wam_verzekerd || null,
    aantal_eigenaren: v.aantal_eigenaren || null,
    export_indicator: v.export_indicator || null,
    gestolen: v.openstaande_terugroepactie_indicator || null,
  };
}

// ─── Step 2: VWE SOAP – Taxatie + Opties + VIN ───
async function fetchVweData(kenteken: string) {
  const VWE_USERNAME = Deno.env.get("VWE_USERNAME");
  const VWE_PASSWORD = Deno.env.get("VWE_PASSWORD");
  if (!VWE_USERNAME || !VWE_PASSWORD) throw new Error("VWE credentials niet geconfigureerd");

  const clean = kenteken.toUpperCase().replace(/[^A-Z0-9]/g, "");

  // Use DataRequest method (older, but compatible with this account)
  const innerXml = `<bericht><authenticatie><gebruikersnaam>${VWE_USERNAME}</gebruikersnaam><wachtwoord>${VWE_PASSWORD}</wachtwoord><berichtsoort>VWE-TXN</berichtsoort></authenticatie><parameters><kenteken>${clean}</kenteken></parameters></bericht>`;

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <DataRequest xmlns="http://hetextranet.nl/InterData">
      <XMLBody>${escapeXml(innerXml)}</XMLBody>
    </DataRequest>
  </soap:Body>
</soap:Envelope>`;

  const response = await fetch("https://interdata.vwe.nl/DataAanvraag.asmx", {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: "http://hetextranet.nl/InterData/DataRequest",
    },
    body: soapEnvelope,
  });

  const responseText = await response.text();
  if (!response.ok) throw new Error(`VWE API error [${response.status}]`);

  const decoded = decodeVweResponse(responseText);
  
  // Log a portion of decoded XML for debugging
  console.log("VWE decoded XML (first 2000 chars):", decoded.substring(0, 2000));
  console.log("VWE decoded XML (2000-4000):", decoded.substring(2000, 4000));

  // Check for VWE error response
  const errorCode = extractXmlValue(decoded, "code");
  const errorMsg = extractXmlValue(decoded, "omschrijving");
  if (errorCode && errorCode !== "0" && errorMsg && errorMsg.includes("niet correct")) {
    console.warn("VWE error:", errorCode, errorMsg);
    return {
      vin: null, inkoopwaarde: null, verkoopwaarde: null, nieuwprijs: null, handelsprijs: null,
      merk: null, model: null, bouwjaar: null, brandstof: null, kmStand: null, opties: [],
    };
  }

  // Try to extract VIN from various possible tags
  const vin = extractXmlValue(decoded, "vin") 
    || extractXmlValue(decoded, "VIN") 
    || extractXmlValue(decoded, "chassisnummer")
    || extractXmlValue(decoded, "Chassisnummer")
    || extractXmlValue(decoded, "voertuigidentificatienummer")
    || null;
  console.log("VWE extracted VIN:", vin);

  // Extract options - try many possible tag names
  const optieOmschrijvingen = [
    ...extractAllXmlValues(decoded, "optieomschrijving"),
    ...extractAllXmlValues(decoded, "OptieOmschrijving"),
    ...extractAllXmlValues(decoded, "omschrijving"),
    ...extractAllXmlValues(decoded, "Omschrijving"),
  ];
  
  const optieCodes = [
    ...extractAllXmlValues(decoded, "optiecode"),
    ...extractAllXmlValues(decoded, "OptieCode"),
    ...extractAllXmlValues(decoded, "code"),
    ...extractAllXmlValues(decoded, "Code"),
  ];

  // Deduplicate options by description
  const seenOpties = new Set<string>();
  const opties: any[] = [];
  for (let i = 0; i < optieOmschrijvingen.length; i++) {
    const omschr = optieOmschrijvingen[i];
    if (omschr && !seenOpties.has(omschr.toLowerCase())) {
      seenOpties.add(omschr.toLowerCase());
      opties.push({
        code: optieCodes[i] || null,
        omschrijving: omschr,
        type: "autotelex",
      });
    }
  }

  console.log("VWE opties found after parsing:", opties.length);
  if (opties.length > 0) console.log("VWE first 3 opties:", JSON.stringify(opties.slice(0, 3)));

  // Extract taxatie values - try multiple case variations
  const inkoopwaarde = extractXmlValue(decoded, "inkoopwaarde") || extractXmlValue(decoded, "Inkoopwaarde") || extractXmlValue(decoded, "InkoopWaarde");
  const verkoopwaarde = extractXmlValue(decoded, "verkoopwaarde") || extractXmlValue(decoded, "Verkoopwaarde") || extractXmlValue(decoded, "VerkoopWaarde");
  const nieuwprijs = extractXmlValue(decoded, "nieuwprijs") || extractXmlValue(decoded, "Nieuwprijs") || extractXmlValue(decoded, "NieuwPrijs");
  const handelsprijs = extractXmlValue(decoded, "handelsprijs") || extractXmlValue(decoded, "Handelsprijs") || extractXmlValue(decoded, "HandelsPrijs");

  console.log("VWE taxatie - inkoop:", inkoopwaarde, "verkoop:", verkoopwaarde, "handel:", handelsprijs, "nieuw:", nieuwprijs);

  return {
    vin,
    inkoopwaarde,
    verkoopwaarde,
    nieuwprijs,
    handelsprijs,
    merk: extractXmlValue(decoded, "merk") || extractXmlValue(decoded, "Merk"),
    model: extractXmlValue(decoded, "handelsbenaming") || extractXmlValue(decoded, "Handelsbenaming") || extractXmlValue(decoded, "model") || extractXmlValue(decoded, "Model"),
    bouwjaar: extractXmlValue(decoded, "datumeerstetoelating") || extractXmlValue(decoded, "DatumEersteToelating"),
    brandstof: extractXmlValue(decoded, "brandstof") || extractXmlValue(decoded, "Brandstof"),
    kmStand: extractXmlValue(decoded, "tellerstand") || extractXmlValue(decoded, "Tellerstand"),
    opties,
  };
}

// ─── Step 2b: SilverDAT VIN – Fabrieksuitrusting via VIN ───
async function fetchSilverDatVin(vin: string) {
  const VWE_USERNAME = Deno.env.get("VWE_USERNAME");
  const VWE_PASSWORD = Deno.env.get("VWE_PASSWORD");
  if (!VWE_USERNAME || !VWE_PASSWORD || !vin) return null;

  console.log("SilverDAT: fetching VIN equipment for", vin);

  const innerXml = `<request><authenticatie><gebruikersnaam>${VWE_USERNAME}</gebruikersnaam><wachtwoord>${VWE_PASSWORD}</wachtwoord></authenticatie><parameters><vin>${vin}</vin></parameters><rubrieken><datVoertuig/></rubrieken></request>`;

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <standaardDataRequest xmlns="http://hetextranet.nl/InterData">
      <requestXml>${escapeXml(innerXml)}</requestXml>
    </standaardDataRequest>
  </soap:Body>
</soap:Envelope>`;

  try {
    const response = await fetch("https://interdata.vwe.nl/DataAanvraag.asmx", {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "http://hetextranet.nl/InterData/standaardDataRequest",
      },
      body: soapEnvelope,
    });

    const responseText = await response.text();
    if (!response.ok) {
      console.warn("SilverDAT VIN error:", response.status);
      return null;
    }

    const decoded = decodeVweResponse(responseText);
    console.log("SilverDAT decoded (first 1000 chars):", decoded.substring(0, 1000));

    // Extract SilverDAT uitrustingen
    const uitrustingNamen = extractAllXmlValues(decoded, "uitrusting-naam");
    const standaardOfOptioneel = extractAllXmlValues(decoded, "standaardofoptioneel");
    const fabrikantcodes = extractAllXmlValues(decoded, "fabrikantcode");
    const prijzen = extractAllXmlValues(decoded, "prijs");

    const fabrieksopties = uitrustingNamen.map((naam, i) => ({
      naam,
      fabrikantcode: fabrikantcodes[i] || null,
      type: standaardOfOptioneel[i] || "onbekend",
      prijs: prijzen[i] ? Number(prijzen[i]) : null,
    }));

    console.log("SilverDAT: found", fabrieksopties.length, "equipment items");

    return {
      fabrieksopties,
      model: extractXmlValue(decoded, "model"),
      submodel: extractXmlValue(decoded, "submodel"),
    };
  } catch (e) {
    console.error("SilverDAT VIN error:", e);
    return null;
  }
}

// ─── Step 3: Firecrawl – Marktplaats & AutoScout24 scraping ───
async function scrapeMarktListings(merk: string, model: string, bouwjaar: string | null) {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) {
    console.warn("FIRECRAWL_API_KEY not set, skipping market scraping");
    return { listings: [], bronnen: [], extractedPrices: [] };
  }

  const jaar = bouwjaar ? bouwjaar.substring(0, 4) : "";
  // More specific queries to get individual listings with prices
  const queries = [
    `${merk} ${model} ${jaar} te koop prijs site:marktplaats.nl`,
    `${merk} ${model} ${jaar} occasion prijs site:autoscout24.nl`,
    `${merk} ${model} ${jaar} te koop site:autotrack.nl`,
  ];

  const results: any[] = [];
  const bronnen: string[] = [];
  const extractedPrices: number[] = [];

  for (const query of queries) {
    try {
      const res = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          limit: 5,
          lang: "nl",
          country: "nl",
          scrapeOptions: { formats: ["markdown"] },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const items = data.data || [];
        for (const item of items) {
          bronnen.push(item.url);
          
          // Extract prices from description and title (NOT from full markdown which contains filter UI)
          const priceText = (item.description || "") + " " + (item.title || "");
          
          // Match patterns like "€ 14.950" or "€14.950,-" or "€ 8.900"
          const priceMatches = priceText.match(/€\s*(\d{1,3}(?:\.\d{3})*(?:,\d+)?)/g) || [];
          for (const pm of priceMatches) {
            const numStr = pm.replace("€", "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".").replace(",-", "");
            const num = parseFloat(numStr);
            // Only accept realistic car prices (€2000 - €200000)
            if (num >= 2000 && num <= 200000) {
              extractedPrices.push(num);
            }
          }

          results.push({
            titel: item.title || "",
            url: item.url || "",
            bron: new URL(item.url || "https://unknown.com").hostname,
            beschrijving: item.description || "",
            content_snippet: (item.markdown || "").substring(0, 500),
          });
        }
      }
    } catch (e) {
      console.error(`Firecrawl search error for "${query}":`, e);
    }
  }

  // Deduplicate and sort prices
  const uniquePrices = [...new Set(extractedPrices)].sort((a, b) => a - b);
  console.log("Extracted prices from listings:", uniquePrices.length, uniquePrices.slice(0, 10));

  return { listings: results, bronnen: [...new Set(bronnen)], extractedPrices: uniquePrices };
}

// ─── Step 4a: Perplexity – Bekende problemen & kwalen ───
async function fetchBekendeKwalen(merk: string, model: string, bouwjaar: string | null, motorcode: string | null) {
  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  if (!PERPLEXITY_API_KEY) return { kwalen: "", bronnen: [] };

  const jaar = bouwjaar ? bouwjaar.substring(0, 4) : "";

  const query = `Wat zijn de bekende problemen, kwalen en aandachtspunten bij de ${merk} ${model} ${jaar ? `bouwjaar ${jaar}` : ""}?
${motorcode ? `Motorcode: ${motorcode}` : ""}

Zoek specifiek naar:
1. Veelvoorkomende technische defecten en storingen
2. Bekende problemen met motor, versnellingsbak, elektronica
3. Typische slijtdelen die vaak kapot gaan
4. Roestgevoelige plekken
5. Terugroepacties van de fabrikant
6. Problemen gemeld op autofora en klachtensites
7. Kostbare reparaties waar kopers vaak mee te maken krijgen

Geef concrete, feitelijke informatie met kilometerstand/leeftijd wanneer problemen vaak optreden.`;

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: "Je bent een expert automonteur en voertuigspecialist. Geef gedetailleerde technische informatie over bekende problemen van specifieke automodellen. Focus op feiten, geen meningen." },
          { role: "user", content: query },
        ],
      }),
    });

    if (!response.ok) {
      console.warn("Perplexity kwalen error:", response.status);
      return { kwalen: "", bronnen: [] };
    }

    const data = await response.json();
    return {
      kwalen: data.choices?.[0]?.message?.content || "",
      bronnen: data.citations || [],
    };
  } catch (e) {
    console.error("Perplexity kwalen error:", e);
    return { kwalen: "", bronnen: [] };
  }
}

// ─── Step 4b: Perplexity – Marktanalyse ───
async function fetchMarktAnalyse(merk: string, model: string, bouwjaar: string | null, opties: any[]) {
  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY niet geconfigureerd");

  const jaar = bouwjaar ? bouwjaar.substring(0, 4) : "";
  const optiesList = opties.slice(0, 10).map(o => o.omschrijving || o.naam).join(", ");

  const query = `Geef een marktanalyse voor een ${merk} ${model} ${jaar ? `uit ${jaar}` : ""}.
${optiesList ? `Opties: ${optiesList}` : ""}

Beantwoord het volgende:
1. Gemiddelde vraagprijs, laagste en hoogste prijs op basis van actuele advertenties (Marktplaats, AutoScout24, AutoTrack)
2. Geschat aantal vergelijkbare exemplaren te koop in Nederland
3. Gemiddelde standtijd voor dit model
4. Hoe populair zijn de genoemde opties? Welke verhogen de waarde significant?
5. Seizoensinvloed op de verkoop van dit type auto

Antwoord alleen met feiten en cijfers.`;

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [
        { role: "system", content: "Je bent een expert in de Nederlandse automarkt. Geef alleen feitelijke marktdata." },
        { role: "user", content: query },
      ],
      search_recency_filter: "month",
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Perplexity error [${response.status}]: ${errText}`);
  }

  const data = await response.json();
  return {
    analyseTekst: data.choices?.[0]?.message?.content || "",
    bronnen: data.citations || [],
  };
}

// ─── Step 5: AI Scoring met uitgebreide data + kostencalculator ───
async function generateAiScore(rdwData: any, vweData: any, marktData: any, scrapedListings: any[], opties: any[], extraInput: any, extractedPrices: number[]) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY niet geconfigureerd");

  const listingsSummary = scrapedListings.slice(0, 8).map(l =>
    `- ${l.titel} (${l.bron}): ${l.beschrijving}`
  ).join("\n");

  const optiesSummary = opties.map(o => o.omschrijving || o.naam).join(", ");

  const staatLabels: Record<string, string> = {
    nieuwstaat: "Nieuwstaat", zeer_goed: "Zeer goed", goed: "Goed", redelijk: "Redelijk", matig: "Matig"
  };
  const bandenLabels: Record<string, string> = {
    nieuw: "Nieuw (7mm+)", goed: "Goed (4-7mm)", matig: "Matig (2-4mm)", vervangen: "Moet vervangen (<2mm)"
  };

  // Calculate reference prices
  const vweInkoop = vweData.inkoopwaarde ? Number(vweData.inkoopwaarde) : null;
  const vweVerkoop = vweData.verkoopwaarde ? Number(vweData.verkoopwaarde) : null;
  const vweHandel = vweData.handelsprijs ? Number(vweData.handelsprijs) : null;
  const vraagprijs = extraInput.vraagprijs ? Number(extraInput.vraagprijs) : null;

  // Price analysis from scraped data
  let prijsAnalyse = "";
  if (extractedPrices.length > 0) {
    const avg = Math.round(extractedPrices.reduce((a, b) => a + b, 0) / extractedPrices.length);
    const min = extractedPrices[0];
    const max = extractedPrices[extractedPrices.length - 1];
    prijsAnalyse = `\n\nGESCRAPTE MARKTPRIJZEN (uit ${extractedPrices.length} gevonden prijzen):
- Laagste gevonden prijs: €${min.toLocaleString("nl-NL")}
- Gemiddelde prijs: €${avg.toLocaleString("nl-NL")}
- Hoogste gevonden prijs: €${max.toLocaleString("nl-NL")}`;
  }

  // Pre-calculate margin
  let margeInfo = "";
  if (vraagprijs && vweVerkoop) {
    const brutomarge = vweVerkoop - vraagprijs;
    const margePerc = ((brutomarge / vweVerkoop) * 100).toFixed(1);
    margeInfo = `\n\n⚠️ VOORBEREKENDE MARGE:
- Bruto marge (verkoopwaarde - inkoopprijs): €${brutomarge} (${margePerc}%)
- ${brutomarge < 0 ? "NEGATIEVE MARGE! Je koopt BOVEN de verkoopwaarde! Dit is een SLECHTE deal." : brutomarge < 1000 ? "Zeer lage marge, nauwelijks winstgevend na kosten." : brutomarge < 2500 ? "Krappe marge, risicovol." : "Gezonde marge."}`;
  }
  if (vraagprijs && vweInkoop) {
    const verschilInkoop = vweInkoop - vraagprijs;
    margeInfo += `\n- Verschil met VWE inkoopwaarde: €${verschilInkoop} (${verschilInkoop > 0 ? "onder inkoopwaarde = goed" : verschilInkoop === 0 ? "gelijk aan inkoopwaarde = neutraal" : "BOVEN inkoopwaarde = slecht"})`;
  }
  if (vraagprijs && vweHandel) {
    const verschilHandel = vweHandel - vraagprijs;
    margeInfo += `\n- Verschil met VWE handelsprijs: €${verschilHandel} (${verschilHandel > 0 ? "onder handelsprijs = goed" : "BOVEN handelsprijs = slecht"})`;
  }

  const prompt = `Je bent een auto-inkoop expert voor een Nederlands autobedrijf. Analyseer deze deal en geef een score van 0-100.

KRITISCH BELANGRIJK - SCORINGSREGELS:
De score MOET gebaseerd zijn op harde rekenkundige logica:

MARGE BEREKENING (dit is de BELANGRIJKSTE factor):
- Als de inkoopprijs HOGER is dan de VWE verkoopwaarde → Score MAXIMAAL 20 (zeer slechte deal, je verliest geld)
- Als de inkoopprijs HOGER is dan de VWE handelsprijs → Score MAXIMAAL 35 (slechte deal)
- Als de inkoopprijs GELIJK is aan de VWE inkoopwaarde → Score rond 40-50 (gemiddeld, weinig marge)
- Als de inkoopprijs ONDER de VWE inkoopwaarde → Score 50-70 (redelijke tot goede deal)
- Als de inkoopprijs 20%+ ONDER de VWE inkoopwaarde → Score 70-85 (goede deal)
- Als de inkoopprijs 30%+ ONDER de VWE inkoopwaarde → Score 85-100 (uitstekende deal)

ALS VWE TAXATIEGEGEVENS ONTBREKEN:
- Gebruik dan de gescrapte marktprijzen en Perplexity marktanalyse als referentie
- Als de inkoopprijs HOGER is dan de gemiddelde marktprijs → Slechte deal
- Als de inkoopprijs GELIJK is aan de laagste marktprijs → Matige deal  
- Als de inkoopprijs 20%+ ONDER de gemiddelde marktprijs → Goede deal

Score labels:
- 0-20: Slechte deal (verlies)
- 21-40: Matige deal
- 41-55: Redelijke deal
- 56-70: Goede deal  
- 71-85: Zeer goede deal
- 86-100: Uitstekende deal

OPKNAPKOSTEN - Bereken geschatte kosten:
Schat de totale opknapkosten op basis van alle beschikbare informatie:
- APK kosten (als APK bijna verlopen of verlopen)
- Schade reparatie (als niet schadevrij)
- Banden vervangen (als bandenprofiel matig/vervangen)
- Schoonmaak/detailing: €250-500
- Transport/logistiek: €100-300
- Ontbrekend onderhoudsboekje: -€500 waardevermindering
- 1 sleutel ipv 2: -€200-500 waardevermindering
- Rooklucht verwijderen: €200-400
- Eventuele bekende problemen van dit model

Trek deze kosten af van de bruto marge voor de netto marge berekening.

De geschatte verkoopprijs moet REALISTISCH zijn op basis van marktdata. Gebruik de VWE verkoopwaarde en live advertenties als referentie.
${margeInfo}
${prijsAnalyse}

VWE Taxatiegegevens:
- Inkoopwaarde: ${vweData.inkoopwaarde ? `€${vweData.inkoopwaarde}` : "NIET BESCHIKBAAR"}
- Verkoopwaarde: ${vweData.verkoopwaarde ? `€${vweData.verkoopwaarde}` : "NIET BESCHIKBAAR"}
- Handelsprijs: ${vweData.handelsprijs ? `€${vweData.handelsprijs}` : "NIET BESCHIKBAAR"}
- Nieuwprijs: ${vweData.nieuwprijs ? `€${vweData.nieuwprijs}` : "NIET BESCHIKBAAR"}

RDW Voertuigdata:
- VIN: ${vweData.vin || "onbekend"}
- Merk/Model: ${rdwData.merk || vweData.merk || "onbekend"} ${rdwData.handelsbenaming || vweData.model || ""}
- Eerste toelating: ${rdwData.datum_eerste_toelating || vweData.bouwjaar || "onbekend"}
- Catalogusprijs: ${rdwData.catalogusprijs ? `€${rdwData.catalogusprijs}` : "onbekend"}
- Aantal eigenaren: ${rdwData.aantal_eigenaren || "onbekend"}
- APK vervaldatum: ${rdwData.apk_vervaldatum || "onbekend"}
- Brandstof: ${rdwData.brandstof || vweData.brandstof || "onbekend"}

Inspectie-input van inkoper:
- KM-stand: ${extraInput.km_stand || vweData.kmStand || "onbekend"} km
- Staat voertuig: ${extraInput.staat ? staatLabels[extraInput.staat] || extraInput.staat : "niet opgegeven"}
- Schadevrij: ${extraInput.schadevrij === true ? "Ja" : extraInput.schadevrij === false ? "Nee (schade aanwezig)" : "niet opgegeven"}
- Onderhoudsboekje: ${extraInput.onderhoudsboekje === true ? "Ja, aanwezig" : extraInput.onderhoudsboekje === false ? "Nee, niet aanwezig" : "niet opgegeven"}
- Rookvrij: ${extraInput.rookvrij === true ? "Ja" : extraInput.rookvrij === false ? "Nee (er is gerookt)" : "niet opgegeven"}
- Aantal sleutels: ${extraInput.aantal_sleutels || "niet opgegeven"}
- Bandenprofiel: ${extraInput.bandenprofiel ? bandenLabels[extraInput.bandenprofiel] || extraInput.bandenprofiel : "niet opgegeven"}
- Extra opmerkingen: ${extraInput.opmerkingen || "geen"}

Opties op dit voertuig:
${optiesSummary || "Geen opties gevonden"}

Live marktadvertenties gevonden:
${listingsSummary || "Geen advertenties gevonden"}

Marktanalyse:
${marktData.analyseTekst}

BEKENDE PROBLEMEN EN KWALEN VAN DIT MODEL:
${marktData.kwalen || "Geen specifieke kwalen gevonden."}

${extraInput.vraagprijs ? `Gevraagde inkoopprijs door klant: €${extraInput.vraagprijs}` : "Geen inkoopprijs opgegeven — geef dan alleen een marktanalyse zonder deal-score."}

Beoordeel op basis van de SCORINGSREGELS hierboven. De marge-berekening is al voorgedaan, gebruik die als leidraad.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: "Je bent een auto-inkoop expert. Antwoord altijd in het Nederlands. Wees streng en realistisch in je beoordeling." },
        { role: "user", content: prompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "deal_score",
            description: "Geef een deal score met advies",
            parameters: {
              type: "object",
              properties: {
                score: { type: "number", description: "Score van 0-100 gebaseerd op de scoringsregels" },
                advies: { type: "string", description: "Uitgebreid advies in 3-5 zinnen over de deal" },
                score_factoren: {
                  type: "object",
                  properties: {
                    marge_potentieel: { type: "number", description: "Score 0-25 voor winstpotentieel" },
                    markt_liquiditeit: { type: "number", description: "Score 0-25 voor hoe snel je het kunt verkopen" },
                    risico_factor: { type: "number", description: "Score 0-25 (hoger = minder risico)" },
                    seizoen_timing: { type: "number", description: "Score 0-25 voor timing" },
                  },
                  required: ["marge_potentieel", "markt_liquiditeit", "risico_factor", "seizoen_timing"],
                },
                geschatte_verkoopprijs: { type: "number", description: "Realistische geschatte verkoopprijs in euros" },
                geschatte_standtijd: { type: "string", description: "Geschatte standtijd in dagen/weken" },
                opties_analyse: { type: "string", description: "Korte analyse van de opties en hun waarde-effect" },
                aandachtspunten: { type: "array", items: { type: "string" }, description: "Lijst van aandachtspunten en risico's" },
                gemiddelde_marktprijs: { type: "number", description: "Gemiddelde marktprijs op basis van alle data" },
                geschatte_opknapkosten: { type: "number", description: "Totaal geschatte opknapkosten in euros" },
                opknapkosten_detail: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      item: { type: "string", description: "Kostenpost" },
                      bedrag: { type: "number", description: "Geschatte kosten in euros" },
                      toelichting: { type: "string", description: "Waarom deze kosten nodig zijn" },
                    },
                    required: ["item", "bedrag"],
                  },
                  description: "Gedetailleerde lijst van opknapkosten",
                },
                netto_marge: { type: "number", description: "Geschatte netto marge na opknapkosten" },
              },
              required: ["score", "advies", "score_factoren", "geschatte_opknapkosten", "opknapkosten_detail", "netto_marge"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "deal_score" } },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("AI Gateway error:", response.status, errText);
    throw new Error(`AI Gateway error [${response.status}]`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("AI gaf geen gestructureerd antwoord");

  return JSON.parse(toolCall.function.arguments);
}

// ─── Main handler ───
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { kenteken, vraagprijs, km_stand, staat, schadevrij, onderhoudsboekje, rookvrij, aantal_sleutels, bandenprofiel, opmerkingen } = await req.json();
    if (!kenteken) {
      return new Response(
        JSON.stringify({ success: false, error: "Kenteken is verplicht" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extraInput = { vraagprijs: vraagprijs ? Number(vraagprijs) : null, km_stand, staat, schadevrij, onderhoudsboekje, rookvrij, aantal_sleutels, bandenprofiel, opmerkingen };

    console.log(`=== Analyzing deal for: ${kenteken} ===`);

    // Step 1 & 2: RDW + VWE parallel
    console.log("Step 1+2: RDW + VWE parallel...");
    const emptyVwe = {
      vin: null, inkoopwaarde: null, verkoopwaarde: null, nieuwprijs: null, handelsprijs: null,
      merk: null, model: null, bouwjaar: null, brandstof: null, kmStand: null, opties: [],
    };
    const [rdwData, vweData] = await Promise.all([
      fetchRdwData(kenteken),
      fetchVweData(kenteken).catch((err) => {
        console.error("VWE failed (continuing without):", err.message);
        return emptyVwe;
      }),
    ]);
    console.log("VWE VIN:", vweData.vin);
    console.log("VWE opties count:", vweData.opties.length);

    // Step 2b: SilverDAT VIN (if VIN available from VWE)
    let silverDatData: any = null;
    if (vweData.vin) {
      console.log("Step 2b: Fetching SilverDAT VIN equipment...");
      silverDatData = await fetchSilverDatVin(vweData.vin);
      console.log("SilverDAT opties count:", silverDatData?.fabrieksopties?.length || 0);
    } else {
      console.log("No VIN available, skipping SilverDAT");
    }

    const merk = rdwData.merk || vweData.merk || "onbekend";
    const model = rdwData.handelsbenaming || vweData.model || "onbekend";
    const bouwjaar = rdwData.datum_eerste_toelating || vweData.bouwjaar;

    // Combine all options: VWE + SilverDAT
    const alleOpties = [
      ...vweData.opties,
      ...(silverDatData?.fabrieksopties || []).map((o: any) => ({
        code: o.fabrikantcode,
        omschrijving: o.naam,
        type: o.type,
        prijs: o.prijs,
      })),
    ];

    // Step 3, 4a, 4b: Firecrawl + Perplexity bekende kwalen + marktanalyse (all parallel)
    console.log("Step 3+4: Firecrawl + Perplexity (kwalen + markt) parallel...");
    const [scraped, kwalenData, marktData] = await Promise.all([
      scrapeMarktListings(merk, model, bouwjaar),
      fetchBekendeKwalen(merk, model, bouwjaar, null),
      fetchMarktAnalyse(merk, model, bouwjaar, alleOpties),
    ]);
    console.log("Scraped listings:", scraped.listings.length);
    console.log("Extracted prices:", scraped.extractedPrices.length);
    console.log("Kwalen tekst length:", kwalenData.kwalen.length);

    // Step 5: AI Scoring (with kwalen + extracted prices)
    console.log("Step 5: AI scoring...");
    const aiResult = await generateAiScore(rdwData, vweData, { ...marktData, kwalen: kwalenData.kwalen }, scraped.listings, alleOpties, extraInput, scraped.extractedPrices);
    console.log("AI score:", aiResult.score);

    // Step 6: Save to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const dealRecord = {
      kenteken: kenteken.toUpperCase().replace(/[^A-Z0-9]/g, ""),
      merk,
      model,
      bouwjaar: bouwjaar?.substring(0, 4) || null,
      brandstof: rdwData.brandstof || vweData.brandstof,
      km_stand: km_stand || vweData.kmStand,
      transmissie: null,
      carrosserie: rdwData.inrichting,
      kleur: rdwData.eerste_kleur,
      vermogen: rdwData.vermogen,
      vin: vweData.vin,
      voertuig_opties: alleOpties,
      opties_populariteit: {},
      vwe_inkoopwaarde: vweData.inkoopwaarde ? Number(vweData.inkoopwaarde) : null,
      vwe_verkoopwaarde: vweData.verkoopwaarde ? Number(vweData.verkoopwaarde) : null,
      vwe_nieuwprijs: vweData.nieuwprijs ? Number(vweData.nieuwprijs) : null,
      vwe_handelsprijs: vweData.handelsprijs ? Number(vweData.handelsprijs) : null,
      markt_analyse_tekst: marktData.analyseTekst,
      markt_bronnen: [...marktData.bronnen, ...scraped.bronnen, ...kwalenData.bronnen],
      markt_listings: scraped.listings,
      gemiddelde_marktprijs: aiResult.gemiddelde_marktprijs || null,
      laagste_marktprijs: scraped.extractedPrices.length > 0 ? scraped.extractedPrices[0] : null,
      hoogste_marktprijs: scraped.extractedPrices.length > 0 ? scraped.extractedPrices[scraped.extractedPrices.length - 1] : null,
      aantal_vergelijkbaar: scraped.listings.length,
      schade_historie: [],
      eerdere_advertenties: [],
      aantal_eigenaren: rdwData.aantal_eigenaren,
      apk_status: rdwData.apk_vervaldatum,
      inkoopprijs_klant: extraInput.vraagprijs,
      deal_score: aiResult.score,
      ai_advies: aiResult.advies,
      score_factoren: aiResult.score_factoren,
      geschatte_verkoopprijs: aiResult.geschatte_verkoopprijs || null,
      geschatte_standtijd: aiResult.geschatte_standtijd || null,
    };

    const { data: savedDeal, error: saveError } = await supabase
      .from("deals")
      .insert(dealRecord)
      .select()
      .single();

    if (saveError) console.error("Save error:", saveError);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: savedDeal?.id,
          ...dealRecord,
          silverdat_opties: silverDatData?.fabrieksopties || [],
          bekende_kwalen: kwalenData.kwalen,
          opties_analyse: aiResult.opties_analyse || null,
          aandachtspunten: aiResult.aandachtspunten || [],
          geschatte_opknapkosten: aiResult.geschatte_opknapkosten || 0,
          opknapkosten_detail: aiResult.opknapkosten_detail || [],
          netto_marge: aiResult.netto_marge || null,
          gescrapte_prijzen: {
            laagste: scraped.extractedPrices.length > 0 ? scraped.extractedPrices[0] : null,
            gemiddeld: scraped.extractedPrices.length > 0 ? Math.round(scraped.extractedPrices.reduce((a, b) => a + b, 0) / scraped.extractedPrices.length) : null,
            hoogste: scraped.extractedPrices.length > 0 ? scraped.extractedPrices[scraped.extractedPrices.length - 1] : null,
            aantal: scraped.extractedPrices.length,
          },
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Analyze deal error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

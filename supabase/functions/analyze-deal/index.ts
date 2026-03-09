import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INTERDATA_URL = "https://interdata.vwe.nl/DataAanvraag.asmx";

const extractXmlValue = (xml: string, tag: string): string | null => {
  const regex = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1] : null;
};

async function fetchVweTaxatie(kenteken: string) {
  const VWE_USERNAME = Deno.env.get("VWE_USERNAME");
  const VWE_PASSWORD = Deno.env.get("VWE_PASSWORD");
  if (!VWE_USERNAME || !VWE_PASSWORD) throw new Error("VWE credentials niet geconfigureerd");

  const cleanKenteken = kenteken.toUpperCase().replace(/[^A-Z0-9]/g, "");

  const requestXml = `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <authenticatie>
    <gebruikersnaam>${VWE_USERNAME}</gebruikersnaam>
    <wachtwoord>${VWE_PASSWORD}</wachtwoord>
  </authenticatie>
  <parameters>
    <kenteken>${cleanKenteken}</kenteken>
  </parameters>
  <rubrieken>
    <atlTaxatieInfoBasic/>
    <atlTaxatieOnline/>
  </rubrieken>
</request>`;

  const response = await fetch(INTERDATA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `requestXml=${encodeURIComponent(requestXml)}`,
  });

  if (!response.ok) throw new Error(`VWE API error [${response.status}]`);

  const xmlText = await response.text();

  return {
    inkoopwaarde: extractXmlValue(xmlText, "inkoopwaarde") || extractXmlValue(xmlText, "Inkoopwaarde"),
    verkoopwaarde: extractXmlValue(xmlText, "verkoopwaarde") || extractXmlValue(xmlText, "Verkoopwaarde"),
    nieuwprijs: extractXmlValue(xmlText, "nieuwprijs") || extractXmlValue(xmlText, "Nieuwprijs"),
    handelsprijs: extractXmlValue(xmlText, "handelsprijs") || extractXmlValue(xmlText, "Handelsprijs"),
    merk: extractXmlValue(xmlText, "merk") || extractXmlValue(xmlText, "Merk"),
    model: extractXmlValue(xmlText, "handelsbenaming") || extractXmlValue(xmlText, "Handelsbenaming"),
    bouwjaar: extractXmlValue(xmlText, "datumeerstetoelating") || extractXmlValue(xmlText, "DatumEersteToelating"),
    brandstof: extractXmlValue(xmlText, "brandstof") || extractXmlValue(xmlText, "Brandstof"),
    kmStand: extractXmlValue(xmlText, "tellerstand") || extractXmlValue(xmlText, "Tellerstand"),
  };
}

async function fetchMarktData(merk: string, model: string, bouwjaar: string | null) {
  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY niet geconfigureerd");

  const jaar = bouwjaar ? bouwjaar.substring(0, 4) : "";
  const query = `Wat zijn de huidige marktprijzen in Nederland voor een ${merk} ${model} ${jaar ? `uit ${jaar}` : ""}? 
Geef de gemiddelde vraagprijs, laagste prijs en hoogste prijs op basis van actuele advertenties op AutoTrack, AutoScout24 en Marktplaats. 
Geef ook het geschatte aantal exemplaren te koop en hoe snel dit model verkoopt (gemiddelde standtijd).
Antwoord alleen met feiten en cijfers, geen meningen.`;

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
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
  const content = data.choices?.[0]?.message?.content || "";
  const citations = data.citations || [];

  return { analyseTekst: content, bronnen: citations };
}

async function generateAiScore(vweData: any, marktData: any, vraagprijs: number | null) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY niet geconfigureerd");

  const prompt = `Je bent een auto-inkoop expert voor een Nederlands autobedrijf. Analyseer deze deal en geef een score van 0-100.

VWE Taxatiegegevens:
- Inkoopwaarde: €${vweData.inkoopwaarde || "onbekend"}
- Verkoopwaarde: €${vweData.verkoopwaarde || "onbekend"}
- Handelsprijs: €${vweData.handelsprijs || "onbekend"}
- Merk/Model: ${vweData.merk || "onbekend"} ${vweData.model || ""}
- Bouwjaar: ${vweData.bouwjaar || "onbekend"}

Marktanalyse:
${marktData.analyseTekst}

${vraagprijs ? `Gevraagde inkoopprijs door klant: €${vraagprijs}` : "Geen inkoopprijs opgegeven."}

Beoordeel op basis van:
1. Verschil tussen inkoopprijs en marktwaarde (marge potentieel)
2. Marktliquiditeit (hoe snel verkoopt dit model)
3. Seizoensgebondenheid
4. Risicofactoren`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "Je bent een auto-inkoop expert. Antwoord altijd in het Nederlands." },
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
                score: { type: "number", description: "Score van 0-100" },
                advies: { type: "string", description: "Kort advies in 2-3 zinnen" },
                score_factoren: {
                  type: "object",
                  properties: {
                    marge_potentieel: { type: "number", description: "Score 0-25" },
                    markt_liquiditeit: { type: "number", description: "Score 0-25" },
                    risico_factor: { type: "number", description: "Score 0-25 (hoger = minder risico)" },
                    seizoen_timing: { type: "number", description: "Score 0-25" },
                  },
                  required: ["marge_potentieel", "markt_liquiditeit", "risico_factor", "seizoen_timing"],
                },
                geschatte_verkoopprijs: { type: "number", description: "Geschatte verkoopprijs in euros" },
                geschatte_standtijd: { type: "string", description: "Geschatte standtijd in dagen/weken" },
              },
              required: ["score", "advies", "score_factoren"],
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { kenteken, vraagprijs } = await req.json();
    if (!kenteken) {
      return new Response(
        JSON.stringify({ success: false, error: "Kenteken is verplicht" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analyzing deal for kenteken: ${kenteken}`);

    // Step 1: VWE Taxatie
    console.log("Step 1: Fetching VWE taxatie...");
    const vweData = await fetchVweTaxatie(kenteken);
    console.log("VWE data:", JSON.stringify(vweData));

    // Step 2: Perplexity markt search
    const merk = vweData.merk || "onbekend";
    const model = vweData.model || "onbekend";
    console.log("Step 2: Fetching markt data via Perplexity...");
    const marktData = await fetchMarktData(merk, model, vweData.bouwjaar);
    console.log("Markt data fetched, length:", marktData.analyseTekst.length);

    // Step 3: AI Scoring
    console.log("Step 3: Generating AI score...");
    const aiResult = await generateAiScore(vweData, marktData, vraagprijs ? Number(vraagprijs) : null);
    console.log("AI result:", JSON.stringify(aiResult));

    // Step 4: Save to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const dealRecord = {
      kenteken: kenteken.toUpperCase().replace(/[^A-Z0-9]/g, ""),
      merk,
      model,
      bouwjaar: vweData.bouwjaar?.substring(0, 4) || null,
      brandstof: vweData.brandstof,
      km_stand: vweData.kmStand,
      vwe_inkoopwaarde: vweData.inkoopwaarde ? Number(vweData.inkoopwaarde) : null,
      vwe_verkoopwaarde: vweData.verkoopwaarde ? Number(vweData.verkoopwaarde) : null,
      vwe_nieuwprijs: vweData.nieuwprijs ? Number(vweData.nieuwprijs) : null,
      vwe_handelsprijs: vweData.handelsprijs ? Number(vweData.handelsprijs) : null,
      markt_analyse_tekst: marktData.analyseTekst,
      markt_bronnen: marktData.bronnen,
      inkoopprijs_klant: vraagprijs ? Number(vraagprijs) : null,
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

    if (saveError) {
      console.error("Save error:", saveError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: savedDeal?.id,
          ...dealRecord,
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

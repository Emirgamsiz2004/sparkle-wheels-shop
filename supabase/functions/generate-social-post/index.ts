import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      merk, model, jaar, kilometerstand, prijs, transmissie,
      kleur, bijzonderheden, type_auto, toon, platform,
    } = await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");
    const toonInstructie: Record<string, string> = {
      "Professioneel & Nuchter": "Schrijf zakelijk, nuchter en to-the-point. Geen overdreven enthousiasme.",
      "Enthousiast & Energiek": "Schrijf energiek en enthousiast. Maak de lezer enthousiast over de auto.",
      "Luxe & Exclusief": "Schrijf alsof dit een premium aanbod is. Elegant, zelfverzekerd, exclusief gevoel.",
    };

    const prompt = `Je bent een social media manager voor Platin Automotive, een autobedrijf in Roelofarendsveen. Schrijf een Instagram/Facebook post caption in het Nederlands voor de volgende auto:

Merk: ${merk}
Model: ${model}
Jaar: ${jaar}
Kilometerstand: ${kilometerstand} km
Vraagprijs: € ${prijs}
Transmissie: ${transmissie}
Kleur: ${kleur}
Type: ${type_auto}
Bijzonderheden: ${bijzonderheden || "geen specifieke bijzonderheden"}
Platform: ${platform}
Toon: ${toonInstructie[toon] || "Schrijf professioneel en to-the-point."}

Schrijf de caption in dit EXACTE formaat:
[Emoji passend bij auto] [Merk] [Model] | [Jaar] | [Transmissie]

[Schrijf 1-2 zinnen die de auto aantrekkelijk omschrijven. Noem NIET alleen de kleur. Beschrijf in plaats daarvan de sfeer, het karakter of de staat van de auto. Voorbeelden van goede zinnen: "Strakke GTI in nette staat — rijklaar en direct beschikbaar." of "Een sportieve daily driver die er scherp uitziet en gewoon rijdt." of "Weinig kilometers voor zijn leeftijd, goed onderhouden en instapklaar." Pas de stijl aan op de gekozen toon.]

📋 Specs:
› Bouwjaar: [jaar]
› Kilometerstand: ± [km] km
› Transmissie: [transmissie]
› Kleur: [kleur]
[Alleen als er bijzonderheden zijn: › Extras: [bijzonderheden]]

💶 Vraagprijs: € [prijs],-

Interesse of vragen? Stuur een DM of app ons via WhatsApp.
📍 Roelofarendsveen

Geef ALLEEN de caption tekst terug, geen uitleg, geen hashtags (die voegen we apart toe).`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit bereikt, probeer het later opnieuw." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Anthropic API error:", response.status, t);
      throw new Error("Anthropic API error");
    }

    const data = await response.json();
    const caption = data.content?.[0]?.text?.trim() ?? "";

    // Generate hashtags
    const merkLower = merk.toLowerCase().replace(/\s/g, "");
    const modelLower = model.toLowerCase().replace(/\s/g, "");
    const merkModel = `${merkLower}${modelLower}`;
    const transmissieTag = transmissie === "Automaat" ? "#automaat" : "#handgeschakeld";

    const typeTagMap: Record<string, string> = {
      Hatchback: "#hothatch",
      Sedan: "#sedan",
      "SUV / Crossover": "#suv #crossover",
      Stationwagon: "#stationwagon",
      Cabrio: "#cabrio",
      Sportauto: "#sportauto #hothatch",
      Youngtimer: "#youngtimer",
    };
    const typeTag = typeTagMap[type_auto] || "#occasion";

    const hashtags = {
      merkModel: `#${merkLower} #${modelLower} #${merkModel}`,
      autoVerkopen: `#autotekoop #autoverkoop #occasion #occasions #tweedehandsauto #gebruikteauto #tweedehandsautotekoop #dutchcars`,
      locatie: `#roelofarendsveen #kaagenbraassem #groenehart #zuidholland #amsterdam #rotterdam #denhaag #nederland`,
      extra: `#carsofinstagram #cars #carphotography #autobedrijf #platinautomotive ${transmissieTag} ${typeTag}`,
    };

    return new Response(JSON.stringify({ caption, hashtags }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-social-post error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

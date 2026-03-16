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
      kleur, bijzonderheden, type_auto, toon, platform, motorinhoud,
      apk_geldig_tot, aantal_eigenaren, schadevrij, nap, prijs_bespreekbaar,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let prompt: string;
    let aiModel = "google/gemini-3-flash-preview";

    if (platform === "Marktplaats") {
      const bespreekbaar = prijs_bespreekbaar ? "Ja" : "Nee";
      const napTxt = nap ? "Ja" : "Nee";
      const schadevrijTxt = schadevrij ? "Ja" : "Nee";

      prompt = `Genereer een volledige Marktplaats advertentie voor een auto met de volgende gegevens:
Merk: ${merk}, Model: ${model}, Jaar: ${jaar}, Kilometerstand: ${kilometerstand}, Motorinhoud: ${motorinhoud || "onbekend"}, Transmissie: ${transmissie}, Kleur: ${kleur}, Vraagprijs: €${prijs}, APK tot: ${apk_geldig_tot || "onbekend"}, Eigenaren: ${aantal_eigenaren || 1}, NAP: ${napTxt}, Schadevrij: ${schadevrijTxt}, Bijzonderheden: ${bijzonderheden || "geen"}, Prijs bespreekbaar: ${bespreekbaar}

Geef de output EXACT in dit formaat terug, geen afwijkingen:

TITEL: [Merk] [Model] [Motorinhoud] [pk indien bekend] | [Jaar] | [Kilometerstand]km | [Kleur]

BESCHRIJVING:
[2-3 zinnen over karakter, rijervaring en staat van de auto. Eerlijk en uitnodigend, jij/je vorm, geen overdreven superlatieven. Benoem het karakter van de auto.]

SPECIFICATIES:
- Bouwjaar: [jaar]
- Kilometerstand: ± [km]
- Motorinhoud: [motorinhoud]
- Transmissie: [transmissie]
- Kleur: [kleur]
- Brandstof: [benzine/diesel/elektrisch]
- Aantal eigenaren: [eigenaren]
- APK geldig tot: [apk]
- NAP: [ja/nee]
- Schadevrij: [ja/nee]

VRAAGPRIJS: € [prijs][indien bespreekbaar voeg toe: ' — prijs is bespreekbaar']

CONTACT:
📞 06 – 1269 3825
🌐 www.platinautomotive.nl
📍 Roelofarendsveen — proefrit altijd mogelijk!

Regels:
- Titel max 60 tekens, gebruik woorden die kopers echt intypen op Marktplaats
- Beschrijving max 3 zinnen, geen opsomming
- Schrijf in jij/je vorm
- Geen emojis behalve in het contactblok`;
    } else {
      const kleurEmoji = (k: string): string => {
        const map: Record<string, string> = {
          rood: "🔴", blauw: "🔵", zwart: "⚫", wit: "⚪",
          grijs: "🔘", zilver: "🔘", groen: "🟢", oranje: "🟠",
          geel: "🟡", paars: "🟣", bruin: "🟤",
        };
        return map[k.toLowerCase().trim()] || "⚫";
      };

      const emoji = kleurEmoji(kleur);
      const motorLabel = motorinhoud ? ` ${motorinhoud}` : "";

      const toonInstructie: Record<string, string> = {
        "Professioneel & Nuchter": "Schrijf zakelijk, nuchter en to-the-point. Geen overdreven enthousiasme.",
        "Enthousiast & Energiek": "Schrijf energiek en enthousiast. Maak de lezer enthousiast over de auto.",
        "Luxe & Exclusief": "Schrijf alsof dit een premium aanbod is. Elegant, zelfverzekerd, exclusief gevoel.",
      };

      prompt = `Je bent een social media manager voor Platin Automotive, een autobedrijf in Roelofarendsveen. Schrijf een Instagram/Facebook post caption in het Nederlands voor de volgende auto:

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

De caption MOET beginnen met EXACT deze eerste regel (kopieer letterlijk, verander NIETS):
${emoji} ${merk} ${model}${motorLabel} | ${jaar} | ${transmissie}

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
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit bereikt, probeer het later opnieuw." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits op, voeg credits toe in je workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const caption = data.choices?.[0]?.message?.content?.trim() ?? "";

    // For Marktplaats, return caption only (no hashtags needed)
    if (platform === "Marktplaats") {
      return new Response(JSON.stringify({ caption, hashtags: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate hashtags for Instagram/Facebook
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

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
      uitvoering, vermogen, brandstof, carrosserie,
      aantal_deuren, aantal_zitplaatsen, gewicht, nieuwprijs, aantal_cilinders,
    } = await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    let prompt: string;

    if (platform === "Marktplaats") {
      const bespreekbaar = prijs_bespreekbaar ? "Ja" : "Nee";
      const napTxt = nap ? "Ja" : "Nee";
      const schadevrijTxt = schadevrij ? "Ja" : "Nee";

      prompt = `Genereer een volledig geoptimaliseerde Marktplaats advertentie voor maximale vindbaarheid in de zoekbalk.

Voertuiggegevens:
Merk: ${merk}, Model: ${model}, Uitvoering: ${uitvoering || "onbekend"}, Jaar: ${jaar}, Kilometerstand: ${kilometerstand}, Motorinhoud: ${motorinhoud || "onbekend"}, Vermogen: ${vermogen || "onbekend"}pk, Transmissie: ${transmissie}, Kleur: ${kleur}, Brandstof: ${brandstof || "onbekend"}, Vraagprijs: €${prijs}, APK tot: ${apk_geldig_tot || "onbekend"}, Eigenaren: ${aantal_eigenaren || 1}, NAP: ${napTxt}, Schadevrij: ${schadevrijTxt}, Bijzonderheden: ${bijzonderheden || "geen"}, Prijs bespreekbaar: ${bespreekbaar}, Carrosserie: ${carrosserie || "onbekend"}, Aantal deuren: ${aantal_deuren || "onbekend"}, Aantal zitplaatsen: ${aantal_zitplaatsen || "onbekend"}, Gewicht: ${gewicht ? gewicht + " kg" : "onbekend"}, Nieuwprijs: ${nieuwprijs ? "€" + nieuwprijs : "onbekend"}, Aantal cilinders: ${aantal_cilinders || "onbekend"}

Geef output EXACT in dit formaat:

TITEL:
[Maximaal 60 tekens. Formule: Merk + Model + Uitvoering + Motorinhoud | Jaar | Bijz. 1 - Bijz. 2. Jaar MOET in de titel staan. De bijzonderheden worden gescheiden door een streepje (-), NIET door een plusteken. Voorbeeld: 'Volkswagen Polo GTI 1.8 TSI | 2017 | Navi - Cruise']

OPVALTEKST:
[Schrijf een opvaltekst van 50-208 tekens. Benoem de 3-4 meest aantrekkelijke kenmerken van deze specifieke auto. Denk aan: staat, bijzondere opties, lage km, eerste eigenaar, apk, etc. Schrijf in actieve stijl zonder hoofdletters aan het begin van elk kenmerk. Voorbeeld stijl: 'Nette auto, eerste eigenaar, goed onderhouden. Inclusief navigatie, cruise control en parkeersensoren. Proefrit mogelijk in Roelofarendsveen!']

BESCHRIJVING:
[2-3 zinnen over karakter, rijervaring en staat. Eerlijk, uitnodigend, jij/je vorm. Benoem wat de auto bijzonder maakt als rijervaring, niet alleen technische specs.]

SPECIFICATIES:
- Bouwjaar: [jaar]
- Kilometerstand: ± [km]
- Motorinhoud: [motorinhoud] [vermogen]pk [aantal_cilinders cil. indien bekend]
- Transmissie: [transmissie]
- Brandstof: [brandstof]
- Kleur: [kleur]
- Carrosserie: [carrosserie]
- Aantal deuren: [aantal deuren indien bekend]
- Aantal zitplaatsen: [aantal zitplaatsen indien bekend]
- Gewicht: [gewicht kg indien bekend]
- Nieuwprijs: € [nieuwprijs indien bekend]
- Aantal eigenaren: [eigenaren]
- APK geldig tot: [apk]
- NAP: [ja/nee]
- Schadevrij: [ja/nee]

VRAAGPRIJS: € [prijs][indien bespreekbaar: ' — prijs is bespreekbaar']

CONTACT:
📞 06 – 1269 3825
🌐 www.platinautomotive.nl
📍 Roelofarendsveen — proefrit altijd mogelijk!

——
Ook te vinden als: [genereer hier 6-8 natuurlijke zoektermen die kopers echt intypen op Marktplaats, gescheiden door komma's. Varieer op merk, model, uitvoering, bouwjaar, motorinhoud en km-stand. Voorbeeld: 'polo gti rood, vw polo gti 2017, polo 1.8 tsi, polo gti 192pk, polo sport 2017, vw polo rood']

Strikte regels:
- Titel max 60 tekens, jaar staat ALTIJD in de titel
- Bijzonderheden in titel gescheiden door streepje (-), NIET door plusteken (+)
- Opvaltekst is 50-208 tekens, benoemt concrete kenmerken
- Beschrijving max 3 zinnen, geen opsomming
- Zoektermen onderaan zijn lowercase, herkenbaar als echte zoekopdrachten
- Schrijf in jij/je vorm
- Geen emojis behalve in contactblok`;
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

Schrijf een beschrijving van 2-3 zinnen die past bij een social media post over deze auto. Regels:

- De eerste zin is een HAAK — een statement, vraag of observatie die iemand doet stoppen met scrollen. Geen saaie opsomming. Denk aan: een gevoel oproepen, FOMO creëren, de doelgroep aanspreken, of iets verrassends over de auto benoemen.
- De tweede zin voegt iets toe over het karakter of de situatie van de auto — waarom is dit juist nu interessant? Lage km, bijzondere staat, zeldzame uitvoering, of een voordeel voor de koper.
- Optionele derde zin: een subtiele call to action die uitnodigt zonder opdringerig te zijn.

Voorbeelden van goede eerste zinnen:
- 'Bijna nieuw, zonder de nieuwprijs.' (voor lage km auto)
- 'Voor wie niet wil wachten op de ideale auto.' (voor instapklaar voertuig)
- 'Dit is wat 5.000 km op een nieuwe auto betekent.' (specifiek en concreet)
- 'Weinig mensen rijden in iets als dit voor deze prijs.' (schaarste)
- 'Soms komt de perfecte auto gewoon op het juiste moment voorbij.' (gevoel)

Pas de toon aan op het gekozen toonprofiel:
- Professioneel & Nuchter: droog, to the point, geen overdrijving
- Enthousiast & Energiek: levendig, actief taalgebruik, lichte energie
- Luxe & Exclusief: rustig, zelfverzekerd, wekt gevoel van kwaliteit

Schrijf NOOIT: 'betrouwbare', 'direct inzetbaar', 'mooie auto', 'geweldige staat' of andere vage superlatieven zonder bewijs. Gebruik altijd concrete details uit de voertuiggegevens om claims te onderbouwen.

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

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
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
    const caption = data.content?.[0]?.text?.trim() ?? "";

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

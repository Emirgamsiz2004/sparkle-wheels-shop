import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const car = await req.json();

    const prompt = `Schrijf een SEO-geoptimaliseerde blogpost voor een autohandelaar website over deze auto:

Merk: ${car.merk}
Model: ${car.model}
Uitvoering: ${car.uitvoering || ''}
Bouwjaar: ${car.jaar}
Kilometerstand: ${car.km}
Motorinhoud: ${car.motorinhoud}
Kleur: ${car.kleur}
Prijs: €${car.prijs}
Bijzonderheden: ${car.bijzonderheden || 'geen'}
Locatie dealer: Roelofarendsveen

Geef output EXACT in dit JSON formaat:
{
  "title": "[Merk Model Uitvoering jaar te koop in Roelofarendsveen | Platin Automotive]",
  "meta_title": "[max 60 tekens, bevat hoofdzoekwoord + locatie]",
  "meta_description": "[max 155 tekens, uitnodigend, bevat zoekwoord en locatie]",
  "focus_keyword": "[meest gezochte zoekterm voor deze auto]",
  "excerpt": "[2 zinnen die uitnodigen om de post te lezen]",
  "slug": "[url-vriendelijke-slug-met-streepjes-geen-spaties]",
  "content": "[volledige blogpost in HTML met deze structuur: <h1>titel</h1> <p>inleiding: 2-3 zinnen die de lezer aanspreken</p> <h2>Over de [Merk Model]</h2> <p>karakter en rijervaring van dit type auto, 3-4 zinnen</p> <h2>Dit exemplaar</h2> <p>specifieke details over deze auto: km, staat, bijzonderheden, 3-4 zinnen</p> <h2>Specificaties</h2> <ul><li>Bouwjaar: ...</li><li>Kilometerstand: ...</li><li>Motorinhoud: ...</li><li>Transmissie: ...</li><li>Kleur: ...</li><li>Vraagprijs: €...</li></ul> <h2>Interesse?</h2> <p>Kom langs in Roelofarendsveen voor een proefrit. Bel ons op 06-1269 3825 of stuur een bericht via WhatsApp. Bekijk ook ons volledige aanbod op platinautomotive.nl</p>]"
}

Regels:
- Schrijf in jij/je vorm
- Verwerk de locatie 'Roelofarendsveen' minimaal 3x natuurlijk in de tekst
- Gebruik het hoofdzoekwoord minimaal 5x in de content
- Geen overdreven superlatieven, schrijf eerlijk en concreet
- Geef ALLEEN de JSON terug, geen uitleg of markdown`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic error:", response.status, errText);
      return new Response(JSON.stringify({ error: `AI error: ${response.status}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const rawText = aiData.content?.[0]?.text?.trim() ?? "";

    // Parse JSON from AI response (strip possible markdown fences)
    const jsonStr = rawText.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
    let blogData;
    try {
      blogData = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI JSON:", rawText);
      return new Response(JSON.stringify({ error: "AI returned invalid JSON", raw: rawText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save to database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: inserted, error: dbError } = await supabase
      .from("blog_posts")
      .insert({
        title: blogData.title,
        slug: blogData.slug,
        excerpt: blogData.excerpt,
        content: blogData.content,
        meta_title: blogData.meta_title,
        meta_description: blogData.meta_description,
        focus_keyword: blogData.focus_keyword,
        car_id: car.car_id || null,
        published: true,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB insert error:", dbError);
      return new Response(JSON.stringify({ error: "Database error", details: dbError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, blog: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-blog-post error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

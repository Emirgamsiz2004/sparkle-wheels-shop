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

// SEO topics relevant for a car dealer in Roelofarendsveen
const TOPIC_TEMPLATES = [
  {
    category: "koopadvies",
    prompts: [
      "Schrijf een blogpost over waar je op moet letten bij het kopen van een tweedehands auto in Roelofarendsveen en omgeving.",
      "Schrijf een blogpost over de voordelen van een occasion kopen bij een erkende dealer vs. particulier in Roelofarendsveen.",
      "Schrijf een blogpost met tips voor het kiezen van de juiste gezinsauto als occasion in de regio Roelofarendsveen.",
      "Schrijf een blogpost over de beste occasions onder €15.000 en waar je op moet letten bij de aanschaf in Roelofarendsveen.",
      "Schrijf een blogpost over de voor- en nadelen van benzine, diesel en hybride occasions in 2024/2025.",
      "Schrijf een blogpost over hoe je de waarde van je huidige auto kunt bepalen voordat je inruilt in Roelofarendsveen.",
    ],
  },
  {
    category: "onderhoud",
    prompts: [
      "Schrijf een blogpost over de belangrijkste onderhoudstips om je occasion in topconditie te houden.",
      "Schrijf een blogpost over wanneer je de distributieriem moet vervangen en waarom dit zo belangrijk is.",
      "Schrijf een blogpost over het belang van regelmatige APK-controle en onderhoud in Roelofarendsveen.",
      "Schrijf een blogpost over winterklaar maken van je auto: checklist voor automobilisten in Roelofarendsveen.",
      "Schrijf een blogpost over zomeronderhoud voor je auto: airco, banden en koelvloeistof checken.",
    ],
  },
  {
    category: "lokaal",
    prompts: [
      "Schrijf een blogpost over waarom Platin Automotive dé specialist is voor occasions in Roelofarendsveen en omgeving.",
      "Schrijf een blogpost over consignatie verkoop: hoe het werkt en waarom het slim is voor autoverkoop in Roelofarendsveen.",
      "Schrijf een blogpost over auto detailing en customizing diensten beschikbaar bij Platin Automotive in Roelofarendsveen.",
      "Schrijf een blogpost over de voordelen van lokaal een auto kopen in Roelofarendsveen in plaats van online.",
      "Schrijf een blogpost over financieringsmogelijkheden bij het kopen van een occasion in Roelofarendsveen.",
    ],
  },
  {
    category: "trends",
    prompts: [
      "Schrijf een blogpost over de populairste occasionmerken in Nederland en wat ze aantrekkelijk maakt.",
      "Schrijf een blogpost over de opkomst van hybride occasions: zijn ze de investering waard?",
      "Schrijf een blogpost over wat BPM betekent bij auto-import en waar je op moet letten.",
      "Schrijf een blogpost over de trend van SUV's als occasion: voor- en nadelen.",
      "Schrijf een blogpost over hoe de automarkt verandert en wat dit betekent voor occasionkopers in 2025.",
    ],
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Check how many posts were created this week to avoid spam
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const { data: recentPosts, error: countErr } = await supabase
      .from("blog_posts")
      .select("id, slug")
      .gte("created_at", oneWeekAgo.toISOString())
      .is("car_id", null); // only count scheduled/general posts

    if (countErr) throw countErr;

    // Check if force mode is enabled (for initial seeding)
    const body = await req.json().catch(() => ({}));
    const maxPosts = body?.force ? 999 : 3;

    // Max posts per week (default 3, override with force)
    if (recentPosts && recentPosts.length >= maxPosts) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Already 3 scheduled posts this week" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pick a random topic that hasn't been used recently
    const existingSlugs = new Set((recentPosts || []).map((p) => p.slug));
    const allPrompts = TOPIC_TEMPLATES.flatMap((t) =>
      t.prompts.map((p) => ({ category: t.category, prompt: p }))
    );

    // Shuffle and pick first unused
    const shuffled = allPrompts.sort(() => Math.random() - 0.5);
    const selected = shuffled[0];

    const fullPrompt = `${selected.prompt}

De blogpost is voor Platin Automotive, een autohandel gevestigd in Roelofarendsveen.
Website: platinautomotive.nl | Telefoon: 06-1269 3825

Geef output EXACT in dit JSON formaat:
{
  "title": "[pakkende titel met locatie Roelofarendsveen]",
  "meta_title": "[max 60 tekens, bevat hoofdzoekwoord + locatie]",
  "meta_description": "[max 155 tekens, uitnodigend, bevat zoekwoord en locatie]",
  "focus_keyword": "[meest gezochte zoekterm voor dit onderwerp]",
  "excerpt": "[2 zinnen die uitnodigen om de post te lezen]",
  "slug": "[url-vriendelijke-slug-met-streepjes]",
  "content": "[volledige blogpost in HTML met h1, h2 koppen, paragrafen, eventueel een lijst. Minimaal 600 woorden. Verwerk 'Roelofarendsveen' minimaal 3x natuurlijk. Eindig met een CTA naar Platin Automotive.]"
}

Regels:
- Schrijf in jij/je vorm
- Verwerk 'Roelofarendsveen' minimaal 3x natuurlijk in de tekst
- Gebruik het hoofdzoekwoord minimaal 5x
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
        max_tokens: 3000,
        messages: [{ role: "user", content: fullPrompt }],
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

    // Check slug doesn't already exist
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", blogData.slug)
      .maybeSingle();

    if (existing) {
      blogData.slug = `${blogData.slug}-${Date.now().toString(36)}`;
    }

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
        car_id: null,
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

    console.log(`Scheduled blog post created: ${blogData.title}`);

    return new Response(JSON.stringify({ success: true, blog: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("scheduled-blog-post error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

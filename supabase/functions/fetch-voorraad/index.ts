import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FEED_URL = "https://svl.autodealers.nl/occasions.aspx?did=91347&format=xml";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const res = await fetch(FEED_URL);
    if (!res.ok) throw new Error(`Feed returned ${res.status}`);
    const html = await res.text();

    // Parse vehicle divs using regex on data-attributes
    const vehicleRegex =
      /<div[^>]+data-merk="([^"]*)"[^>]*data-model="([^"]*)"[^>]*data-prijs="([^"]*)"[^>]*data-aid="([^"]*)"[^>]*data-brandstof="([^"]*)"[^>]*data-kleur="([^"]*)"[^>]*data-transmissie="([^"]*)"[^>]*data-kilometerstand="([^"]*)"[^>]*data-kmmiles="[^"]*"[^>]*data-aantaldeuren="([^"]*)"[^>]*data-vermogen-kw="([^"]*)"[^>]*data-vermogen-pk="([^"]*)"[^>]*data-bouwjaar="([^"]*)"[^>]*data-type="([^"]*)"[^>]*>/g;

    // More flexible: extract each vehicle block and parse individually
    const blocks = html.split(/(?=<div[^>]+class="advertisement)/);
    const vehicles: any[] = [];

    for (const block of blocks) {
      const attr = (name: string) => {
        const m = block.match(new RegExp(`data-${name}="([^"]*)"`));
        return m ? m[1] : "";
      };

      const merk = attr("merk");
      if (!merk) continue;

      // Extract photo from data-lazyloader-src
      const photoMatch = block.match(/data-lazyloader-src="([^"]+)"/);
      const photo = photoMatch ? photoMatch[1] : "";

      // Extract detail link
      const detailMatch = block.match(/href="(\/[^"]*details\.aspx[^"]*)"/);
      const detailPath = detailMatch ? detailMatch[1] : "";
      const detailUrl = detailPath ? `https://svl.autodealers.nl${detailPath}` : "";

      // Extract carrosserie
      const carrosserie = attr("carrosserie");

      vehicles.push({
        id: attr("aid"),
        merk,
        model: attr("model"),
        type: attr("type"),
        bouwjaar: attr("bouwjaar"),
        brandstof: attr("brandstof"),
        transmissie: attr("transmissie"),
        kilometerstand: attr("kilometerstand"),
        carrosserie,
        kleur: attr("kleur"),
        prijs: parseInt(attr("prijs") || "0", 10),
        vermogen_pk: attr("vermogen-pk"),
        afbeelding: photo,
        url: detailUrl,
        kenteken: attr("kenteken"),
      });
    }

    return new Response(JSON.stringify({ vehicles, count: vehicles.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

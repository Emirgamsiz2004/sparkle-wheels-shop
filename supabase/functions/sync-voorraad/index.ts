import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE = "https://svl.autodealers.nl";
const LIST_URL = `${BASE}/occasions.aspx?did=91347&format=xml`;

function attr(block: string, name: string): string {
  const m = block.match(new RegExp(`data-${name}="([^"]*)"`));
  return m ? m[1] : "";
}

async function fetchFeedVehicles() {
  const res = await fetch(LIST_URL);
  if (!res.ok) throw new Error(`Feed returned ${res.status}`);
  const html = await res.text();

  const blocks = html.split(/(?=<div[^>]+class="advertisement)/);
  const vehicles: any[] = [];

  for (const block of blocks) {
    const merk = attr(block, "merk");
    if (!merk) continue;

    const photoMatch = block.match(/data-lazyloader-src="([^"]+)"/);
    const photo = photoMatch ? photoMatch[1] : "";

    vehicles.push({
      feed_id: attr(block, "aid"),
      merk,
      model: attr(block, "model"),
      bouwjaar: parseInt(attr(block, "bouwjaar") || "0", 10) || null,
      brandstof: attr(block, "brandstof") || null,
      kilometerstand: parseInt(attr(block, "kilometerstand") || "0", 10) || 0,
      kleur: attr(block, "kleur") || null,
      kenteken: attr(block, "kenteken") || null,
      verkoopprijs: parseInt(attr(block, "prijs") || "0", 10) || 0,
    });
  }

  return vehicles;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const feedVehicles = await fetchFeedVehicles();

    // Get existing vehicles from DB
    const { data: existing } = await supabase
      .from("vehicles")
      .select("id, feed_id, kenteken");

    const existingByFeedId = new Map(
      (existing || []).filter((v: any) => v.feed_id).map((v: any) => [v.feed_id, v])
    );
    const existingByKenteken = new Map(
      (existing || []).filter((v: any) => v.kenteken).map((v: any) => [v.kenteken.toUpperCase().replace(/[^A-Z0-9]/g, ""), v])
    );

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const fv of feedVehicles) {
      const normalizedKenteken = fv.kenteken
        ? fv.kenteken.toUpperCase().replace(/[^A-Z0-9]/g, "")
        : null;

      // Check if already exists by feed_id or kenteken
      const existingByFeed = existingByFeedId.get(fv.feed_id);
      const existingByKent = normalizedKenteken
        ? existingByKenteken.get(normalizedKenteken)
        : null;
      const match = existingByFeed || existingByKent;

      if (match) {
        // Update feed_id if not set, and update verkoopprijs/km
        const updates: any = {};
        if (!match.feed_id && fv.feed_id) updates.feed_id = fv.feed_id;

        if (Object.keys(updates).length > 0) {
          await supabase.from("vehicles").update(updates).eq("id", match.id);
          updated++;
        } else {
          skipped++;
        }
      } else {
        // Create new vehicle
        const { error } = await supabase.from("vehicles").insert({
          feed_id: fv.feed_id,
          merk: fv.merk,
          model: fv.model,
          bouwjaar: fv.bouwjaar,
          brandstof: fv.brandstof,
          kilometerstand: fv.kilometerstand,
          kleur: fv.kleur,
          kenteken: fv.kenteken,
          verkoopprijs: fv.verkoopprijs,
          status: "te_koop",
        });

        if (error) {
          console.error("Insert error:", error);
        } else {
          created++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        feed_count: feedVehicles.length,
        created,
        updated,
        skipped,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE = "https://svl.autodealers.nl";
const LIST_URL = `${BASE}/occasions.aspx?did=91347&format=xml`;

type FeedStatus = "te_koop" | "verkocht" | "gereserveerd";

function attr(block: string, name: string): string {
  const m = block.match(new RegExp(`data-${name}="([^"]*)"`));
  return m ? m[1] : "";
}

function normalizeKenteken(k: string | null | undefined): string {
  if (!k) return "";
  return k.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function extractFeedStatus(block: string): FeedStatus {
  const lowerBlock = block.toLowerCase();

  if (lowerBlock.includes("occ_verkocht.png") || lowerBlock.includes(">verkocht<")) {
    return "verkocht";
  }

  if (lowerBlock.includes("occ_gereserveerd.png") || lowerBlock.includes(">gereserveerd<")) {
    return "gereserveerd";
  }

  return "te_koop";
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
    const afbeelding = photoMatch ? photoMatch[1] : "";

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
      feed_status: extractFeedStatus(block),
      feed_afbeelding: afbeelding,
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
      .select("id, feed_id, kenteken, status, verkoopprijs, kilometerstand, feed_verkoopprijs, feed_kilometerstand, merk, model, bouwjaar, brandstof, kleur, verkoop_datum, koper_naam, koper_email");

    const existingByFeedId = new Map(
      (existing || []).filter((v: any) => v.feed_id).map((v: any) => [v.feed_id, v])
    );
    const existingByKenteken = new Map(
      (existing || []).filter((v: any) => v.kenteken).map((v: any) => [normalizeKenteken(v.kenteken), v])
    );

    // Track which DB vehicles are still in the feed
    const matchedDbIds = new Set<string>();

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const fv of feedVehicles) {
      const normalizedKenteken = normalizeKenteken(fv.kenteken);

      const existingByFeed = existingByFeedId.get(fv.feed_id);
      const existingByKent = normalizedKenteken
        ? existingByKenteken.get(normalizedKenteken)
        : null;
      const match = existingByFeed || existingByKent;

      if (match) {
        matchedDbIds.add(match.id);

        // Bestaande voertuigen: handmatige admin-wijzigingen zijn leidend.
        // Vul alleen ontbrekende feeddata aan, maar overschrijf geen bestaande waarden.
        const updates: any = {};
        if (!match.feed_id && fv.feed_id) updates.feed_id = fv.feed_id;
        if (!match.kenteken && fv.kenteken) updates.kenteken = fv.kenteken;
        if (!match.merk && fv.merk) updates.merk = fv.merk;
        if (!match.model && fv.model) updates.model = fv.model;
        if (!match.bouwjaar && fv.bouwjaar) updates.bouwjaar = fv.bouwjaar;
        if (!match.brandstof && fv.brandstof) updates.brandstof = fv.brandstof.toLowerCase();
        if (!match.kleur && fv.kleur) updates.kleur = fv.kleur;
        // Autodealers.nl voorraadpagina is leidend voor verkoopprijs en kilometerstand.
        // Wijzigingen daar worden direct overgenomen in de DB.
        if (fv.verkoopprijs && Number(fv.verkoopprijs) !== Number(match.verkoopprijs)) {
          updates.verkoopprijs = fv.verkoopprijs;
          updates.feed_verkoopprijs = fv.verkoopprijs;
        }
        if (fv.kilometerstand && fv.kilometerstand !== Number(match.kilometerstand)) {
          updates.kilometerstand = fv.kilometerstand;
          updates.feed_kilometerstand = fv.kilometerstand;
        }
        if (fv.feed_afbeelding) {
          updates.feed_afbeelding = fv.feed_afbeelding;
        }
        // Autodealers is leidend, behalve voor handmatige statussen.
        // Een verkoop wordt als "echt" beschouwd als er een koper bekend is.
        const isManualSale = match.status === "verkocht" && (match.koper_naam || match.koper_email);
        const manualStatuses = ["consignatie", "in_behandeling", "inkoop"];
        const isManualStatus = manualStatuses.includes(match.status) || isManualSale;

        if (fv.feed_status !== match.status && !isManualStatus) {
          if (fv.feed_status === "verkocht" || fv.feed_status === "gereserveerd") {
            const wasNotVerkocht = match.status !== "verkocht";
            updates.status = fv.feed_status;
            if (fv.feed_status === "verkocht" && !match.verkoop_datum) {
              updates.verkoop_datum = new Date().toISOString().split("T")[0];
            }
            if (fv.feed_status === "verkocht" && wasNotVerkocht) {
              const verkoopTaken = [
                "Kopersgegevens invullen",
                "Koopovereenkomst genereren en uploaden",
                "Factuur aanmaken",
                "Vrijwaringsbewijs uploaden",
                "Betaling controleren",
              ];
              for (const taak of verkoopTaken) {
                await supabase.from("vehicle_tasks").insert({
                  vehicle_id: match.id,
                  omschrijving: taak,
                  prioriteit: "hoog",
                });
              }
              await supabase.from("vehicle_activity_log").insert({
                vehicle_id: match.id,
                actie_type: "status_gewijzigd",
                beschrijving: "Automatisch op verkocht gezet via feed — verkooptaken aangemaakt",
              });
            }
          } else if (fv.feed_status === "te_koop" && match.status === "verkocht" && !isManualSale) {
            // Auto-verkocht teruggedraaid: voertuig staat weer in feed → terug naar te_koop
            updates.status = "te_koop";
            updates.verkoop_datum = null;
            await supabase.from("vehicle_activity_log").insert({
              vehicle_id: match.id,
              actie_type: "status_gewijzigd",
              beschrijving: "Automatisch teruggezet naar te koop (weer aanwezig in feed)",
            });
          }
        }

        if (Object.keys(updates).length > 0) {
          await supabase.from("vehicles").update(updates).eq("id", match.id);
          updated++;
        } else {
          skipped++;
        }
      } else {
        const { error } = await supabase.from("vehicles").insert({
          feed_id: fv.feed_id,
          merk: fv.merk,
          model: fv.model,
          bouwjaar: fv.bouwjaar,
          brandstof: fv.brandstof?.toLowerCase() || null,
          kilometerstand: fv.kilometerstand,
          feed_kilometerstand: fv.kilometerstand,
          kleur: fv.kleur,
          kenteken: fv.kenteken,
          verkoopprijs: fv.verkoopprijs,
          feed_verkoopprijs: fv.verkoopprijs,
          status: fv.feed_status,
          inkoop_datum: new Date().toISOString().split("T")[0],
        });

        if (error) {
          console.error("Insert error:", error);
        } else {
          created++;
        }
      }
    }

    // Mark vehicles that disappeared from feed as verkocht
    // ONLY if their current status is "te_koop" — never touch manually set statuses
    // (gereserveerd, consignatie, in_behandeling, inkoop, etc.)
    let removed = 0;
    for (const dbVehicle of (existing || [])) {
      if (
        dbVehicle.feed_id &&
        !matchedDbIds.has(dbVehicle.id) &&
        dbVehicle.status === "te_koop"
      ) {
        await supabase
          .from("vehicles")
          .update({ status: "verkocht", verkoop_datum: new Date().toISOString().split("T")[0] })
          .eq("id", dbVehicle.id);

        // Create verkoop checklist tasks
        const verkoopTaken = [
          "Kopersgegevens invullen",
          "Koopovereenkomst genereren en uploaden",
          "Factuur aanmaken",
          "Vrijwaringsbewijs uploaden",
          "Betaling controleren",
        ];
        for (const taak of verkoopTaken) {
          await supabase.from("vehicle_tasks").insert({
            vehicle_id: dbVehicle.id,
            omschrijving: taak,
            prioriteit: "hoog",
          });
        }
        await supabase.from("vehicle_activity_log").insert({
          vehicle_id: dbVehicle.id,
          actie_type: "status_gewijzigd",
          beschrijving: "Automatisch op verkocht gezet (uit feed verdwenen) — verkooptaken aangemaakt",
        });

        removed++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        feed_count: feedVehicles.length,
        created,
        updated,
        skipped,
        removed,
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

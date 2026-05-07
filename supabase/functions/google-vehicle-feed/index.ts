import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const SITE = "https://platinautomotive.nl";

function xmlEscape(s: string | number | null | undefined): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function kentekenSlug(k: string): string {
  return (k || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function kentekenUpper(k: string): string {
  return (k || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function capitalize(s: string | null | undefined): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

const fuelMap: Record<string, string> = {
  benzine: "Gasoline",
  diesel: "Diesel",
  elektrisch: "Electric",
  hybride: "Hybrid",
  "plug-in hybride": "Plug-in Hybrid",
  lpg: "LPG",
};

const bodyMap: Record<string, string> = {
  sedan: "Sedan",
  hatchback: "Hatchback",
  stationwagon: "Wagon",
  suv: "SUV",
  cabrio: "Convertible",
  "coupé": "Coupe",
  coupe: "Coupe",
  mpv: "Minivan",
  bestelwagen: "Van",
};

function mapFuel(b: string | null | undefined): string {
  if (!b) return "";
  return fuelMap[b.toLowerCase()] || capitalize(b);
}

function mapTransmission(t: string | null | undefined): string {
  if (!t) return "Manual";
  return t.toLowerCase().startsWith("automaat") ? "Automatic" : "Manual";
}

function mapBody(b: string | null | undefined): string {
  if (!b) return "";
  return bodyMap[b.toLowerCase()] || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const feedUrl = `${supabaseUrl}/functions/v1/google-vehicle-feed`;
    console.log(`[google-vehicle-feed] Public feed URL: ${feedUrl}`);

    const { data: vehicles, error } = await supabase
      .from("vehicles")
      .select("*")
      .neq("status", "verkocht")
      .gt("verkoopprijs", 0)
      .not("kenteken", "is", null)
      .neq("kenteken", "")
      .limit(2000);

    if (error) throw error;

    const vehicleIds = (vehicles || []).map((v: any) => v.id);
    const { data: photos } = await supabase
      .from("vehicle_photos")
      .select("vehicle_id, file_path, volgorde, is_hoofdfoto")
      .in("vehicle_id", vehicleIds.length ? vehicleIds : ["00000000-0000-0000-0000-000000000000"])
      .order("is_hoofdfoto", { ascending: false })
      .order("volgorde", { ascending: true });

    const photoByVehicle = new Map<string, string>();
    for (const p of photos || []) {
      if (!photoByVehicle.has(p.vehicle_id)) {
        photoByVehicle.set(
          p.vehicle_id,
          `${supabaseUrl}/storage/v1/object/public/vehicle-photos/${p.file_path}`
        );
      }
    }

    const now = new Date().toISOString();
    const year = new Date().getFullYear();

    const items: string[] = [];

    for (const v of vehicles || []) {
      const kentekenClean = kentekenUpper(v.kenteken);
      const slug = kentekenSlug(v.kenteken);
      if (!kentekenClean || !slug) continue;

      const title = `${v.merk || ""} ${v.model || ""}`.trim();
      const link = `${SITE}/autos/${slug}`;
      const image = photoByVehicle.get(v.id);

      const km = v.kilometerstand
        ? new Intl.NumberFormat("nl-NL").format(Number(v.kilometerstand))
        : "";

      const descParts = [
        v.bouwjaar ? String(v.bouwjaar) : "",
        km ? `${km} Km` : "",
        v.brandstof ? capitalize(v.brandstof) : "",
        v.kleur ? capitalize(v.kleur) : "",
      ].filter(Boolean);
      const description = descParts.join(" · ");

      const price = `${Math.round(Number(v.verkoopprijs))}.00 EUR`;
      const id = `tag:platinautomotive.nl,${year}:${kentekenClean}`;

      const fields: string[] = [];
      fields.push(`    <id>${xmlEscape(id)}</id>`);
      fields.push(`    <g:id>${xmlEscape(kentekenClean)}</g:id>`);
      fields.push(`    <title>${xmlEscape(title)}</title>`);
      if (description) fields.push(`    <description>${xmlEscape(description)}</description>`);
      fields.push(`    <link>${xmlEscape(link)}</link>`);
      if (image) fields.push(`    <g:image_link>${xmlEscape(image)}</g:image_link>`);
      fields.push(`    <g:price>${xmlEscape(price)}</g:price>`);
      fields.push(`    <g:condition>used</g:condition>`);
      if (v.merk) fields.push(`    <g:vehicle_make>${xmlEscape(v.merk)}</g:vehicle_make>`);
      if (v.model) fields.push(`    <g:vehicle_model>${xmlEscape(v.model)}</g:vehicle_model>`);
      if (v.bouwjaar) fields.push(`    <g:vehicle_year>${xmlEscape(v.bouwjaar)}</g:vehicle_year>`);
      if (v.kilometerstand) {
        fields.push(
          `    <g:vehicle_mileage><g:value>${xmlEscape(v.kilometerstand)}</g:value><g:unit>KM</g:unit></g:vehicle_mileage>`
        );
      }
      const fuel = mapFuel(v.brandstof);
      if (fuel) fields.push(`    <g:vehicle_fuel_type>${xmlEscape(fuel)}</g:vehicle_fuel_type>`);
      if (v.kleur) fields.push(`    <g:color>${xmlEscape(capitalize(v.kleur))}</g:color>`);
      if (v.chassis_nummer) fields.push(`    <g:vehicle_vin>${xmlEscape(v.chassis_nummer)}</g:vehicle_vin>`);
      fields.push(`    <g:product_type>Car</g:product_type>`);
      fields.push(`    <g:availability>in stock</g:availability>`);
      fields.push(`    <g:brand>Platin Automotive</g:brand>`);

      items.push(`  <entry>\n${fields.join("\n")}\n  </entry>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:g="http://base.google.com/ns/1.0">
  <title>Platin Automotive - Voertuigen</title>
  <link rel="self" href="${xmlEscape(feedUrl)}"/>
  <updated>${now}</updated>
${items.join("\n")}
</feed>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=UTF-8",
        "Cache-Control": "max-age=3600",
      },
    });
  } catch (e) {
    console.error("google-vehicle-feed error:", e);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>\n<error>${xmlEscape((e as Error).message)}</error>`,
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/xml; charset=UTF-8" },
      }
    );
  }
});

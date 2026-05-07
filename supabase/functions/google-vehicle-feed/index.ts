const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const SITE = "https://platinautomotive.nl";
const BASE = "https://svl.autodealers.nl";
const LIST_URL = `${BASE}/occasions.aspx?did=91347&format=xml`;

function xmlEscape(s: string | number | null | undefined): string {
  if (s === null || s === undefined || s === "") return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function attr(block: string, name: string): string {
  const m = block.match(new RegExp(`data-${name}="([^"]*)"`));
  return m ? m[1] : "";
}

function kentekenSlug(k: string): string {
  return (k || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function kentekenUpper(k: string): string {
  return (k || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}
function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

const fuelMap: Record<string, string> = {
  benzine: "Gasoline",
  diesel: "Diesel",
  elektrisch: "Electric",
  electric: "Electric",
  hybride: "Hybrid",
  "plug-in hybride": "Plug-in Hybrid",
  "plug-in": "Plug-in Hybrid",
  lpg: "LPG",
};

const bodyMap: Record<string, string> = {
  sedan: "Sedan",
  hatchback: "Hatchback",
  stationwagon: "Wagon",
  station: "Wagon",
  suv: "SUV",
  cabrio: "Convertible",
  cabriolet: "Convertible",
  "coupé": "Coupe",
  coupe: "Coupe",
  mpv: "Minivan",
  bestelwagen: "Van",
  bestel: "Van",
};

function mapFuel(b: string): string {
  if (!b) return "";
  return fuelMap[b.toLowerCase()] || capitalize(b);
}
function mapTransmission(t: string): string {
  if (!t) return "";
  return t.toLowerCase().startsWith("automaat") ? "Automatic" : "Manual";
}
function mapBody(b: string): string {
  if (!b) return "";
  return bodyMap[b.toLowerCase()] || "";
}

function extractFeedStatus(block: string): string {
  const lower = block.toLowerCase();
  if (lower.includes("occ_verkocht.png") || lower.includes(">verkocht<")) return "verkocht";
  if (lower.includes("occ_gereserveerd.png") || lower.includes(">gereserveerd<")) return "gereserveerd";
  return "te_koop";
}

async function fetchList() {
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

    const detailMatch = block.match(/href="(\/[^"]*details\.aspx[^"]*)"/);
    const detailPath = detailMatch ? detailMatch[1] : "";

    vehicles.push({
      id: attr(block, "aid"),
      merk,
      model: attr(block, "model"),
      type: attr(block, "type"),
      bouwjaar: attr(block, "bouwjaar"),
      brandstof: attr(block, "brandstof"),
      transmissie: attr(block, "transmissie"),
      kilometerstand: attr(block, "kilometerstand"),
      carrosserie: attr(block, "carrosserie"),
      kleur: attr(block, "kleur"),
      prijs: parseInt(attr(block, "prijs") || "0", 10),
      vermogen_pk: attr(block, "vermogen-pk"),
      afbeelding: photo,
      detailPath,
      kenteken: attr(block, "kenteken"),
      feedStatus: extractFeedStatus(block),
    });
  }

  return vehicles;
}

async function fetchDetailPhotos(detailPath: string): Promise<string[]> {
  try {
    const res = await fetch(`${BASE}${detailPath}`);
    if (!res.ok) return [];
    const html = await res.text();
    const all = html.match(/https:\/\/media-cdn\.vwe\.nl\/Images\/\d+/g) || [];
    const unique = [...new Set(all)];
    return unique.map((p) => `${p}?templateid=&overlay=&bgc=f5f5f5&w=1280`);
  } catch {
    return [];
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, i: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;
  const workers = new Array(Math.min(concurrency, items.length || 1))
    .fill(0)
    .map(async () => {
      while (true) {
        const i = idx++;
        if (i >= items.length) return;
        results[i] = await fn(items[i], i);
      }
    });
  await Promise.all(workers);
  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const feedUrl = `${supabaseUrl}/functions/v1/google-vehicle-feed`;
    console.log(`[google-vehicle-feed] Public feed URL: ${feedUrl}`);

    const vehicles = await fetchList();
    const now = new Date().toISOString();
    const year = new Date().getFullYear();

    const items: string[] = [];

    const eligible = vehicles.filter(
      (v: any) =>
        v.feedStatus !== "verkocht" &&
        v.prijs > 0 &&
        kentekenUpper(v.kenteken) &&
        v.detailPath
    );

    const photoLists = await mapWithConcurrency(eligible, 8, (v: any) =>
      fetchDetailPhotos(v.detailPath)
    );
    const photosByAid = new Map<string, string[]>();
    eligible.forEach((v: any, i: number) => photosByAid.set(v.id, photoLists[i] || []));

    for (const v of vehicles) {
      if (v.feedStatus === "verkocht") continue;
      if (!v.prijs || v.prijs <= 0) continue;
      const kentekenClean = kentekenUpper(v.kenteken);
      const slug = kentekenSlug(v.kenteken);
      if (!kentekenClean || !slug) continue;

      const fotos = photosByAid.get(v.id) || [];
      const hoofdfoto = fotos[0] || v.afbeelding || "";
      const extraFotos = fotos.slice(1, 11);

      if (!kentekenClean || !slug) continue;

      const title = `${v.merk} ${v.model}`.trim();
      const link = `${SITE}/autos/${slug}`;

      const km = v.kilometerstand
        ? new Intl.NumberFormat("nl-NL").format(Number(v.kilometerstand))
        : "";

      const descParts = [
        v.bouwjaar || "",
        km ? `${km} Km` : "",
        v.brandstof ? capitalize(v.brandstof) : "",
        v.transmissie || "",
        v.carrosserie ? capitalize(v.carrosserie) : "",
        v.kleur ? capitalize(v.kleur) : "",
        v.vermogen_pk ? `${v.vermogen_pk} Pk` : "",
      ].filter(Boolean);
      const description = descParts.join(" · ");

      const price = `${Math.round(Number(v.prijs))}.00 EUR`;
      const id = `tag:platinautomotive.nl,${year}:${kentekenClean}`;

      const fields: string[] = [];
      fields.push(`    <id>${xmlEscape(id)}</id>`);
      fields.push(`    <g:id>${xmlEscape(kentekenClean)}</g:id>`);
      fields.push(`    <title>${xmlEscape(title)}</title>`);
      if (description) fields.push(`    <description>${xmlEscape(description)}</description>`);
      fields.push(`    <link>${xmlEscape(link)}</link>`);
      if (v.afbeelding) fields.push(`    <g:image_link>${xmlEscape(v.afbeelding)}</g:image_link>`);
      fields.push(`    <g:price>${xmlEscape(price)}</g:price>`);
      fields.push(`    <g:condition>used</g:condition>`);
      fields.push(`    <g:vehicle_make>${xmlEscape(v.merk)}</g:vehicle_make>`);
      fields.push(`    <g:vehicle_model>${xmlEscape(v.model)}</g:vehicle_model>`);
      if (v.bouwjaar) fields.push(`    <g:vehicle_year>${xmlEscape(v.bouwjaar)}</g:vehicle_year>`);
      if (v.kilometerstand) {
        fields.push(
          `    <g:vehicle_mileage><g:value>${xmlEscape(v.kilometerstand)}</g:value><g:unit>KM</g:unit></g:vehicle_mileage>`
        );
      }
      const fuel = mapFuel(v.brandstof);
      if (fuel) fields.push(`    <g:vehicle_fuel_type>${xmlEscape(fuel)}</g:vehicle_fuel_type>`);
      const trans = mapTransmission(v.transmissie);
      if (trans) fields.push(`    <g:vehicle_transmission>${trans}</g:vehicle_transmission>`);
      if (v.kleur) fields.push(`    <g:color>${xmlEscape(capitalize(v.kleur))}</g:color>`);
      const body = mapBody(v.carrosserie);
      if (body) fields.push(`    <g:vehicle_body_style>${body}</g:vehicle_body_style>`);
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

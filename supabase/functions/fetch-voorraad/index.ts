import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      nap: attr(block, "nap"),
    });
  }

  return vehicles;
}

async function fetchDetail(detailPath: string) {
  const url = `${BASE}${detailPath}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Detail page returned ${res.status}`);
  const html = await res.text();

  // Photos - unique IDs from media-cdn
  const allPhotos = html.match(/https:\/\/media-cdn\.vwe\.nl\/Images\/\d+/g) || [];
  const uniqueIds = [...new Set(allPhotos)];
  const fotos = uniqueIds.map((p) => `${p}?templateid=&overlay=&bgc=f5f5f5&w=1280`);

  // Description
  let beschrijving = "";
  const descMatch = html.match(/opmerking-tekst[\s"'][^>]*>(.*?)<\/span>/s);
  if (descMatch) {
    beschrijving = descMatch[1]
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/^\s*>\s*\n?/, "")
      .trim();
  }

  // Options from ul inside opties section
  const opties: string[] = [];
  const optMatch = html.match(/data-section="opties".*?<ul[^>]*>(.*?)<\/ul>/s);
  if (optMatch) {
    const items = optMatch[1].match(/<li[^>]*>(.*?)<\/li>/gs) || [];
    for (const li of items) {
      const text = li.replace(/<[^>]+>/g, "").trim();
      if (text) opties.push(text);
    }
  }

  // Main data attributes from the detail page div
  const dataAttr = (name: string): string => {
    const m = html.match(new RegExp(`data-${name}="([^"]*)"`));
    return m ? m[1] : "";
  };

  const nap = dataAttr("nap"); // "0" or "1"
  const bovagGarantie = dataAttr("bovaggarantie");
  const garantieMaanden = dataAttr("garantiemaanden");

  // Extract more specs from data-section attributes
  const extractSection = (name: string): string => {
    const m = html.match(new RegExp(`data-section="${name}"[^>]*>.*?data-item-value[^>]*>([^<]+)`, "s"));
    if (m) return m[1].trim();
    const m2 = html.match(new RegExp(`data-section="${name}"[^>]*>(.*?)(?=data-section=)`, "s"));
    if (m2) {
      const nums = m2[1].match(/>\s*(\d[\d.,]*)\s*</);
      if (nums) return nums[1];
    }
    return "";
  };

  const topsnelheid = extractSection("topsnelheid");
  const verbruik = extractSection("verbruik ");
  const co2 = extractSection("co2uitstoot");
  const energielabel = extractSection("energielabel");
  const bekleding = extractSection("bekleding");
  const aandrijving = extractSection("aandrijving");
  const deuren = extractSection("aantal-deuren") || extractSection("deuren");
  const cilinders = extractSection("cilinders");
  const gewicht = extractSection("gewicht");
  const tankinhoud = extractSection("tankinhoud");
  const apk = extractSection("apk");
  const zitplaatsen = extractSection("zitplaatsen");
  const acceleratie = extractSection("acceleratie");

  // Extract Marktplaats URL if present
  let marktplaatsUrl = "";
  const mpMatch = html.match(/href="(https?:\/\/(?:www\.)?marktplaats\.nl\/[^"]+)"/i);
  if (mpMatch) {
    marktplaatsUrl = mpMatch[1];
  }

  return {
    fotos,
    beschrijving,
    opties,
    nap,
    bovag_garantie: bovagGarantie,
    garantie_maanden: garantieMaanden,
    marktplaats_url: marktplaatsUrl,
    extra: {
      topsnelheid,
      verbruik,
      co2,
      energielabel,
      bekleding,
      aandrijving,
      deuren,
      cilinders,
      gewicht,
      tankinhoud,
      apk,
      zitplaatsen,
      acceleratie,
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const vehicleId = url.searchParams.get("id");

    if (vehicleId) {
      // Fetch list first to get the detail path for this vehicle
      const vehicles = await fetchList();
      const vehicle = vehicles.find((v: any) => v.id === vehicleId);
      if (!vehicle || !vehicle.detailPath) {
        return new Response(JSON.stringify({ error: "Voertuig niet gevonden" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const detail = await fetchDetail(vehicle.detailPath);

      return new Response(
        JSON.stringify({ vehicle: { ...vehicle, ...detail } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // List all vehicles
    const vehicles = await fetchList();
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

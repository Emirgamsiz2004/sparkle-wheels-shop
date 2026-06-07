import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
      feedStatus: extractFeedStatus(block),
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

  // Extract kenteken from detail page
  const kentekenDetail = dataAttr("kenteken");

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

  const aantalEigenaren = dataAttr("aantaleigenaren") || extractSection("aantal-eigenaren") || extractSection("eigenaren");
  const btw_marge = dataAttr("btwmarge") || extractSection("btw-marge") || extractSection("btw");

  // Try to extract aantal eigenaren from page text if not in data attributes
  let eigenaren = aantalEigenaren;
  if (!eigenaren) {
    const eigMatch = html.match(/eigenar[^<]*?(\d+)/i);
    if (eigMatch) eigenaren = eigMatch[1];
  }

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
    aantal_eigenaren: eigenaren,
    btw_marge: btw_marge,
    kenteken_detail: kentekenDetail,
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

async function syncAutodealersPricesToDatabase(supabase: ReturnType<typeof createClient>, vehicles: any[]) {
  const { data: dbVehicles, error } = await supabase
    .from("vehicles")
    .select("id, feed_id, kenteken, verkoopprijs, feed_verkoopprijs, feed_afbeelding");

  if (error) {
    console.error("Autodealers price sync select error:", error);
    return;
  }

  const byFeedId = new Map((dbVehicles || []).filter((v: any) => v.feed_id).map((v: any) => [v.feed_id, v]));
  const byKenteken = new Map(
    (dbVehicles || [])
      .filter((v: any) => v.kenteken)
      .map((v: any) => [normalizeKenteken(v.kenteken), v])
  );

  for (const vehicle of vehicles) {
    const prijs = Number(vehicle.prijs) || 0;
    const match = byFeedId.get(vehicle.id) || byKenteken.get(normalizeKenteken(vehicle.kenteken));
    if (!match) continue;

    const updates: Record<string, unknown> = {};
    if (!match.feed_id && vehicle.id) updates.feed_id = vehicle.id;
    if (prijs && Number(match.verkoopprijs) !== prijs) updates.verkoopprijs = prijs;
    if (prijs && Number(match.feed_verkoopprijs) !== prijs) updates.feed_verkoopprijs = prijs;
    if (vehicle.afbeelding && match.feed_afbeelding !== vehicle.afbeelding) {
      updates.feed_afbeelding = vehicle.afbeelding;
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase.from("vehicles").update(updates).eq("id", match.id);
      if (updateError) console.error("Autodealers price sync update error:", updateError);
    }
  }
}

Deno.serve(async (req) => {
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

    // List all vehicles — merge DB statuses
    const vehicles = await fetchList();

    // Sync DB prices from Autodealers whenever the live voorraad is loaded.
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await syncAutodealersPricesToDatabase(supabase, vehicles);

    const { data: dbVehicles } = await supabase
      .from("vehicles")
      .select("feed_id, kenteken, status, marktplaats_url, verkoop_datum")
      .in("status", ["verkocht", "gereserveerd"]);

    type DbMatch = { status: string; marktplaats_url: string | null; verkoop_datum: string | null };
    const statusByFeedId = new Map<string, DbMatch>();
    const statusByKenteken = new Map<string, DbMatch>();
    for (const v of (dbVehicles || [])) {
      const entry: DbMatch = { status: v.status, marktplaats_url: v.marktplaats_url, verkoop_datum: v.verkoop_datum };
      if (v.feed_id) statusByFeedId.set(v.feed_id, entry);
      if (v.kenteken) statusByKenteken.set(v.kenteken.toUpperCase().replace(/[^A-Z0-9]/g, ""), entry);
    }

    // Merge status into feed vehicles
    const enriched = vehicles.map((v: any) => {
      const match = statusByFeedId.get(v.id) ||
        (v.kenteken ? statusByKenteken.get(v.kenteken.toUpperCase().replace(/[^A-Z0-9]/g, "")) : null);
      return {
        ...v,
        dbStatus: match?.status || v.feedStatus || "te_koop",
        verkochtOp: match?.verkoop_datum || null,
      };
    });

    // Voeg verkochte voertuigen toe die niet meer in de feed staan (verwijderd uit
    // advertentie-manager), zodat ze in "Onlangs verkocht" blijven verschijnen.
    const feedIds = new Set(vehicles.map((v: any) => v.id).filter(Boolean));
    const feedKentekens = new Set(
      vehicles.map((v: any) => normalizeKenteken(v.kenteken)).filter(Boolean)
    );
    const { data: soldDbVehicles } = await supabase
      .from("vehicles")
      .select("id, feed_id, kenteken, merk, model, bouwjaar, brandstof, kilometerstand, kleur, verkoopprijs, feed_verkoopprijs, verkoop_datum, feed_afbeelding")
      .eq("status", "verkocht")
      .order("verkoop_datum", { ascending: false, nullsFirst: false });

    const extras: any[] = [];
    for (const v of soldDbVehicles || []) {
      if (v.feed_id && feedIds.has(v.feed_id)) continue;
      if (v.kenteken && feedKentekens.has(normalizeKenteken(v.kenteken))) continue;

      let afbeelding = v.feed_afbeelding || "";

      if (!afbeelding) {
        const { data: photos } = await supabase
          .from("vehicle_photos")
          .select("file_path, is_hoofdfoto, volgorde")
          .eq("vehicle_id", v.id)
          .order("is_hoofdfoto", { ascending: false })
          .order("volgorde", { ascending: true })
          .limit(1);

        const path = photos?.[0]?.file_path;
        if (path) {
          const { data: pub } = supabase.storage.from("vehicle-photos").getPublicUrl(path);
          afbeelding = pub.publicUrl;
        }
      }

      const prijs = Number(v.feed_verkoopprijs || v.verkoopprijs) || 0;

      extras.push({
        id: v.feed_id || v.id,
        merk: v.merk || "",
        model: v.model || "",
        type: "",
        bouwjaar: v.bouwjaar ? String(v.bouwjaar) : "",
        brandstof: v.brandstof || "",
        transmissie: "",
        kilometerstand: v.kilometerstand ? String(v.kilometerstand) : "",
        carrosserie: "",
        kleur: v.kleur || "",
        prijs,
        vermogen_pk: "",
        afbeelding,
        detailPath: "",
        kenteken: v.kenteken || "",
        nap: "",
        feedStatus: "verkocht",
        dbStatus: "verkocht",
        verkochtOp: v.verkoop_datum,
        detailAvailable: false,
      });
    }

    const all = [...enriched, ...extras];

    return new Response(JSON.stringify({ vehicles: all, count: all.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

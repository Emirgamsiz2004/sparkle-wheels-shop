const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GOOGLE_PLACES_API_KEY niet geconfigureerd" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { action, input, placeId, sessionToken } = await req.json();

    if (action === "autocomplete") {
      if (!input || typeof input !== "string" || input.trim().length < 2) {
        return new Response(JSON.stringify({ predictions: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
      url.searchParams.set("input", input);
      url.searchParams.set("key", apiKey);
      url.searchParams.set("language", "nl");
      url.searchParams.set("components", "country:nl");
      url.searchParams.set("types", "address");
      if (sessionToken) url.searchParams.set("sessiontoken", sessionToken);

      const res = await fetch(url.toString());
      const data = await res.json();
      return new Response(
        JSON.stringify({ predictions: data.predictions || [], status: data.status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "details") {
      if (!placeId || typeof placeId !== "string") {
        return new Response(JSON.stringify({ error: "placeId vereist" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
      url.searchParams.set("place_id", placeId);
      url.searchParams.set("key", apiKey);
      url.searchParams.set("language", "nl");
      url.searchParams.set("fields", "address_components,formatted_address");
      if (sessionToken) url.searchParams.set("sessiontoken", sessionToken);

      const res = await fetch(url.toString());
      const data = await res.json();
      const components = data.result?.address_components || [];
      const get = (type: string) =>
        components.find((c: any) => c.types?.includes(type))?.long_name || "";
      const getShort = (type: string) =>
        components.find((c: any) => c.types?.includes(type))?.short_name || "";

      const street = get("route");
      const number = get("street_number");
      const adres = [street, number].filter(Boolean).join(" ");
      const postcode = get("postal_code");
      const woonplaats = get("locality") || get("postal_town") || get("administrative_area_level_2");
      const land = get("country") || "Nederland";

      return new Response(
        JSON.stringify({
          adres,
          postcode,
          woonplaats,
          land,
          countryCode: getShort("country"),
          formatted: data.result?.formatted_address || "",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: "Onbekende action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Onbekende fout";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

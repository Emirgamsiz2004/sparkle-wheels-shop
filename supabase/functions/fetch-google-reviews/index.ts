import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const PLACE_ID = "ChIJI1ARTp7FxUcRPX-wUt-4OAA";

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!GOOGLE_API_KEY) {
      console.error("Google Places reviews unavailable: GOOGLE_PLACES_API_KEY is not configured");
      return jsonResponse({ reviews: [], rating: null, totalRatings: 0, unavailable: true });
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews,rating,user_ratings_total&language=nl&key=${GOOGLE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Google Places reviews unavailable", {
        status: data.status,
        message: data.error_message,
      });

      return jsonResponse({
        reviews: [],
        rating: null,
        totalRatings: 0,
        unavailable: true,
        googleStatus: data.status,
        googleMessage: data.error_message || null,
      });
    }

    const reviews = data.result.reviews || [];

    return jsonResponse({ reviews, rating: data.result.rating, totalRatings: data.result.user_ratings_total });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Google Places reviews fetch failed", errorMessage);
    return jsonResponse({ reviews: [], rating: null, totalRatings: 0, unavailable: true });
  }
});

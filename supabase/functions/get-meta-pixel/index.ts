import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const pixelId = Deno.env.get("META_PIXEL_ID");

  return new Response(JSON.stringify({ pixelId: pixelId || null }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

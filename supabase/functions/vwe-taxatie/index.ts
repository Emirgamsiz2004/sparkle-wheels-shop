import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INTERDATA_URL = "https://interdata.vwe.nl/DataAanvraag.asmx";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { kenteken } = await req.json();

    const VWE_USERNAME = Deno.env.get("VWE_USERNAME");
    const VWE_PASSWORD = Deno.env.get("VWE_PASSWORD");

    if (!VWE_USERNAME || !VWE_PASSWORD) {
      return new Response(
        JSON.stringify({ success: false, error: "VWE credentials niet geconfigureerd" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Kenteken opschonen (alleen letters en cijfers)
    const cleanKenteken = kenteken.toUpperCase().replace(/[^A-Z0-9]/g, "");

    // Interdata standaard request XML voor taxatie info
    const requestXml = `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <authenticatie>
    <gebruikersnaam>${VWE_USERNAME}</gebruikersnaam>
    <wachtwoord>${VWE_PASSWORD}</wachtwoord>
  </authenticatie>
  <parameters>
    <kenteken>${cleanKenteken}</kenteken>
  </parameters>
  <rubrieken>
    <atlTaxatieInfoBasic/>
    <atlTaxatieOnline/>
  </rubrieken>
</request>`;

    const response = await fetch(INTERDATA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `requestXml=${encodeURIComponent(requestXml)}`,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`VWE API error [${response.status}]: ${errorText}`);
    }

    const xmlText = await response.text();

    // Parse relevante waarden uit XML response
    const extractValue = (xml: string, tag: string): string | null => {
      const regex = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "i");
      const match = xml.match(regex);
      return match ? match[1] : null;
    };

    const taxatieData = {
      inkoopwaarde: extractValue(xmlText, "inkoopwaarde") || extractValue(xmlText, "Inkoopwaarde"),
      verkoopwaarde: extractValue(xmlText, "verkoopwaarde") || extractValue(xmlText, "Verkoopwaarde"),
      nieuwprijs: extractValue(xmlText, "nieuwprijs") || extractValue(xmlText, "Nieuwprijs"),
      dagwaarde: extractValue(xmlText, "dagwaarde") || extractValue(xmlText, "Dagwaarde"),
      handelsprijs: extractValue(xmlText, "handelsprijs") || extractValue(xmlText, "Handelsprijs"),
      raw_response: xmlText, // Voor debugging
    };

    return new Response(
      JSON.stringify({ success: true, data: taxatieData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("VWE Taxatie error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INTERDATA_URL = "https://interdata.vwe.nl/DataAanvraag.asmx";

const escapeXml = (str: string) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

async function requireStaff(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data, error } = await supabase.auth.getClaims(authHeader.slice(7));
  if (error || !data?.claims?.sub) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: ok } = await supabase.rpc("is_staff", { _user_id: data.claims.sub });
  if (!ok) {
    return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const denied = await requireStaff(req);
  if (denied) return denied;

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

    const cleanKenteken = kenteken.toUpperCase().replace(/[^A-Z0-9]/g, "");

    const innerXml = `<request><authenticatie><gebruikersnaam>${VWE_USERNAME}</gebruikersnaam><wachtwoord>${VWE_PASSWORD}</wachtwoord></authenticatie><parameters><kenteken>${cleanKenteken}</kenteken></parameters><rubrieken><atlTaxatieInfoBasic/><atlTaxatieOnline/></rubrieken></request>`;

    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <standaardDataRequest xmlns="http://hetextranet.nl/InterData">
      <requestXml>${escapeXml(innerXml)}</requestXml>
    </standaardDataRequest>
  </soap:Body>
</soap:Envelope>`;

    const response = await fetch(INTERDATA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": "http://hetextranet.nl/InterData/standaardDataRequest",
      },
      body: soapEnvelope,
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`VWE API error [${response.status}]: ${responseText.substring(0, 200)}`);
    }

    // Extract result from SOAP response
    const resultMatch = responseText.match(/<standaardDataRequestResult>([\s\S]*?)<\/standaardDataRequestResult>/i);
    const resultXml = resultMatch ? resultMatch[1] : responseText;

    // Decode entity-encoded XML
    const decodedXml = resultXml
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");

    const extractValue = (xml: string, tag: string): string | null => {
      const regex = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "i");
      const match = xml.match(regex);
      return match ? match[1] : null;
    };

    const taxatieData = {
      inkoopwaarde: extractValue(decodedXml, "inkoopwaarde") || extractValue(decodedXml, "Inkoopwaarde"),
      verkoopwaarde: extractValue(decodedXml, "verkoopwaarde") || extractValue(decodedXml, "Verkoopwaarde"),
      nieuwprijs: extractValue(decodedXml, "nieuwprijs") || extractValue(decodedXml, "Nieuwprijs"),
      dagwaarde: extractValue(decodedXml, "dagwaarde") || extractValue(decodedXml, "Dagwaarde"),
      handelsprijs: extractValue(decodedXml, "handelsprijs") || extractValue(decodedXml, "Handelsprijs"),
      raw_response: decodedXml,
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

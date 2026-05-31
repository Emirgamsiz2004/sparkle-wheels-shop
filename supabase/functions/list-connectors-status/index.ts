import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConnectorDef {
  id: string;
  name: string;
  description: string;
  category: "AI" | "Communicatie" | "Data" | "Marketing" | "Automatisering" | "Documenten" | "Financieel";
  envVars: string[];
  manageUrl?: string;
}

const CONNECTORS: ConnectorDef[] = [
  { id: "lovable_ai", name: "Lovable AI Gateway", category: "AI", description: "Toegang tot Gemini, GPT en Claude modellen", envVars: ["LOVABLE_API_KEY"] },
  { id: "anthropic", name: "Anthropic (Claude)", category: "AI", description: "Voor tekstgeneratie en social posts", envVars: ["ANTHROPIC_API_KEY"] },
  { id: "perplexity", name: "Perplexity", category: "AI", description: "Web research voor deal analyzer", envVars: ["PERPLEXITY_API_KEY"] },
  { id: "firecrawl", name: "Firecrawl", category: "Data", description: "Web scraping voor prijsanalyses", envVars: ["FIRECRAWL_API_KEY"] },
  { id: "slack", name: "Slack", category: "Communicatie", description: "Notificaties naar je Slack workspace", envVars: ["SLACK_API_KEY"] },
  { id: "google_calendar", name: "Google Calendar", category: "Automatisering", description: "Synchroniseer afspraken en proefritten", envVars: ["GOOGLE_CALENDAR_API_KEY"] },
  { id: "google_places", name: "Google Places", category: "Data", description: "Adres autocomplete en Google Reviews", envVars: ["GOOGLE_PLACES_API_KEY"] },
  { id: "google_search_console", name: "Google Search Console", category: "Marketing", description: "SEO inzichten en zoekprestaties", envVars: ["GOOGLE_SEARCH_CONSOLE_API_KEY"] },
  { id: "moneybird", name: "Moneybird", category: "Financieel", description: "Boekhouding en facturatie sync", envVars: ["MONEYBIRD_API_TOKEN", "MONEYBIRD_ADMINISTRATION_ID"] },
  { id: "vwe", name: "VWE", category: "Data", description: "Voertuigdata en taxaties", envVars: ["VWE_USERNAME", "VWE_PASSWORD"] },
  { id: "meta_pixel", name: "Meta Pixel", category: "Marketing", description: "Facebook/Instagram conversie tracking", envVars: ["META_PIXEL_ID"] },
  { id: "make", name: "Make.com", category: "Automatisering", description: "Webhook automatiseringen (Google Drive, etc.)", envVars: [] },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const result = CONNECTORS.map((c) => {
    const connected = c.envVars.length === 0
      ? true
      : c.envVars.every((v) => !!Deno.env.get(v));
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      category: c.category,
      connected,
      missingVars: c.envVars.filter((v) => !Deno.env.get(v)),
    };
  });

  return new Response(JSON.stringify({ connectors: result }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

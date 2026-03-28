import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const testDriveId = url.searchParams.get("id");

    if (!testDriveId) {
      return new Response("Missing id", { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: td } = await supabase
      .from("test_drives")
      .select("pdf_definitief_path, pdf_path")
      .eq("id", testDriveId)
      .maybeSingle();

    const path = td?.pdf_definitief_path || td?.pdf_path;
    if (!path) {
      return new Response("Document niet gevonden", { status: 404 });
    }

    const { data } = await supabase.storage
      .from("test-drive-files")
      .download(path);

    if (!data) {
      return new Response("Bestand niet beschikbaar", { status: 404 });
    }

    const html = await data.text();

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": "inline",
      },
    });
  } catch (err) {
    return new Response("Er is een fout opgetreden", { status: 500 });
  }
});

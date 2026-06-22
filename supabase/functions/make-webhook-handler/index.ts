import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-webhook-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Shared-secret auth (Make.com must send x-webhook-secret header)
    const expected = Deno.env.get("MAKE_WEBHOOK_SECRET");
    const provided = req.headers.get("x-webhook-secret");
    if (!expected || !provided || provided !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action } = body;

    if (action === "update_vehicle_drive_folder") {
      const { vehicle_id, folder_id, folder_url } = body;
      if (!vehicle_id || !folder_id) {
        return new Response(JSON.stringify({ error: "vehicle_id and folder_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { error } = await supabase.from("vehicles").update({
        google_drive_folder_id: folder_id,
        google_drive_folder_url: folder_url || `https://drive.google.com/drive/folders/${folder_id}`,
        google_drive_synced: true,
      }).eq("id", vehicle_id);
      if (error) throw error;

    } else if (action === "update_document_drive_id") {
      const { document_id, file_id, file_url } = body;
      if (!document_id || !file_id) {
        return new Response(JSON.stringify({ error: "document_id and file_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { error } = await supabase.from("vehicle_documents").update({
        google_drive_file_id: file_id,
        google_drive_url: file_url || `https://drive.google.com/file/d/${file_id}`,
      }).eq("id", document_id);
      if (error) throw error;

    } else if (action === "update_photo_drive_id") {
      const { photo_id, file_id, file_url } = body;
      if (!photo_id || !file_id) {
        return new Response(JSON.stringify({ error: "photo_id and file_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { error } = await supabase.from("vehicle_photos").update({
        google_drive_file_id: file_id,
        google_drive_url: file_url || `https://drive.google.com/file/d/${file_id}`,
      }).eq("id", photo_id);
      if (error) throw error;

    } else if (action === "add_document_from_drive") {
      const { vehicle_id, naam, type, file_path, google_drive_file_id, google_drive_url } = body;
      if (!vehicle_id || !naam || !google_drive_file_id) {
        return new Response(JSON.stringify({ error: "vehicle_id, naam, and google_drive_file_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { error } = await supabase.from("vehicle_documents").insert({
        vehicle_id,
        naam,
        type: type || "Overig",
        file_path: file_path || `drive://${google_drive_file_id}`,
        google_drive_file_id,
        google_drive_url: google_drive_url || `https://drive.google.com/file/d/${google_drive_file_id}`,
        synced_from_drive: true,
      });
      if (error) throw error;

    } else {
      return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

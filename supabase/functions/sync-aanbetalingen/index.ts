// Polls Moneybird every 15 min for outstanding aanbetaling invoices
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MB_BASE = "https://moneybird.com/api/v2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const token = Deno.env.get("MONEYBIRD_API_TOKEN");
    const adminId = Deno.env.get("MONEYBIRD_ADMINISTRATION_ID");
    if (!token || !adminId) throw new Error("Moneybird credentials missing");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: open, error } = await supabase
      .from("aanbetalingen")
      .select("id, vehicle_id, moneybird_invoice_id, aanbetalingsbedrag, voertuig_merk, voertuig_model, voertuig_kenteken, klant_voornaam")
      .eq("status", "open")
      .not("moneybird_invoice_id", "is", null);
    if (error) throw error;

    const updates: any[] = [];
    for (const a of (open || [])) {
      try {
        const r = await fetch(`${MB_BASE}/${adminId}/sales_invoices/${a.moneybird_invoice_id}.json`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) continue;
        const inv = await r.json();
        if (inv.state === "paid") {
          await supabase.from("aanbetalingen")
            .update({ status: "betaald", betaald_op: new Date().toISOString() })
            .eq("id", a.id);

          // In-app notification for all admins
          const { data: admins } = await supabase
            .from("user_roles").select("user_id").eq("role", "admin");
          for (const u of (admins || [])) {
            await supabase.from("notifications").insert({
              user_id: u.user_id,
              type: "aanbetaling_ontvangen",
              title: `Aanbetaling van €${Number(a.aanbetalingsbedrag).toFixed(0)} ontvangen voor ${a.voertuig_merk || ""} ${a.voertuig_model || ""} ${a.voertuig_kenteken || ""}`.trim(),
              vehicle_id: a.vehicle_id,
              link: `/admin/voertuigen/${a.vehicle_id}`,
            });
          }
          updates.push(a.id);
        }
      } catch (e) {
        console.error("sync failed for", a.id, e);
      }
    }

    return new Response(JSON.stringify({ checked: open?.length || 0, paid: updates.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

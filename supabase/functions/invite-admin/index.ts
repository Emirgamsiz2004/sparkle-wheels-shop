import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "email required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const redirectTo = "https://www.platinautomotive.nl/admin/login";

    let userId: string | undefined;
    const { data: invData, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (invErr) {
      // user already exists -> send recovery (password reset) link via email
      const { error: recErr } = await admin.auth.resetPasswordForEmail(email, { redirectTo });
      if (recErr) throw recErr;
      const { data: list } = await admin.auth.admin.listUsers();
      userId = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
    } else {
      userId = invData.user?.id;
    }

    if (userId) {
      await admin.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    }

    return new Response(JSON.stringify({ ok: true, user_id: userId, mode: invErr ? "recovery" : "invite" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

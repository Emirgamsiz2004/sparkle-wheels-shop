import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Require an admin caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const jwt = authHeader.slice("Bearer ".length);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: claimsData, error: claimsErr } = await admin.auth.getClaims(jwt);
    if (claimsErr || !claimsData?.claims?.sub) {
      return json({ error: "Unauthorized" }, 401);
    }
    const callerId = claimsData.claims.sub as string;

    const { data: roleRow, error: roleErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr || !roleRow) {
      return json({ error: "Forbidden" }, 403);
    }

    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return json({ error: "email required" }, 400);
    }

    const redirectTo = "https://www.platinautomotive.nl/admin/login";

    let userId: string | undefined;
    const { data: invData, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (invErr) {
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

    return json({ ok: true, user_id: userId, mode: invErr ? "recovery" : "invite" });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

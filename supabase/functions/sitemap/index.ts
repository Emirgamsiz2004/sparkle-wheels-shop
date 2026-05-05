import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE = "https://platinautomotive.nl";

const STATIC_URLS: { loc: string; changefreq: string; priority: string }[] = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/voorraad", changefreq: "daily", priority: "0.9" },
  { loc: "/consignatie", changefreq: "monthly", priority: "0.8" },
  { loc: "/diensten/in-en-verkoop", changefreq: "monthly", priority: "0.9" },
  { loc: "/diensten/onderhoud-reparatie", changefreq: "monthly", priority: "0.8" },
  { loc: "/diensten/auto-detailing", changefreq: "monthly", priority: "0.8" },
  { loc: "/diensten/auto-customizing", changefreq: "monthly", priority: "0.7" },
  { loc: "/diensten/auto-zoeken", changefreq: "monthly", priority: "0.7" },
  { loc: "/over-ons", changefreq: "monthly", priority: "0.6" },
  { loc: "/contact", changefreq: "monthly", priority: "0.7" },
  { loc: "/garantie", changefreq: "monthly", priority: "0.6" },
  { loc: "/blog", changefreq: "weekly", priority: "0.7" },
  { loc: "/privacybeleid", changefreq: "yearly", priority: "0.3" },
  { loc: "/cookiebeleid", changefreq: "yearly", priority: "0.3" },
  { loc: "/algemene-voorwaarden", changefreq: "yearly", priority: "0.3" },
  { loc: "/occasions-leiden", changefreq: "weekly", priority: "0.6" },
  { loc: "/occasions-alphen-aan-den-rijn", changefreq: "weekly", priority: "0.6" },
  { loc: "/occasions-zoetermeer", changefreq: "weekly", priority: "0.6" },
  { loc: "/occasions-den-haag", changefreq: "weekly", priority: "0.6" },
];

function xmlEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Blog posts
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, created_at")
      .eq("published", true);

    // Vehicles still on sale (use feed_id as URL id matches /voorraad/:id)
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("feed_id, updated_at, status")
      .in("status", ["te_koop", "gereserveerd", "consignatie"])
      .not("feed_id", "is", null);

    const urls: string[] = [];

    for (const u of STATIC_URLS) {
      urls.push(
        `<url><loc>${BASE}${u.loc}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
      );
    }

    for (const p of posts || []) {
      const lastmod = p.created_at ? new Date(p.created_at).toISOString().split("T")[0] : "";
      urls.push(
        `<url><loc>${BASE}/blog/${xmlEscape(p.slug)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>monthly</changefreq><priority>0.6</priority></url>`
      );
    }

    for (const v of vehicles || []) {
      if (!v.feed_id) continue;
      const lastmod = v.updated_at ? new Date(v.updated_at).toISOString().split("T")[0] : "";
      urls.push(
        `<url><loc>${BASE}/voorraad/${xmlEscape(v.feed_id)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>weekly</changefreq><priority>0.7</priority></url>`
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    return new Response(`Error: ${(e as Error).message}`, { status: 500, headers: corsHeaders });
  }
});

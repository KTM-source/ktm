import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: games, error } = await supabase
      .from("games")
      .select("slug, updated_at, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const baseUrl = "https://ktm.lovable.app";
    
    const staticPages = [
      { loc: "", priority: "1.0", changefreq: "daily" },
      { loc: "/games", priority: "0.9", changefreq: "daily" },
      { loc: "/categories", priority: "0.8", changefreq: "weekly" },
      { loc: "/top-games", priority: "0.8", changefreq: "daily" },
      { loc: "/recent", priority: "0.9", changefreq: "daily" },
      { loc: "/faq", priority: "0.5", changefreq: "monthly" },
      { loc: "/how-to-download", priority: "0.5", changefreq: "monthly" },
      { loc: "/contact", priority: "0.4", changefreq: "monthly" },
      { loc: "/report-issue", priority: "0.4", changefreq: "monthly" },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static pages
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <priority>${page.priority}</priority>
    <changefreq>${page.changefreq}</changefreq>
  </url>
`;
    }

    // Add game pages
    if (games) {
      for (const game of games) {
        const lastmod = game.updated_at || game.created_at;
        xml += `  <url>
    <loc>${baseUrl}/${game.slug}</loc>
    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>
    <priority>0.8</priority>
    <changefreq>weekly</changefreq>
  </url>
`;
      }
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return new Response("Error generating sitemap", { status: 500 });
  }
});

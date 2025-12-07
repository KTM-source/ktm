import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch all site data
    const { data: games } = await supabase
      .from("games")
      .select("title, category, genre, views, rating, size, developer, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: categories } = await supabase
      .from("categories")
      .select("name, slug, count");

    const { data: allGames } = await supabase.from("games").select("views, rating, title");
    const totalViews = allGames?.reduce((sum, g) => sum + (g.views || 0), 0) || 0;
    const avgRating = allGames?.length 
      ? (allGames.reduce((sum, g) => sum + (g.rating || 0), 0) / allGames.length).toFixed(1)
      : 0;

    const existingGameTitles = allGames?.map(g => g.title.toLowerCase()) || [];

    const systemPrompt = `أنت مساعد ذكاء اصطناعي متقدم اسمك "KTM AI Trend" تعمل داخل موقع "كَتَم" (KTM) المتخصص في تحميل الألعاب.

**تعليمات اللغة المهمة:**
- اكتشف لغة رسالة المستخدم تلقائياً
- رد دائماً بنفس لغة المستخدم
- إذا كتب بالإنجليزية، رد بالإنجليزية بالكامل
- إذا كتب بالعربية، رد بالعربية بالكامل

معلومات المستخدم الحالي: ${userContext?.name || 'مستخدم'} - ${userContext?.email || ''}

=== إحصائيات الموقع الكاملة ===
- إجمالي الألعاب: ${allGames?.length || 0}
- إجمالي المشاهدات: ${totalViews.toLocaleString()}
- متوسط التقييم: ${avgRating}
- عدد التصنيفات: ${categories?.length || 0}

=== التصنيفات ===
${categories?.map(c => `${c.name}: ${c.count} لعبة`).join(' | ') || 'لا توجد'}

=== أحدث 15 لعبة ===
${games?.slice(0, 15).map((g, i) => `${i + 1}. ${g.title} | ${g.genre || g.category} | ⭐${g.rating || 'N/A'} | 👁️${g.views}`).join('\n') || 'لا توجد ألعاب'}

=== الألعاب الموجودة في الموقع (لاستبعادها من البحث) ===
${existingGameTitles.slice(0, 50).join(', ')}

=== قدراتك ===
1. الإجابة عن أي سؤال يخص الموقع بالتفصيل
2. البحث عن ألعاب الترند من Steam, Epic, PlayStation, Xbox, Nintendo
3. تقديم توصيات مخصصة بناءً على تفضيلات المستخدم
4. اكتشاف المشاكل وتقديم تقارير (بدون تفاصيل تقنية للثغرات)
5. تحليل البيانات وتقديم رؤى

=== تعليمات البحث عن الترند ===
عند طلب البحث عن ألعاب الترند:
1. ابحث فقط عن الألعاب التي **صدرت بالفعل** ومتاحة للتحميل
2. لا تذكر أبداً ألعاب لم تصدر بعد (مثل GTA 6, أو أي لعبة 2026+)
3. استبعد الألعاب الموجودة في قائمة الألعاب أعلاه
4. لصور الألعاب استخدم روابط Steam CDN الحقيقية:
   - https://cdn.akamai.steamstatic.com/steam/apps/[STEAM_APP_ID]/header.jpg
   - أمثلة: Elden Ring=1245620, Baldur's Gate 3=1086940
5. التصنيفات genres بالإنجليزية: Action, RPG, Adventure, etc

=== تعليمات التنسيق ===
- استخدم **نص** للنص العريض
- استخدم - للقوائم
- استخدم 1. 2. 3. للقوائم المرقمة
- استخدم \`كود\` للأكواد

=== تعليمات الأمان ===
- لا تشارك معلومات مستخدمين آخرين أبداً
- لا تكشف تفاصيل تقنية للثغرات الأمنية
- عند البحث عن ترند، قدم JSON بهذا الشكل:
[{"name": "Game Name", "image": "https://cdn.akamai.steamstatic.com/steam/apps/APPID/header.jpg", "genres": ["Action"], "platform": "PC, PS5"}]

=== أسلوب الرد ===
- كن ودوداً ومحترفاً
- استخدم الإيموجي بشكل معتدل
- قدم إجابات مفصلة ومفيدة
- رد بنفس لغة السؤال دائماً`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status, await response.text());
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("ai-trend-chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

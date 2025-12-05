import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Challenge types that can be auto-verified
const CHALLENGE_TYPES = {
  COMMENT: "comment", // Write a specific comment
  RATE_GAMES: "rate_games", // Rate X games
  ADD_FAVORITES: "add_favorites", // Add X games to favorites
  VIEW_GAMES: "view_games", // View X games
  AVATAR_CHANGE: "avatar_change", // Change avatar to something specific
  SEND_MESSAGE: "send_message", // Send a contact message
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { userId, batchMode } = await req.json();

    // Calculate expiry time (next 3 AM UTC)
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setUTCHours(3, 0, 0, 0);
    if (expiresAt <= now) {
      expiresAt.setDate(expiresAt.getDate() + 1);
    }

    // Get users to process
    let usersToProcess: string[] = [];
    
    if (batchMode) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id");
      
      if (profiles) {
        usersToProcess = profiles.map(p => p.user_id);
      }
    } else if (userId) {
      usersToProcess = [userId];
    }

    if (usersToProcess.length === 0) {
      return new Response(JSON.stringify({ message: "No users to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get games for reference
    const { data: games } = await supabase
      .from("games")
      .select("id, title, slug")
      .limit(50);

    const gamesList = games?.map(g => g.title).join("، ") || "";

    // Process in batches of 50
    const batchSize = 50;
    const results: any[] = [];

    for (let i = 0; i < usersToProcess.length; i += batchSize) {
      const batch = usersToProcess.slice(i, i + batchSize);
      
      // Get existing challenge hashes for these users
      const { data: existingChallenges } = await supabase
        .from("user_challenges")
        .select("user_id, challenge_hash")
        .in("user_id", batch);

      const existingHashesByUser: Record<string, Set<string>> = {};
      existingChallenges?.forEach(c => {
        if (!existingHashesByUser[c.user_id]) {
          existingHashesByUser[c.user_id] = new Set();
        }
        existingHashesByUser[c.user_id].add(c.challenge_hash);
      });

      // Generate auto-verifiable challenges using AI
      const prompt = `أنت مولد تحديات لموقع ألعاب. أنشئ ${batch.length * 3} تحدي قابل للتحقق التلقائي.

أنواع التحديات المتاحة (يجب استخدام هذه الأنواع فقط):

1. "comment" - كتابة تعليق بمحتوى محدد وغريب
   - مثال: اكتب تعليق يقول "أنا بطاطس محشية 🥔"
   - مثال: اكتب تعليق يحتوي على 3 إيموجي حيوانات متتالية

2. "rate_games" - تقييم عدد معين من الألعاب
   - مثال: قيّم 3 ألعاب بـ 5 نجوم
   - مثال: قيّم لعبتين مختلفتين اليوم

3. "add_favorites" - إضافة ألعاب للمفضلة
   - مثال: أضف 4 ألعاب جديدة لقائمة المفضلة
   - مثال: أضف لعبة من فئة Action للمفضلة

4. "view_games" - مشاهدة صفحات ألعاب
   - مثال: شاهد 5 صفحات ألعاب مختلفة
   - مثال: استكشف 3 ألعاب من فئة Adventure

5. "avatar_change" - تغيير صورة الملف الشخصي
   - مثال: غيّر صورتك لصورة قطة ترتدي نظارة شمسية
   - مثال: غيّر الأفتار لصورة بطريق يأكل بيتزا
   - مثال: حط صورة دب يلعب كرة قدم

6. "send_message" - إرسال رسالة للدعم
   - مثال: أرسل رسالة شكر للفريق
   - مثال: اقترح لعبة جديدة عبر نموذج التواصل

قواعد مهمة:
- كل تحدي يجب أن يكون فريد وغير مكرر
- تحديات التعليقات يجب أن تكون غريبة ومضحكة جداً
- تحديات الأفتار يجب أن تكون وصف دقيق لصورة غريبة وواضحة
- ضمّن الـ verification_data وهو البيانات المطلوبة للتحقق

أرجع JSON array فقط بهذا الشكل:
[
  {
    "text": "نص التحدي الظاهر للمستخدم",
    "description": "وصف قصير",
    "type": "comment|rate_games|add_favorites|view_games|avatar_change|send_message",
    "verification_data": {
      "required_text": "النص المطلوب للتعليق (فقط لـ comment)",
      "required_count": 3,
      "avatar_description": "وصف الصورة المطلوبة (فقط لـ avatar_change)"
    }
  }
]

أنشئ ${batch.length * 3} تحدي متنوع وغريب.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "أنت مساعد يكتب تحديات ألعاب إبداعية وغريبة باللغة العربية. أرجع JSON فقط." },
            { role: "user", content: prompt }
          ],
        }),
      });

      if (!aiResponse.ok) {
        console.error("AI API error:", await aiResponse.text());
        continue;
      }

      const aiData = await aiResponse.json();
      let challengesText = aiData.choices?.[0]?.message?.content || "[]";
      
      // Extract JSON from response
      const jsonMatch = challengesText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error("No JSON found in AI response");
        continue;
      }

      let challenges: any[];
      try {
        challenges = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("Failed to parse challenges:", e);
        continue;
      }

      // Assign 3 unique challenges to each user
      let challengeIndex = 0;
      for (const currentUserId of batch) {
        const userExistingHashes = existingHashesByUser[currentUserId] || new Set();
        const userChallenges: any[] = [];

        while (userChallenges.length < 3 && challengeIndex < challenges.length) {
          const challenge = challenges[challengeIndex];
          const hash = btoa(encodeURIComponent(challenge.text + Date.now())).slice(0, 32);
          
          // Ensure no duplicates
          if (!userExistingHashes.has(hash)) {
            userChallenges.push({
              user_id: currentUserId,
              challenge_text: challenge.text,
              challenge_description: JSON.stringify({
                description: challenge.description,
                type: challenge.type,
                verification_data: challenge.verification_data
              }),
              challenge_type: challenge.type || "comment",
              challenge_hash: hash,
              expires_at: expiresAt.toISOString(),
            });
            userExistingHashes.add(hash);
          }
          challengeIndex++;
        }

        // Insert challenges
        if (userChallenges.length > 0) {
          const { error } = await supabase
            .from("user_challenges")
            .insert(userChallenges);

          if (error) {
            console.error("Error inserting challenges:", error);
          } else {
            results.push({ userId: currentUserId, challengesCreated: userChallenges.length });
          }
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: results.length,
      results 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating challenges:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

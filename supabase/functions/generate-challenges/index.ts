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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { userId, batchMode } = await req.json();

    // Calculate expiry time (next 3 AM)
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setHours(3, 0, 0, 0);
    if (expiresAt <= now) {
      expiresAt.setDate(expiresAt.getDate() + 1);
    }

    // If batch mode, get all users who need challenges
    let usersToProcess: string[] = [];
    
    if (batchMode) {
      // Get all users
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

    // Process in batches of 50
    const batchSize = 50;
    const results: any[] = [];

    for (let i = 0; i < usersToProcess.length; i += batchSize) {
      const batch = usersToProcess.slice(i, i + batchSize);
      
      // Get existing challenge hashes for these users to avoid duplicates
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

      // Get user profiles for personalization
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, first_name")
        .in("user_id", batch);

      const userProfiles: Record<string, any> = {};
      profiles?.forEach(p => {
        userProfiles[p.user_id] = p;
      });

      // Generate challenges using AI
      const prompt = `أنت مولد تحديات ألعاب إبداعي. اكتب ${batch.length * 3} تحدي فريد ومبتكر للاعبين.

قواعد التحديات:
- كل تحدي يجب أن يكون قابل للتحقق بسهولة
- التحديات يجب أن تكون ممتعة ومتنوعة
- بعض التحديات غريبة ومضحكة
- بعض التحديات متعلقة بالألعاب
- بعض التحديات اجتماعية (مشاركة، تعليق، تقييم)
- لا تكرر نفس التحدي أبداً

أمثلة على أنواع التحديات:
- "أضف 3 ألعاب جديدة للمفضلة اليوم"
- "قيّم 5 ألعاب مختلفة"
- "اكتب تعليق على لعبة لم تجربها من قبل"
- "شاهد صفحة 10 ألعاب مختلفة"
- "استخدم البحث للعثور على لعبة بحرف الميم"
- "أرسل رسالة للدعم الفني تشكرهم"
- "اقضِ 15 دقيقة في تصفح الموقع"
- "اكتشف قسم جديد لم تزره من قبل"
- "شارك لعبة مع صديق"
- "اقرأ متطلبات النظام لـ 3 ألعاب"

أرجع JSON array فقط بهذا الشكل (بدون أي نص إضافي):
[
  {"text": "نص التحدي", "description": "وصف قصير", "type": "gaming|social|exploration|creative"},
  ...
]

أنشئ ${batch.length * 3} تحدي مختلف تماماً.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "أنت مساعد يكتب تحديات ألعاب إبداعية باللغة العربية. أرجع JSON فقط." },
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
          const hash = btoa(encodeURIComponent(challenge.text)).slice(0, 32);
          
          // Check if this challenge was already given to this user
          if (!userExistingHashes.has(hash)) {
            userChallenges.push({
              user_id: currentUserId,
              challenge_text: challenge.text,
              challenge_description: challenge.description,
              challenge_type: challenge.type || "gaming",
              challenge_hash: hash,
              expires_at: expiresAt.toISOString(),
            });
            userExistingHashes.add(hash);
          }
          challengeIndex++;
        }

        // Insert challenges for this user
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

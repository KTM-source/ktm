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
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { userId, challengeId, action, actionData } = await req.json();

    console.log("Verifying challenge:", { userId, challengeId, action, actionData });

    if (!userId || !challengeId) {
      return new Response(JSON.stringify({ error: "Missing userId or challengeId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the challenge
    const { data: challenge, error: challengeError } = await supabase
      .from("user_challenges")
      .select("*")
      .eq("id", challengeId)
      .eq("user_id", userId)
      .single();

    if (challengeError || !challenge) {
      return new Response(JSON.stringify({ error: "Challenge not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (challenge.is_completed) {
      return new Response(JSON.stringify({ 
        verified: true, 
        message: "التحدي مكتمل مسبقاً" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse challenge description for verification data
    let verificationData: any = {};
    try {
      const desc = JSON.parse(challenge.challenge_description || "{}");
      verificationData = desc.verification_data || {};
    } catch (e) {
      console.log("No structured verification data");
    }

    let verified = false;
    let message = "";

    switch (challenge.challenge_type) {
      case "comment":
        // Check if user wrote the required comment
        if (action === "comment" && actionData?.content) {
          const requiredText = verificationData.required_text?.toLowerCase();
          const commentText = actionData.content.toLowerCase();
          
          if (requiredText && commentText.includes(requiredText)) {
            verified = true;
            message = "تم التحقق من التعليق بنجاح!";
          } else {
            // Check for partial match or similar content
            const similarity = calculateSimilarity(requiredText || "", commentText);
            if (similarity > 0.6) {
              verified = true;
              message = "تم قبول التعليق!";
            }
          }
        }
        break;

      case "rate_games":
        // Check user's rating count
        const requiredRatings = verificationData.required_count || 3;
        const { count: ratingCount } = await supabase
          .from("game_ratings")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        if ((ratingCount || 0) >= requiredRatings) {
          verified = true;
          message = `تم تقييم ${ratingCount} ألعاب!`;
        }
        break;

      case "add_favorites":
        // Check user's favorites count
        const requiredFavorites = verificationData.required_count || 3;
        const { count: favCount } = await supabase
          .from("user_favorites")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        if ((favCount || 0) >= requiredFavorites) {
          verified = true;
          message = `تم إضافة ${favCount} ألعاب للمفضلة!`;
        }
        break;

      case "view_games":
        // Check from user stats
        const { data: stats } = await supabase
          .from("user_stats")
          .select("games_viewed")
          .eq("user_id", userId)
          .single();

        const requiredViews = verificationData.required_count || 5;
        if ((stats?.games_viewed || 0) >= requiredViews) {
          verified = true;
          message = `تم مشاهدة ${stats?.games_viewed} لعبة!`;
        }
        break;

      case "avatar_change":
        // Use AI to verify avatar matches description
        if (action === "avatar_change" && actionData?.avatarUrl && LOVABLE_API_KEY) {
          const avatarDescription = verificationData.avatar_description || "";
          
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: `هل هذه الصورة تطابق الوصف التالي بنسبة 70% أو أكثر؟
الوصف المطلوب: "${avatarDescription}"

أجب بـ "نعم" أو "لا" فقط مع نسبة التطابق.`
                    },
                    {
                      type: "image_url",
                      image_url: { url: actionData.avatarUrl }
                    }
                  ]
                }
              ],
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const response = aiData.choices?.[0]?.message?.content?.toLowerCase() || "";
            
            if (response.includes("نعم") || response.includes("yes")) {
              verified = true;
              message = "تم التحقق من صورة الأفتار!";
            }
          }
        }
        break;

      case "send_message":
        // Check if user sent a contact message
        const { count: messageCount } = await supabase
          .from("contact_messages")
          .select("*", { count: "exact", head: true })
          .eq("email", actionData?.email);

        if ((messageCount || 0) > 0) {
          verified = true;
          message = "تم إرسال الرسالة بنجاح!";
        }
        break;
    }

    // Mark challenge as completed if verified
    if (verified) {
      await supabase
        .from("user_challenges")
        .update({ 
          is_completed: true, 
          completed_at: new Date().toISOString() 
        })
        .eq("id", challengeId);

      // Record completion
      await supabase
        .from("challenge_completions")
        .insert({
          user_id: userId,
          challenge_id: challengeId
        });

      // Check verification status
      await checkAndUpdateVerification(supabase, userId);
    }

    return new Response(JSON.stringify({ 
      verified, 
      message: message || (verified ? "تم إنجاز التحدي!" : "لم يتم التحقق بعد") 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error verifying challenge:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper function to calculate text similarity
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const set1 = new Set(str1.split(" "));
  const set2 = new Set(str2.split(" "));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

// Check and update user verification status
async function checkAndUpdateVerification(supabase: any, userId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count } = await supabase
    .from("challenge_completions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("completed_at", thirtyDaysAgo.toISOString());

  const isVerified = (count || 0) >= 30;
  
  if (isVerified) {
    const verifiedUntil = new Date();
    verifiedUntil.setDate(verifiedUntil.getDate() + 30);
    
    await supabase
      .from("profiles")
      .update({ 
        is_verified: true,
        verified_until: verifiedUntil.toISOString()
      })
      .eq("user_id", userId);
  }
}

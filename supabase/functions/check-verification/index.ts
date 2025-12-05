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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId } = await req.json();

    if (!userId) {
      throw new Error("userId is required");
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, is_verified, is_permanently_verified, verified_until")
      .eq("user_id", userId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ verified: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is "ktm" - permanent verification
    if (profile.username === "ktm" || profile.is_permanently_verified) {
      // Ensure permanent verification is set
      if (!profile.is_permanently_verified) {
        await supabase
          .from("profiles")
          .update({ is_verified: true, is_permanently_verified: true })
          .eq("user_id", userId);
      }
      return new Response(JSON.stringify({ 
        verified: true, 
        permanent: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate completions in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: completions, count } = await supabase
      .from("challenge_completions")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .gte("completed_at", thirtyDaysAgo.toISOString());

    const completionCount = count || 0;
    const isVerified = completionCount >= 30;

    // Update verification status
    const verifiedUntil = isVerified ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;

    await supabase
      .from("profiles")
      .update({ 
        is_verified: isVerified,
        verified_until: verifiedUntil?.toISOString() || null
      })
      .eq("user_id", userId);

    return new Response(JSON.stringify({ 
      verified: isVerified, 
      permanent: false,
      completions: completionCount,
      requiredForVerification: 30,
      verifiedUntil: verifiedUntil?.toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error checking verification:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

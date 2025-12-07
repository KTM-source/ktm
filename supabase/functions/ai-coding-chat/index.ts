import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, filesContext, currentFile } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // System prompt for coding AI - using GPT-5 for best code generation
    const systemPrompt = `أنت مساعد برمجة ذكي متخصص في كتابة الأكواد البرمجية باحترافية عالية.
أنت جزء من منصة KTM Coding - محرر أكواد ذكي.

## قدراتك:
- كتابة أكواد HTML, CSS, JavaScript كاملة واحترافية
- إنشاء صفحات ويب جميلة ومتجاوبة
- إضافة تأثيرات وأنيميشن
- كتابة أكواد نظيفة ومنظمة
- شرح الأكواد بالعربية

## تعليمات مهمة:
1. عند كتابة كود، استخدم الصيغة التالية:
   \`\`\`html:filename.html
   الكود هنا
   \`\`\`

2. يمكنك إنشاء ملفات متعددة:
   - \`\`\`html:index.html\`\`\` للصفحة الرئيسية
   - \`\`\`html:about.html\`\`\` لصفحة عن
   - \`\`\`css:style.css\`\`\` لملف CSS منفصل
   - \`\`\`javascript:script.js\`\`\` لملف JavaScript منفصل

3. اكتب أكواد كاملة وجاهزة للتشغيل
4. استخدم تصميمات حديثة وجميلة
5. أضف تعليقات توضيحية بالعربية
6. اجعل الصفحات متجاوبة مع جميع الأجهزة

## الملفات الحالية في المشروع:
${filesContext || "لا توجد ملفات بعد"}

## الملف النشط حالياً: ${currentFile || "index.html"}

رد دائماً بالعربية وكن مختصراً في الشرح. ركز على كتابة الكود.`;

    console.log("Sending request to AI gateway with coding prompt...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5", // Using GPT-5 for best code generation
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "يرجى إضافة رصيد لحساب Lovable AI" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "حدث خطأ في الاتصال بالذكاء الاصطناعي" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return streaming response
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in ai-coding-chat:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

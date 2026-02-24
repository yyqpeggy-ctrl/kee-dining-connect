import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, language } = await req.json();
    const isZh = language === "zh";

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: isZh ? "未收到语音内容" : "No voice content received" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are a restaurant ERP voice assistant. Your job is to analyze voice input (from phone calls, meetings, or direct commands) and extract actionable tasks.

For each task, determine:
1. "module": which ERP module it belongs to. Must be one of: procurement, inventory, orders, kitchen, hr, finance, delivery, marketing, stores, workflow, legal
2. "action": a short action keyword like "create_order", "restock", "schedule_shift", "approve", "create_campaign", etc.
3. "title_zh": task title in Chinese
4. "title_en": task title in English
5. "description_zh": detailed description in Chinese
6. "description_en": detailed description in English
7. "priority": "high", "medium", or "low"
8. "route": the frontend route to navigate to, e.g. "/procurement", "/inventory", "/orders", "/kitchen", "/hr", "/finance", "/delivery", "/marketing", "/stores", "/workflow", "/legal"

Also provide:
- "summary_zh": a brief Chinese summary of what was understood
- "summary_en": a brief English summary of what was understood
- "voice_command": if this is a navigation command (like "打开采购页面"), set this to the route path. Otherwise null.

Respond ONLY with valid JSON in this format:
{
  "summary_zh": "...",
  "summary_en": "...",
  "voice_command": null,
  "tasks": [
    {
      "module": "procurement",
      "action": "restock",
      "title_zh": "...",
      "title_en": "...",
      "description_zh": "...",
      "description_en": "...",
      "priority": "high",
      "route": "/procurement"
    }
  ]
}

If no actionable tasks are found, return empty tasks array with a summary explaining what was heard.`;

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Voice input: "${text}"` },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", response.status, errText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      result = {
        summary_zh: "AI 未能正确解析语音内容，请重试",
        summary_en: "AI failed to parse voice content, please retry",
        voice_command: null,
        tasks: [],
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Voice task error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { style, template, target_duration, video_names, instructions, language } = await req.json();
    const isZh = language === "zh";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a professional video subtitle writer for restaurant/bar marketing videos. Generate bilingual (Chinese + English) subtitles that match the video style and create emotional impact.

Rules:
- Generate subtitles that evenly cover the entire video duration
- Each subtitle should be concise (under 15 Chinese characters, under 10 English words)
- Subtitles should tell a story arc: opening hook → main content → call to action
- Match the tone to the video style
- Return ONLY a JSON array using the tool provided`;

    const userPrompt = `Generate bilingual subtitles for a ${target_duration}-second marketing video.

Video style: ${style || "energetic"}
Template: ${template || "short video"}
Source videos: ${video_names?.join(", ") || "restaurant/bar footage"}
${instructions ? `Extra instructions: ${instructions}` : ""}

Generate 5-8 subtitle segments that evenly cover the video. Each segment uses percentage-based timing (0-100) of the total duration.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "set_subtitles",
              description: "Set the bilingual subtitle segments for the video",
              parameters: {
                type: "object",
                properties: {
                  subtitles: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        startPct: { type: "number", description: "Start percentage (0-100)" },
                        endPct: { type: "number", description: "End percentage (0-100)" },
                        zh: { type: "string", description: "Chinese subtitle text" },
                        en: { type: "string", description: "English subtitle text" },
                      },
                      required: ["startPct", "endPct", "zh", "en"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["subtitles"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "set_subtitles" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits depleted, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call in AI response");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const subtitles = parsed.subtitles || [];

    console.log(`[ai-subtitle-generate] Generated ${subtitles.length} subtitle segments`);

    return new Response(JSON.stringify({ subtitles }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-subtitle-generate error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { videos, template, platform, instructions, language } = await req.json();

    const systemPrompt = language === "zh"
      ? `你是一位专业的社交媒体短视频剪辑顾问，专注于餐饮、酒吧行业的内容营销。
用户需要从两段长视频素材中提取精彩片段，合并剪辑为一段有营销冲击力的短视频。
请根据两段视频素材信息、剪辑模板和要求，生成专业的合并剪辑建议。
回复必须使用 suggest_edits 工具。`
      : `You are a professional social media video editing consultant specializing in F&B and bar industry content marketing.
The user needs to extract highlights from two long source videos and merge them into one impactful marketing short video.
Based on the two video materials, template, and instructions provided, generate professional merge editing suggestions.
You must use the suggest_edits tool to respond.`;

    const userPrompt = language === "zh"
      ? `两段视频素材：${JSON.stringify(videos)}
剪辑模板：${template}
目标平台：${platform}
用户要求：${instructions || "无特殊要求"}

请针对"从两段长视频合并为一段营销短视频"的场景生成：
1. 3-5条具体的合并剪辑建议（如何从两段素材中选取和交叉剪辑，每条包含建议内容和预期互动提升百分比）
2. 推荐的BGM风格和具体曲目（适合合并后的短视频节奏）
3. 推荐的标题和标签
4. 最佳发布时间建议`
      : `Two video materials: ${JSON.stringify(videos)}
Edit template: ${template}
Target platform: ${platform}
User instructions: ${instructions || "No special requirements"}

Generate suggestions for "merging two long videos into one marketing short":
1. 3-5 specific merge editing suggestions (how to select and cross-cut between the two sources, each with suggestion content and expected engagement boost percentage)
2. Recommended BGM style and specific tracks (fitting the merged short video rhythm)
3. Recommended titles and hashtags
4. Best posting time suggestions`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "suggest_edits",
                description: "Return structured video editing suggestions",
                parameters: {
                  type: "object",
                  properties: {
                    suggestions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          tip: { type: "string", description: "The editing suggestion with emoji prefix" },
                          impact: { type: "string", description: "Expected engagement boost, e.g. +25%" },
                          category: { type: "string", enum: ["opening", "bgm", "subtitle", "transition", "ending", "effect", "general"] },
                        },
                        required: ["tip", "impact", "category"],
                        additionalProperties: false,
                      },
                    },
                    recommended_bgm: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          artist: { type: "string" },
                          style: { type: "string" },
                          match_score: { type: "number", description: "Match score 0-100" },
                        },
                        required: ["name", "style", "match_score"],
                        additionalProperties: false,
                      },
                    },
                    recommended_titles: {
                      type: "array",
                      items: { type: "string" },
                      description: "3 recommended video titles",
                    },
                    recommended_tags: {
                      type: "array",
                      items: { type: "string" },
                      description: "5-8 recommended hashtags",
                    },
                    best_post_time: {
                      type: "object",
                      properties: {
                        day: { type: "string" },
                        time: { type: "string" },
                        reason: { type: "string" },
                      },
                      required: ["day", "time", "reason"],
                      additionalProperties: false,
                    },
                  },
                  required: ["suggestions", "recommended_bgm", "recommended_titles", "recommended_tags", "best_post_time"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "suggest_edits" } },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: language === "zh" ? "请求过于频繁，请稍后再试" : "Rate limited, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: language === "zh" ? "AI 额度不足，请充值" : "AI credits exhausted, please top up" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ error: "No structured response from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-video-suggest error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

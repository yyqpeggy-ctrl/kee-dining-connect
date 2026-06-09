import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";

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
    const authResult = await requireUser(req);
    if (authResult instanceof Response) return authResult;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { store_name, language } = await req.json();

    const systemPrompt = language === "zh"
      ? `你是一位专业的餐饮、酒吧行业社交媒体运营顾问。
请根据当前行业趋势、季节热点和门店特色，生成热门内容主题推荐。
回复必须使用 suggest_topics 工具。`
      : `You are a professional social media strategist for the F&B and bar industry.
Based on current industry trends, seasonal highlights and store characteristics, generate trending content topic recommendations.
You must use the suggest_topics tool to respond.`;

    const userPrompt = language === "zh"
      ? `门店名称：${store_name || "连锁酒吧品牌"}
当前日期：${new Date().toISOString().split("T")[0]}

请生成：
1. 5-8个热门内容主题（每个包含主题标题、引流指数0-100、趋势增长百分比、推荐平台、内容类型建议）
2. 8-12个推荐标签
3. 3-5条竞品热门内容分析（标题、预估浏览量、热度标识）
4. 3条关键洞察建议`
      : `Store name: ${store_name || "Bar & Restaurant Chain"}
Current date: ${new Date().toISOString().split("T")[0]}

Please generate:
1. 5-8 trending content topics (each with title, traffic score 0-100, trend growth %, recommended platform, content type suggestion)
2. 8-12 recommended hashtags
3. 3-5 competitor trending content analyses (title, estimated views, heat indicator)
4. 3 key insight recommendations`;

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
                name: "suggest_topics",
                description: "Return structured trending topic recommendations",
                parameters: {
                  type: "object",
                  properties: {
                    topics: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          topic: { type: "string", description: "Topic title with emoji prefix" },
                          score: { type: "number", description: "Traffic score 0-100" },
                          trend: { type: "string", description: "Trend growth e.g. +18%" },
                          platform: { type: "string", description: "Best platform for this topic" },
                          content_type: { type: "string", description: "Suggested content format e.g. short video, article, poster" },
                        },
                        required: ["topic", "score", "trend", "platform", "content_type"],
                        additionalProperties: false,
                      },
                    },
                    recommended_tags: {
                      type: "array",
                      items: { type: "string" },
                      description: "8-12 recommended hashtags",
                    },
                    competitor_trends: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string", description: "Trending content description" },
                          views: { type: "string", description: "Estimated views e.g. 50K+" },
                          icon: { type: "string", description: "Emoji indicator e.g. 🔥" },
                        },
                        required: ["title", "views", "icon"],
                        additionalProperties: false,
                      },
                    },
                    insights: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          text: { type: "string", description: "Key insight or recommendation" },
                          category: { type: "string", enum: ["timing", "content", "platform", "trend"] },
                        },
                        required: ["text", "category"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["topics", "recommended_tags", "competitor_trends", "insights"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "suggest_topics" } },
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
    console.error("ai-topic-suggest error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

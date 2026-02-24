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

    const { store_name, platforms, language } = await req.json();

    const systemPrompt = language === "zh"
      ? `你是一位专业的社交媒体发布策略顾问，专注于餐饮、酒吧行业的多平台运营。
请根据各平台的用户活跃规律、行业最佳实践和门店特色，生成本周的最佳发布排期。
回复必须使用 suggest_schedule 工具。`
      : `You are a professional social media publishing strategist specializing in multi-platform operations for the F&B and bar industry.
Based on platform user activity patterns, industry best practices and store characteristics, generate optimal publishing schedule for this week.
You must use the suggest_schedule tool to respond.`;

    const userPrompt = language === "zh"
      ? `门店名称：${store_name || "连锁酒吧品牌"}
运营平台：${(platforms || ["微信公众号", "小红书", "TikTok/抖音", "Instagram", "YouTube"]).join("、")}
当前日期：${new Date().toISOString().split("T")[0]}
当前星期：${["日", "一", "二", "三", "四", "五", "六"][new Date().getDay()]}

请生成：
1. 7-10条本周发布排期（每条包含：具体发布时间、平台、内容类型、内容主题建议、预估互动量级、状态）
2. 各平台最佳发布时间分析（包含平台名、最佳时间段、原因说明、预估互动提升）
3. 3个汇总统计指标（如：最佳发布时间、本周计划数、AI自动化率等）`
      : `Store name: ${store_name || "Bar & Restaurant Chain"}
Platforms: ${(platforms || ["WeChat", "Xiaohongshu", "TikTok", "Instagram", "YouTube"]).join(", ")}
Current date: ${new Date().toISOString().split("T")[0]}
Day of week: ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()]}

Please generate:
1. 7-10 publishing schedule entries for this week (each with: specific time, platform, content type, topic suggestion, estimated engagement, status)
2. Best posting time analysis per platform (platform name, best time slot, reason, estimated engagement boost)
3. 3 summary statistics (e.g., best posting time, weekly plan count, AI automation rate)`;

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
                name: "suggest_schedule",
                description: "Return structured publishing schedule recommendations",
                parameters: {
                  type: "object",
                  properties: {
                    schedule: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          time: { type: "string", description: "Publishing time e.g. Mon 12:00" },
                          platform: { type: "string", description: "Platform name" },
                          content_type: { type: "string", description: "Content format e.g. article, short video, poster" },
                          topic: { type: "string", description: "Suggested content topic" },
                          estimated_engagement: { type: "string", description: "Estimated engagement e.g. 500-1K" },
                          status: { type: "string", enum: ["ai_ready", "scheduled", "draft"], description: "Suggested status" },
                        },
                        required: ["time", "platform", "content_type", "topic", "estimated_engagement", "status"],
                        additionalProperties: false,
                      },
                    },
                    platform_analysis: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          platform: { type: "string" },
                          best_time: { type: "string", description: "Best posting time slot" },
                          reason: { type: "string", description: "Why this time works best" },
                          engagement_boost: { type: "string", description: "Expected engagement boost e.g. +35%" },
                        },
                        required: ["platform", "best_time", "reason", "engagement_boost"],
                        additionalProperties: false,
                      },
                    },
                    summary_stats: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          label: { type: "string", description: "Stat label" },
                          value: { type: "string", description: "Stat value" },
                          sub: { type: "string", description: "Supporting detail" },
                        },
                        required: ["label", "value", "sub"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["schedule", "platform_analysis", "summary_stats"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "suggest_schedule" } },
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
    console.error("ai-schedule-suggest error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

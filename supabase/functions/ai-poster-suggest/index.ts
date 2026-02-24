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

    const { template_id, template_name, template_desc, extra_instructions, language } = await req.json();

    const systemPrompt = language === "zh"
      ? `你是一位专业的餐饮行业营销文案策划专家，擅长为酒吧、餐厅设计营销海报的文案和创意方案。
请根据用户选择的海报模板和要求，生成专业的营销文案和设计建议。
回复必须使用 suggest_poster 工具。`
      : `You are a professional F&B industry marketing copywriter, specializing in creating marketing poster copy and creative concepts for bars and restaurants.
Based on the poster template and requirements provided, generate professional marketing copy and design suggestions.
You must use the suggest_poster tool to respond.`;

    const userPrompt = language === "zh"
      ? `海报模板类型：${template_name}
模板说明：${template_desc}
用户额外要求：${extra_instructions || "无特殊要求"}

请生成：
1. 3个不同风格的海报标题（主标题+副标题）
2. 每个标题对应的正文文案（50-100字）
3. 3-5条设计建议（配色、布局、字体、图片风格等）
4. 每个平台（微信、小红书、Instagram、抖音）的文案适配建议
5. 5-8个推荐标签/话题`
      : `Poster template: ${template_name}
Template description: ${template_desc}
Extra instructions: ${extra_instructions || "No special requirements"}

Please generate:
1. 3 poster headline variations (main title + subtitle)
2. Body copy for each (50-100 words)
3. 3-5 design suggestions (colors, layout, fonts, image style)
4. Copy adaptation for each platform (WeChat, Xiaohongshu, Instagram, TikTok)
5. 5-8 recommended hashtags`;

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
                name: "suggest_poster",
                description: "Return structured poster copy and design suggestions",
                parameters: {
                  type: "object",
                  properties: {
                    headlines: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          main_title: { type: "string", description: "Main headline" },
                          subtitle: { type: "string", description: "Subtitle" },
                          body_copy: { type: "string", description: "Body copy text 50-100 words" },
                          style: { type: "string", description: "Style description e.g. elegant, bold, playful" },
                        },
                        required: ["main_title", "subtitle", "body_copy", "style"],
                        additionalProperties: false,
                      },
                    },
                    design_tips: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          tip: { type: "string", description: "Design suggestion with emoji prefix" },
                          category: { type: "string", enum: ["color", "layout", "typography", "imagery", "general"] },
                        },
                        required: ["tip", "category"],
                        additionalProperties: false,
                      },
                    },
                    platform_adaptations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          platform: { type: "string" },
                          size: { type: "string", description: "Recommended image size e.g. 1080x1350" },
                          copy_tip: { type: "string", description: "Platform-specific copy advice" },
                        },
                        required: ["platform", "size", "copy_tip"],
                        additionalProperties: false,
                      },
                    },
                    recommended_tags: {
                      type: "array",
                      items: { type: "string" },
                      description: "5-8 recommended hashtags",
                    },
                    color_palette: {
                      type: "array",
                      items: { type: "string", description: "Hex color code" },
                      description: "3-5 recommended colors",
                    },
                  },
                  required: ["headlines", "design_tips", "platform_adaptations", "recommended_tags", "color_palette"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "suggest_poster" } },
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
    console.error("ai-poster-suggest error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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

    const { videos, template, platform, instructions, language, style } = await req.json();

    const styleDescriptions: Record<string, { zh: string; en: string }> = {
      energetic: { zh: "活力动感：快节奏剪辑、炫酷转场、强节奏BGM、卡点", en: "Energetic: Fast cuts, cool transitions, upbeat BGM, beat-synced" },
      elegant: { zh: "高端优雅：慢镜头、柔和过渡、轻爵士BGM、精致调色", en: "Elegant: Slow-mo, soft transitions, jazz BGM, refined color grading" },
      storytelling: { zh: "故事叙事：叙事结构、情感铺垫、旁白字幕、起承转合", en: "Storytelling: Narrative arc, emotional build, voiceover subs, story structure" },
      trendy: { zh: "潮流网感：热门BGM、卡点剪辑、社交平台爆款风格", en: "Trendy: Trending BGM, beat-synced cuts, viral social media style" },
      minimal: { zh: "简约清新：留白构图、自然色调、轻音乐、呼吸感", en: "Minimal: Clean composition, natural tones, light music, breathing room" },
      cinematic: { zh: "电影质感：宽幅画面、调色渲染、史诗感配乐、叙事张力", en: "Cinematic: Widescreen, color grading, epic soundtrack, narrative tension" },
      cyberpunk: { zh: "赛博朋克：霓虹色调、故障艺术转场、电子合成器BGM、未来感HUD叠加、高饱和青紫配色", en: "Cyberpunk: Neon palette, glitch art transitions, synth BGM, futuristic HUD overlays, high-saturation cyan-purple grading" },
      south_american: { zh: "南美肆意：热带色彩爆炸、狂欢节节奏剪辑、拉丁打击乐BGM、自由奔放手持运镜、阳光高光溢出", en: "South American: Tropical color explosion, carnival-rhythm editing, Latin percussion BGM, wild handheld camera, sun-drenched highlight blowout" },
      chill_groove: { zh: "放松动感：Lofi慵懒节奏、柔和胶片滤镜、慢推慢拉运镜、City Pop氛围BGM、温暖黄调", en: "Chill Groove: Lofi lazy beats, soft film grain filter, slow dolly movement, City Pop vibes BGM, warm amber tones" },
    };
    const styleDesc = styleDescriptions[style || "energetic"] || styleDescriptions["energetic"];

    const systemPrompt = language === "zh"
      ? `你是一位专业的社交媒体短视频剪辑顾问，专注于餐饮、酒吧行业的内容营销。
用户上传了两段长视频素材，需要AI自动提取精彩片段并合并为一段有营销冲击力的短视频。
用户选择的剪辑风格是：${styleDesc.zh}
你需要根据风格自动决定：片段选取策略、转场方式、BGM选曲、字幕样式、节奏把控等所有剪辑细节。
回复必须使用 suggest_edits 工具。`
      : `You are a professional social media video editing consultant specializing in F&B and bar industry content marketing.
The user uploaded two long source videos. AI must automatically extract highlights and merge into one impactful marketing short.
Selected editing style: ${styleDesc.en}
You must auto-decide: clip extraction strategy, transition types, BGM selection, subtitle style, pacing — all editing details based on this style.
You must use the suggest_edits tool to respond.`;

    const userPrompt = language === "zh"
      ? `两段视频素材：${JSON.stringify(videos)}
输出格式：${template}
目标平台：${platform}
剪辑风格：${styleDesc.zh}

请自动生成完整的AI剪辑方案：
1. 3-5条具体的片段提取与合并建议（从素材A和素材B分别提取哪些片段、如何交叉剪辑，每条包含预期互动提升百分比）
2. 根据风格推荐的BGM曲目（含匹配度评分）
3. 推荐的视频标题（3个）和标签
4. 最佳发布时间建议`
      : `Two source videos: ${JSON.stringify(videos)}
Output format: ${template}
Target platform: ${platform}
Editing style: ${styleDesc.en}

Auto-generate the complete AI editing plan:
1. 3-5 specific clip extraction & merge suggestions (which segments from Video A and B, how to cross-cut, each with expected engagement boost %)
2. BGM tracks recommended for this style (with match score)
3. 3 recommended video titles and hashtags
4. Best posting time suggestion`;

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

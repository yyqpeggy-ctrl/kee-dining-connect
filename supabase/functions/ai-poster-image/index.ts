import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { template_name, headline, subtitle, body_copy, style, color_palette, extra_instructions, language, reference_images } = await req.json();

    const isZh = language === "zh";

    const prompt = isZh
      ? `请为餐饮/酒吧行业生成一张营销海报视觉稿。
海报类型：${template_name}
主标题：${headline}
副标题：${subtitle}
正文摘要：${body_copy}
设计风格：${style}
推荐配色：${(color_palette || []).join(", ")}
额外要求：${extra_instructions || "无"}
${reference_images?.length ? "用户提供了参考图片（可能包含LOGO、品牌元素），请提取其中的品牌标识、配色风格融入海报设计。" : ""}

要求：
- 生成一张高质量的营销海报图片，1:1或9:16竖版
- 风格要专业、高端，适合社交媒体发布
- 文字要清晰可读
- 配色要和推荐配色一致
- 不要在图片中包含太多文字，保持简洁大气
- 如果有参考图中的LOGO，请将其融入设计`
      : `Generate a marketing poster visual for a bar/restaurant.
Poster type: ${template_name}
Main headline: ${headline}
Subtitle: ${subtitle}
Body summary: ${body_copy}
Design style: ${style}
Color palette: ${(color_palette || []).join(", ")}
Extra instructions: ${extra_instructions || "None"}
${reference_images?.length ? "User provided reference images (may contain logo, brand elements). Extract brand identity and color scheme to integrate into poster design." : ""}

Requirements:
- Generate a high-quality marketing poster image, portrait 9:16 or square 1:1
- Professional, premium style suitable for social media
- Text should be clear and readable
- Colors should match the recommended palette
- Keep text minimal and elegant
- If reference images contain a logo, integrate it into the design`;

    // Build message content with optional reference images
    const messageContent: any[] = [{ type: "text", text: prompt }];
    if (reference_images && reference_images.length > 0) {
      for (const imgUrl of reference_images) {
        if (imgUrl) {
          messageContent.push({
            type: "image_url",
            image_url: { url: imgUrl },
          });
        }
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: messageContent }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: isZh ? "请求过于频繁，请稍后再试" : "Rate limited, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: isZh ? "AI 额度不足，请充值" : "AI credits exhausted, please top up" }),
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
    const message = data.choices?.[0]?.message;
    const images = message?.images || [];
    const textContent = message?.content || "";

    console.log("AI response keys:", JSON.stringify(Object.keys(data)));
    console.log("Message keys:", message ? JSON.stringify(Object.keys(message)) : "no message");
    console.log("Images count:", images.length);

    // Also check for inline base64 images in content if images array is empty
    let imageUrl = "";
    if (images.length > 0) {
      imageUrl = images[0].image_url?.url || "";
    }

    // Check content array for image parts
    if (!imageUrl && Array.isArray(message?.content)) {
      const imgPart = message.content.find((p: any) => p.type === "image_url");
      if (imgPart) {
        imageUrl = imgPart.image_url?.url || "";
      }
    }

    if (!imageUrl) {
      console.error("No image in response. Full response:", JSON.stringify(data).substring(0, 500));
      return new Response(
        JSON.stringify({ error: isZh ? "AI 未能生成图片，请重试" : "AI failed to generate image, please retry" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        image_url: imageUrl,
        description: typeof textContent === "string" ? textContent : "",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-poster-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

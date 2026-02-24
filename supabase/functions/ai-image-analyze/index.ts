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
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { image_url, language } = await req.json();
    if (!image_url) throw new Error("image_url is required");

    const isZh = language === "zh";

    const prompt = isZh
      ? `请分析这张图片，识别以下内容并以JSON格式返回：

1. **LOGO识别**：图片中是否存在LOGO？如果有，描述LOGO的位置（左上/右上/中心/左下/右下等）、形状、文字内容
2. **品牌颜色**：提取图片中最突出的4-6个品牌色/主色调，返回HEX色值
3. **品牌名称**：如果能识别出品牌名称，请返回
4. **图片类型**：判断图片类型（LOGO图、产品图、品牌海报、照片、插画等）
5. **设计风格**：描述设计风格关键词（如现代简约、复古、高端、活泼等）

请严格按以下JSON格式返回，不要添加其他内容：`
      : `Analyze this image and return the following in JSON format:

1. **Logo Detection**: Is there a logo? If yes, describe position (top-left/top-right/center/bottom-left/bottom-right), shape, text content
2. **Brand Colors**: Extract the 4-6 most prominent brand/primary colors as HEX values
3. **Brand Name**: If identifiable, return the brand name
4. **Image Type**: Classify (logo, product photo, brand poster, photo, illustration, etc.)
5. **Design Style**: Describe style keywords (modern minimal, vintage, premium, playful, etc.)

Return strictly in this JSON format with no extra text:`;

    const jsonSchema = `{
  "has_logo": true/false,
  "logo_info": {
    "position": "center",
    "shape": "circular/rectangular/text-based/...",
    "text": "brand text if any"
  },
  "brand_colors": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "brand_name": "Name or null",
  "image_type": "logo/product/poster/photo/illustration",
  "design_style": ["keyword1", "keyword2"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt + "\n" + jsonSchema },
              { type: "image_url", image_url: { url: image_url } },
            ],
          },
        ],
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
          JSON.stringify({ error: isZh ? "AI 额度不足" : "AI credits exhausted" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    let analysis: any = null;
    try {
      // Try to find JSON in the response
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.error("Failed to parse AI response as JSON:", textContent);
    }

    if (!analysis) {
      return new Response(
        JSON.stringify({ error: isZh ? "AI 分析失败，请重试" : "AI analysis failed, please retry" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-image-analyze error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

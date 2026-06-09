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

    const { image_url, edit_instruction, language } = await req.json();

    if (!image_url) {
      return new Response(
        JSON.stringify({ error: language === "zh" ? "缺少原始图片" : "Missing source image" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!edit_instruction) {
      return new Response(
        JSON.stringify({ error: language === "zh" ? "请输入编辑指令" : "Please provide edit instructions" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isZh = language === "zh";

    const prompt = isZh
      ? `请根据以下指令修改这张营销海报图片：
${edit_instruction}

要求：
- 保持海报的专业品质和营销效果
- 修改后的图片应保持清晰可读
- 保持原有的整体构图和比例`
      : `Please modify this marketing poster image based on the following instructions:
${edit_instruction}

Requirements:
- Maintain professional quality and marketing effectiveness
- Modified image should remain clear and readable
- Keep the overall composition and proportions`;

    const maxAttempts = 5;
    let lastError = "";
    let resultImage = "";
    let resultText = "";

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Edit attempt ${attempt}/${maxAttempts}`);
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: image_url } },
              ],
            },
          ],
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
        console.error(`Attempt ${attempt} gateway error:`, response.status, errText);
        lastError = errText;
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 1500 * attempt));
          continue;
        }
        break;
      }

      const data = await response.json();
      const message = data.choices?.[0]?.message;
      const images = message?.images || [];
      const textContent = typeof message?.content === "string" ? message.content : "";

      console.log(`Attempt ${attempt} - images: ${images.length}`);

      if (images.length > 0 && images[0]?.image_url?.url) {
        resultImage = images[0].image_url.url;
        resultText = textContent;
        break;
      }

      // Try to extract base64 from content as fallback
      if (typeof message?.content === "string") {
        const match = message.content.match(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/);
        if (match) {
          resultImage = match[0];
          resultText = textContent;
          break;
        }
      }

      console.warn(`Attempt ${attempt} returned no image, retrying...`);
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }

    if (!resultImage) {
      return new Response(
        JSON.stringify({ error: isZh ? "AI 未能编辑图片，请重试" : "AI failed to edit image, please retry", details: lastError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ image_url: resultImage, description: resultText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    console.error("ai-poster-edit error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

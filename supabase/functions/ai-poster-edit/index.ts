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

    // Direct, imperative prompt - the image-gen model needs an unambiguous "output an image" instruction
    const prompt = isZh
      ? `编辑这张图片并输出新的图片（必须返回图片，不要只用文字回复）。
编辑指令：${edit_instruction}
保持原有海报的整体构图、比例和专业营销品质。`
      : `Edit this image and output the new image (you MUST return an image, do not reply with text only).
Edit instruction: ${edit_instruction}
Preserve the original poster's composition, proportions and professional marketing quality.`;

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
      let textContent = "";

      if (typeof message?.content === "string") {
        textContent = message.content;
      } else if (Array.isArray(message?.content)) {
        for (const part of message.content) {
          if (part?.type === "image_url" && part?.image_url?.url) {
            resultImage = part.image_url.url;
            break;
          }
          if (typeof part === "string" && part.startsWith("data:image")) {
            resultImage = part;
            break;
          }
        }
        textContent = message.content
          .filter((part: any) => typeof part === "string" || part?.type === "text")
          .map((part: any) => (typeof part === "string" ? part : part?.text || ""))
          .join("");
      }

      console.log(`Attempt ${attempt} - images: ${images.length}, text: ${textContent.slice(0, 200)}`);

      if (resultImage) {
        resultText = textContent;
        break;
      }

      if (images.length > 0 && (images[0]?.image_url?.url || images[0]?.url)) {
        resultImage = images[0]?.image_url?.url || images[0]?.url;
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

      lastError = textContent || "No image returned";
      console.warn(`Attempt ${attempt} returned no image. Model text: ${textContent.slice(0, 300)}`);
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }

    if (!resultImage) {
      const detail = lastError ? ` (${lastError.slice(0, 200)})` : "";
      return new Response(
        JSON.stringify({ error: (isZh ? "AI 未能编辑图片，请换个指令重试" : "AI failed to edit image, try a different instruction") + detail, details: lastError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ image_url: resultImage, description: resultText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-poster-edit error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

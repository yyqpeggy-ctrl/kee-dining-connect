import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { image_base64, file_type } = await req.json();
    if (!image_base64) throw new Error("No image data provided");

    const mimeType = file_type === "pdf" ? "application/pdf" : `image/${file_type || "jpeg"}`;

    const systemPrompt = `你是一个专业的中国增值税发票OCR识别系统。请仔细分析这张发票图片，提取以下信息并以JSON格式返回：

{
  "invoice_number": "发票号码（8位数字）",
  "invoice_code": "发票代码（10-12位数字）",
  "invoice_type": "发票类型: general(普通发票), special(专用发票), electronic(电子发票)",
  "type": "方向: output(销项/开出) 或 input(进项/收到)",
  "amount": 不含税金额(数字),
  "tax_rate": 税率(小数，如0.06表示6%),
  "tax_amount": 税额(数字),
  "total_with_tax": 价税合计(数字),
  "buyer_name": "购买方名称",
  "buyer_tax_id": "购买方纳税人识别号",
  "seller_name": "销售方名称",
  "seller_tax_id": "销售方纳税人识别号",
  "issue_date": "开票日期 YYYY-MM-DD",
  "items": [
    {
      "name": "货物或劳务名称",
      "quantity": 数量,
      "unit_price": 单价,
      "amount": 金额,
      "tax_rate": 税率(小数),
      "tax_amount": 税额
    }
  ],
  "notes": "备注内容",
  "machine_number": "机器编号",
  "check_code": "校验码",
  "confidence": 识别置信度(0-100)
}

重点注意：
- 发票号码和代码是最关键的识别项
- 金额数字要精确，注意区分小数点和千分位
- 税率要转换为小数（如6%写为0.06）
- 如果是增值税专用发票，invoice_type设为"special"
- 如果是电子发票，invoice_type设为"electronic"
- 如果某些字段无法识别，设为null
- 默认type为"input"（进项），除非明确是自己开出的发票

请只返回JSON，不要其他文字。`;

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
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${image_base64}` } },
              { type: "text", text: "请识别这张发票，提取所有关键信息。" },
            ],
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI服务请求频率限制，请稍后再试" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI服务额度不足，请充值" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    let ocrData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      ocrData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      ocrData = { raw_text: content, parse_error: true };
    }

    return new Response(JSON.stringify({ ocr: ocrData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Invoice OCR error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

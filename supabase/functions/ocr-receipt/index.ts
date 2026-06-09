import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authResult = await requireUser(req);
    if (authResult instanceof Response) return authResult;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { image_base64, file_type, order_data } = await req.json();

    if (!image_base64) throw new Error("No image data provided");

    const mimeType = file_type === "pdf" ? "application/pdf" : "image/jpeg";

    const systemPrompt = `你是一个专业的收货单据OCR识别系统。请仔细分析这张收货单据/发票图片，提取以下信息并以JSON格式返回：

1. items: 商品明细数组，每个包含 name(品名), quantity(数量), unit_price(单价), amount(金额), unit(单位)
2. total: 合计金额(数字)
3. date: 单据日期(YYYY-MM-DD格式)
4. supplier: 供应商/卖方名称
5. receipt_number: 单据编号
6. signature_detected: 是否检测到收货人签字(true/false)
7. signature_confidence: 签字检测置信度(0-100)
8. signature_location: 签字位置描述
9. signature_notes: 签字相关备注（如"签字清晰"、"签字模糊"、"未发现签字区域"等）
10. additional_notes: 其他重要信息

重点注意：
- 收货人签字是最关键的验证项，必须仔细检查
- 如果没有发现签字，signature_detected设为false，并在signature_notes中说明
- 金额数字要精确，注意区分小数点
- 如果某些字段无法识别，设为null而不是猜测

请只返回JSON，不要其他文字。`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${image_base64}` },
          },
          {
            type: "text",
            text: order_data
              ? `请识别这张收货单据。对应的采购订单信息：订单号${order_data.order_number}，供应商${order_data.supplier_name}，订单金额¥${order_data.total_amount}。请特别注意核对金额和品名是否一致。`
              : "请识别这张收货单据，提取所有关键信息。",
          },
        ],
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI服务请求频率限制，请稍后再试" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI服务额度不足，请充值" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response
    let ocrData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      ocrData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      ocrData = { raw_text: content, parse_error: true };
    }

    // If order_data provided, do matching
    let matchResult = null;
    if (order_data && ocrData && !ocrData.parse_error) {
      const totalMatch = ocrData.total != null && Math.abs(ocrData.total - order_data.total_amount) < 0.01;
      const supplierMatch = ocrData.supplier && order_data.supplier_name &&
        (ocrData.supplier.includes(order_data.supplier_name) || order_data.supplier_name.includes(ocrData.supplier));

      matchResult = {
        total_match: totalMatch,
        supplier_match: supplierMatch,
        total_diff: ocrData.total != null ? ocrData.total - order_data.total_amount : null,
        signature_ok: ocrData.signature_detected === true,
        overall_pass: totalMatch && ocrData.signature_detected === true,
      };
    }

    return new Response(JSON.stringify({ ocr: ocrData, match: matchResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("OCR error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

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

    const { image_base64, file_type } = await req.json();
    if (!image_base64) throw new Error("No image data provided");

    const mimeType = file_type === "pdf" ? "application/pdf" : "image/jpeg";

    const systemPrompt = `你是一个专业的合同文件OCR识别系统。请仔细分析这份合同/协议文件，重点提取以下关键商业信息并以JSON格式返回：

{
  "contract_number": "合同编号",
  "title": "合同标题/名称",
  "supplier_name": "供应商/卖方/乙方名称",
  "start_date": "合同开始日期 YYYY-MM-DD",
  "end_date": "合同结束/到期日期 YYYY-MM-DD",
  "payment_terms": "付款条件描述（如月结30天、货到付款等）",
  
  "bank_info": {
    "bank_name": "开户银行全称",
    "bank_branch": "支行名称",
    "bank_account": "银行账号",
    "account_name": "账户名称"
  },
  
  "invoice_info": {
    "tax_id": "纳税人识别号/统一社会信用代码",
    "invoice_type": "发票类型(general=普通发票, vat_special=增值税专用发票)",
    "invoice_address": "开票地址",
    "invoice_phone": "开票电话",
    "invoice_bank_name": "开票开户行",
    "invoice_bank_account": "开票银行账号"
  },
  
  "contact_person": "联系人姓名",
  "phone": "联系电话",
  "email": "电子邮箱",
  "address": "公司地址",
  "currency": "币种(CNY/USD等)",
  "additional_terms": "其他重要条款摘要"
}

重点注意：
- 银行账户信息是最关键的提取项，用于付款管理
- 开票信息（纳税人识别号、开票地址等）同样重要，用于发票核对
- 如果某些字段无法识别，设为空字符串""而不是猜测
- 注意区分供应商自己的银行账户和开票信息中的银行账户，二者可能不同
- 合同编号通常在合同首页顶部

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
            text: "请识别这份合同文件，提取供应商银行账户信息、开票信息、合同条款等关键商业信息。",
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
    console.error("Contract OCR error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

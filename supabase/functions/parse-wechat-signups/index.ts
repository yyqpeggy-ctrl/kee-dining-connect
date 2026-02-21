import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { chatText, existingPhones } = await req.json();
    if (!chatText || typeof chatText !== "string") {
      return new Response(JSON.stringify({ error: "chatText is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `你是一个专业的活动报名信息提取助手。你的任务是从微信群聊天记录中智能识别报名信息。

请严格按照以下规则提取信息：

1. **识别报名意图**：寻找表示要参加活动的消息，如"我报名"、"我来"、"+1"、"算我一个"、"count me in"、"sign me up"等
2. **提取个人信息**：
   - 姓名：发送者的名字或群昵称
   - 手机号：11位中国手机号（1开头）
   - 微信号：如果提到的话
   - 邮箱：如果提到的话
3. **判断是否新客户**：如果消息中提到"第一次来"、"新人"、"first time"等，标记为新客户
4. **意图分析**：对每条消息判断意图类型：
   - "signup": 明确报名
   - "inquiry": 询问活动信息但未报名
   - "cancel": 取消报名
   - "proxy": 帮别人报名
5. **去重判断**：以下手机号已在系统中存在，请标记为重复：${(existingPhones || []).join(", ")}

请使用 suggest_signups 工具返回结果。`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `请分析以下微信群聊天记录，提取所有报名信息：\n\n${chatText}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_signups",
              description: "Return extracted signup information from chat messages",
              parameters: {
                type: "object",
                properties: {
                  participants: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Person's name" },
                        phone: { type: "string", description: "Phone number (11 digits)" },
                        wechat: { type: "string", description: "WeChat ID if mentioned" },
                        email: { type: "string", description: "Email if mentioned" },
                        intent: { type: "string", enum: ["signup", "inquiry", "cancel", "proxy"], description: "Intent type" },
                        intentDetail: { type: "string", description: "Brief explanation of the intent in Chinese" },
                        isNewCustomer: { type: "boolean", description: "Whether this is a new customer" },
                        isDuplicate: { type: "boolean", description: "Whether phone exists in system" },
                        confidence: { type: "number", description: "Confidence score 0-1" },
                        originalMessage: { type: "string", description: "The original message that was parsed" },
                      },
                      required: ["name", "phone", "intent", "confidence"],
                      additionalProperties: false,
                    },
                  },
                  summary: {
                    type: "object",
                    properties: {
                      totalMessages: { type: "number" },
                      signupCount: { type: "number" },
                      inquiryCount: { type: "number" },
                      cancelCount: { type: "number" },
                      proxyCount: { type: "number" },
                      duplicateCount: { type: "number" },
                      newCustomerCount: { type: "number" },
                    },
                    required: ["totalMessages", "signupCount"],
                    additionalProperties: false,
                  },
                },
                required: ["participants", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_signups" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("parse-wechat-signups error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

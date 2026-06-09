import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await requireUser(req);
    if (authResult instanceof Response) return authResult;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { stocktakeData, inventoryItems } = await req.json();
    if (!stocktakeData || !Array.isArray(stocktakeData)) {
      return new Response(JSON.stringify({ error: "stocktakeData is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `你是一个专业的餐饮库存管理分析师，精通Cambridge会计准则。请对月末盘点差异数据进行智能分析。

分析维度：
1. **差异原因推断**：根据物料类型、差异方向和幅度推断可能原因（如：酒水蒸发损耗、配料称量误差、员工使用未记录、供应商短交、盗损等）
2. **趋势分析**：识别差异模式（如：某类物料持续盘亏、特定品类差异率偏高）
3. **财务影响**：估算差异对成本的影响
4. **改进建议**：提出具体的管理改进措施
5. **异常预警**：标记需要重点关注的异常项

请用 analyze_inventory 工具返回结构化分析结果。`;

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
          { role: "user", content: `以下是本月盘点对比数据：\n\n${JSON.stringify(stocktakeData, null, 2)}\n\n库存物料信息：\n${JSON.stringify((inventoryItems || []).map((i: any) => ({ name: i.name_zh, category: i.category_zh, unit: i.unit, pour_cost: i.pour_cost })), null, 2)}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_inventory",
              description: "Return structured inventory variance analysis",
              parameters: {
                type: "object",
                properties: {
                  overall_summary: {
                    type: "object",
                    properties: {
                      total_items: { type: "number" },
                      items_with_variance: { type: "number" },
                      total_loss_value_estimate: { type: "number", description: "Estimated total loss in CNY" },
                      risk_level: { type: "string", enum: ["low", "medium", "high"] },
                      summary_zh: { type: "string", description: "Overall summary in Chinese" },
                      summary_en: { type: "string", description: "Overall summary in English" },
                    },
                    required: ["total_items", "items_with_variance", "risk_level", "summary_zh"],
                    additionalProperties: false,
                  },
                  item_analyses: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        item_name: { type: "string" },
                        variance_direction: { type: "string", enum: ["loss", "gain", "match"] },
                        likely_cause: { type: "string", description: "Most likely cause in Chinese" },
                        risk_level: { type: "string", enum: ["low", "medium", "high"] },
                        recommendation: { type: "string", description: "Specific recommendation in Chinese" },
                      },
                      required: ["item_name", "variance_direction", "likely_cause", "risk_level"],
                      additionalProperties: false,
                    },
                  },
                  pattern_insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        pattern: { type: "string", description: "Identified pattern in Chinese" },
                        affected_items: { type: "array", items: { type: "string" } },
                        suggestion: { type: "string", description: "Action suggestion in Chinese" },
                      },
                      required: ["pattern", "suggestion"],
                      additionalProperties: false,
                    },
                  },
                  improvement_actions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string", description: "Action item in Chinese" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        category: { type: "string", enum: ["process", "training", "technology", "supplier"] },
                      },
                      required: ["action", "priority", "category"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["overall_summary", "item_analyses", "pattern_insights", "improvement_actions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_inventory" } },
      }),
    });

    if (!response.ok) {
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
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return structured data");
    }

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-inventory-analysis error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

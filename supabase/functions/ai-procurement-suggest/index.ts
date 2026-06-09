import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { store_id, store_name_zh, store_name_en } = await req.json();

    // 1. Fetch inventory data with usage trends
    const { data: inventory } = await supabase
      .from("inventory_items")
      .select("name_zh, name_en, stock, min_stock, usage_7d, unit, category_zh, status");

    // 2. Fetch recent procurement orders (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
    let procQuery = supabase
      .from("procurement_orders")
      .select("supplier_name, items, total_amount, created_at, status, type")
      .gte("created_at", ninetyDaysAgo)
      .order("created_at", { ascending: false });
    if (store_id && store_id !== "hq") procQuery = procQuery.eq("store_id", store_id);
    const { data: recentOrders } = await procQuery;

    // 3. Fetch upcoming events (next 14 days)
    // Events are stored as menu_items with category 'event' or schedule_days
    const { data: menuItems } = await supabase
      .from("menu_items")
      .select("name_zh, name_en, category, ingredients, max_participants, schedule_days, schedule_time, is_available")
      .eq("is_available", true);

    // 4. Fetch event participants for upcoming events
    const twoWeeksLater = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    const { data: eventParticipants } = await supabase
      .from("event_participants")
      .select("event_name, status")
      .in("status", ["registered", "confirmed"]);

    // 5. Fetch supplier info for matching
    const { data: suppliers } = await supabase
      .from("suppliers")
      .select("name, short_name, tags, status, rating")
      .eq("status", "active")
      .order("rating", { ascending: false });

    // Build context for AI
    const today = new Date();
    const month = today.getMonth() + 1;
    const season = month <= 2 || month === 12 ? "冬季" : month <= 5 ? "春季" : month <= 8 ? "夏季" : "秋季";

    const context = `
你是一个专业的餐饮采购分析师，为"${store_name_zh || "总部"}"生成智能采购建议。

## 当前信息
- 日期: ${today.toISOString().slice(0, 10)}
- 季节: ${season} (${month}月)
- 门店: ${store_name_zh || "总部汇总"}

## 库存状态 (${(inventory || []).length}项)
${(inventory || []).map(i => `- ${i.name_zh}: 库存${i.stock}${i.unit}, 最低${i.min_stock}${i.unit}, 7日用量${i.usage_7d}${i.unit}, 状态${i.status}`).join("\n")}

## 近90天采购记录 (${(recentOrders || []).length}单)
${(recentOrders || []).slice(0, 20).map(o => `- ${o.supplier_name}: ¥${o.total_amount}, ${o.created_at?.slice(0, 10)}, ${o.status}`).join("\n")}

## 菜单与活动 (${(menuItems || []).length}项)
${(menuItems || []).filter(m => m.ingredients && (m.ingredients as any[]).length > 0).slice(0, 15).map(m => `- ${m.name_zh} (${m.category}): 配料${JSON.stringify(m.ingredients)}${m.max_participants ? `, 最大${m.max_participants}人` : ""}`).join("\n")}

## 近期活动报名
${(eventParticipants || []).length > 0 ? `共${eventParticipants.length}人报名` : "暂无近期活动"}

## 可用供应商
${(suppliers || []).map(s => `- ${s.name}${s.short_name ? `(${s.short_name})` : ""}: 评级${s.rating}/5, 标签${(s.tags || []).join(",")}`).join("\n")}

## 任务
根据以上数据，生成采购建议。考虑因素：
1. 库存低于安全线或即将耗尽的物料（根据7日用量预测）
2. 即将到来的活动需要额外备货
3. 季节性需求变化（如夏季冰块/饮品增加，冬季热饮增加）
4. 历史采购周期和规律
5. 优选评级高的供应商`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: context },
          { role: "user", content: "请生成采购建议清单" },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_procurement_suggestions",
              description: "生成结构化的采购建议列表",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        item_name_zh: { type: "string", description: "物料中文名" },
                        item_name_en: { type: "string", description: "物料英文名" },
                        category: { type: "string", description: "分类：food/beverage/supplies/other" },
                        quantity: { type: "number", description: "建议采购数量" },
                        unit: { type: "string", description: "单位" },
                        estimated_unit_price: { type: "number", description: "预估单价(元)" },
                        urgency: { type: "string", enum: ["urgent", "normal", "low"], description: "紧急程度" },
                        reason_zh: { type: "string", description: "建议原因(中文)" },
                        reason_en: { type: "string", description: "建议原因(英文)" },
                        suggested_supplier: { type: "string", description: "建议供应商名称" },
                        current_stock: { type: "number", description: "当前库存" },
                        days_until_stockout: { type: "number", description: "预计几天后缺货" },
                      },
                      required: ["item_name_zh", "quantity", "unit", "urgency", "reason_zh", "suggested_supplier"],
                    },
                  },
                  summary_zh: { type: "string", description: "整体采购建议摘要(中文)" },
                  summary_en: { type: "string", description: "整体采购建议摘要(英文)" },
                  total_estimated_cost: { type: "number", description: "预估总成本" },
                },
                required: ["suggestions", "summary_zh", "total_estimated_cost"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_procurement_suggestions" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求频率超限，请稍后再试" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI额度不足，请充值" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const suggestions = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-procurement-suggest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

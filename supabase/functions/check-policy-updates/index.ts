import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Store cities to check - maps store addresses to cities
const STORE_CITIES = [
  { city: "上海", province: "上海市", en: "Shanghai" },
  // Add more cities as stores expand to other locations
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await requireUser(req);
    if (authResult instanceof Response) return authResult;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Optionally accept specific cities from request body
    let citiesToCheck = STORE_CITIES;
    try {
      const body = await req.json();
      if (body?.cities && Array.isArray(body.cities)) {
        citiesToCheck = body.cities;
      }
    } catch {
      // No body or invalid JSON - use defaults
    }

    const results: any[] = [];

    for (const cityInfo of citiesToCheck) {
      try {
        // Get existing policies for this city to compare
        const { data: existingPolicies } = await supabase
          .from("work_permit_policies")
          .select("policy_title, category, updated_at")
          .eq("city", cityInfo.city)
          .eq("status", "reviewed")
          .order("updated_at", { ascending: false })
          .limit(50);

        const existingTitles = (existingPolicies || []).map((p: any) => p.policy_title);

        // Ask AI to search for latest policy changes
        const systemPrompt = `你是中国外国人工作许可和签证政策法规变更检测专家。

请检查【${cityInfo.city}】（${cityInfo.province}）近期是否有以下方面的政策变更：
1. 工作许可申请/续签流程变化
2. 签证/居留许可新规
3. 人才引进政策调整
4. 外籍员工税收优惠变化
5. 合规要求更新

已知政策库中已有以下政策（请重点关注这些之外的新变化）：
${existingTitles.slice(0, 20).map((t: string) => `- ${t}`).join("\n")}

请返回JSON格式：
{
  "has_changes": true/false,
  "changes": [
    {
      "title": "变更标题",
      "description": "变更内容摘要（100字内）",
      "category": "work_permit|visa|talent|tax|compliance",
      "importance": "high|medium|low",
      "effective_date": "YYYY-MM-DD或空",
      "source": "来源机构"
    }
  ],
  "summary_zh": "整体变更摘要",
  "summary_en": "Overall change summary in English"
}

如果没有发现显著变化，has_changes设为false，changes为空数组。`;

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `请检查${cityInfo.city}最近的外国人工作许可和签证政策是否有变更。当前日期：${new Date().toISOString().split("T")[0]}` },
            ],
            temperature: 0.2,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`AI error for ${cityInfo.city}:`, errText);
          results.push({ city: cityInfo.city, error: errText });
          continue;
        }

        const aiData = await response.json();
        const content = aiData.choices?.[0]?.message?.content || "";

        let parsed;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { has_changes: false, changes: [] };
        } catch {
          parsed = { has_changes: false, changes: [], raw: content };
        }

        // If changes detected, create alerts
        if (parsed.has_changes && parsed.changes?.length > 0) {
          for (const change of parsed.changes) {
            // Insert policy alert
            await supabase.from("work_permit_policy_alerts").insert({
              city: cityInfo.city,
              alert_type: change.importance === "high" ? "urgent_change" : "new_policy",
              title: change.title,
              description: `[${change.category}] ${change.description}${change.effective_date ? ` (生效日期: ${change.effective_date})` : ""} — 来源: ${change.source || "AI检测"}`,
              is_read: false,
            });

            // Insert in-app notification for HR
            await supabase.from("hr_notifications").insert({
              title: change.importance === "high" 
                ? `🚨 紧急政策变更 - ${cityInfo.city}` 
                : `📋 新政策通知 - ${cityInfo.city}`,
              message: `[${change.category}] ${change.title}: ${change.description}`,
              category: "policy_change",
              priority: change.importance || "medium",
              city: cityInfo.city,
            });

            // Also insert as pending_review policy for HR to confirm
            await supabase.from("work_permit_policies").insert({
              city: cityInfo.city,
              province: cityInfo.province,
              policy_title: change.title,
              policy_content: change.description,
              policy_summary_zh: change.description,
              policy_summary_en: parsed.summary_en || "",
              category: change.category || "general",
              source_name: change.source || "AI自动检测",
              ai_confidence: 0.7,
              ai_search_query: `${cityInfo.city}政策变更自动检查`,
              status: "pending_review",
              effective_date: change.effective_date || null,
              tags: ["auto_detected", change.importance],
            });
          }

          results.push({
            city: cityInfo.city,
            has_changes: true,
            change_count: parsed.changes.length,
            summary: parsed.summary_zh,
          });
        } else {
          results.push({ city: cityInfo.city, has_changes: false });
        }
      } catch (cityErr: any) {
        console.error(`Error checking ${cityInfo.city}:`, cityErr);
        results.push({ city: cityInfo.city, error: cityErr.message });
      }
    }

    return new Response(JSON.stringify({
      checked_at: new Date().toISOString(),
      cities_checked: citiesToCheck.length,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Policy check error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

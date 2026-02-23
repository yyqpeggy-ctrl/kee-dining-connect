import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if we already ran today (avoid duplicates)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: existing } = await supabase
      .from("daily_procurement_suggestions")
      .select("id")
      .gte("created_at", todayStart.toISOString())
      .limit(1);

    if (existing && existing.length > 0) {
      console.info("Daily analysis already ran today, skipping");
      return new Response(JSON.stringify({ success: true, skipped: true, message: "Already ran today" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call the AI procurement suggest function internally
    const aiUrl = `${SUPABASE_URL}/functions/v1/ai-procurement-suggest`;
    const aiResponse = await fetch(aiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        store_id: "hq",
        store_name_zh: "总部",
        store_name_en: "HQ",
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI function error: ${aiResponse.status} - ${errText}`);
    }

    const aiResult = await aiResponse.json();

    if (aiResult.error) {
      throw new Error(aiResult.error);
    }

    // Store the suggestions in the daily table
    const { error: insertError } = await supabase
      .from("daily_procurement_suggestions")
      .insert({
        store_id: "hq",
        store_name_zh: "总部",
        store_name_en: "HQ",
        suggestions: aiResult.suggestions || [],
        summary_zh: aiResult.summary_zh || "",
        summary_en: aiResult.summary_en || "",
        total_estimated_cost: aiResult.total_estimated_cost || 0,
        status: "pending",
      });

    if (insertError) throw insertError;

    console.info(`Daily procurement analysis completed: ${(aiResult.suggestions || []).length} suggestions, ¥${aiResult.total_estimated_cost}`);

    return new Response(JSON.stringify({
      success: true,
      suggestions_count: (aiResult.suggestions || []).length,
      total_estimated_cost: aiResult.total_estimated_cost,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("daily-procurement-analysis error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

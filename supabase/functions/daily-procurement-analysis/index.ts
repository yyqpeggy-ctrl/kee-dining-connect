import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// All stores to generate suggestions for
const STORES = [
  { id: "hq", name_zh: "总部", name_en: "HQ" },
  { id: "flagship", name_zh: "旗舰店", name_en: "Flagship" },
  { id: "french", name_zh: "法租界店", name_en: "French Concession" },
  { id: "jingan", name_zh: "静安店", name_en: "Jing'an" },
  { id: "xintiandi", name_zh: "新天地店", name_en: "Xintiandi" },
];

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
      .select("id, store_id")
      .gte("created_at", todayStart.toISOString());

    const existingStoreIds = new Set((existing || []).map(e => e.store_id));

    // Filter to only stores not yet analyzed today
    const pendingStores = STORES.filter(s => !existingStoreIds.has(s.id));

    if (pendingStores.length === 0) {
      console.info("Daily analysis already ran for all stores today, skipping");
      return new Response(JSON.stringify({ success: true, skipped: true, message: "Already ran today for all stores" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { store_id: string; suggestions_count: number; total_estimated_cost: number; error?: string }[] = [];

    for (const store of pendingStores) {
      try {
        console.info(`Generating suggestions for store: ${store.name_zh} (${store.id})`);

        const aiUrl = `${SUPABASE_URL}/functions/v1/ai-procurement-suggest`;
        const aiResponse = await fetch(aiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            store_id: store.id,
            store_name_zh: store.name_zh,
            store_name_en: store.name_en,
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error(`AI error for ${store.id}:`, aiResponse.status, errText);
          results.push({ store_id: store.id, suggestions_count: 0, total_estimated_cost: 0, error: errText });
          continue;
        }

        const aiResult = await aiResponse.json();
        if (aiResult.error) {
          results.push({ store_id: store.id, suggestions_count: 0, total_estimated_cost: 0, error: aiResult.error });
          continue;
        }

        const { error: insertError } = await supabase
          .from("daily_procurement_suggestions")
          .insert({
            store_id: store.id,
            store_name_zh: store.name_zh,
            store_name_en: store.name_en,
            suggestions: aiResult.suggestions || [],
            summary_zh: aiResult.summary_zh || "",
            summary_en: aiResult.summary_en || "",
            total_estimated_cost: aiResult.total_estimated_cost || 0,
            status: "pending",
          });

        if (insertError) {
          console.error(`Insert error for ${store.id}:`, insertError);
          results.push({ store_id: store.id, suggestions_count: 0, total_estimated_cost: 0, error: insertError.message });
        } else {
          results.push({
            store_id: store.id,
            suggestions_count: (aiResult.suggestions || []).length,
            total_estimated_cost: aiResult.total_estimated_cost || 0,
          });
        }
      } catch (storeErr) {
        console.error(`Error for store ${store.id}:`, storeErr);
        results.push({ store_id: store.id, suggestions_count: 0, total_estimated_cost: 0, error: String(storeErr) });
      }
    }

    console.info(`Daily procurement analysis completed for ${results.length} stores`);

    return new Response(JSON.stringify({ success: true, results }), {
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

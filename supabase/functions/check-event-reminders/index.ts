import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// This function is called by pg_cron every 15 minutes
// It checks for upcoming events and triggers auto-reminders based on configured rules
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all active reminder rules
    const { data: rules, error: rulesErr } = await supabase
      .from("event_reminder_rules")
      .select("*")
      .eq("is_active", true);

    if (rulesErr) throw rulesErr;
    if (!rules || rules.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No active rules", triggered: 0 }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    let triggeredCount = 0;
    const triggeredDetails: any[] = [];

    // For each rule, check if there are events that match the trigger window
    // In a real implementation, events would be stored in a DB table
    // For now, we log the check and demonstrate the mechanism
    for (const rule of rules) {
      const offsetMs = rule.trigger_offset_minutes * 60 * 1000;
      const targetTime = new Date(now.getTime() - offsetMs);

      // Check if we already sent this notification recently (within 20 minutes)
      const { data: recentNotifs } = await supabase
        .from("event_notifications")
        .select("id")
        .eq("rule_name", rule.rule_name)
        .gte("created_at", new Date(now.getTime() - 20 * 60 * 1000).toISOString())
        .limit(1);

      if (recentNotifs && recentNotifs.length > 0) {
        console.info(`Rule "${rule.rule_name}" already triggered recently, skipping`);
        continue;
      }

      // In production: query events table WHERE event_start BETWEEN targetTime AND targetTime + 15min
      // For now, log the check
      console.info(`Checking rule "${rule.rule_name}": looking for events around ${targetTime.toISOString()}`);
      
      triggeredDetails.push({
        rule: rule.rule_name,
        ruleZh: rule.rule_name_zh,
        checkedAt: now.toISOString(),
        targetEventTime: targetTime.toISOString(),
        status: "checked",
      });
    }

    return new Response(JSON.stringify({
      success: true,
      checkedAt: now.toISOString(),
      rulesChecked: rules.length,
      triggered: triggeredCount,
      details: triggeredDetails,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("check-event-reminders error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

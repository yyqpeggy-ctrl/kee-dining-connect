import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Mock WeChat template message sender
// Replace with real API call when WeChat AppID/AppSecret are configured
async function sendWechatTemplate(recipient: any, message: string, eventData: any) {
  // Real implementation would call:
  // POST https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=ACCESS_TOKEN
  console.info(`[MOCK] WeChat template to ${recipient.name}: ${message.substring(0, 50)}...`);
  
  // Simulate network delay
  await new Promise(r => setTimeout(r, 100 + Math.random() * 200));
  
  // 95% success rate simulation
  const success = Math.random() > 0.05;
  return {
    success,
    channel: "wechat_template",
    recipient: recipient.name,
    msgId: success ? `wx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` : null,
    error: success ? null : "User has unsubscribed from template messages",
  };
}

// Mock SMS sender
// Replace with Aliyun SMS / Tencent Cloud SMS when API keys are configured
async function sendSms(recipient: any, message: string, eventData: any) {
  // Real Aliyun implementation would call:
  // POST https://dysmsapi.aliyuncs.com/ with SignatureMethod, AccessKeyId, etc.
  console.info(`[MOCK] SMS to ${recipient.phone}: ${message.substring(0, 50)}...`);
  
  await new Promise(r => setTimeout(r, 50 + Math.random() * 150));
  
  const success = Math.random() > 0.03;
  return {
    success,
    channel: "sms",
    recipient: recipient.phone,
    msgId: success ? `sms_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` : null,
    error: success ? null : "Phone number not in service",
  };
}

// Mock mini program push
async function sendMiniprogramPush(recipient: any, message: string, eventData: any) {
  console.info(`[MOCK] Mini program push to ${recipient.name}: ${message.substring(0, 50)}...`);
  
  await new Promise(r => setTimeout(r, 80 + Math.random() * 120));
  
  const success = Math.random() > 0.08;
  return {
    success,
    channel: "miniprogram",
    recipient: recipient.name,
    msgId: success ? `mp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` : null,
    error: success ? null : "User has not subscribed to this template",
  };
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, eventId, eventName, eventDate, eventTime, channel, targetType, recipients, messageTemplate, scheduledAt, ruleId } = await req.json();

    if (action === "send") {
      // Send notifications to recipients
      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return new Response(JSON.stringify({ error: "No recipients provided" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Log the notification in DB
      const { data: notif, error: insertErr } = await supabase.from("event_notifications").insert({
        event_id: eventId || "unknown",
        event_name: eventName || "Unknown Event",
        channel: channel || "wechat_template",
        target_type: targetType || "all",
        recipient_count: recipients.length,
        message_template: messageTemplate,
        status: "sending",
        trigger_type: ruleId ? "auto_rule" : (scheduledAt ? "scheduled" : "manual"),
        rule_name: ruleId || null,
        scheduled_at: scheduledAt || null,
      }).select().single();

      if (insertErr) console.error("Failed to log notification:", insertErr);

      // Send to each recipient
      const results = [];
      let delivered = 0, failed = 0;

      for (const recipient of recipients) {
        const filledMessage = fillTemplate(messageTemplate, {
          name: recipient.name || "",
          event: eventName || "",
          date: eventDate || "",
          time: eventTime || "",
        });

        let result;
        const ch = channel || "wechat_template";
        if (ch === "wechat_template") {
          result = await sendWechatTemplate(recipient, filledMessage, { eventName, eventDate, eventTime });
        } else if (ch === "sms") {
          result = await sendSms(recipient, filledMessage, { eventName, eventDate, eventTime });
        } else if (ch === "miniprogram") {
          result = await sendMiniprogramPush(recipient, filledMessage, { eventName, eventDate, eventTime });
        } else {
          // Send via all channels
          const wxResult = await sendWechatTemplate(recipient, filledMessage, { eventName, eventDate, eventTime });
          const smsResult = await sendSms(recipient, filledMessage, { eventName, eventDate, eventTime });
          result = { success: wxResult.success || smsResult.success, channel: "all", subResults: [wxResult, smsResult] };
        }

        if (result.success) delivered++;
        else failed++;
        results.push(result);
      }

      // Update notification status
      if (notif) {
        await supabase.from("event_notifications").update({
          status: failed === recipients.length ? "failed" : "sent",
          sent_at: new Date().toISOString(),
          delivery_stats: { delivered, failed, pending: 0 },
        }).eq("id", notif.id);
      }

      return new Response(JSON.stringify({
        success: true,
        notificationId: notif?.id,
        totalSent: recipients.length,
        delivered,
        failed,
        results,
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_rules") {
      const { data: rules, error } = await supabase
        .from("event_reminder_rules")
        .select("*")
        .order("trigger_offset_minutes", { ascending: true });
      
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, rules }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "toggle_rule") {
      const { error } = await supabase
        .from("event_reminder_rules")
        .update({ is_active: !!(await req.json()).is_active })
        .eq("id", ruleId);
      
      // Re-read to get current state since we already consumed the body
      const { data: rule } = await supabase
        .from("event_reminder_rules")
        .select("*")
        .eq("id", ruleId)
        .single();

      return new Response(JSON.stringify({ success: true, rule }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_history") {
      const { data: history, error } = await supabase
        .from("event_notifications")
        .select("*")
        .eq("event_id", eventId || "")
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, history }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-event-notification error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


-- Create event_notifications table for tracking all sent notifications
CREATE TABLE public.event_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('wechat_template', 'sms', 'miniprogram')),
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'confirmed', 'not_checked_in', 'selected', 'custom')),
  recipient_count INTEGER NOT NULL DEFAULT 0,
  message_template TEXT NOT NULL,
  message_content TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'scheduled')),
  trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'scheduled', 'auto_rule')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  rule_name TEXT,
  delivery_stats JSONB DEFAULT '{"delivered": 0, "failed": 0, "pending": 0}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_notifications ENABLE ROW LEVEL SECURITY;

-- Public read/write for now (no auth yet)
CREATE POLICY "Anyone can view notifications" ON public.event_notifications FOR SELECT USING (true);
CREATE POLICY "Anyone can insert notifications" ON public.event_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update notifications" ON public.event_notifications FOR UPDATE USING (true);

-- Create auto-reminder rules table
CREATE TABLE public.event_reminder_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  rule_name_zh TEXT NOT NULL,
  description TEXT,
  description_zh TEXT,
  trigger_offset_minutes INTEGER NOT NULL,
  trigger_relative_to TEXT NOT NULL DEFAULT 'event_start' CHECK (trigger_relative_to IN ('event_start', 'event_end')),
  channel TEXT NOT NULL DEFAULT 'wechat_template' CHECK (channel IN ('wechat_template', 'sms', 'miniprogram', 'all')),
  target_type TEXT NOT NULL DEFAULT 'confirmed',
  message_template TEXT NOT NULL,
  message_template_zh TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.event_reminder_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view rules" ON public.event_reminder_rules FOR SELECT USING (true);
CREATE POLICY "Anyone can manage rules" ON public.event_reminder_rules FOR ALL USING (true);

-- Insert default reminder rules
INSERT INTO public.event_reminder_rules (rule_name, rule_name_zh, trigger_offset_minutes, trigger_relative_to, channel, target_type, message_template, message_template_zh, is_active) VALUES
  ('24h_before_event', '活动前24小时提醒', -1440, 'event_start', 'all', 'confirmed', 'Hi {name}, reminder: "{event}" starts tomorrow at {time}. See you there!', '您好{name}，温馨提醒："{event}"将于明天{time}开始，期待您的到来！', true),
  ('2h_before_event', '活动前2小时签到提醒', -120, 'event_start', 'all', 'confirmed', 'Hi {name}, "{event}" starts in 2 hours at {time}. Don''t forget to check in!', '您好{name}，"{event}"将在2小时后开始（{time}），请准时到场签到！', true),
  ('post_event_thanks', '活动结束后感谢消息', 30, 'event_end', 'wechat_template', 'checked_in', 'Thanks for attending "{event}"! We''d love your feedback. Rate us on Dianping!', '感谢您参加"{event}"！期待您的评价，欢迎在大众点评留下您的感受～', false),
  ('no_show_mark', '未签到者标记', 30, 'event_start', 'sms', 'not_checked_in', 'We missed you at "{event}" today. Hope to see you next time!', '我们注意到您未能参加今天的"{event}"，期待下次见到您！', true);

-- Enable pg_cron and pg_net for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Updated_at trigger
CREATE TRIGGER update_event_notifications_updated_at
  BEFORE UPDATE ON public.event_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_menu_items_updated_at();

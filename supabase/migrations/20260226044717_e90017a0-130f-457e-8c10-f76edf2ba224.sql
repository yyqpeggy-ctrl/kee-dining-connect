
-- Create in-app notifications table for HR policy change alerts
CREATE TABLE public.hr_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'policy_change',
  priority TEXT NOT NULL DEFAULT 'medium',
  city TEXT,
  policy_id UUID REFERENCES public.work_permit_policies(id),
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  read_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hr_notifications ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view notifications
CREATE POLICY "Authenticated users can view hr notifications"
  ON public.hr_notifications FOR SELECT
  USING (true);

-- All authenticated users can update (mark as read)
CREATE POLICY "Authenticated users can update hr notifications"
  ON public.hr_notifications FOR UPDATE
  USING (true);

-- Service role / edge functions can insert
CREATE POLICY "Service role can insert hr notifications"
  ON public.hr_notifications FOR INSERT
  WITH CHECK (true);

-- Allow deletion
CREATE POLICY "Authenticated users can delete hr notifications"
  ON public.hr_notifications FOR DELETE
  USING (true);

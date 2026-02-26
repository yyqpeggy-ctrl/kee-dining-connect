
-- Create work permit policy knowledge base
CREATE TABLE public.work_permit_policies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city text NOT NULL,
  district text DEFAULT '',
  province text NOT NULL DEFAULT '',
  policy_title text NOT NULL,
  policy_content text NOT NULL DEFAULT '',
  policy_summary_zh text DEFAULT '',
  policy_summary_en text DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  source_url text DEFAULT '',
  source_name text DEFAULT '',
  effective_date date,
  expiry_date date,
  tags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending_review',
  reviewed_by uuid,
  reviewed_at timestamptz,
  ai_confidence numeric DEFAULT 0,
  ai_search_query text DEFAULT '',
  last_verified_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_permit_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view policies" ON public.work_permit_policies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert policies" ON public.work_permit_policies FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update policies" ON public.work_permit_policies FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete policies" ON public.work_permit_policies FOR DELETE USING (true);

-- Create policy change log for tracking updates
CREATE TABLE public.work_permit_policy_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id uuid REFERENCES public.work_permit_policies(id) ON DELETE CASCADE,
  city text NOT NULL,
  alert_type text NOT NULL DEFAULT 'new_policy',
  title text NOT NULL,
  description text DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.work_permit_policy_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view alerts" ON public.work_permit_policy_alerts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update alerts" ON public.work_permit_policy_alerts FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can insert alerts" ON public.work_permit_policy_alerts FOR INSERT WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_work_permit_policies_updated_at
  BEFORE UPDATE ON public.work_permit_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

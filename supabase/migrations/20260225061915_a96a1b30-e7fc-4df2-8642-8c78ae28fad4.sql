
-- Create lead_activities table for tracking follow-up records and conversion timeline
CREATE TABLE public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL DEFAULT 'note',
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lead activities" ON public.lead_activities FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert lead activities" ON public.lead_activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can delete lead activities" ON public.lead_activities FOR DELETE USING (true);

-- Index for fast lookups
CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX idx_lead_activities_created_at ON public.lead_activities(created_at DESC);

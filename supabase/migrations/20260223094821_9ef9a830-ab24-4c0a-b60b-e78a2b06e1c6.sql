
-- Create table to store daily AI procurement suggestions
CREATE TABLE public.daily_procurement_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL DEFAULT 'hq',
  store_name_zh TEXT NOT NULL DEFAULT '总部',
  store_name_en TEXT NOT NULL DEFAULT 'HQ',
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary_zh TEXT,
  summary_en TEXT,
  total_estimated_cost NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending / approved / rejected / expired
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_procurement_suggestions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Authenticated users can view suggestions"
ON public.daily_procurement_suggestions FOR SELECT
USING (true);

-- Allow all authenticated users to update (approve/reject)
CREATE POLICY "Authenticated users can update suggestions"
ON public.daily_procurement_suggestions FOR UPDATE
USING (true);

-- Allow service role inserts (from edge function)
CREATE POLICY "Service role can insert suggestions"
ON public.daily_procurement_suggestions FOR INSERT
WITH CHECK (true);

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

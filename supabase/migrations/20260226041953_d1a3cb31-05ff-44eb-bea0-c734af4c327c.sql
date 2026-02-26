
-- Create table to track processed wechat export files
CREATE TABLE public.wechat_extract_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  source_module TEXT NOT NULL DEFAULT 'general',
  extracted_data JSONB DEFAULT '[]'::jsonb,
  summary JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  store_id TEXT NOT NULL DEFAULT '',
  store_name_zh TEXT NOT NULL DEFAULT '',
  store_name_en TEXT NOT NULL DEFAULT '',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.wechat_extract_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view extract jobs"
  ON public.wechat_extract_jobs FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert extract jobs"
  ON public.wechat_extract_jobs FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update extract jobs"
  ON public.wechat_extract_jobs FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete extract jobs"
  ON public.wechat_extract_jobs FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_wechat_extract_jobs_updated_at
  BEFORE UPDATE ON public.wechat_extract_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for wechat exports
INSERT INTO storage.buckets (id, name, public) VALUES ('wechat-exports', 'wechat-exports', false);

-- Storage policies
CREATE POLICY "Authenticated users can upload wechat exports"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'wechat-exports' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view wechat exports"
  ON storage.objects FOR SELECT USING (bucket_id = 'wechat-exports' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete wechat exports"
  ON storage.objects FOR DELETE USING (bucket_id = 'wechat-exports' AND auth.uid() IS NOT NULL);

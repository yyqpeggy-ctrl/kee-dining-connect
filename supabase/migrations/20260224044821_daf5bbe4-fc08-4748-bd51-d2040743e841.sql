
-- Create trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create knowledge_documents table
CREATE TABLE public.knowledge_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id),
  store_id TEXT NOT NULL DEFAULT 'HQ',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view knowledge docs"
  ON public.knowledge_documents FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert knowledge docs"
  ON public.knowledge_documents FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update knowledge docs"
  ON public.knowledge_documents FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete knowledge docs"
  ON public.knowledge_documents FOR DELETE USING (auth.uid() IS NOT NULL);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-files', 'knowledge-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload knowledge files"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'knowledge-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view knowledge files"
  ON storage.objects FOR SELECT USING (bucket_id = 'knowledge-files');

CREATE POLICY "Authenticated users can delete knowledge files"
  ON storage.objects FOR DELETE USING (bucket_id = 'knowledge-files' AND auth.uid() IS NOT NULL);

-- Trigger
CREATE TRIGGER update_knowledge_documents_updated_at
  BEFORE UPDATE ON public.knowledge_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

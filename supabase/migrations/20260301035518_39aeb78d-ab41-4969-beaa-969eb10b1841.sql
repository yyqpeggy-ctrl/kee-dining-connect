
-- Create BGM library table for preset background music tracks
CREATE TABLE public.bgm_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  artist TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'ambient',
  style TEXT DEFAULT '',
  duration_seconds INTEGER DEFAULT 0,
  file_url TEXT NOT NULL,
  cover_url TEXT DEFAULT '',
  bpm INTEGER DEFAULT 0,
  mood TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  is_preset BOOLEAN DEFAULT true,
  uploaded_by TEXT DEFAULT NULL,
  store_id TEXT DEFAULT 'hq',
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bgm_library ENABLE ROW LEVEL SECURITY;

-- Everyone can read preset BGM
CREATE POLICY "Anyone can view BGM library" ON public.bgm_library FOR SELECT USING (true);

-- Authenticated users can upload custom BGM
CREATE POLICY "Authenticated users can insert BGM" ON public.bgm_library FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update their BGM" ON public.bgm_library FOR UPDATE USING (auth.uid()::text = uploaded_by OR is_preset = true);

CREATE POLICY "Authenticated users can delete their BGM" ON public.bgm_library FOR DELETE USING (auth.uid()::text = uploaded_by);

-- Create storage bucket for BGM files
INSERT INTO storage.buckets (id, name, public) VALUES ('bgm-library', 'bgm-library', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Public BGM access" ON storage.objects FOR SELECT USING (bucket_id = 'bgm-library');
CREATE POLICY "Auth users upload BGM" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'bgm-library' AND auth.uid() IS NOT NULL);

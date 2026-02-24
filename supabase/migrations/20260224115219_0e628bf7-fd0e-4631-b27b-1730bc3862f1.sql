
-- ==========================================
-- WeChat Groups table with multi-store isolation
-- ==========================================
CREATE TABLE public.wechat_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'vip',
  member_count INTEGER NOT NULL DEFAULT 0,
  owner TEXT NOT NULL DEFAULT '',
  qr_code_url TEXT DEFAULT '',
  created_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  weekly_messages INTEGER NOT NULL DEFAULT 0,
  weekly_new_members INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  store_id TEXT NOT NULL DEFAULT '',
  store_name_zh TEXT NOT NULL DEFAULT '',
  store_name_en TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wechat_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view wechat groups" ON public.wechat_groups FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert wechat groups" ON public.wechat_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update wechat groups" ON public.wechat_groups FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete wechat groups" ON public.wechat_groups FOR DELETE USING (true);

CREATE TRIGGER update_wechat_groups_updated_at
  BEFORE UPDATE ON public.wechat_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- Video Channel table with multi-store isolation
-- ==========================================
CREATE TABLE public.video_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'event',
  publish_date DATE,
  duration TEXT DEFAULT '',
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  cover_url TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  store_id TEXT NOT NULL DEFAULT '',
  store_name_zh TEXT NOT NULL DEFAULT '',
  store_name_en TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.video_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view video channels" ON public.video_channels FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert video channels" ON public.video_channels FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update video channels" ON public.video_channels FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete video channels" ON public.video_channels FOR DELETE USING (true);

CREATE TRIGGER update_video_channels_updated_at
  BEFORE UPDATE ON public.video_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

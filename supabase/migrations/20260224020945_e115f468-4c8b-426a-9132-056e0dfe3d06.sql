
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  short_name TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'hotel',
  contact_person TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  wechat TEXT DEFAULT '',
  address TEXT DEFAULT '',
  cooperation_start DATE DEFAULT CURRENT_DATE,
  cooperation_end DATE,
  cooperation_content TEXT DEFAULT '',
  commission_rate NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  rating INTEGER DEFAULT 3,
  notes TEXT DEFAULT '',
  store_id TEXT NOT NULL DEFAULT '',
  store_name_zh TEXT NOT NULL DEFAULT '',
  store_name_en TEXT NOT NULL DEFAULT '',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view partners" ON public.partners FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert partners" ON public.partners FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update partners" ON public.partners FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete partners" ON public.partners FOR DELETE USING (true);

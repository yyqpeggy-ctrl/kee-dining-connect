
-- Renovation projects table
CREATE TABLE public.renovation_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL DEFAULT '',
  store_name_zh TEXT NOT NULL DEFAULT '',
  store_name_en TEXT NOT NULL DEFAULT '',
  phase_zh TEXT NOT NULL DEFAULT '',
  phase_en TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  budget NUMERIC NOT NULL DEFAULT 0,
  spent NUMERIC NOT NULL DEFAULT 0,
  manager_zh TEXT NOT NULL DEFAULT '',
  manager_en TEXT NOT NULL DEFAULT '',
  notes TEXT DEFAULT '',
  contractor TEXT DEFAULT '',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.renovation_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view renovation projects"
  ON public.renovation_projects FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert renovation projects"
  ON public.renovation_projects FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update renovation projects"
  ON public.renovation_projects FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete renovation projects"
  ON public.renovation_projects FOR DELETE USING (true);

CREATE TRIGGER update_renovation_projects_updated_at
  BEFORE UPDATE ON public.renovation_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_updated_at();

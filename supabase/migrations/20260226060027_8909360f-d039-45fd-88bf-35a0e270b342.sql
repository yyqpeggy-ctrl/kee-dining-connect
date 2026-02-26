
-- Table for defining scheduled data import tasks
CREATE TABLE public.data_import_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type text NOT NULL DEFAULT 'keruyun', -- keruyun, lakala, bank
  source_label_zh text NOT NULL DEFAULT '',
  source_label_en text NOT NULL DEFAULT '',
  file_naming_rule text NOT NULL DEFAULT '', -- e.g. "客如云_YYYYMMDD.xlsx"
  upload_folder text NOT NULL DEFAULT '', -- logical folder path in storage
  frequency text NOT NULL DEFAULT 'weekly', -- daily, weekly, monthly
  day_of_week integer DEFAULT 1, -- 0=Sun, 1=Mon...6=Sat (for weekly)
  day_of_month integer DEFAULT 1, -- for monthly
  reminder_hour integer NOT NULL DEFAULT 9, -- hour to send reminder (0-23)
  is_active boolean NOT NULL DEFAULT true,
  store_id text NOT NULL DEFAULT '',
  store_name_zh text NOT NULL DEFAULT '',
  store_name_en text NOT NULL DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table for tracking individual import file records
CREATE TABLE public.data_import_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id uuid REFERENCES public.data_import_schedules(id) ON DELETE SET NULL,
  source_type text NOT NULL DEFAULT 'keruyun',
  file_name text NOT NULL DEFAULT '',
  file_path text NOT NULL DEFAULT '',
  file_size bigint NOT NULL DEFAULT 0,
  period_label text NOT NULL DEFAULT '', -- e.g. "2026-W09", "2026-02-20"
  status text NOT NULL DEFAULT 'pending', -- pending, uploaded, processing, completed, failed
  record_count integer DEFAULT 0,
  error_message text,
  processed_at timestamptz,
  uploaded_by uuid,
  store_id text NOT NULL DEFAULT '',
  store_name_zh text NOT NULL DEFAULT '',
  store_name_en text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table for import reminders/notifications
CREATE TABLE public.data_import_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id uuid NOT NULL REFERENCES public.data_import_schedules(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, notified, completed, overdue
  notified_at timestamptz,
  completed_at timestamptz,
  completed_by uuid,
  import_record_id uuid REFERENCES public.data_import_records(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.data_import_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_import_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_import_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Auth users can manage import schedules" ON public.data_import_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage import records" ON public.data_import_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage import reminders" ON public.data_import_reminders FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket for import files
INSERT INTO storage.buckets (id, name, public) VALUES ('data-imports', 'data-imports', false);
CREATE POLICY "Auth users can upload import files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'data-imports' AND auth.uid() IS NOT NULL);
CREATE POLICY "Auth users can view import files" ON storage.objects FOR SELECT USING (bucket_id = 'data-imports' AND auth.uid() IS NOT NULL);
CREATE POLICY "Auth users can delete import files" ON storage.objects FOR DELETE USING (bucket_id = 'data-imports' AND auth.uid() IS NOT NULL);

-- Updated at triggers
CREATE TRIGGER update_data_import_schedules_updated_at BEFORE UPDATE ON public.data_import_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_data_import_records_updated_at BEFORE UPDATE ON public.data_import_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


ALTER TABLE public.menu_items 
ADD COLUMN schedule_days text[] DEFAULT '{}',
ADD COLUMN schedule_time text DEFAULT '';

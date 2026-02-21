
-- Create event_participants table
CREATE TABLE public.event_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  wechat TEXT,
  status TEXT NOT NULL DEFAULT 'registered',
  source TEXT NOT NULL DEFAULT 'manual',
  is_new_customer BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  check_in_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth yet)
CREATE POLICY "Anyone can view participants" ON public.event_participants FOR SELECT USING (true);
CREATE POLICY "Anyone can insert participants" ON public.event_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update participants" ON public.event_participants FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete participants" ON public.event_participants FOR DELETE USING (true);

-- Index for cross-event analysis
CREATE INDEX idx_participants_phone ON public.event_participants (phone);
CREATE INDEX idx_participants_event_id ON public.event_participants (event_id);
CREATE INDEX idx_participants_status ON public.event_participants (status);

-- Updated_at trigger
CREATE TRIGGER update_event_participants_updated_at
  BEFORE UPDATE ON public.event_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_menu_items_updated_at();

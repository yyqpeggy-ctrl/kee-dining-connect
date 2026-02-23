
-- Fixed assets table
CREATE TABLE public.fixed_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'equipment',
  store_id TEXT NOT NULL DEFAULT '',
  store_name_zh TEXT NOT NULL DEFAULT '',
  store_name_en TEXT NOT NULL DEFAULT '',
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  original_value NUMERIC NOT NULL DEFAULT 0,
  salvage_value NUMERIC NOT NULL DEFAULT 0,
  useful_life_years INTEGER NOT NULL DEFAULT 5,
  accumulated_depreciation NUMERIC NOT NULL DEFAULT 0,
  net_value NUMERIC NOT NULL DEFAULT 0,
  depreciation_method TEXT NOT NULL DEFAULT 'straight_line',
  status TEXT NOT NULL DEFAULT 'in_use',
  location TEXT DEFAULT '',
  serial_number TEXT DEFAULT '',
  supplier TEXT DEFAULT '',
  warranty_expiry DATE,
  notes TEXT DEFAULT '',
  disposed_at TIMESTAMP WITH TIME ZONE,
  disposed_reason TEXT DEFAULT '',
  disposed_value NUMERIC DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view fixed assets"
  ON public.fixed_assets FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert fixed assets"
  ON public.fixed_assets FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update fixed assets"
  ON public.fixed_assets FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete fixed assets"
  ON public.fixed_assets FOR DELETE USING (true);

-- Auto-update updated_at
CREATE TRIGGER update_fixed_assets_updated_at
  BEFORE UPDATE ON public.fixed_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_updated_at();

-- Depreciation records table for monthly tracking
CREATE TABLE public.asset_depreciation_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.fixed_assets(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  depreciation_amount NUMERIC NOT NULL DEFAULT 0,
  accumulated_total NUMERIC NOT NULL DEFAULT 0,
  net_value_after NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.asset_depreciation_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view depreciation records"
  ON public.asset_depreciation_records FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert depreciation records"
  ON public.asset_depreciation_records FOR INSERT WITH CHECK (true);

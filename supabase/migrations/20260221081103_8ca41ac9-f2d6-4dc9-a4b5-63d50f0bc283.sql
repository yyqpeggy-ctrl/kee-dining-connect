
-- Add ingredients and cost fields to menu_items
ALTER TABLE public.menu_items
ADD COLUMN ingredients jsonb DEFAULT '[]'::jsonb,
ADD COLUMN cost_price numeric DEFAULT 0;

COMMENT ON COLUMN public.menu_items.ingredients IS 'Array of {name, quantity, unit, unit_cost}';
COMMENT ON COLUMN public.menu_items.cost_price IS 'Total cost price calculated from ingredients';

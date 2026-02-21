
-- Inventory items table (replaces hardcoded mock data)
CREATE TABLE public.inventory_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_zh text NOT NULL,
  name_en text NOT NULL,
  category_zh text NOT NULL DEFAULT '',
  category_en text NOT NULL DEFAULT '',
  stock numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'btl',
  min_stock numeric NOT NULL DEFAULT 0,
  pour_cost numeric NOT NULL DEFAULT 0,
  target_cost numeric NOT NULL DEFAULT 0,
  usage_7d numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view inventory" ON public.inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert inventory" ON public.inventory_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update inventory" ON public.inventory_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete inventory" ON public.inventory_items FOR DELETE TO authenticated USING (true);

-- Inventory deduction log table
CREATE TABLE public.inventory_deductions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  inventory_item_name text NOT NULL,
  quantity numeric NOT NULL,
  unit text NOT NULL DEFAULT '',
  reason text NOT NULL DEFAULT 'order',
  order_id text,
  menu_item_name text,
  deducted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_deductions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view deductions" ON public.inventory_deductions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert deductions" ON public.inventory_deductions FOR INSERT TO authenticated WITH CHECK (true);

-- Function to deduct inventory based on menu item ingredients (matched by name)
CREATE OR REPLACE FUNCTION public.deduct_inventory_for_menu_item(
  p_menu_item_id uuid,
  p_quantity integer DEFAULT 1,
  p_order_id text DEFAULT NULL,
  p_reason text DEFAULT 'order'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_ingredients jsonb;
  v_ingredient jsonb;
  v_inv_id uuid;
  v_inv_stock numeric;
  v_deduct_qty numeric;
  v_menu_name text;
  v_results jsonb := '[]'::jsonb;
BEGIN
  -- Get menu item ingredients
  SELECT ingredients, name_zh INTO v_ingredients, v_menu_name
  FROM public.menu_items WHERE id = p_menu_item_id;

  IF v_ingredients IS NULL OR jsonb_array_length(v_ingredients) = 0 THEN
    RETURN jsonb_build_object('status', 'skipped', 'message', 'No ingredients defined');
  END IF;

  -- Loop through each ingredient
  FOR v_ingredient IN SELECT * FROM jsonb_array_elements(v_ingredients)
  LOOP
    v_deduct_qty := (v_ingredient->>'quantity')::numeric * p_quantity;

    -- Match by name (case-insensitive, match either zh or en name)
    SELECT id, stock INTO v_inv_id, v_inv_stock
    FROM public.inventory_items
    WHERE lower(name_zh) = lower(v_ingredient->>'name')
       OR lower(name_en) = lower(v_ingredient->>'name')
    LIMIT 1;

    IF v_inv_id IS NOT NULL THEN
      -- Deduct stock
      UPDATE public.inventory_items
      SET stock = GREATEST(0, stock - v_deduct_qty),
          usage_7d = usage_7d + v_deduct_qty,
          status = CASE
            WHEN GREATEST(0, stock - v_deduct_qty) <= 0 THEN 'critical'
            WHEN GREATEST(0, stock - v_deduct_qty) <= min_stock THEN 'low'
            ELSE 'normal'
          END,
          updated_at = now()
      WHERE id = v_inv_id;

      -- Log deduction
      INSERT INTO public.inventory_deductions (inventory_item_id, inventory_item_name, quantity, unit, reason, order_id, menu_item_name, deducted_by)
      VALUES (v_inv_id, v_ingredient->>'name', v_deduct_qty, COALESCE(v_ingredient->>'unit', ''), p_reason, p_order_id, v_menu_name, auth.uid());

      v_results := v_results || jsonb_build_object('name', v_ingredient->>'name', 'deducted', v_deduct_qty, 'remaining', GREATEST(0, v_inv_stock - v_deduct_qty));
    ELSE
      v_results := v_results || jsonb_build_object('name', v_ingredient->>'name', 'status', 'not_found');
    END IF;
  END LOOP;

  RETURN jsonb_build_object('status', 'ok', 'deductions', v_results);
END;
$$;

-- Manual deduction function
CREATE OR REPLACE FUNCTION public.manual_deduct_inventory(
  p_inventory_item_id uuid,
  p_quantity numeric,
  p_reason text DEFAULT 'manual'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_name text;
  v_unit text;
  v_stock numeric;
BEGIN
  SELECT name_zh, unit, stock INTO v_name, v_unit, v_stock
  FROM public.inventory_items WHERE id = p_inventory_item_id;

  UPDATE public.inventory_items
  SET stock = GREATEST(0, stock - p_quantity),
      status = CASE
        WHEN GREATEST(0, stock - p_quantity) <= 0 THEN 'critical'
        WHEN GREATEST(0, stock - p_quantity) <= min_stock THEN 'low'
        ELSE 'normal'
      END,
      updated_at = now()
  WHERE id = p_inventory_item_id;

  INSERT INTO public.inventory_deductions (inventory_item_id, inventory_item_name, quantity, unit, reason, deducted_by)
  VALUES (p_inventory_item_id, v_name, p_quantity, v_unit, p_reason, auth.uid());
END;
$$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_inventory_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_updated_at();

-- Seed initial inventory data
INSERT INTO public.inventory_items (name_zh, name_en, category_zh, category_en, stock, unit, min_stock, pour_cost, target_cost, usage_7d, status) VALUES
('Hendrick''s 金酒', 'Hendrick''s Gin', '烈酒', 'Spirits', 8, 'btl', 3, 18, 20, 12, 'normal'),
('Rioja红酒 Marqués de Riscal', 'Rioja Marqués de Riscal', '红酒', 'Wine', 6, 'btl', 4, 32, 28, 8, 'low'),
('Estrella Damm啤酒', 'Estrella Damm Beer', '啤酒', 'Beer', 120, 'btl', 24, 20, 25, 156, 'normal'),
('鲜榨橙汁', 'Fresh Orange Juice', '果汁', 'Juice', 15, 'L', 10, 35, 30, 40, 'critical'),
('Baileys百利甜', 'Baileys Irish Cream', '利口酒', 'Liqueur', 5, 'btl', 2, 15, 18, 8, 'normal'),
('Patrón龙舌兰', 'Patrón Tequila', '烈酒', 'Spirits', 3, 'btl', 2, 22, 20, 6, 'low'),
('Fever-Tree汤力水', 'Fever-Tree Tonic Water', '软饮', 'Mixers', 48, 'btl', 12, 8, 10, 60, 'normal'),
('Sangria预调酒', 'Sangria House Blend', '鸡尾酒', 'Cocktails', 20, 'L', 5, 25, 22, 35, 'critical'),
('KTV话筒套', 'Microphone Covers', '耗材', 'Supplies', 200, 'pcs', 50, 0, 0, 120, 'normal'),
('飞镖针（钢尖）', 'Steel Tip Darts', '游戏耗材', 'Game Supplies', 24, 'set', 6, 0, 0, 6, 'normal'),
('爆米花原料', 'Popcorn Kernels', '小食原料', 'Snack Ingredients', 8, 'kg', 5, 12, 15, 15, 'low');

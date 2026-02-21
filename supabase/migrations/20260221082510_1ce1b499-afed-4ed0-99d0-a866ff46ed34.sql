
-- Orders table
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number text NOT NULL DEFAULT ('ORD-' || lpad(floor(random() * 10000)::text, 4, '0')),
  table_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  total numeric NOT NULL DEFAULT 0,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can view orders" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update orders" ON public.orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete orders" ON public.orders FOR DELETE TO authenticated USING (true);

-- Order items table
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name_zh text NOT NULL,
  name_en text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can view order items" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can delete order items" ON public.order_items FOR DELETE TO authenticated USING (true);

-- Trigger: auto-deduct inventory when order status changes to 'completed'
CREATE OR REPLACE FUNCTION public.on_order_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Only fire when status changes TO 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    FOR v_item IN
      SELECT menu_item_id, quantity FROM public.order_items WHERE order_id = NEW.id AND menu_item_id IS NOT NULL
    LOOP
      PERFORM public.deduct_inventory_for_menu_item(v_item.menu_item_id, v_item.quantity, NEW.id::text, 'order');
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_order_completed
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.on_order_completed();

-- Updated_at trigger for orders
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_updated_at();

-- Seed sample orders
INSERT INTO public.orders (id, order_number, table_name, status, total, created_at) VALUES
('a0000001-0000-0000-0000-000000000001', 'ORD-001', 'A1', 'preparing', 468, now() - interval '1 hour'),
('a0000001-0000-0000-0000-000000000002', 'ORD-002', 'B1', 'served', 520, now() - interval '2 hours'),
('a0000001-0000-0000-0000-000000000003', 'ORD-003', 'KTV-1', 'pending', 588, now() - interval '30 minutes'),
('a0000001-0000-0000-0000-000000000004', 'ORD-004', 'C3', 'preparing', 178, now() - interval '45 minutes'),
('a0000001-0000-0000-0000-000000000005', 'ORD-005', 'B4', 'completed', 448, now() - interval '3 hours'),
('a0000001-0000-0000-0000-000000000006', 'ORD-006', 'A2', 'completed', 880, now() - interval '4 hours');

-- Seed order items (no menu_item_id link for legacy data)
INSERT INTO public.order_items (order_id, name_zh, name_en, quantity, unit_price) VALUES
('a0000001-0000-0000-0000-000000000001', '西班牙火腿拼盘', 'Jamón Ibérico Platter', 1, 188),
('a0000001-0000-0000-0000-000000000001', 'Sangria 红酒', 'Sangria', 2, 68),
('a0000001-0000-0000-0000-000000000001', '飞镖区1小时', 'Darts Zone 1hr', 1, 80),
('a0000001-0000-0000-0000-000000000002', '蒜香虾 Gambas', 'Gambas al Ajillo', 1, 128),
('a0000001-0000-0000-0000-000000000002', '精酿啤酒桶 5L', 'Craft Beer Tower 5L', 1, 288),
('a0000001-0000-0000-0000-000000000003', 'KTV包厢2小时', 'Karaoke Room 2hrs', 1, 388),
('a0000001-0000-0000-0000-000000000003', '酒水套餐A', 'Drink Package A', 1, 200),
('a0000001-0000-0000-0000-000000000004', '精酿IPA', 'Craft IPA', 3, 48),
('a0000001-0000-0000-0000-000000000004', '薯条拼盘', 'Loaded Fries', 1, 38),
('a0000001-0000-0000-0000-000000000005', 'Nachos芝士玉米片', 'Loaded Nachos', 1, 68),
('a0000001-0000-0000-0000-000000000005', 'Mojito', 'Mojito', 4, 58),
('a0000001-0000-0000-0000-000000000006', 'Tomahawk战斧牛排', 'Tomahawk Steak', 1, 580),
('a0000001-0000-0000-0000-000000000006', 'Rioja红酒整瓶', 'Rioja Wine (Bottle)', 1, 300);


-- Menu items table for Tapas & Bar
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_zh TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'tapas',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT DEFAULT '',
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Menu items are viewable by everyone"
ON public.menu_items FOR SELECT USING (true);

-- Public write access (no auth in this app currently)
CREATE POLICY "Anyone can insert menu items"
ON public.menu_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update menu items"
ON public.menu_items FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete menu items"
ON public.menu_items FOR DELETE USING (true);

-- Seed data for Tapas & Bar
INSERT INTO public.menu_items (name_zh, name_en, description_zh, description_en, category, price, is_available, is_featured, sort_order) VALUES
('西班牙火腿拼盘', 'Jamón Ibérico Platter', '精选36个月熟成伊比利亚火腿', 'Premium 36-month aged Iberian ham selection', 'tapas', 128, true, true, 1),
('蒜香虾 Gambas', 'Gambas al Ajillo', '橄榄油蒜香虾配烤面包', 'Garlic shrimp in olive oil with toasted bread', 'tapas', 78, true, true, 2),
('西班牙土豆饼', 'Tortilla Española', '经典西班牙鸡蛋土豆饼', 'Classic Spanish potato omelette', 'tapas', 48, true, false, 3),
('烤章鱼', 'Pulpo a la Gallega', '加利西亚风味烤章鱼配烟熏辣椒粉', 'Galician-style grilled octopus with paprika', 'tapas', 98, true, true, 4),
('炸丸子', 'Croquetas de Jamón', '火腿奶油炸丸子', 'Ham and béchamel croquettes', 'tapas', 58, true, false, 5),
('番茄面包', 'Pan con Tomate', '烤面包配新鲜番茄和橄榄油', 'Toasted bread with fresh tomato and olive oil', 'tapas', 38, true, false, 6),
('Tomahawk战斧牛排', 'Tomahawk Steak', '1.2kg澳洲战斧牛排配时蔬', '1.2kg Australian Tomahawk with seasonal vegetables', 'mains', 398, true, true, 7),
('海鲜饭', 'Paella Marinera', '西班牙经典海鲜饭(2人份)', 'Classic Spanish seafood paella (serves 2)', 'mains', 228, true, false, 8),
('烤羊排', 'Costillas de Cordero', '迷迭香烤羊排配薄荷酱', 'Rosemary grilled lamb chops with mint sauce', 'mains', 188, true, false, 9),
('Gin & Tonic', 'Gin & Tonic', 'Hendrick''s金酒配接骨木花汤力水', 'Hendrick''s gin with elderflower tonic', 'cocktails', 68, true, true, 10),
('Sangria红酒', 'Sangria', '经典西班牙水果红酒(杯/壶)', 'Classic Spanish fruit wine punch (glass/pitcher)', 'cocktails', 58, true, true, 11),
('Mojito', 'Mojito', '古巴经典薄荷朗姆鸡尾酒', 'Classic Cuban mint rum cocktail', 'cocktails', 68, true, false, 12),
('Negroni', 'Negroni', '金酒+苦味酒+甜味美思', 'Gin + Campari + Sweet Vermouth', 'cocktails', 78, true, false, 13),
('Espresso Martini', 'Espresso Martini', '浓缩咖啡伏特加马天尼', 'Vodka espresso martini', 'cocktails', 78, true, true, 14),
('Estrella Damm', 'Estrella Damm', '西班牙巴塞罗那精酿啤酒', 'Barcelona craft lager beer', 'drinks', 48, true, false, 15),
('Rioja红酒', 'Rioja Reserva', '里奥哈陈酿红葡萄酒(杯)', 'Rioja Reserva red wine (glass)', 'drinks', 88, true, false, 16),
('Cava气泡酒', 'Cava Brut', '西班牙传统法酿气泡酒', 'Spanish traditional method sparkling wine', 'drinks', 68, true, false, 17),
('焦糖布丁', 'Crema Catalana', '加泰罗尼亚经典焦糖布丁', 'Classic Catalan crème brûlée', 'desserts', 48, true, false, 18),
('巧克力熔岩蛋糕', 'Chocolate Fondant', '热巧克力熔岩蛋糕配冰淇淋', 'Warm chocolate lava cake with ice cream', 'desserts', 58, true, true, 19),
('油条配巧克力酱', 'Churros con Chocolate', '西班牙经典油条配浓巧克力蘸酱', 'Classic Spanish churros with thick chocolate dipping sauce', 'desserts', 48, true, false, 20);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_menu_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.update_menu_items_updated_at();

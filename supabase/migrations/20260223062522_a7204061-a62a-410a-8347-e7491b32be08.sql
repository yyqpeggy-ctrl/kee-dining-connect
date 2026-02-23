
-- ============================================
-- 1. Procurement Orders (采购单) - linked to assets and inventory
-- ============================================
CREATE TABLE public.procurement_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL DEFAULT ('PO-' || lpad((floor(random() * 100000))::text, 5, '0')),
  type TEXT NOT NULL DEFAULT 'asset', -- 'asset', 'inventory', 'service'
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft','pending_approval','approved','ordered','received','paid','cancelled'
  
  -- Supplier info
  supplier_name TEXT NOT NULL DEFAULT '',
  supplier_contact TEXT DEFAULT '',
  
  -- Linked entities
  linked_asset_id UUID REFERENCES public.fixed_assets(id) ON DELETE SET NULL,
  linked_inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  
  -- Financial
  total_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CNY',
  payment_method TEXT DEFAULT '',
  payment_due_date DATE,
  paid_at TIMESTAMPTZ,
  
  -- Contract & compliance
  contract_number TEXT DEFAULT '',
  warranty_months INTEGER DEFAULT 0,
  compliance_checked BOOLEAN NOT NULL DEFAULT false,
  compliance_notes TEXT DEFAULT '',
  
  -- Items detail (JSONB array)
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Store
  store_id TEXT NOT NULL DEFAULT '',
  store_name_zh TEXT NOT NULL DEFAULT '',
  store_name_en TEXT NOT NULL DEFAULT '',
  
  -- Meta
  notes TEXT DEFAULT '',
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.procurement_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view procurement orders" ON public.procurement_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert procurement orders" ON public.procurement_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update procurement orders" ON public.procurement_orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete procurement orders" ON public.procurement_orders FOR DELETE TO authenticated USING (true);

-- ============================================
-- 2. Finance Transactions (财务流水) - the core cross-module ledger
-- ============================================
CREATE TABLE public.finance_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_number TEXT NOT NULL DEFAULT ('FT-' || lpad((floor(random() * 100000))::text, 5, '0')),
  type TEXT NOT NULL DEFAULT 'expense', -- 'income', 'expense', 'transfer', 'depreciation'
  category TEXT NOT NULL DEFAULT '', -- 'asset_purchase','depreciation','salary','rent','revenue','procurement'...
  
  -- Financial
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CNY',
  
  -- Accounting
  debit_account TEXT NOT NULL DEFAULT '',
  credit_account TEXT NOT NULL DEFAULT '',
  
  -- Cross-module links
  linked_asset_id UUID REFERENCES public.fixed_assets(id) ON DELETE SET NULL,
  linked_procurement_id UUID REFERENCES public.procurement_orders(id) ON DELETE SET NULL,
  linked_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  linked_depreciation_id UUID REFERENCES public.asset_depreciation_records(id) ON DELETE SET NULL,
  
  -- Description
  description_zh TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  
  -- Payment
  payment_method TEXT DEFAULT '',
  
  -- Store
  store_id TEXT NOT NULL DEFAULT '',
  store_name_zh TEXT NOT NULL DEFAULT '',
  store_name_en TEXT NOT NULL DEFAULT '',
  
  -- Status & compliance
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending','reviewed','approved','rejected'
  compliance_status TEXT NOT NULL DEFAULT 'unchecked', -- 'unchecked','passed','flagged'
  
  -- Meta
  notes TEXT DEFAULT '',
  created_by UUID,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view finance transactions" ON public.finance_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert finance transactions" ON public.finance_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update finance transactions" ON public.finance_transactions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete finance transactions" ON public.finance_transactions FOR DELETE TO authenticated USING (true);

-- ============================================
-- 3. Trigger: Auto-create finance transaction when asset is registered
-- ============================================
CREATE OR REPLACE FUNCTION public.on_asset_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-create a finance transaction for the asset purchase
  INSERT INTO public.finance_transactions (
    type, category, amount, 
    debit_account, credit_account,
    linked_asset_id,
    description_zh, description_en,
    store_id, store_name_zh, store_name_en,
    status, created_by
  ) VALUES (
    'expense', 'asset_purchase', NEW.original_value,
    '固定资产', '银行存款',
    NEW.id,
    '固定资产购置 - ' || NEW.name_zh,
    'Fixed Asset Purchase - ' || NEW.name_en,
    NEW.store_id, NEW.store_name_zh, NEW.store_name_en,
    'pending', NEW.created_by
  );
  
  -- Auto-create a procurement order for the asset
  INSERT INTO public.procurement_orders (
    type, status, supplier_name,
    linked_asset_id, total_amount,
    store_id, store_name_zh, store_name_en,
    warranty_months, created_by,
    items
  ) VALUES (
    'asset', 'received', COALESCE(NEW.supplier, ''),
    NEW.id, NEW.original_value,
    NEW.store_id, NEW.store_name_zh, NEW.store_name_en,
    CASE WHEN NEW.warranty_expiry IS NOT NULL 
      THEN EXTRACT(MONTH FROM age(NEW.warranty_expiry, CURRENT_DATE))::integer 
      ELSE 0 END,
    NEW.created_by,
    jsonb_build_array(jsonb_build_object(
      'name_zh', NEW.name_zh, 'name_en', NEW.name_en,
      'quantity', 1, 'unit_price', NEW.original_value, 'category', NEW.category
    ))
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_asset_created
AFTER INSERT ON public.fixed_assets
FOR EACH ROW
EXECUTE FUNCTION public.on_asset_created();

-- ============================================
-- 4. Trigger: Auto-create finance entry on depreciation record
-- ============================================
CREATE OR REPLACE FUNCTION public.on_depreciation_recorded()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_asset RECORD;
BEGIN
  SELECT * INTO v_asset FROM public.fixed_assets WHERE id = NEW.asset_id;
  
  INSERT INTO public.finance_transactions (
    type, category, amount,
    debit_account, credit_account,
    linked_asset_id, linked_depreciation_id,
    description_zh, description_en,
    store_id, store_name_zh, store_name_en,
    status
  ) VALUES (
    'expense', 'depreciation', NEW.depreciation_amount,
    '折旧费用', '累计折旧',
    NEW.asset_id, NEW.id,
    v_asset.name_zh || ' - ' || NEW.period || '折旧',
    v_asset.name_en || ' - ' || NEW.period || ' Depreciation',
    v_asset.store_id, v_asset.store_name_zh, v_asset.store_name_en,
    'reviewed'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_depreciation_recorded
AFTER INSERT ON public.asset_depreciation_records
FOR EACH ROW
EXECUTE FUNCTION public.on_depreciation_recorded();

-- ============================================
-- 5. Trigger: Auto-create finance entry when procurement is paid
-- ============================================
CREATE OR REPLACE FUNCTION public.on_procurement_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
    INSERT INTO public.finance_transactions (
      type, category, amount,
      debit_account, credit_account,
      linked_procurement_id, linked_asset_id,
      description_zh, description_en,
      payment_method,
      store_id, store_name_zh, store_name_en,
      status, created_by
    ) VALUES (
      'expense', 'procurement', NEW.total_amount,
      CASE WHEN NEW.type = 'asset' THEN '固定资产' ELSE '原材料' END,
      '银行存款',
      NEW.id, NEW.linked_asset_id,
      '采购付款 - ' || NEW.order_number,
      'Procurement Payment - ' || NEW.order_number,
      NEW.payment_method,
      NEW.store_id, NEW.store_name_zh, NEW.store_name_en,
      'pending', NEW.created_by
    );
    
    -- Update paid_at
    NEW.paid_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_procurement_paid
BEFORE UPDATE ON public.procurement_orders
FOR EACH ROW
EXECUTE FUNCTION public.on_procurement_paid();

-- ============================================
-- 6. Trigger: Auto-create finance entry when order is completed (revenue)
-- ============================================
CREATE OR REPLACE FUNCTION public.on_order_revenue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    INSERT INTO public.finance_transactions (
      type, category, amount,
      debit_account, credit_account,
      linked_order_id,
      description_zh, description_en,
      store_id, store_name_zh, store_name_en,
      status
    ) VALUES (
      'income', 'revenue', NEW.total,
      '银行存款', '主营业务收入',
      NEW.id,
      '订单收入 - ' || NEW.order_number,
      'Order Revenue - ' || NEW.order_number,
      '', '', '',
      'reviewed'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_order_revenue
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.on_order_revenue();

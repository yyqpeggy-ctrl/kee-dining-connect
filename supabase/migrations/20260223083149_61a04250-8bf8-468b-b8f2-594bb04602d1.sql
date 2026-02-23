
-- 供应商主表
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- 基本信息
  name TEXT NOT NULL DEFAULT '',
  short_name TEXT DEFAULT '',
  contact_person TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  -- 银行信息
  bank_name TEXT DEFAULT '',
  bank_branch TEXT DEFAULT '',
  bank_account TEXT DEFAULT '',
  bank_account_name TEXT DEFAULT '',
  -- 开票信息
  tax_id TEXT DEFAULT '',
  invoice_type TEXT DEFAULT 'general',  -- general / vat_special
  invoice_address TEXT DEFAULT '',
  invoice_phone TEXT DEFAULT '',
  invoice_bank_name TEXT DEFAULT '',
  invoice_bank_account TEXT DEFAULT '',
  -- 评级与状态
  rating INTEGER DEFAULT 3,  -- 1-5
  status TEXT NOT NULL DEFAULT 'active',  -- active / inactive / blacklisted
  blacklist_reason TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  -- 元数据
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert suppliers" ON public.suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update suppliers" ON public.suppliers FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete suppliers" ON public.suppliers FOR DELETE USING (true);

-- 供应商合同表
CREATE TABLE public.supplier_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  -- 合同条款
  start_date DATE,
  end_date DATE,
  payment_terms TEXT DEFAULT '',  -- e.g. "月结30天"
  currency TEXT DEFAULT 'CNY',
  -- 合同附件
  file_url TEXT DEFAULT '',
  file_type TEXT DEFAULT 'pdf',
  -- OCR提取数据
  ocr_status TEXT DEFAULT 'none',  -- none / processing / completed / failed
  ocr_extracted_data JSONB DEFAULT '{}',
  -- 从合同中提取的银行信息（可能与供应商主表不同）
  extracted_bank_name TEXT DEFAULT '',
  extracted_bank_account TEXT DEFAULT '',
  extracted_bank_account_name TEXT DEFAULT '',
  -- 从合同中提取的开票信息
  extracted_tax_id TEXT DEFAULT '',
  extracted_invoice_info JSONB DEFAULT '{}',
  -- 状态
  status TEXT NOT NULL DEFAULT 'active',  -- draft / active / expired / terminated
  notes TEXT DEFAULT '',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view contracts" ON public.supplier_contracts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert contracts" ON public.supplier_contracts FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update contracts" ON public.supplier_contracts FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete contracts" ON public.supplier_contracts FOR DELETE USING (true);

-- 在procurement_orders中添加supplier_id外键
ALTER TABLE public.procurement_orders ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id);

-- 合同附件存储桶
INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', false) ON CONFLICT DO NOTHING;

CREATE POLICY "Auth users can upload contracts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'contracts' AND auth.role() = 'authenticated');
CREATE POLICY "Auth users can view contracts" ON storage.objects FOR SELECT USING (bucket_id = 'contracts' AND auth.role() = 'authenticated');
CREATE POLICY "Auth users can delete contracts" ON storage.objects FOR DELETE USING (bucket_id = 'contracts' AND auth.role() = 'authenticated');

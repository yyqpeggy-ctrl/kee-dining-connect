
-- Create invoices table for 发票管理 (Invoice Management)
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL DEFAULT '',
  invoice_code TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'output', -- output(销项) / input(进项)
  invoice_type TEXT NOT NULL DEFAULT 'general', -- general(普票) / special(专票) / electronic(电子发票)
  status TEXT NOT NULL DEFAULT 'pending', -- pending / verified / rejected / voided
  amount NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 0.06,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_with_tax NUMERIC NOT NULL DEFAULT 0,
  buyer_name TEXT DEFAULT '',
  buyer_tax_id TEXT DEFAULT '',
  seller_name TEXT DEFAULT '',
  seller_tax_id TEXT DEFAULT '',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  linked_voucher_id TEXT DEFAULT '',
  linked_procurement_id UUID,
  ocr_status TEXT DEFAULT 'none', -- none / processing / completed / failed
  ocr_result JSONB DEFAULT '{}'::jsonb,
  file_url TEXT DEFAULT '',
  file_type TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  store_id TEXT NOT NULL DEFAULT '',
  store_name_zh TEXT NOT NULL DEFAULT '',
  store_name_en TEXT NOT NULL DEFAULT '',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert invoices" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update invoices" ON public.invoices FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete invoices" ON public.invoices FOR DELETE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for common queries
CREATE INDEX idx_invoices_store_type ON public.invoices(store_id, type);
CREATE INDEX idx_invoices_status ON public.invoices(status);

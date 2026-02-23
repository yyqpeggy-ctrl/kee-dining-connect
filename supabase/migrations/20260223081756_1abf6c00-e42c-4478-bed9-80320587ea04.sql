
-- Create storage bucket for receipt documents
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);

-- Storage policies for receipts bucket
CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete receipts"
ON storage.objects FOR DELETE
USING (bucket_id = 'receipts' AND auth.role() = 'authenticated');

-- Create procurement_receipts table for OCR results
CREATE TABLE public.procurement_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  procurement_order_id UUID REFERENCES public.procurement_orders(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL DEFAULT '',
  file_type TEXT NOT NULL DEFAULT 'image',
  ocr_status TEXT NOT NULL DEFAULT 'pending',
  ocr_result JSONB DEFAULT '{}',
  extracted_items JSONB DEFAULT '[]',
  extracted_total NUMERIC DEFAULT 0,
  extracted_date TEXT DEFAULT '',
  extracted_supplier TEXT DEFAULT '',
  signature_detected BOOLEAN DEFAULT false,
  signature_confidence NUMERIC DEFAULT 0,
  signature_notes TEXT DEFAULT '',
  match_status TEXT NOT NULL DEFAULT 'pending',
  match_details JSONB DEFAULT '{}',
  supplier_invoice_url TEXT DEFAULT '',
  supplier_invoice_ocr JSONB DEFAULT '{}',
  payment_request_status TEXT NOT NULL DEFAULT 'none',
  payment_requested_at TIMESTAMPTZ,
  payment_requested_by UUID,
  store_id TEXT NOT NULL DEFAULT '',
  store_name_zh TEXT NOT NULL DEFAULT '',
  store_name_en TEXT NOT NULL DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.procurement_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view receipts records"
ON public.procurement_receipts FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert receipts records"
ON public.procurement_receipts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update receipts records"
ON public.procurement_receipts FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete receipts records"
ON public.procurement_receipts FOR DELETE
USING (true);


-- Store lease terms: first lease agreement per store
CREATE TABLE public.store_lease_terms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id text NOT NULL,
  store_name_zh text NOT NULL DEFAULT '',
  store_name_en text NOT NULL DEFAULT '',
  lease_start date NOT NULL,
  lease_end date NOT NULL,
  lease_months integer NOT NULL DEFAULT 0,
  landlord_name text DEFAULT '',
  contract_number text DEFAULT '',
  monthly_rent numeric DEFAULT 0,
  notes text DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id)
);

ALTER TABLE public.store_lease_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage lease terms" ON public.store_lease_terms FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_store_lease_terms_updated_at
  BEFORE UPDATE ON public.store_lease_terms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Amortization items: collected pre-opening expenses & fixed assets for amortization
CREATE TABLE public.amortization_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id text NOT NULL,
  store_name_zh text NOT NULL DEFAULT '',
  store_name_en text NOT NULL DEFAULT '',
  item_type text NOT NULL DEFAULT 'opening_expense', -- opening_expense, decoration, fixed_asset, equipment, marketing
  name_zh text NOT NULL DEFAULT '',
  name_en text NOT NULL DEFAULT '',
  total_amount numeric NOT NULL DEFAULT 0,
  amortization_months integer NOT NULL DEFAULT 0, -- derived from lease term
  monthly_amount numeric NOT NULL DEFAULT 0,
  amortized_total numeric NOT NULL DEFAULT 0,
  remaining_amount numeric NOT NULL DEFAULT 0,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  source_type text NOT NULL DEFAULT 'manual', -- manual, bank_remark, ocr, procurement
  source_reference text DEFAULT '', -- bank remark, PO number, etc.
  source_document_id uuid, -- linked procurement_receipt or invoice
  debit_account text NOT NULL DEFAULT '长期待摊费用',
  credit_account text NOT NULL DEFAULT '银行存款',
  -- workflow status
  collection_status text NOT NULL DEFAULT 'ai_suggested', -- ai_suggested, confirmed, rejected
  verification_status text NOT NULL DEFAULT 'pending', -- pending, verified, disputed
  payment_status text NOT NULL DEFAULT 'pending', -- pending, paid, partial
  journal_status text NOT NULL DEFAULT 'pending', -- pending, posted, reviewed
  ai_confidence numeric DEFAULT 0, -- AI classification confidence 0-1
  ai_category_reason text DEFAULT '', -- why AI chose this category
  notes text DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.amortization_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage amortization items" ON public.amortization_items FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_amortization_items_updated_at
  BEFORE UPDATE ON public.amortization_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Monthly amortization journal entries
CREATE TABLE public.amortization_journal (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amortization_item_id uuid NOT NULL REFERENCES public.amortization_items(id) ON DELETE CASCADE,
  store_id text NOT NULL,
  period text NOT NULL, -- e.g. '2025-02'
  amount numeric NOT NULL DEFAULT 0,
  debit_account text NOT NULL DEFAULT '管理费用-摊销',
  credit_account text NOT NULL DEFAULT '长期待摊费用',
  status text NOT NULL DEFAULT 'pending', -- pending, posted, reviewed
  linked_transaction_id uuid, -- link to finance_transactions
  posted_by uuid,
  posted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.amortization_journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage amortization journal" ON public.amortization_journal FOR ALL USING (true) WITH CHECK (true);

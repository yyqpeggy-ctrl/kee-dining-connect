
-- Add contract fields to partners table
ALTER TABLE public.partners
  ADD COLUMN contract_url text DEFAULT '',
  ADD COLUMN contract_file_type text DEFAULT '';

-- Create storage policy for partner contracts in existing contracts bucket
CREATE POLICY "Authenticated users can upload partner contracts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contracts' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view partner contracts"
ON storage.objects FOR SELECT
USING (bucket_id = 'contracts' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete partner contracts"
ON storage.objects FOR DELETE
USING (bucket_id = 'contracts' AND auth.role() = 'authenticated');

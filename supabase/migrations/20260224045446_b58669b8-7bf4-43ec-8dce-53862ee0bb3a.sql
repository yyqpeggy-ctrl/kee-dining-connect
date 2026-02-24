
-- Add version management columns to knowledge_documents
ALTER TABLE public.knowledge_documents
  ADD COLUMN IF NOT EXISTS document_group_id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_latest boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS version_note text;

-- Create index for fast group lookups
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_group ON public.knowledge_documents (document_group_id, version DESC);

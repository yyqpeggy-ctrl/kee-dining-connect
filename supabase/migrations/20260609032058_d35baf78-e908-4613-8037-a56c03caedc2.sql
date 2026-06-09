
DO $$
DECLARE
  tbl TEXT;
  pol RECORD;
  tables TEXT[] := ARRAY[
    'amortization_items','amortization_journal','asset_depreciation_records',
    'daily_procurement_suggestions','data_import_records','data_import_reminders',
    'data_import_schedules','fixed_assets','hr_notifications','invoices',
    'knowledge_documents','lead_activities','leads','partners',
    'procurement_receipts','renovation_projects','store_lease_terms',
    'supplier_contracts','suppliers','video_channels','wechat_extract_jobs',
    'wechat_groups','work_permit_policies','work_permit_policy_alerts'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY "Authenticated users can view %1$s" ON public.%1$I FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "Authenticated users can insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "Authenticated users can update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "Authenticated users can delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL)',
      tbl
    );

    -- Ensure grants are correct: revoke anon, keep authenticated + service_role
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl);
  END LOOP;
END $$;

-- Tighten SECURITY DEFINER function execute grants: remove from anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.deduct_inventory_for_menu_item(uuid, integer, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.deduct_inventory_for_menu_item(uuid, integer, text, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.manual_deduct_inventory(uuid, numeric, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.manual_deduct_inventory(uuid, numeric, text) TO authenticated, service_role;

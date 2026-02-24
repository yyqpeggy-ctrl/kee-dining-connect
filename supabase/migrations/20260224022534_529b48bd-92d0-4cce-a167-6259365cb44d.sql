
-- Add performance tracking columns to partners table
ALTER TABLE public.partners
  ADD COLUMN total_referrals integer DEFAULT 0,
  ADD COLUMN total_revenue numeric DEFAULT 0,
  ADD COLUMN current_month_referrals integer DEFAULT 0,
  ADD COLUMN current_month_revenue numeric DEFAULT 0,
  ADD COLUMN last_referral_at timestamp with time zone DEFAULT NULL;

-- Fix Issue 1: admin_members view - Add RLS policy
-- The admin_members view already uses security_invoker = true
-- We need to ensure only admins can access it

-- First, drop and recreate the view with proper security
DROP VIEW IF EXISTS public.admin_members;

CREATE VIEW public.admin_members
WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  p.email,
  p.avatar_url,
  p.business_name,
  p.business_type,
  p.region,
  p.city,
  p.membership_status,
  p.membership_type_id,
  p.membership_start_date,
  p.membership_expiry_date,
  p.is_public_directory,
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE is_admin();

-- Fix Issue 2: payments table - Replace the overly permissive service role policy
-- The current policy allows ANY insert with true, which is too permissive
-- We should remove this policy since payment insertions should only happen
-- through authenticated edge functions that use service role internally

DROP POLICY IF EXISTS "Service role can insert payments" ON public.payments;

-- Add a policy that only allows inserts via authenticated users for their own payments
-- (Edge functions use service role which bypasses RLS, so we add this for regular users)
-- But actually, we want to PREVENT regular users from inserting payments directly
-- Payment creation should ONLY happen through edge functions

-- Instead, let's create a more restrictive policy that requires admin role for direct inserts
CREATE POLICY "Only admins can insert payments directly" 
ON public.payments 
FOR INSERT 
TO authenticated
WITH CHECK (is_admin());

-- Note: Edge functions using SUPABASE_SERVICE_ROLE_KEY bypass RLS entirely,
-- so the legitimate payment creation via hubtel-callback edge function still works.
-- This policy just prevents regular authenticated users from creating fake payments.
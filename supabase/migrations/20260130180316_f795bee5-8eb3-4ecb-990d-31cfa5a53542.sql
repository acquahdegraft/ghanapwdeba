-- Fix 1: Add RLS policy to admin_members view
-- admin_members is a view with security_invoker = true, but needs explicit RLS policy
-- The view already has security_invoker = true which means RLS is enforced based on underlying table
-- However, we need to ensure only admins can access it

-- Drop and recreate the admin_members view with proper security settings
DROP VIEW IF EXISTS public.admin_members;

CREATE VIEW public.admin_members
WITH (security_invoker = true)
AS
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

-- Add comment to document security
COMMENT ON VIEW public.admin_members IS 'Admin-only view of member profiles. Excludes sensitive fields (disability_type, phone). Access restricted to admin users via is_admin() check in WHERE clause.';

-- Fix 2: Update membership_types SELECT policy to require authentication
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view membership types" ON public.membership_types;

-- Create new policy requiring authentication
CREATE POLICY "Authenticated users can view active membership types" 
ON public.membership_types 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

-- Admins can view all membership types including inactive ones
CREATE POLICY "Admins can view all membership types" 
ON public.membership_types 
FOR SELECT 
USING (is_admin());
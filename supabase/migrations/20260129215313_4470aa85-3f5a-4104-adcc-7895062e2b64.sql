-- Drop the existing admin_members view and recreate it with proper security
DROP VIEW IF EXISTS public.admin_members;

-- Recreate admin_members view with SECURITY DEFINER to enforce admin-only access
-- This view explicitly checks is_admin() so only admins can access member data
CREATE OR REPLACE VIEW public.admin_members
WITH (security_invoker = false)
AS
SELECT 
  id,
  user_id,
  full_name,
  email,
  avatar_url,
  region,
  city,
  business_name,
  business_type,
  membership_status,
  membership_type_id,
  membership_start_date,
  membership_expiry_date,
  is_public_directory,
  created_at,
  updated_at
FROM public.profiles
WHERE is_admin();

-- Grant select on the view to authenticated users
-- The WHERE is_admin() clause ensures only admins see data
GRANT SELECT ON public.admin_members TO authenticated;

-- Add comment explaining security model
COMMENT ON VIEW public.admin_members IS 'Admin-only view of member profiles. Access controlled by is_admin() check in the view definition itself, not relying on underlying RLS policies.';
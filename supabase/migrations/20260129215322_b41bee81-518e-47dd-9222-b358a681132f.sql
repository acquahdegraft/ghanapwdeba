-- Drop and recreate admin_members view with security_invoker and explicit admin check
DROP VIEW IF EXISTS public.admin_members;

-- Recreate admin_members view with SECURITY INVOKER (uses caller's permissions)
-- Combined with explicit is_admin() check in WHERE clause for double security
CREATE OR REPLACE VIEW public.admin_members
WITH (security_invoker = true)
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
-- The WHERE is_admin() clause + underlying RLS ensures only admins see data
GRANT SELECT ON public.admin_members TO authenticated;

-- Add comment explaining security model
COMMENT ON VIEW public.admin_members IS 'Admin-only view of member profiles. Uses security_invoker=true to respect caller permissions, plus explicit is_admin() check in WHERE clause for explicit access control.';
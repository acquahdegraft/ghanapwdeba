-- Fix admin_members view: Add explicit admin check in view definition
-- This ensures only admins can see the data even with security_invoker

DROP VIEW IF EXISTS public.admin_members;
CREATE VIEW public.admin_members
WITH (security_invoker = true, security_barrier = true)
AS SELECT 
    id,
    user_id,
    full_name,
    email,
    avatar_url,
    business_name,
    business_type,
    region,
    city,
    membership_status,
    membership_type_id,
    membership_start_date,
    membership_expiry_date,
    is_public_directory,
    created_at,
    updated_at
FROM profiles
WHERE is_admin();  -- Only return rows when the querying user is an admin

-- Revoke all access from anonymous and public roles
REVOKE ALL ON public.admin_members FROM anon;
REVOKE ALL ON public.admin_members FROM public;

-- Grant access only to authenticated users (admin check is in the view)
GRANT SELECT ON public.admin_members TO authenticated;

-- Add a comment explaining the security model
COMMENT ON VIEW public.admin_members IS 'Admin-only view of member profiles. Uses security_invoker to inherit RLS from profiles table, and includes explicit is_admin() check in WHERE clause for defense in depth.';
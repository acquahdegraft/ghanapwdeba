-- Fix RLS for admin_members view
-- This view already has security_invoker=true and WHERE is_admin() filter
-- Adding RLS and grants for defense in depth

-- Enable RLS on the view (views inherit RLS from underlying tables when security_invoker=true)
-- Ensure security settings are properly configured
DROP VIEW IF EXISTS public.admin_members;

CREATE VIEW public.admin_members
WITH (security_invoker = on, security_barrier = true)
AS
SELECT 
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
FROM public.profiles
WHERE is_admin();

-- Revoke access from public/anon roles
REVOKE ALL ON public.admin_members FROM anon;
REVOKE ALL ON public.admin_members FROM public;

-- Only authenticated users (admins will be filtered by WHERE clause)
GRANT SELECT ON public.admin_members TO authenticated;

-- Fix RLS for directory_members view
-- This view should only show members who opted into the public directory
-- and should require authentication

DROP VIEW IF EXISTS public.directory_members;

CREATE VIEW public.directory_members
WITH (security_invoker = on, security_barrier = true)
AS
SELECT 
    id,
    user_id,
    full_name,
    business_name,
    business_type,
    region,
    city,
    avatar_url,
    membership_status
FROM public.profiles
WHERE is_public_directory = true;

-- Revoke access from public/anon roles
REVOKE ALL ON public.directory_members FROM anon;
REVOKE ALL ON public.directory_members FROM public;

-- Only authenticated users can view the directory (respects privacy)
GRANT SELECT ON public.directory_members TO authenticated;
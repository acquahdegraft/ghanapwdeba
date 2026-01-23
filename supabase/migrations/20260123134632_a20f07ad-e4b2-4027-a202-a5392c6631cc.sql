-- Fix security issue: admin_members and directory_members views need security_invoker = true
-- This ensures they respect the RLS policies on the underlying profiles table

-- Drop and recreate admin_members view with security_invoker
DROP VIEW IF EXISTS public.admin_members;

CREATE VIEW public.admin_members
WITH (security_invoker = true)
AS
SELECT 
    id,
    user_id,
    full_name,
    email,
    business_name,
    business_type,
    region,
    city,
    avatar_url,
    membership_status,
    membership_type_id,
    membership_start_date,
    membership_expiry_date,
    is_public_directory,
    created_at,
    updated_at
FROM profiles p
WHERE is_admin(); -- Only admins can see this data through the view

-- Add comment explaining the security measures
COMMENT ON VIEW public.admin_members IS 'Admin-only view of member profiles. Excludes sensitive PHI fields (disability_type) and phone. Uses security_invoker=true to respect RLS policies.';

-- Drop and recreate directory_members view with security_invoker
DROP VIEW IF EXISTS public.directory_members;

CREATE VIEW public.directory_members
WITH (security_invoker = true)
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
FROM profiles
WHERE is_public_directory = true 
  AND membership_status = 'active'::membership_status;

-- Add comment explaining the security measures
COMMENT ON VIEW public.directory_members IS 'Public directory of active members who opted in. Excludes all sensitive fields (email, phone, disability_type). Uses security_invoker=true to respect RLS policies.';
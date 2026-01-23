-- Fix: Convert directory_members view from SECURITY DEFINER to SECURITY INVOKER
-- and add a proper RLS policy on profiles for directory access

-- Step 1: Drop the existing view
DROP VIEW IF EXISTS public.directory_members;

-- Step 2: Add RLS policy on profiles for authenticated users to view public directory profiles
-- This policy only exposes profiles where is_public_directory=true AND membership_status='active'
CREATE POLICY "Authenticated users can view public directory profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  is_public_directory = true 
  AND membership_status = 'active'::membership_status
);

-- Step 3: Recreate the view with SECURITY INVOKER (default, but explicit for clarity)
-- The view still filters to only non-sensitive fields
CREATE VIEW public.directory_members
WITH (security_barrier = true, security_invoker = true) AS
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
WHERE is_public_directory = true 
  AND membership_status = 'active'::membership_status;

-- Grant select to authenticated users
GRANT SELECT ON public.directory_members TO authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW public.directory_members IS 'Public directory view for authenticated users. Uses SECURITY INVOKER mode with RLS policy on profiles table. Only exposes non-sensitive fields (no email, phone, disability_type) for active members who opted into the directory.';
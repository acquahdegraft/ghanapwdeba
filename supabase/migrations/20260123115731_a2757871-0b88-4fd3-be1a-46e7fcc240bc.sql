-- Recreate the directory_members view with security_barrier to prevent data leakage
-- and use security_definer so it doesn't need RLS policies on profiles

-- Drop and recreate the view as security definer
DROP VIEW IF EXISTS public.directory_members;

CREATE VIEW public.directory_members
WITH (security_barrier = true, security_invoker = false) AS
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

-- Grant select to authenticated users (the view itself controls access, not RLS)
GRANT SELECT ON public.directory_members TO authenticated;

-- Add comment
COMMENT ON VIEW public.directory_members IS 'Public directory view for authenticated users. Only exposes non-sensitive fields (no email, phone, disability_type) for active members who opted into the directory.';
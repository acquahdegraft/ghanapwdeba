-- Create a secure admin members view that excludes sensitive health data (disability_type)
-- This view is for standard admin operations - excludes disability_type and phone for privacy
CREATE OR REPLACE VIEW public.admin_members AS
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  p.email,
  p.business_name,
  p.business_type,
  p.region,
  p.city,
  p.avatar_url,
  p.membership_status,
  p.membership_type_id,
  p.membership_start_date,
  p.membership_expiry_date,
  p.is_public_directory,
  p.created_at,
  p.updated_at
FROM public.profiles p;

-- Grant access to authenticated users (RLS on profiles table will still apply)
GRANT SELECT ON public.admin_members TO authenticated;

-- Use security_invoker so RLS policies on profiles table are enforced
ALTER VIEW public.admin_members SET (security_invoker = true);

-- Add comment documenting why sensitive fields are excluded
COMMENT ON VIEW public.admin_members IS 'Admin view for member management. Excludes sensitive fields (disability_type, phone) for privacy protection. Standard admins should use this view for routine operations.';
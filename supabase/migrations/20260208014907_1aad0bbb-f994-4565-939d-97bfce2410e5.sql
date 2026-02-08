-- Update views to use security_invoker = true for proper RLS inheritance
-- This ensures views respect RLS policies on underlying tables

-- Recreate admin_members view with security_invoker
DROP VIEW IF EXISTS public.admin_members;
CREATE VIEW public.admin_members
WITH (security_invoker = true)
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
FROM profiles p
WHERE is_admin();

-- Recreate directory_members view with security_invoker
DROP VIEW IF EXISTS public.directory_members;
CREATE VIEW public.directory_members
WITH (security_invoker = true)
AS SELECT 
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

-- Recreate payments_safe view with security_invoker
DROP VIEW IF EXISTS public.payments_safe;
CREATE VIEW public.payments_safe
WITH (security_invoker = true)
AS SELECT 
    id,
    user_id,
    amount,
    status,
    payment_date,
    due_date,
    payment_type,
    payment_method,
    transaction_reference,
    notes,
    created_at,
    updated_at,
    CASE
        WHEN is_admin() THEN webhook_token
        ELSE NULL::text
    END AS webhook_token
FROM payments;

-- Grant appropriate permissions
GRANT SELECT ON public.admin_members TO authenticated;
GRANT SELECT ON public.directory_members TO authenticated;
GRANT SELECT ON public.payments_safe TO authenticated;
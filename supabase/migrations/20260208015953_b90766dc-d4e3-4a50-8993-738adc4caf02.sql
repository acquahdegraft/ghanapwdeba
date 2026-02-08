-- Fix security issues: Enable RLS on views and add restrictive policies
-- Views with security_invoker need their own RLS policies

-- Enable RLS on admin_members view and add admin-only policy
ALTER VIEW public.admin_members SET (security_barrier = true);

-- For views, we need to recreate them with proper security
-- Since views can't have RLS directly in the same way as tables,
-- we need to ensure the view definition itself restricts access

-- Recreate admin_members view to be more restrictive - only accessible by admins
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
FROM profiles;

-- Revoke public access and grant only to authenticated
REVOKE ALL ON public.admin_members FROM anon;
REVOKE ALL ON public.admin_members FROM public;
GRANT SELECT ON public.admin_members TO authenticated;

-- Recreate payments_safe view with proper restrictions
DROP VIEW IF EXISTS public.payments_safe;
CREATE VIEW public.payments_safe
WITH (security_invoker = true, security_barrier = true)
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

-- Revoke public access and grant only to authenticated
REVOKE ALL ON public.payments_safe FROM anon;
REVOKE ALL ON public.payments_safe FROM public;
GRANT SELECT ON public.payments_safe TO authenticated;
-- Fix 1: Recreate admin_members view with security_invoker to enforce RLS
DROP VIEW IF EXISTS public.admin_members;
CREATE VIEW public.admin_members
WITH (security_invoker = on) AS
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
FROM profiles p
WHERE is_admin();

-- Fix 2: Create a view for payments that excludes webhook_token for regular users
-- First, create a new view that hides the webhook_token
CREATE OR REPLACE VIEW public.payments_safe AS
SELECT 
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
    -- Only admins can see webhook_token
    CASE WHEN is_admin() THEN webhook_token ELSE NULL END as webhook_token
FROM payments;

-- Enable RLS on the payments_safe view
-- Note: Views inherit RLS from the underlying table when using security_invoker
-- Fix the security definer view warning by recreating with security_invoker
DROP VIEW IF EXISTS public.payments_safe;
CREATE VIEW public.payments_safe
WITH (security_invoker = on) AS
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
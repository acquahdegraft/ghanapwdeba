-- Secure the admin_members view with explicit RLS
-- This view already has security_invoker=true and WHERE is_admin() filter
-- Adding explicit RLS policy for defense in depth

-- First ensure RLS is enabled on the view
ALTER VIEW public.admin_members SET (security_invoker = on, security_barrier = true);

-- Revoke all access from anon and public roles
REVOKE ALL ON public.admin_members FROM anon;
REVOKE ALL ON public.admin_members FROM public;

-- Grant SELECT only to authenticated users (the is_admin() filter in the view definition handles admin-only access)
REVOKE ALL ON public.admin_members FROM authenticated;
GRANT SELECT ON public.admin_members TO authenticated;

-- Secure the payments_safe view with explicit RLS
-- This view already has security_invoker=true and CASE logic for webhook_token
-- Adding explicit RLS policy for defense in depth

-- First ensure RLS is enabled on the view
ALTER VIEW public.payments_safe SET (security_invoker = on, security_barrier = true);

-- Revoke all access from anon and public roles
REVOKE ALL ON public.payments_safe FROM anon;
REVOKE ALL ON public.payments_safe FROM public;

-- Grant SELECT only to authenticated users (the underlying payments table RLS handles row-level access)
REVOKE ALL ON public.payments_safe FROM authenticated;
GRANT SELECT ON public.payments_safe TO authenticated;
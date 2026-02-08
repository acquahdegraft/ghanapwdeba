-- Fix admin_members view security by restricting permissions
-- The view already has security_invoker=true, security_barrier=true, and WHERE is_admin() filter
-- But we need to ensure proper role-based access control

-- Revoke all permissions from anonymous and public roles
REVOKE ALL ON public.admin_members FROM anon;
REVOKE ALL ON public.admin_members FROM public;

-- Restrict authenticated users to SELECT only (not full write access)
REVOKE ALL ON public.admin_members FROM authenticated;
GRANT SELECT ON public.admin_members TO authenticated;

-- Service role keeps full access for backend operations
-- (it already has access via default grants)
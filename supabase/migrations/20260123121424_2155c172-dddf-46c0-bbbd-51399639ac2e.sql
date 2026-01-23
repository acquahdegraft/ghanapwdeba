-- Fix: Remove overly permissive RLS policy that exposes email addresses
-- The directory_members view with SECURITY INVOKER already provides safe access

DROP POLICY IF EXISTS "Authenticated users can view public directory profiles" ON public.profiles;

-- Add comment explaining the security model
COMMENT ON TABLE public.profiles IS 'User profile data. Direct SELECT access restricted to owner, admins, and via directory_members view. Email, phone, and disability_type are never exposed to other users.';
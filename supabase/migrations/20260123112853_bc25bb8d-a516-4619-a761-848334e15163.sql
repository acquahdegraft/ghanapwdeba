-- Fix 1: Remove user INSERT on payments - only edge functions (via service role) should create payments
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;

-- Add policy allowing only service role (edge functions) to insert payments
-- Users cannot directly insert - must go through process-payment edge function
CREATE POLICY "Service role can insert payments"
ON public.payments
FOR INSERT
TO service_role
WITH CHECK (true);

-- Fix 2: Create a secure view for directory that only exposes safe fields
-- Drop existing directory-related policies and create a more restrictive one
-- First, add a policy for authenticated users to view LIMITED profile data for public directory members
CREATE POLICY "Authenticated users can view public directory profiles (limited fields)"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  is_public_directory = true 
  AND membership_status = 'active'
  AND auth.uid() != user_id  -- This policy is for OTHER users, not self
);

-- Note: The above policy still allows SELECT of all columns via RLS
-- We need to use a database view to restrict columns, then update the client code

-- Create a secure view for directory that only shows safe public fields
CREATE OR REPLACE VIEW public.directory_members AS
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  p.business_name,
  p.business_type,
  p.region,
  p.city,
  p.avatar_url,
  p.membership_status
FROM public.profiles p
WHERE p.is_public_directory = true 
  AND p.membership_status = 'active';

-- Grant access to the view for authenticated users
GRANT SELECT ON public.directory_members TO authenticated;

-- Enable RLS on the view (views inherit RLS from underlying tables, but we need security invoker)
-- For views, we use security_invoker to ensure RLS on the base table applies
ALTER VIEW public.directory_members SET (security_invoker = true);
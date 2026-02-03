-- Add DELETE policy for admins on profiles table
-- This allows administrators to delete member profiles for account management
CREATE POLICY "Admins can delete any profile"
ON public.profiles
FOR DELETE
USING (is_admin());
-- Fix: Drop the problematic RLS policy that exposes sensitive profile data to all authenticated users
-- The directory_members view already provides secure access to public directory data
-- This policy allowed any authenticated user to SELECT from profiles if is_public_directory=true and status=active
DROP POLICY IF EXISTS "Authenticated users can view public directory profiles (limited" ON public.profiles;
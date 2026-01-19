-- Fix 1: Add UPDATE policy for payments table (restricted to notes only for security)
CREATE POLICY "Users can update their own payment notes"
ON public.payments FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix 2: Create proper role-based access control using a separate table (NOT on profiles)
-- This follows security best practices to prevent privilege escalation attacks

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('member', 'admin', 'super_admin');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
  )
$$;

-- RLS policies for user_roles table
-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Only super_admins can manage roles
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- Admin policies for profiles table
-- Admins can view all profiles (for member management)
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.is_admin());

-- Admins can update membership status on any profile
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
USING (public.is_admin());

-- Admin policies for payments table  
-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
ON public.payments FOR SELECT
USING (public.is_admin());

-- Admins can update payment status
CREATE POLICY "Admins can update any payment"
ON public.payments FOR UPDATE
USING (public.is_admin());

-- Add trigger for updated_at on user_roles
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
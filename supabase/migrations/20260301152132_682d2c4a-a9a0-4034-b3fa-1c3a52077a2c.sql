
-- Add new business registration fields to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_address text,
  ADD COLUMN IF NOT EXISTS mailing_address text,
  ADD COLUMN IF NOT EXISTS education_level text,
  ADD COLUMN IF NOT EXISTS special_skills text,
  ADD COLUMN IF NOT EXISTS num_permanent_staff integer,
  ADD COLUMN IF NOT EXISTS num_temporary_staff integer,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_branch text,
  ADD COLUMN IF NOT EXISTS bir_registration_number text,
  ADD COLUMN IF NOT EXISTS nis_registration_number text,
  ADD COLUMN IF NOT EXISTS vat_registration_number text,
  ADD COLUMN IF NOT EXISTS has_certificate_of_registration boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_certificate_of_continuance boolean DEFAULT false;

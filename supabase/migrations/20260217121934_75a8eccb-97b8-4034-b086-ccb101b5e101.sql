
-- Change disability_type column from enum to text to support the full list of disability categories
ALTER TABLE public.profiles 
  ALTER COLUMN disability_type TYPE text USING disability_type::text;

-- Drop the old enum type since it's no longer needed
DROP TYPE IF EXISTS public.disability_type;

-- Harden handle_new_user function with input validation and length limits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  safe_name TEXT;
BEGIN
  -- Sanitize and validate user metadata with length limits
  safe_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    'New Member'
  );
  
  -- Limit length to prevent abuse (max 100 characters)
  IF LENGTH(safe_name) > 100 THEN
    safe_name := LEFT(safe_name, 100);
  END IF;
  
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    safe_name,
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
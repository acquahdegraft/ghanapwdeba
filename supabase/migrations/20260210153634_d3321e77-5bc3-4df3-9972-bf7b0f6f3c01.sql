
-- Update handle_new_user to support gender, disability_type, and membership_type_id from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  safe_name TEXT;
  safe_gender TEXT;
  safe_disability TEXT;
  safe_membership_type_id UUID;
BEGIN
  safe_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    'New Member'
  );
  
  IF LENGTH(safe_name) > 100 THEN
    safe_name := LEFT(safe_name, 100);
  END IF;

  -- Extract gender (validate against allowed values)
  safe_gender := NULLIF(TRIM(NEW.raw_user_meta_data->>'gender'), '');
  IF safe_gender IS NOT NULL AND safe_gender NOT IN ('male', 'female', 'prefer_not_to_say') THEN
    safe_gender := NULL;
  END IF;

  -- Extract disability_type (validate against enum)
  safe_disability := NULLIF(TRIM(NEW.raw_user_meta_data->>'disability_type'), '');
  IF safe_disability IS NOT NULL THEN
    BEGIN
      PERFORM safe_disability::disability_type;
    EXCEPTION WHEN OTHERS THEN
      safe_disability := NULL;
    END;
  END IF;

  -- Extract membership_type_id (validate it's a valid UUID and exists)
  BEGIN
    safe_membership_type_id := (NEW.raw_user_meta_data->>'membership_type_id')::UUID;
    IF safe_membership_type_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.membership_types WHERE id = safe_membership_type_id AND is_active = true) THEN
        safe_membership_type_id := NULL;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    safe_membership_type_id := NULL;
  END;
  
  INSERT INTO public.profiles (user_id, full_name, email, gender, disability_type, membership_type_id)
  VALUES (
    NEW.id,
    safe_name,
    NEW.email,
    safe_gender,
    safe_disability::disability_type,
    safe_membership_type_id
  );
  RETURN NEW;
END;
$function$;

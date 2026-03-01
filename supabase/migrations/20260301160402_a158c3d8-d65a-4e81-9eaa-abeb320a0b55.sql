
-- Add view_count directly to portfolios table for simplicity
ALTER TABLE public.portfolios ADD COLUMN view_count integer NOT NULL DEFAULT 0;

-- Create a security definer function to increment views (avoids needing update RLS for anon)
CREATE OR REPLACE FUNCTION public.increment_portfolio_view(portfolio_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.portfolios
  SET view_count = view_count + 1
  WHERE slug = portfolio_slug AND is_published = true;
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.increment_portfolio_view(text) TO anon, authenticated;

-- Update the public view to include view_count
DROP VIEW IF EXISTS public.public_portfolios;

CREATE VIEW public.public_portfolios
WITH (security_invoker = true, security_barrier = true)
AS
SELECT
  p.id,
  p.slug,
  p.headline,
  p.bio,
  p.services,
  p.skills,
  p.years_of_experience,
  p.portfolio_images,
  p.website_url,
  p.social_links,
  p.is_featured,
  p.view_count,
  pr.full_name,
  pr.business_name,
  pr.business_type,
  pr.avatar_url,
  pr.region,
  pr.city
FROM public.portfolios p
JOIN public.profiles pr ON pr.user_id = p.user_id
WHERE p.is_published = true;

GRANT SELECT ON public.public_portfolios TO anon, authenticated;

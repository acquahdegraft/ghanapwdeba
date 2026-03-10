
DROP VIEW IF EXISTS public.public_portfolios;

CREATE VIEW public.public_portfolios AS
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
  p.logo_url,
  pr.full_name,
  pr.business_name,
  pr.business_type,
  pr.avatar_url,
  pr.region,
  pr.city
FROM public.portfolios p
JOIN public.profiles pr ON p.user_id = pr.user_id
WHERE p.is_published = true;

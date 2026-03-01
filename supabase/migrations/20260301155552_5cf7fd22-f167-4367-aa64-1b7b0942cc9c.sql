
-- Create portfolio-images storage bucket (public for display)
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio-images', 'portfolio-images', true);

-- RLS for portfolio-images bucket
CREATE POLICY "Users can upload own portfolio images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'portfolio-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own portfolio images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'portfolio-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own portfolio images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'portfolio-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view portfolio images"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'portfolio-images');

-- Add is_featured column to portfolios
ALTER TABLE public.portfolios ADD COLUMN is_featured boolean NOT NULL DEFAULT false;

-- Drop and recreate the public view to include is_featured and portfolio_images
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

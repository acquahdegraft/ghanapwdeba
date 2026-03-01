
-- Create portfolios table
CREATE TABLE public.portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  headline text NOT NULL DEFAULT '',
  bio text DEFAULT '',
  services text[] DEFAULT '{}',
  skills text[] DEFAULT '{}',
  years_of_experience integer DEFAULT NULL,
  portfolio_images text[] DEFAULT '{}',
  website_url text DEFAULT NULL,
  social_links jsonb DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- Users can view their own portfolio
CREATE POLICY "Users can view own portfolio"
  ON public.portfolios FOR SELECT
  USING (auth.uid() = user_id);

-- Public can view published portfolios
CREATE POLICY "Public can view published portfolios"
  ON public.portfolios FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Only active members can insert their own portfolio (one per user enforced by UNIQUE)
CREATE POLICY "Active members can create portfolio"
  ON public.portfolios FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.membership_status = 'active'
    )
  );

-- Users can update their own portfolio
CREATE POLICY "Users can update own portfolio"
  ON public.portfolios FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own portfolio
CREATE POLICY "Users can delete own portfolio"
  ON public.portfolios FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all portfolios
CREATE POLICY "Admins can manage all portfolios"
  ON public.portfolios FOR ALL
  USING (is_admin());

-- Create a public view for portfolio listings
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
  pr.full_name,
  pr.business_name,
  pr.business_type,
  pr.avatar_url,
  pr.region,
  pr.city
FROM public.portfolios p
JOIN public.profiles pr ON pr.user_id = p.user_id
WHERE p.is_published = true;

-- Grant access to public view
GRANT SELECT ON public.public_portfolios TO anon, authenticated;

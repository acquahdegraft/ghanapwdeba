-- Add is_active column to membership_types for deactivation support
ALTER TABLE public.membership_types 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_by UUID NOT NULL,
  publish_date TIMESTAMP WITH TIME ZONE,
  expire_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- RLS policies for announcements
CREATE POLICY "Admins can manage announcements" 
ON public.announcements 
FOR ALL 
USING (is_admin());

CREATE POLICY "Published announcements are viewable by authenticated users" 
ON public.announcements 
FOR SELECT 
USING (
  is_published = true 
  AND (publish_date IS NULL OR publish_date <= now())
  AND (expire_date IS NULL OR expire_date > now())
);

-- Add trigger for updated_at
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add RLS policies for membership_types management by admins
CREATE POLICY "Admins can insert membership types" 
ON public.membership_types 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update membership types" 
ON public.membership_types 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete membership types" 
ON public.membership_types 
FOR DELETE 
USING (is_admin());
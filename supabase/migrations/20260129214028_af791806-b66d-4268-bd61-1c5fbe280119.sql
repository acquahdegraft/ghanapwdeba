-- Create resources table for storing documents and guides
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  file_url TEXT,
  external_url TEXT,
  file_type TEXT,
  file_size INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Published resources viewable by authenticated users
CREATE POLICY "Published resources viewable by authenticated users"
ON public.resources
FOR SELECT
USING (is_published = true AND auth.uid() IS NOT NULL);

-- Admins can manage all resources
CREATE POLICY "Admins can manage all resources"
ON public.resources
FOR ALL
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for resources
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resources', 'resources', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for resources bucket
CREATE POLICY "Authenticated users can view resource files"
ON storage.objects FOR SELECT
USING (bucket_id = 'resources' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can upload resource files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resources' AND is_admin());

CREATE POLICY "Admins can update resource files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'resources' AND is_admin());

CREATE POLICY "Admins can delete resource files"
ON storage.objects FOR DELETE
USING (bucket_id = 'resources' AND is_admin());
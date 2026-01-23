-- Fix avatar storage security: Make bucket private and update RLS policies
-- The bucket was public but code uses signed URLs, creating inconsistency

-- Make the avatars bucket private
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Drop existing storage policies for avatars bucket
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create new RLS policies for private bucket access
-- Authenticated users can view any avatar (needed for directory display)
CREATE POLICY "Authenticated users can view avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Users can upload their own avatar
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatar
CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);
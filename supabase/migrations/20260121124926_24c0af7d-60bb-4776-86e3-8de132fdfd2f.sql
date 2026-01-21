-- Make avatars bucket private instead of public
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Drop the existing public SELECT policy for avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Create new SELECT policy that requires authentication
CREATE POLICY "Authenticated users can view avatars" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'avatars');
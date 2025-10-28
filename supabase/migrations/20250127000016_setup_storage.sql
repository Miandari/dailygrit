-- =====================================================
-- SETUP STORAGE BUCKETS FOR FILE UPLOADS
-- =====================================================

-- Create storage bucket for challenge uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'challenge-uploads',
    'challenge-uploads',
    true, -- Public bucket for images
    5242880, -- 5MB max file size
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create storage policies
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'challenge-uploads'
    AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'challenge-uploads'
    AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'challenge-uploads'
    AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view uploaded files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'challenge-uploads');

-- Add file_urls column to daily_entries if it doesn't exist
ALTER TABLE public.daily_entries
ADD COLUMN IF NOT EXISTS file_urls TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add avatar_url column to challenges if it doesn't exist
ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

COMMENT ON COLUMN public.daily_entries.file_urls IS 'Array of uploaded file URLs for this entry';
COMMENT ON COLUMN public.challenges.cover_image_url IS 'Cover image URL for the challenge';
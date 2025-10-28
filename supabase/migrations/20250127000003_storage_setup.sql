-- =====================================================
-- STORAGE BUCKETS AND POLICIES
-- =====================================================

-- Create storage bucket for challenge uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'challenge-uploads',
    'challenge-uploads',
    true,
    5242880, -- 5MB max file size
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Users can upload their own files
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'challenge-uploads'
    AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Users can update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'challenge-uploads'
    AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Users can delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'challenge-uploads'
    AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Anyone can view uploaded files (public bucket)
CREATE POLICY "Anyone can view uploaded files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'challenge-uploads');
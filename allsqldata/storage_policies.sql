-- =====================================================
-- STORAGE RLS POLICIES FOR RECEIPTS BUCKET
-- =====================================================
-- Run this in Supabase SQL Editor to enable receipt uploads

-- 1. Allow authenticated users to upload receipts
CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipts');

-- 2. Allow authenticated users to update their receipts
CREATE POLICY "Authenticated users can update receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'receipts')
WITH CHECK (bucket_id = 'receipts');

-- 3. Allow public read access to receipts (since bucket is public)
CREATE POLICY "Public read access for receipts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'receipts');

-- 4. Allow authenticated users to delete receipts (Optional but good to have)
CREATE POLICY "Authenticated users can delete receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'receipts');

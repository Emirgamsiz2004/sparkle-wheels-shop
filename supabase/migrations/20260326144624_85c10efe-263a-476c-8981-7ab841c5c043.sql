CREATE POLICY "Public can upload test drive files"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'test-drive-files');

DROP POLICY IF EXISTS "Anyone can upload consignatie photos" ON storage.objects;
CREATE POLICY "Anyone can upload consignatie photos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'consignatie-fotos'
  AND lower(storage.extension(name)) = ANY (ARRAY['jpg','jpeg','png','webp','heic','heif'])
);

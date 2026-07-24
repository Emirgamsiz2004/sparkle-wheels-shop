
-- Tighten consignatie-fotos INSERT: require folder = valid consignatie_aanmeldingen id
CREATE OR REPLACE FUNCTION public.consignatie_submission_exists(p_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.consignatie_aanmeldingen WHERE id = p_id); $$;

DROP POLICY IF EXISTS "Anyone can upload consignatie photos" ON storage.objects;
CREATE POLICY "Anyone can upload consignatie photos"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'consignatie-fotos'
  AND lower(storage.extension(name)) = ANY (ARRAY['jpg','jpeg','png','webp','heic','heif'])
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND public.consignatie_submission_exists(((storage.foldername(name))[1])::uuid)
);

-- Tighten test-drive-files INSERT: require folder = ${id}/${token} matching test_drives row
CREATE OR REPLACE FUNCTION public.test_drive_accepts_anon_upload_with_token(p_id uuid, p_token text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.test_drives
    WHERE id = p_id AND token = p_token
      AND status = 'wacht_op_klant' AND formulier_ingevuld_op IS NULL
  );
$$;

DROP POLICY IF EXISTS "Anon can upload to test-drive-files under uuid folder" ON storage.objects;
CREATE POLICY "Anon can upload to test-drive-files under uuid+token folder"
ON storage.objects FOR INSERT TO anon
WITH CHECK (
  bucket_id = 'test-drive-files'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND (storage.foldername(name))[2] IS NOT NULL
  AND length((storage.foldername(name))[2]) >= 16
  AND public.test_drive_accepts_anon_upload_with_token(
    ((storage.foldername(name))[1])::uuid,
    (storage.foldername(name))[2]
  )
);

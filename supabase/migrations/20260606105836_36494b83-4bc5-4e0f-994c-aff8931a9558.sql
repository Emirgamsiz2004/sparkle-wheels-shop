
CREATE OR REPLACE FUNCTION public.test_drive_accepts_anon_upload(p_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.test_drives
    WHERE id = p_id
      AND status = 'wacht_op_klant'
      AND formulier_ingevuld_op IS NULL
  );
$$;

DROP POLICY IF EXISTS "Anon can upload to test-drive-files under uuid folder" ON storage.objects;

CREATE POLICY "Anon can upload to test-drive-files under uuid folder"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'test-drive-files'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND public.test_drive_accepts_anon_upload(((storage.foldername(name))[1])::uuid)
);

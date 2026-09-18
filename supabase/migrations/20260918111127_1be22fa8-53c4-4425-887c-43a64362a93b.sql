CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.inruil_submission_exists(p_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (SELECT 1 FROM public.inruil_aanmeldingen WHERE id = p_id)
$$;

REVOKE ALL ON FUNCTION private.inruil_submission_exists(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.inruil_submission_exists(uuid) TO anon, authenticated, service_role;

ALTER POLICY "Applicants can upload trade in photos"
ON storage.objects
WITH CHECK (
  bucket_id = 'inruil-fotos'
  AND lower(storage.extension(name)) = ANY (ARRAY['jpg', 'jpeg', 'png', 'webp'])
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND private.inruil_submission_exists(((storage.foldername(name))[1])::uuid)
);

DROP FUNCTION public.inruil_submission_exists(uuid);
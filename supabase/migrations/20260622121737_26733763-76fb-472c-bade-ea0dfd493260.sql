
-- Restrict profiles read access to staff or own row
DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;
CREATE POLICY "Staff or self can read profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()) OR user_id = auth.uid());

-- Storage: test-drive-files – staff-only management (keep anon upload policy)
DROP POLICY IF EXISTS "Auth users can manage test-drive-files" ON storage.objects;
CREATE POLICY "Staff can manage test-drive-files"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'test-drive-files' AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id = 'test-drive-files' AND public.is_staff(auth.uid()));

-- Storage: vehicle-documents – staff-only read/write/delete
DROP POLICY IF EXISTS "Auth users can view vehicle docs" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can upload vehicle docs" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can delete vehicle docs" ON storage.objects;
CREATE POLICY "Staff can view vehicle docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'vehicle-documents' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff can upload vehicle docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vehicle-documents' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff can delete vehicle docs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'vehicle-documents' AND public.is_staff(auth.uid()));

-- Storage: vehicle-photos – staff-only write/delete (public read kept)
DROP POLICY IF EXISTS "Auth users can upload vehicle photos" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can delete vehicle photos" ON storage.objects;
CREATE POLICY "Staff can upload vehicle photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vehicle-photos' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff can delete vehicle photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'vehicle-photos' AND public.is_staff(auth.uid()));

-- Update sync-aanbetalingen cron job to use service_role JWT (instead of anon)
SELECT cron.unschedule('sync-aanbetalingen-15min');
SELECT cron.schedule(
  'sync-aanbetalingen-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://leykexzdvatuyitkxdxs.supabase.co/functions/v1/sync-aanbetalingen',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

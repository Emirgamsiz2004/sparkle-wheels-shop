
-- 1. app_settings: restrict writes to admins
DROP POLICY IF EXISTS "Auth users can CRUD app_settings" ON public.app_settings;

CREATE POLICY "Auth users can read app_settings"
ON public.app_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert app_settings"
ON public.app_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update app_settings"
ON public.app_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete app_settings"
ON public.app_settings FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. user_roles: explicit admin-only write policies
CREATE POLICY "Admins can insert user_roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user_roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user_roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Restrict anonymous uploads to test-drive-files to a UUID-prefixed folder
DROP POLICY IF EXISTS "Anon can upload to test-drive-files" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload test drive files" ON storage.objects;

CREATE POLICY "Anon can upload to test-drive-files under uuid folder"
ON storage.objects FOR INSERT TO anon
WITH CHECK (
  bucket_id = 'test-drive-files'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND EXISTS (
    SELECT 1 FROM public.test_drives td
    WHERE td.id::text = (storage.foldername(name))[1]
  )
);


INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE lower(email) = lower('Emirgamsiz67@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin'::public.app_role, 'medewerker'::public.app_role)
  )
$$;

DROP POLICY IF EXISTS "Auth users can CRUD aanbetalingen" ON public.aanbetalingen;
CREATE POLICY "Staff can manage aanbetalingen" ON public.aanbetalingen
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Auth users can manage bookings" ON public.bookings;
CREATE POLICY "Staff can manage bookings" ON public.bookings
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Auth users can CRUD consignatie_overeenkomsten" ON public.consignatie_overeenkomsten;
CREATE POLICY "Staff can manage consignatie_overeenkomsten" ON public.consignatie_overeenkomsten
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Auth users can CRUD customers" ON public.customers;
CREATE POLICY "Staff can manage customers" ON public.customers
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Auth users can read inkoopverklaringen" ON public.inkoopverklaringen;
DROP POLICY IF EXISTS "Auth users can insert inkoopverklaringen" ON public.inkoopverklaringen;
DROP POLICY IF EXISTS "Auth users can update inkoopverklaringen" ON public.inkoopverklaringen;
CREATE POLICY "Staff can manage inkoopverklaringen" ON public.inkoopverklaringen
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Auth users can CRUD test_drive_customers" ON public.test_drive_customers;
CREATE POLICY "Staff can manage test_drive_customers" ON public.test_drive_customers
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Auth users can CRUD test_drives" ON public.test_drives;
DROP POLICY IF EXISTS "Authenticated users can delete test drives" ON public.test_drives;
CREATE POLICY "Staff can manage test_drives" ON public.test_drives
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Auth users can CRUD vehicles" ON public.vehicles;
CREATE POLICY "Staff can manage vehicles" ON public.vehicles
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Auth users can CRUD verkopen" ON public.verkopen;
CREATE POLICY "Staff can manage verkopen" ON public.verkopen
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

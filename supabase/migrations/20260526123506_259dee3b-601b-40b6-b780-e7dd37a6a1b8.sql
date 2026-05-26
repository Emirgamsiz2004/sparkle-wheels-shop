-- 1. BOOKINGS: remove public select of PII; expose only slot times via RPC
DROP POLICY IF EXISTS "Public can read booking slots" ON public.bookings;

CREATE OR REPLACE FUNCTION public.get_booked_slots(p_date date)
RETURNS TABLE(starttijd time, eindtijd time)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT starttijd, eindtijd
  FROM public.bookings
  WHERE datum = p_date AND status = 'bevestigd';
$$;
GRANT EXECUTE ON FUNCTION public.get_booked_slots(date) TO anon, authenticated;

-- 2. CUSTOMERS: remove anon SELECT and UPDATE (keep INSERT for forms)
DROP POLICY IF EXISTS "Anon can read customers by email" ON public.customers;
DROP POLICY IF EXISTS "Anon can update customers" ON public.customers;

-- 3. TEST_DRIVE_CUSTOMERS: remove anon SELECT (keep INSERT for forms)
DROP POLICY IF EXISTS "Public can read own customer by email" ON public.test_drive_customers;

-- 4. TEST_DRIVES: replace open anon SELECT/UPDATE with token-scoped RPCs
DROP POLICY IF EXISTS "Public can read test_drive by token" ON public.test_drives;
DROP POLICY IF EXISTS "Public can update test_drive by token" ON public.test_drives;

CREATE OR REPLACE FUNCTION public.get_test_drive_by_token(p_token text)
RETURNS SETOF public.test_drives
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.test_drives WHERE token = p_token LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_test_drive_by_token(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_proefrit_form(
  p_token text,
  p_voornaam text,
  p_achternaam text,
  p_email text,
  p_telefoon text,
  p_adres text,
  p_postcode text,
  p_plaats text,
  p_geboortedatum date,
  p_rijbewijsnummer text,
  p_rijbewijscategorie text,
  p_rijbewijs_foto_path text,
  p_handtekening_data text,
  p_opmerkingen text,
  p_ip_adres text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_td_id uuid;
  v_cust_id uuid;
  v_crm_id uuid;
  v_already_filled timestamptz;
BEGIN
  SELECT id, formulier_ingevuld_op INTO v_td_id, v_already_filled
  FROM public.test_drives
  WHERE token = p_token
  LIMIT 1;

  IF v_td_id IS NULL THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;

  IF v_already_filled IS NOT NULL THEN
    RAISE EXCEPTION 'already_submitted';
  END IF;

  -- Upsert test_drive_customers
  SELECT id INTO v_cust_id FROM public.test_drive_customers WHERE email = p_email LIMIT 1;
  IF v_cust_id IS NULL THEN
    INSERT INTO public.test_drive_customers
      (voornaam, achternaam, email, telefoon, adres, postcode, plaats, geboortedatum, rijbewijsnummer, rijbewijscategorie, rijbewijs_foto_path)
    VALUES
      (p_voornaam, p_achternaam, p_email, p_telefoon, p_adres, p_postcode, p_plaats, p_geboortedatum, p_rijbewijsnummer, p_rijbewijscategorie, p_rijbewijs_foto_path)
    RETURNING id INTO v_cust_id;
  ELSE
    UPDATE public.test_drive_customers
       SET voornaam = p_voornaam,
           achternaam = p_achternaam,
           telefoon = p_telefoon,
           adres = p_adres,
           postcode = p_postcode,
           plaats = p_plaats,
           geboortedatum = p_geboortedatum,
           rijbewijsnummer = p_rijbewijsnummer,
           rijbewijscategorie = p_rijbewijscategorie,
           rijbewijs_foto_path = p_rijbewijs_foto_path
     WHERE id = v_cust_id;
  END IF;

  -- CRM upsert
  SELECT id INTO v_crm_id FROM public.customers WHERE email = p_email LIMIT 1;
  IF v_crm_id IS NULL THEN
    INSERT INTO public.customers
      (voornaam, achternaam, email, telefoon, adres, postcode, plaats, geboortedatum, status, laatste_contact)
    VALUES
      (p_voornaam, p_achternaam, p_email, p_telefoon, p_adres, p_postcode, p_plaats, p_geboortedatum, 'prospect', now());
  ELSE
    UPDATE public.customers
       SET voornaam = p_voornaam,
           achternaam = p_achternaam,
           telefoon = p_telefoon,
           adres = COALESCE(p_adres, adres),
           postcode = COALESCE(p_postcode, postcode),
           plaats = COALESCE(p_plaats, plaats),
           geboortedatum = COALESCE(p_geboortedatum, geboortedatum),
           laatste_contact = now()
     WHERE id = v_crm_id;
  END IF;

  UPDATE public.test_drives
     SET customer_id = v_cust_id,
         handtekening_data = p_handtekening_data,
         opmerkingen_voor = p_opmerkingen,
         formulier_ingevuld_op = now(),
         vertrek_tijd = now(),
         status = 'actief',
         ip_adres = p_ip_adres
   WHERE id = v_td_id;

  RETURN v_td_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_proefrit_form(text,text,text,text,text,text,text,text,date,text,text,text,text,text,text) TO anon, authenticated;

-- 5. TEST-DRIVE-FILES STORAGE: remove anon SELECT
DROP POLICY IF EXISTS "Anon can read test-drive-files" ON storage.objects;

-- 6. DEALS: lock down to authenticated only
DROP POLICY IF EXISTS "Allow all access to deals" ON public.deals;
CREATE POLICY "Auth users can CRUD deals"
  ON public.deals
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7. VERKOPEN + VERKOOP_DOCUMENTEN: enable RLS + authenticated CRUD
ALTER TABLE public.verkopen ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users can CRUD verkopen" ON public.verkopen;
CREATE POLICY "Auth users can CRUD verkopen"
  ON public.verkopen
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.verkoop_documenten ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users can CRUD verkoop_documenten" ON public.verkoop_documenten;
CREATE POLICY "Auth users can CRUD verkoop_documenten"
  ON public.verkoop_documenten
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 8. USER_ROLES: restrict SELECT to own user only
DROP POLICY IF EXISTS "Authenticated users can read roles" ON public.user_roles;
CREATE POLICY "Users can read own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 9. Pin search_path on legacy function
CREATE OR REPLACE FUNCTION public.notify_make_vehicle_created()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
begin
  perform net.http_post(
    url := 'https://hook.eu1.make.com/dqt33t15bylujh6frpmjfx760bn7werp',
    body := jsonb_build_object(
      'event_type', 'vehicle.created',
      'id', NEW.id,
      'merk', NEW.merk,
      'model', NEW.model,
      'bouwjaar', NEW.bouwjaar,
      'kleur', NEW.kleur,
      'kenteken', NEW.kenteken,
      'status', NEW.status,
      'inkoopprijs', NEW.inkoopprijs,
      'inkoop_datum', NEW.inkoop_datum
    )
  );
  return NEW;
end;
$function$;
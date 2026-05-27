
-- 1. Remove anon insert on customers (admin-only intake)
DROP POLICY IF EXISTS "Anon can insert customers" ON public.customers;

-- 2. Remove direct anon insert on test_drive_customers (use RPC submit_proefrit_form)
DROP POLICY IF EXISTS "Public can insert test_drive_customers" ON public.test_drive_customers;

-- 3. Restrict notifications insert: only service_role can target arbitrary users
DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 4. Bookings: replace anon direct insert with a SECURITY DEFINER RPC that validates input
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;

CREATE OR REPLACE FUNCTION public.submit_booking(
  p_naam text,
  p_telefoon text,
  p_email text,
  p_voertuig_type text,
  p_pakket text,
  p_extras jsonb,
  p_totaal_prijs numeric,
  p_totaal_minuten integer,
  p_datum date,
  p_starttijd time,
  p_eindtijd time,
  p_opmerking text,
  p_voornaam text,
  p_achternaam text,
  p_diensten text[],
  p_diensten_notitie text,
  p_onderwerp text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_dt_start timestamptz;
  v_dt_end timestamptz;
BEGIN
  -- Basic input validation
  IF length(coalesce(p_naam,'')) < 2 OR length(p_naam) > 120 THEN RAISE EXCEPTION 'invalid_name'; END IF;
  IF p_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' OR length(p_email) > 200 THEN RAISE EXCEPTION 'invalid_email'; END IF;
  IF length(coalesce(p_telefoon,'')) < 6 OR length(p_telefoon) > 30 THEN RAISE EXCEPTION 'invalid_phone'; END IF;
  IF p_totaal_prijs IS NULL OR p_totaal_prijs < 0 OR p_totaal_prijs > 100000 THEN RAISE EXCEPTION 'invalid_price'; END IF;
  IF p_totaal_minuten IS NULL OR p_totaal_minuten <= 0 OR p_totaal_minuten > 1440 THEN RAISE EXCEPTION 'invalid_duration'; END IF;
  IF p_datum IS NULL OR p_datum < CURRENT_DATE OR p_datum > CURRENT_DATE + INTERVAL '1 year' THEN RAISE EXCEPTION 'invalid_date'; END IF;
  IF coalesce(length(p_opmerking),0) > 2000 THEN RAISE EXCEPTION 'opmerking_too_long'; END IF;

  INSERT INTO public.bookings (
    naam, telefoon, email, voertuig_type, pakket, extras,
    totaal_prijs, totaal_minuten, datum, starttijd, eindtijd, status, opmerking
  ) VALUES (
    p_naam, p_telefoon, p_email, p_voertuig_type, p_pakket, p_extras,
    p_totaal_prijs, p_totaal_minuten, p_datum, p_starttijd, p_eindtijd, 'bevestigd', p_opmerking
  ) RETURNING id INTO v_id;

  -- Mirror to appointments
  v_dt_start := (p_datum::text || ' ' || p_starttijd::text)::timestamptz;
  v_dt_end   := (p_datum::text || ' ' || p_eindtijd::text)::timestamptz;

  INSERT INTO public.appointments (
    type, datum_tijd, eind_datum_tijd, status, bron, is_aanvraag,
    diensten, diensten_notitie, geschatte_duur_minuten, betalingsstatus,
    aanvrager_voornaam, aanvrager_achternaam, aanvrager_telefoon, aanvrager_email,
    notities, onderwerp
  ) VALUES (
    'poetsbeurt', v_dt_start, v_dt_end, 'gepland', 'website', false,
    p_diensten, p_diensten_notitie, p_totaal_minuten, 'openstaand',
    p_voornaam, p_achternaam, p_telefoon, p_email,
    nullif(p_opmerking,''), p_onderwerp
  );

  RETURN v_id;
END $$;

REVOKE ALL ON FUNCTION public.submit_booking(text,text,text,text,text,jsonb,numeric,integer,date,time,time,text,text,text,text[],text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_booking(text,text,text,text,text,jsonb,numeric,integer,date,time,time,text,text,text,text[],text,text) TO anon, authenticated;

-- 5. Signatures bucket: make private + restrict reads to authenticated
UPDATE storage.buckets SET public = false WHERE id = 'signatures';
DROP POLICY IF EXISTS "Public can read signatures" ON storage.objects;
CREATE POLICY "Authenticated can read signatures"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'signatures');

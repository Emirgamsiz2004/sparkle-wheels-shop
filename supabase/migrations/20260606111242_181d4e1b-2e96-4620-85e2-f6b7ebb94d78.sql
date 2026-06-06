
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS bron text;

-- Backfill in priority order; first matching source wins
UPDATE public.customers c SET bron = 'proefrit'
WHERE bron IS NULL AND EXISTS (SELECT 1 FROM public.test_drives t WHERE t.customer_id = c.id);

UPDATE public.customers c SET bron = 'aanbetaling'
WHERE bron IS NULL AND EXISTS (
  SELECT 1 FROM public.aanbetalingen a 
  WHERE (a.klant_email IS NOT NULL AND lower(a.klant_email) = lower(c.email))
);

UPDATE public.customers c SET bron = 'verkoop'
WHERE bron IS NULL AND EXISTS (SELECT 1 FROM public.verkopen v WHERE v.customer_id = c.id);

UPDATE public.customers c SET bron = 'afspraak'
WHERE bron IS NULL AND EXISTS (SELECT 1 FROM public.appointments a WHERE a.customer_id = c.id);

UPDATE public.customers c SET bron = 'lead'
WHERE bron IS NULL AND EXISTS (SELECT 1 FROM public.leads l WHERE l.customer_id = c.id);

UPDATE public.customers c SET bron = 'handmatig' WHERE bron IS NULL;

ALTER TABLE public.customers ALTER COLUMN bron SET DEFAULT 'handmatig';

-- Also set bron via submit_proefrit_form RPC for newly-created customers
CREATE OR REPLACE FUNCTION public.submit_proefrit_form(p_token text, p_voornaam text, p_achternaam text, p_email text, p_telefoon text, p_adres text, p_postcode text, p_plaats text, p_geboortedatum date, p_rijbewijsnummer text, p_rijbewijscategorie text, p_rijbewijs_foto_path text, p_handtekening_data text, p_opmerkingen text, p_ip_adres text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  SELECT id INTO v_cust_id FROM public.test_drive_customers WHERE email = p_email LIMIT 1;
  IF v_cust_id IS NULL THEN
    INSERT INTO public.test_drive_customers
      (voornaam, achternaam, email, telefoon, adres, postcode, plaats, geboortedatum, rijbewijsnummer, rijbewijscategorie, rijbewijs_foto_path)
    VALUES
      (p_voornaam, p_achternaam, p_email, p_telefoon, p_adres, p_postcode, p_plaats, p_geboortedatum, p_rijbewijsnummer, p_rijbewijscategorie, p_rijbewijs_foto_path)
    RETURNING id INTO v_cust_id;
  ELSE
    UPDATE public.test_drive_customers
       SET voornaam = p_voornaam, achternaam = p_achternaam, telefoon = p_telefoon,
           adres = p_adres, postcode = p_postcode, plaats = p_plaats,
           geboortedatum = p_geboortedatum, rijbewijsnummer = p_rijbewijsnummer,
           rijbewijscategorie = p_rijbewijscategorie, rijbewijs_foto_path = p_rijbewijs_foto_path
     WHERE id = v_cust_id;
  END IF;

  SELECT id INTO v_crm_id FROM public.customers WHERE email = p_email LIMIT 1;
  IF v_crm_id IS NULL THEN
    INSERT INTO public.customers
      (voornaam, achternaam, email, telefoon, adres, postcode, plaats, geboortedatum, status, laatste_contact, bron)
    VALUES
      (p_voornaam, p_achternaam, p_email, p_telefoon, p_adres, p_postcode, p_plaats, p_geboortedatum, 'prospect', now(), 'proefrit');
  ELSE
    UPDATE public.customers
       SET voornaam = p_voornaam, achternaam = p_achternaam, telefoon = p_telefoon,
           adres = COALESCE(p_adres, adres), postcode = COALESCE(p_postcode, postcode),
           plaats = COALESCE(p_plaats, plaats), geboortedatum = COALESCE(p_geboortedatum, geboortedatum),
           laatste_contact = now()
     WHERE id = v_crm_id;
  END IF;

  UPDATE public.test_drives
     SET customer_id = v_cust_id, handtekening_data = p_handtekening_data,
         opmerkingen_voor = p_opmerkingen, formulier_ingevuld_op = now(),
         vertrek_tijd = now(), status = 'actief', ip_adres = p_ip_adres
   WHERE id = v_td_id;

  RETURN v_td_id;
END;
$function$;

CREATE TABLE public.inruil_aanmeldingen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naam text NOT NULL CHECK (char_length(naam) BETWEEN 1 AND 200),
  telefoon text NOT NULL CHECK (char_length(telefoon) BETWEEN 5 AND 50),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 255),
  kenteken text NOT NULL CHECK (char_length(kenteken) BETWEEN 4 AND 12),
  merk text,
  model text,
  bouwjaar text,
  km_stand integer NOT NULL CHECK (km_stand BETWEEN 0 AND 5000000),
  gewenste_prijs numeric(12,2) NOT NULL CHECK (gewenste_prijs BETWEEN 0 AND 10000000),
  interesse_voertuig_id text,
  interesse_voertuig text NOT NULL CHECK (char_length(interesse_voertuig) BETWEEN 1 AND 300),
  foto_paths text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'nieuw' CHECK (status IN ('nieuw', 'in_behandeling', 'afgerond')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.inruil_aanmeldingen TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.inruil_aanmeldingen TO authenticated;
GRANT ALL ON public.inruil_aanmeldingen TO service_role;

ALTER TABLE public.inruil_aanmeldingen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit trade in request"
ON public.inruil_aanmeldingen
FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'nieuw' AND cardinality(foto_paths) = 0);

CREATE POLICY "Staff can view trade in requests"
ON public.inruil_aanmeldingen
FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update trade in requests"
ON public.inruil_aanmeldingen
FOR UPDATE
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete trade in requests"
ON public.inruil_aanmeldingen
FOR DELETE
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.inruil_submission_exists(p_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.inruil_aanmeldingen WHERE id = p_id)
$$;

REVOKE ALL ON FUNCTION public.inruil_submission_exists(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inruil_submission_exists(uuid) TO anon, authenticated, service_role;

CREATE POLICY "Applicants can upload trade in photos"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'inruil-fotos'
  AND lower(storage.extension(name)) = ANY (ARRAY['jpg', 'jpeg', 'png', 'webp'])
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND public.inruil_submission_exists(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Staff can view trade in photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'inruil-fotos' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete trade in photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'inruil-fotos' AND public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.update_inruil_aanmeldingen_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_inruil_aanmeldingen_updated_at
BEFORE UPDATE ON public.inruil_aanmeldingen
FOR EACH ROW EXECUTE FUNCTION public.update_inruil_aanmeldingen_updated_at();
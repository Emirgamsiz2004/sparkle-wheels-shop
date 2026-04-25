-- Toestaan van nieuwe types
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_type_check;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_type_check
  CHECK (type = ANY (ARRAY['bezichtiging','proefrit','terugbelafspraak','aflevering','ophalen','onderhoud','anders','poetsbeurt']));

-- Nieuwe velden voor website-boekingen / aanvragen
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS bron text,
  ADD COLUMN IF NOT EXISTS is_aanvraag boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS aanvraag_omschrijving text,
  ADD COLUMN IF NOT EXISTS voorkeursdatum date,
  ADD COLUMN IF NOT EXISTS aanvrager_voornaam text,
  ADD COLUMN IF NOT EXISTS aanvrager_achternaam text,
  ADD COLUMN IF NOT EXISTS aanvrager_telefoon text,
  ADD COLUMN IF NOT EXISTS aanvrager_email text,
  ADD COLUMN IF NOT EXISTS aanvrager_kenteken text;

-- Public insert policy: bezoekers mogen via website een afspraak/aanvraag aanmaken
DROP POLICY IF EXISTS "Public can create website appointments" ON public.appointments;
CREATE POLICY "Public can create website appointments"
  ON public.appointments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bron = 'website');

-- View die alleen bezetting toont (voor frontend tijdslot-check)
CREATE OR REPLACE VIEW public.appointment_slots AS
  SELECT id, vehicle_id, type, datum_tijd, eind_datum_tijd, status
  FROM public.appointments
  WHERE status <> 'geannuleerd';

GRANT SELECT ON public.appointment_slots TO anon, authenticated;
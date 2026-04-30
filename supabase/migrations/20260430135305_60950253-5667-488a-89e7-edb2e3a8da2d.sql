CREATE TABLE IF NOT EXISTS public.diensten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  naam TEXT NOT NULL,
  categorie TEXT NOT NULL DEFAULT 'overig',
  duur_minuten INTEGER NOT NULL DEFAULT 60,
  volgorde INTEGER NOT NULL DEFAULT 0,
  actief BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diensten ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth users can CRUD diensten" ON public.diensten;
CREATE POLICY "Auth users can CRUD diensten"
  ON public.diensten FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_diensten_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_diensten_updated_at ON public.diensten;
CREATE TRIGGER trg_diensten_updated_at
  BEFORE UPDATE ON public.diensten
  FOR EACH ROW EXECUTE FUNCTION public.update_diensten_updated_at();

INSERT INTO public.diensten (naam, categorie, duur_minuten, volgorde)
SELECT * FROM (VALUES
  ('Exterieur wassen','detailing',45,10),
  ('Interieur reinigen','detailing',60,20),
  ('Volledige poetsbeurt','detailing',180,30),
  ('Lak polish','detailing',120,40),
  ('Nano coating','detailing',240,50),
  ('Ramen reinigen','detailing',20,60),
  ('Velgen reinigen','detailing',30,70),
  ('Motorruimte reinigen','detailing',30,80),
  ('Olie verversen','onderhoud',45,110),
  ('Filters vervangen','onderhoud',30,120),
  ('Remmen controleren','onderhoud',20,130),
  ('Banden controleren/wisselen','onderhoud',30,140),
  ('APK voorbereiding','onderhoud',60,150),
  ('Vloeistoffen bijvullen','onderhoud',15,160),
  ('Accu controleren','onderhoud',15,170),
  ('Remmen vervangen','reparatie',90,210),
  ('Koppeling vervangen','reparatie',240,220),
  ('Uitlaat reparatie','reparatie',60,230),
  ('Airco service','reparatie',60,240),
  ('Electra/diagnose','reparatie',60,250),
  ('Overige reparatie','reparatie',60,260),
  ('Ophalen voertuig','overig',30,310),
  ('Afleveren voertuig','overig',30,320),
  ('Fotosessie','overig',45,330),
  ('Anders','overig',60,340)
) AS v(naam, categorie, duur_minuten, volgorde)
WHERE NOT EXISTS (SELECT 1 FROM public.diensten);

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS diensten TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS diensten_notitie TEXT,
  ADD COLUMN IF NOT EXISTS geschatte_duur_minuten INTEGER,
  ADD COLUMN IF NOT EXISTS voertuig_klant_kenteken TEXT,
  ADD COLUMN IF NOT EXISTS voertuig_klant_omschrijving TEXT,
  ADD COLUMN IF NOT EXISTS werkzaamheden_omschrijving TEXT,
  ADD COLUMN IF NOT EXISTS klant_naam_los TEXT,
  ADD COLUMN IF NOT EXISTS klant_telefoon_los TEXT,
  ADD COLUMN IF NOT EXISTS klant_email_los TEXT;
CREATE TABLE public.handmatige_verkopen (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verkoop_datum date NOT NULL DEFAULT CURRENT_DATE,
  kenteken text,
  merk text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  bouwjaar integer,
  kilometerstand integer,
  brandstof text,
  inkoopprijs numeric NOT NULL DEFAULT 0,
  verkoopprijs numeric NOT NULL DEFAULT 0,
  koper_naam text,
  notitie text,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.handmatige_verkopen TO authenticated;
GRANT ALL ON public.handmatige_verkopen TO service_role;

ALTER TABLE public.handmatige_verkopen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can CRUD handmatige_verkopen"
ON public.handmatige_verkopen
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE INDEX idx_handmatige_verkopen_datum ON public.handmatige_verkopen(verkoop_datum);

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS inruil_kenteken text,
  ADD COLUMN IF NOT EXISTS inruil_merk text,
  ADD COLUMN IF NOT EXISTS inruil_model text,
  ADD COLUMN IF NOT EXISTS inruil_waarde numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contant_bedrag numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overboeking_bedrag numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS financiering_actief boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS financiering_bedrag numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aanbetalingsbedrag numeric DEFAULT 0;

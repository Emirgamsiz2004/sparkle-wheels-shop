ALTER TABLE public.test_drives 
  ADD COLUMN IF NOT EXISTS vertrek_tijd timestamptz,
  ADD COLUMN IF NOT EXISTS terugkomst_tijd timestamptz,
  ADD COLUMN IF NOT EXISTS gereden_km integer,
  ADD COLUMN IF NOT EXISTS max_duur_minuten integer NOT NULL DEFAULT 30;
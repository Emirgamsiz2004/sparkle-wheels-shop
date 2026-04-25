ALTER TABLE public.verkopen
  ADD COLUMN IF NOT EXISTS auto_schoongemaakt boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS apk_gecommuniceerd boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sleutels_overhandigd boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gebreken_besproken boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gebreken_omschrijving text,
  ADD COLUMN IF NOT EXISTS tenaamstellingsbewijs_meegegeven boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS uitlevering_voltooid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS uitlevering_fotos text[] NOT NULL DEFAULT '{}';
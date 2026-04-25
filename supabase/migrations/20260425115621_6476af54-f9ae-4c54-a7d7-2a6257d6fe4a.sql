ALTER TABLE public.verkopen
  ADD COLUMN IF NOT EXISTS machtigingsnummer text,
  ADD COLUMN IF NOT EXISTS machtiging_datum timestamp with time zone,
  ADD COLUMN IF NOT EXISTS machtiging_ontvangen boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tenaamstelling_bevestigd boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tenaamstelling_datum timestamp with time zone;
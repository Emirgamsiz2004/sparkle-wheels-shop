ALTER TABLE public.verkopen
  ADD COLUMN IF NOT EXISTS factuur_verstuurd boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS factuur_email text;
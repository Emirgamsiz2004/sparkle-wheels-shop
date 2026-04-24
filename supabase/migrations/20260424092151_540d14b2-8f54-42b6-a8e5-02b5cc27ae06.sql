ALTER TABLE public.verkopen
  ADD COLUMN IF NOT EXISTS moneybird_factuur_nummer text,
  ADD COLUMN IF NOT EXISTS factuurdatum date,
  ADD COLUMN IF NOT EXISTS factuur_referentie text,
  ADD COLUMN IF NOT EXISTS factuur_email_verzonden_op timestamp with time zone;
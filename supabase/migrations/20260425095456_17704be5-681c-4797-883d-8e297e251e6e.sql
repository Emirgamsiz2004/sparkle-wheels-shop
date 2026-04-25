ALTER TABLE public.verkopen
  ADD COLUMN IF NOT EXISTS betaling_opmerking text,
  ADD COLUMN IF NOT EXISTS moneybird_payment_id text;
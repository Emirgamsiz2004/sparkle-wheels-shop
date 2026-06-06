ALTER TABLE public.diensten
  ADD COLUMN IF NOT EXISTS standaard_prijs_cent integer;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS prijs_regels jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS totaal_prijs_cent integer,
  ADD COLUMN IF NOT EXISTS moneybird_invoice_id text,
  ADD COLUMN IF NOT EXISTS moneybird_invoice_url text;
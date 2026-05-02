
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS heeft_aanbetaling boolean NOT NULL DEFAULT false;

ALTER TABLE public.aanbetalingen
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS moneybird_invoice_id text,
  ADD COLUMN IF NOT EXISTS moneybird_contact_id text,
  ADD COLUMN IF NOT EXISTS moneybird_credit_invoice_id text,
  ADD COLUMN IF NOT EXISTS notities text,
  ADD COLUMN IF NOT EXISTS geannuleerd_op timestamptz,
  ADD COLUMN IF NOT EXISTS betaald_op timestamptz,
  ADD COLUMN IF NOT EXISTS bron text NOT NULL DEFAULT 'pdf';

ALTER TABLE public.aanbetalingen
  ALTER COLUMN klant_adres DROP NOT NULL,
  ALTER COLUMN klant_postcode DROP NOT NULL,
  ALTER COLUMN klant_woonplaats DROP NOT NULL,
  ALTER COLUMN klant_telefoon DROP NOT NULL,
  ALTER COLUMN voertuig_merk DROP NOT NULL,
  ALTER COLUMN voertuig_model DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_aanbetalingen_vehicle_status
  ON public.aanbetalingen(vehicle_id, status);

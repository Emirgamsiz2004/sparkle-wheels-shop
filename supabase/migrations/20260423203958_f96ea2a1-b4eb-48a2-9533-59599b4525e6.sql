ALTER TABLE public.vehicle_sales
  ADD COLUMN IF NOT EXISTS financiering boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS financiering_maatschappij text;
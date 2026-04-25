ALTER TABLE public.vehicle_sales
ADD COLUMN IF NOT EXISTS lead_source text,
ADD COLUMN IF NOT EXISTS lead_source_anders text;
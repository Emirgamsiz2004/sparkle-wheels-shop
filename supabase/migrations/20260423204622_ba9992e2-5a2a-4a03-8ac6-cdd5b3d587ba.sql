ALTER TABLE public.vehicle_sales
  ADD COLUMN IF NOT EXISTS betaalwijze_details jsonb NOT NULL DEFAULT '[]'::jsonb;
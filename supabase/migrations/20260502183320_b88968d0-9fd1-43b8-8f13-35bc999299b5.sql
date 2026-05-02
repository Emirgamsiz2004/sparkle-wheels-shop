ALTER TABLE public.vehicles 
  ADD COLUMN IF NOT EXISTS feed_verkoopprijs numeric,
  ADD COLUMN IF NOT EXISTS feed_kilometerstand integer;
ALTER TABLE public.vehicles 
  ADD COLUMN IF NOT EXISTS marktplaats_url text,
  ADD COLUMN IF NOT EXISTS feed_id text;
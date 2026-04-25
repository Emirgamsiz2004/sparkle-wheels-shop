ALTER TABLE public.verkopen
ADD COLUMN IF NOT EXISTS lead_source text,
ADD COLUMN IF NOT EXISTS lead_source_anders text;
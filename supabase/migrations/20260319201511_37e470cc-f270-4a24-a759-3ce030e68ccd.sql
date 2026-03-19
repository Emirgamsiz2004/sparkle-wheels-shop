
ALTER TABLE public.vehicles 
ADD COLUMN verkoop_type text DEFAULT 'regulier',
ADD COLUMN consignatie_commissie_perc numeric DEFAULT 10,
ADD COLUMN consignatie_eigenaar_naam text,
ADD COLUMN consignatie_eigenaar_telefoon text,
ADD COLUMN consignatie_eigenaar_email text;

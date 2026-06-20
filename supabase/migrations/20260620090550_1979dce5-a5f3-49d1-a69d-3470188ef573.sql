ALTER TABLE public.verkopen ADD COLUMN IF NOT EXISTS korting_bedrag numeric NOT NULL DEFAULT 0;
ALTER TABLE public.verkopen ADD COLUMN IF NOT EXISTS korting_omschrijving text;
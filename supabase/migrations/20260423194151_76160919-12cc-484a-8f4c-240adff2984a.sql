ALTER TABLE public.verkopen
  ADD COLUMN IF NOT EXISTS afleverwijze text DEFAULT 'vandaag',
  ADD COLUMN IF NOT EXISTS afleveradres text;
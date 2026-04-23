ALTER TABLE public.verkopen 
  ADD COLUMN IF NOT EXISTS overeenkomstnummer text,
  ADD COLUMN IF NOT EXISTS opmerkingen text;
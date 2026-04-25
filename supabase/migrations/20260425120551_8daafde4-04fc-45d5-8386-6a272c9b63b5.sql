ALTER TABLE public.verkopen
  ADD COLUMN IF NOT EXISTS restbedrag_later boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS restbedrag_verwachte_datum date;
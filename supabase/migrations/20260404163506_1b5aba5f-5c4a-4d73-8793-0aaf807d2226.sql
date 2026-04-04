ALTER TABLE public.vehicle_sales 
  ADD COLUMN garantie_kosten numeric DEFAULT 0,
  ADD COLUMN garantie_betaler text DEFAULT 'geen';
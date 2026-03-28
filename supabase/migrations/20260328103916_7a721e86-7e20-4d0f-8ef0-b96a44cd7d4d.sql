
ALTER TABLE public.test_drive_customers 
  ADD COLUMN IF NOT EXISTS postcode text,
  ADD COLUMN IF NOT EXISTS plaats text;

ALTER TABLE public.test_drives 
  ADD COLUMN IF NOT EXISTS begeleidende_medewerker text;

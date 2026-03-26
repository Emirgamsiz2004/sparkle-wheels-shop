
-- Klanten tabel
CREATE TABLE public.test_drive_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  voornaam TEXT NOT NULL,
  achternaam TEXT NOT NULL,
  email TEXT NOT NULL,
  telefoon TEXT NOT NULL,
  adres TEXT,
  geboortedatum DATE,
  rijbewijsnummer TEXT,
  rijbewijscategorie TEXT DEFAULT 'B',
  rijbewijs_foto_path TEXT,
  UNIQUE(email)
);

ALTER TABLE public.test_drive_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can CRUD test_drive_customers" ON public.test_drive_customers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can insert test_drive_customers" ON public.test_drive_customers
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Public can read own customer by email" ON public.test_drive_customers
  FOR SELECT TO anon USING (true);

-- Proefriten tabel
CREATE TABLE public.test_drives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.test_drive_customers(id) ON DELETE SET NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'wacht_op_klant',
  km_voor INTEGER NOT NULL,
  km_na INTEGER,
  start_tijd TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  eind_tijd TIMESTAMP WITH TIME ZONE,
  opmerkingen_voor TEXT,
  opmerkingen_na TEXT,
  handtekening_data TEXT,
  ip_adres TEXT,
  formulier_ingevuld_op TIMESTAMP WITH TIME ZONE,
  pdf_path TEXT,
  pdf_definitief_path TEXT,
  schade_fotos TEXT[] DEFAULT '{}',
  voertuig_merk TEXT,
  voertuig_model TEXT,
  voertuig_kenteken TEXT,
  voertuig_bouwjaar INTEGER
);

ALTER TABLE public.test_drives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can CRUD test_drives" ON public.test_drives
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can read test_drive by token" ON public.test_drives
  FOR SELECT TO anon USING (true);

CREATE POLICY "Public can update test_drive by token" ON public.test_drives
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Storage bucket voor rijbewijsfotos en schadefotos
INSERT INTO storage.buckets (id, name, public) VALUES ('test-drive-files', 'test-drive-files', false);

CREATE POLICY "Auth users can manage test-drive-files" ON storage.objects
  FOR ALL TO authenticated USING (bucket_id = 'test-drive-files') WITH CHECK (bucket_id = 'test-drive-files');

CREATE POLICY "Anon can upload to test-drive-files" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'test-drive-files');

CREATE POLICY "Anon can read test-drive-files" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'test-drive-files');

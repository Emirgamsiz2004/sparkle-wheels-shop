
CREATE TABLE public.aanbetalingen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  klant_voornaam TEXT NOT NULL,
  klant_achternaam TEXT NOT NULL,
  klant_adres TEXT NOT NULL,
  klant_postcode TEXT NOT NULL,
  klant_woonplaats TEXT NOT NULL,
  klant_telefoon TEXT NOT NULL,
  klant_email TEXT NOT NULL,
  voertuig_merk TEXT NOT NULL,
  voertuig_model TEXT NOT NULL,
  voertuig_bouwjaar INTEGER,
  voertuig_kenteken TEXT,
  voertuig_kilometerstand INTEGER,
  voertuig_vin TEXT,
  verkoopprijs NUMERIC NOT NULL DEFAULT 0,
  aanbetalingsbedrag NUMERIC NOT NULL DEFAULT 0,
  restbedrag NUMERIC NOT NULL DEFAULT 0,
  uiterlijke_datum DATE,
  datum DATE NOT NULL DEFAULT CURRENT_DATE,
  plaats TEXT NOT NULL DEFAULT 'Roelofarendsveen',
  pdf_path TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.aanbetalingen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can CRUD aanbetalingen"
  ON public.aanbetalingen FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_aanbetalingen_vehicle_id ON public.aanbetalingen(vehicle_id);

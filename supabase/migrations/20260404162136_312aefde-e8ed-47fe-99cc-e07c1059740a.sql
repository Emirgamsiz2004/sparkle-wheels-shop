CREATE TABLE public.vehicle_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id),
  verkoopprijs NUMERIC NOT NULL DEFAULT 0,
  betaalwijze TEXT NOT NULL DEFAULT 'overboeking',
  contant_bedrag NUMERIC DEFAULT 0,
  overboeking_bedrag NUMERIC DEFAULT 0,
  aanbetaling_actief BOOLEAN NOT NULL DEFAULT false,
  aanbetalingsbedrag NUMERIC DEFAULT 0,
  aanbetaling_datum DATE,
  restbedrag NUMERIC DEFAULT 0,
  afleverdatum DATE,
  garantie_type TEXT NOT NULL DEFAULT 'geen',
  garantie_maanden INTEGER DEFAULT 0,
  wwft_bevestigd BOOLEAN NOT NULL DEFAULT false,
  overeenkomst_ondertekend BOOLEAN NOT NULL DEFAULT false,
  moneybird_factuur_id TEXT,
  wizard_stap INTEGER NOT NULL DEFAULT 1,
  wizard_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'concept',
  verkoop_datum DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can CRUD vehicle_sales"
  ON public.vehicle_sales
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
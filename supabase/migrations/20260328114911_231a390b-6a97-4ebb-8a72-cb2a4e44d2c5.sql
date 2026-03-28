
CREATE TABLE public.consignatie_overeenkomsten (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Eigenaar
  eigenaar_voornaam TEXT NOT NULL,
  eigenaar_achternaam TEXT NOT NULL,
  eigenaar_adres TEXT NOT NULL,
  eigenaar_postcode TEXT NOT NULL,
  eigenaar_woonplaats TEXT NOT NULL,
  eigenaar_telefoon TEXT NOT NULL,
  eigenaar_email TEXT NOT NULL,
  eigenaar_iban TEXT NOT NULL,
  
  -- Voertuig snapshot
  voertuig_merk TEXT NOT NULL,
  voertuig_model TEXT NOT NULL,
  voertuig_bouwjaar INTEGER,
  voertuig_kenteken TEXT,
  voertuig_kilometerstand INTEGER,
  voertuig_vin TEXT,
  voertuig_kleur TEXT,
  voertuig_apk_tot TEXT,
  
  -- Financieel
  vraagprijs NUMERIC NOT NULL DEFAULT 0,
  minimumprijs NUMERIC NOT NULL DEFAULT 0,
  commissie_percentage NUMERIC NOT NULL DEFAULT 10,
  garantie TEXT NOT NULL DEFAULT 'geen',
  aangepast_commissie_percentage NUMERIC,
  
  -- Opzeggingskosten
  advertentiekosten NUMERIC DEFAULT 0,
  poetskosten NUMERIC DEFAULT 0,
  overige_kosten NUMERIC DEFAULT 0,
  
  -- Meta
  datum DATE NOT NULL DEFAULT CURRENT_DATE,
  plaats TEXT NOT NULL DEFAULT 'Roelofarendsveen',
  pdf_path TEXT,
  user_id UUID
);

ALTER TABLE public.consignatie_overeenkomsten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can CRUD consignatie_overeenkomsten"
  ON public.consignatie_overeenkomsten
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

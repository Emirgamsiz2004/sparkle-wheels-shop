
-- Create deals table with comprehensive fields for deal analysis
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kenteken TEXT NOT NULL,
  merk TEXT,
  model TEXT,
  bouwjaar TEXT,
  brandstof TEXT,
  km_stand TEXT,
  transmissie TEXT,
  carrosserie TEXT,
  kleur TEXT,
  vermogen TEXT,
  
  -- VIN & Options
  vin TEXT,
  voertuig_opties JSONB DEFAULT '[]'::jsonb,
  opties_populariteit JSONB DEFAULT '{}'::jsonb,
  
  -- VWE Taxatie
  vwe_inkoopwaarde NUMERIC,
  vwe_verkoopwaarde NUMERIC,
  vwe_nieuwprijs NUMERIC,
  vwe_handelsprijs NUMERIC,
  
  -- Markt data
  markt_analyse_tekst TEXT,
  markt_bronnen JSONB DEFAULT '[]'::jsonb,
  markt_listings JSONB DEFAULT '[]'::jsonb,
  gemiddelde_marktprijs NUMERIC,
  laagste_marktprijs NUMERIC,
  hoogste_marktprijs NUMERIC,
  aantal_vergelijkbaar INTEGER,
  
  -- Damage & History
  schade_historie JSONB DEFAULT '[]'::jsonb,
  eerdere_advertenties JSONB DEFAULT '[]'::jsonb,
  aantal_eigenaren TEXT,
  apk_status TEXT,
  
  -- Deal scoring
  inkoopprijs_klant NUMERIC,
  deal_score INTEGER,
  ai_advies TEXT,
  score_factoren JSONB,
  geschatte_verkoopprijs NUMERIC,
  geschatte_standtijd TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (admin-only feature, no auth yet)
CREATE POLICY "Allow all access to deals" ON public.deals FOR ALL USING (true) WITH CHECK (true);

-- Create table for consignatie aanmeldingen
CREATE TABLE public.consignatie_aanmeldingen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  naam TEXT NOT NULL,
  telefoon TEXT NOT NULL,
  email TEXT NOT NULL,
  kenteken TEXT,
  merk TEXT NOT NULL,
  model TEXT NOT NULL,
  bouwjaar TEXT NOT NULL,
  km_stand TEXT NOT NULL,
  brandstof TEXT,
  transmissie TEXT,
  kleur TEXT,
  schadevrij BOOLEAN,
  onderhoudsboekje BOOLEAN,
  apk_geldig BOOLEAN,
  rookvrij BOOLEAN,
  eerste_eigenaar BOOLEAN,
  opmerkingen TEXT,
  foto_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consignatie_aanmeldingen ENABLE ROW LEVEL SECURITY;

-- Public insert policy (anyone can submit)
CREATE POLICY "Anyone can submit consignatie" ON public.consignatie_aanmeldingen
  FOR INSERT WITH CHECK (true);

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('consignatie-fotos', 'consignatie-fotos', true);

-- Allow anyone to upload consignatie photos
CREATE POLICY "Anyone can upload consignatie photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'consignatie-fotos');

-- Allow public read access
CREATE POLICY "Consignatie photos are public" ON storage.objects
  FOR SELECT USING (bucket_id = 'consignatie-fotos');
CREATE TABLE public.inkoopverklaringen (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_naam text NOT NULL,
  verkoper_naam text NOT NULL,
  verkoper_email text,
  verkoper_telefoon text NOT NULL,
  verkoper_adres text NOT NULL,
  verkoper_woonplaats text NOT NULL,
  kenteken text,
  merk text NOT NULL,
  model text NOT NULL,
  bouwjaar integer,
  kilometerstand integer,
  chassisnummer text,
  legitimatie_type text NOT NULL,
  legitimatie_nummer text NOT NULL,
  inkoopprijs numeric NOT NULL DEFAULT 0,
  datum date NOT NULL DEFAULT CURRENT_DATE,
  handtekening_data text,
  pdf_path text,
  status text NOT NULL DEFAULT 'ondertekend',
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.inkoopverklaringen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read inkoopverklaringen"
  ON public.inkoopverklaringen FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Auth users can insert inkoopverklaringen"
  ON public.inkoopverklaringen FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Auth users can update inkoopverklaringen"
  ON public.inkoopverklaringen FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_inkoopverklaringen_kenteken ON public.inkoopverklaringen(kenteken);
CREATE INDEX idx_inkoopverklaringen_vehicle_id ON public.inkoopverklaringen(vehicle_id);
CREATE INDEX idx_inkoopverklaringen_datum ON public.inkoopverklaringen(datum DESC);
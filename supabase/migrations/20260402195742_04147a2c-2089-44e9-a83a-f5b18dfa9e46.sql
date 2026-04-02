
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('bezichtiging', 'proefrit', 'terugbelafspraak', 'aflevering')),
  datum_tijd TIMESTAMP WITH TIME ZONE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  medewerker TEXT,
  notities TEXT,
  onderwerp TEXT,
  betalingsstatus TEXT CHECK (betalingsstatus IS NULL OR betalingsstatus IN ('volledig_betaald', 'openstaand')),
  voertuig_klaargemaakt BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'gepland' CHECK (status IN ('gepland', 'voltooid', 'geannuleerd')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can CRUD appointments"
  ON public.appointments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_appointments_datum ON public.appointments (datum_tijd);
CREATE INDEX idx_appointments_customer ON public.appointments (customer_id);
CREATE INDEX idx_appointments_vehicle ON public.appointments (vehicle_id);
CREATE INDEX idx_appointments_type ON public.appointments (type);

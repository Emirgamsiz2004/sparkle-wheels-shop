CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naam text NOT NULL,
  telefoon text NOT NULL,
  email text NOT NULL,
  voertuig_type text NOT NULL,
  pakket text NOT NULL,
  extras text[] NOT NULL DEFAULT '{}',
  totaal_prijs integer NOT NULL DEFAULT 0,
  totaal_minuten integer NOT NULL DEFAULT 0,
  datum date NOT NULL,
  starttijd time NOT NULL,
  eindtijd time NOT NULL,
  status text NOT NULL DEFAULT 'bevestigd',
  opmerking text,
  aangemaakt_op timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create bookings"
ON public.bookings FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public can read booking slots"
ON public.bookings FOR SELECT TO anon, authenticated
USING (status = 'bevestigd');

CREATE POLICY "Auth users can manage bookings"
ON public.bookings FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE INDEX idx_bookings_datum ON public.bookings(datum) WHERE status = 'bevestigd';
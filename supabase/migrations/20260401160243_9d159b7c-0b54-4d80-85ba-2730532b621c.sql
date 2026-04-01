-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voornaam TEXT NOT NULL,
  achternaam TEXT NOT NULL,
  email TEXT NOT NULL,
  telefoon TEXT NOT NULL DEFAULT '',
  adres TEXT,
  postcode TEXT,
  plaats TEXT,
  geboortedatum DATE,
  status TEXT NOT NULL DEFAULT 'prospect',
  notities TEXT,
  laatste_contact TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on email for upsert logic
CREATE UNIQUE INDEX idx_customers_email ON public.customers (email);

-- Create index on status for filtering
CREATE INDEX idx_customers_status ON public.customers (status);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Auth users can CRUD
CREATE POLICY "Auth users can CRUD customers"
  ON public.customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add customer_id to vehicles for buyer linking
ALTER TABLE public.vehicles ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customers_updated_at();
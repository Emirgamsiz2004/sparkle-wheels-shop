-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'nieuw',
  bron TEXT NOT NULL DEFAULT 'website',
  notities_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  volgende_actie TEXT,
  volgende_actie_datum DATE,
  verloren_reden TEXT,
  laatste_activiteit TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_status ON public.leads (status);
CREATE INDEX idx_leads_customer ON public.leads (customer_id);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can CRUD leads"
  ON public.leads FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Create lead history table
CREATE TABLE public.lead_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  oude_status TEXT,
  nieuwe_status TEXT,
  beschrijving TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can CRUD lead_history"
  ON public.lead_history FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Updated_at trigger for leads
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customers_updated_at();
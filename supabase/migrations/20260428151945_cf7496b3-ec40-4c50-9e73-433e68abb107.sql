-- Kosten tabel voor financiele administratie (vaste lasten, abonnementen, advertentiekosten etc.)
CREATE TABLE public.kosten (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  naam TEXT NOT NULL,
  categorie TEXT NOT NULL DEFAULT 'overig',
  bedrag NUMERIC NOT NULL DEFAULT 0,
  frequentie TEXT NOT NULL DEFAULT 'eenmalig', -- eenmalig | maandelijks | kwartaal | jaarlijks
  datum DATE NOT NULL DEFAULT CURRENT_DATE,
  leverancier TEXT,
  notities TEXT,
  actief BOOLEAN NOT NULL DEFAULT true,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.kosten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can CRUD kosten"
ON public.kosten
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE INDEX idx_kosten_datum ON public.kosten(datum);
CREATE INDEX idx_kosten_categorie ON public.kosten(categorie);
CREATE INDEX idx_kosten_frequentie ON public.kosten(frequentie);

CREATE TRIGGER update_kosten_updated_at
BEFORE UPDATE ON public.kosten
FOR EACH ROW
EXECUTE FUNCTION public.update_customers_updated_at();
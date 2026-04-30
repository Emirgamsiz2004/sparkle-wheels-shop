
-- Tabel voor kostencategorieën
CREATE TABLE IF NOT EXISTS public.kosten_categorieen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naam text NOT NULL,
  moneybird_contact_ids text[] NOT NULL DEFAULT '{}',
  aangemaakt_op timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kosten_categorieen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can CRUD kosten_categorieen"
  ON public.kosten_categorieen
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Vaste IDs zodat UI stabiel kan refereren
INSERT INTO public.kosten_categorieen (id, naam) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Vaste kosten'),
  ('11111111-1111-1111-1111-111111111102', 'Abonnementen & software'),
  ('11111111-1111-1111-1111-111111111103', 'Inkoop voertuigen'),
  ('11111111-1111-1111-1111-111111111104', 'Onderdelen & materialen'),
  ('11111111-1111-1111-1111-111111111105', 'Advertentiekosten'),
  ('11111111-1111-1111-1111-111111111106', 'Personeelskosten')
ON CONFLICT (id) DO NOTHING;

-- Optionele koppeling van handmatige kosten aan een categorie
ALTER TABLE public.kosten
  ADD COLUMN IF NOT EXISTS categorie_id uuid REFERENCES public.kosten_categorieen(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_kosten_categorie_id ON public.kosten(categorie_id);

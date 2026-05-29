CREATE TABLE public.aflevering_taken (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL,
  titel text NOT NULL,
  deadline date,
  klaar boolean NOT NULL DEFAULT false,
  klaar_op timestamptz,
  notitie text,
  volgorde integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.aflevering_taken TO authenticated;
GRANT ALL ON public.aflevering_taken TO service_role;

ALTER TABLE public.aflevering_taken ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can CRUD aflevering_taken"
ON public.aflevering_taken
FOR ALL
TO authenticated
USING (true) WITH CHECK (true);

CREATE INDEX idx_aflevering_taken_vehicle ON public.aflevering_taken(vehicle_id);
CREATE INDEX idx_aflevering_taken_open_deadline ON public.aflevering_taken(deadline) WHERE klaar = false;

ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS aflever_datum date;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS aflever_notities text;
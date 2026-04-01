
-- Vehicle tasks table
CREATE TABLE public.vehicle_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  omschrijving TEXT NOT NULL,
  prioriteit TEXT NOT NULL DEFAULT 'normaal',
  deadline DATE,
  voltooid BOOLEAN NOT NULL DEFAULT false,
  voltooid_op TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can CRUD vehicle_tasks" ON public.vehicle_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Vehicle activity log table
CREATE TABLE public.vehicle_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  actie_type TEXT NOT NULL,
  beschrijving TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can CRUD vehicle_activity_log" ON public.vehicle_activity_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create time_entries table
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'overig',
  end_note TEXT,
  hourly_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_time_entries_user ON public.time_entries (user_id);
CREATE INDEX idx_time_entries_vehicle ON public.time_entries (vehicle_id);
CREATE INDEX idx_time_entries_customer ON public.time_entries (customer_id);
CREATE INDEX idx_time_entries_start ON public.time_entries (start_time);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can CRUD time_entries"
  ON public.time_entries FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
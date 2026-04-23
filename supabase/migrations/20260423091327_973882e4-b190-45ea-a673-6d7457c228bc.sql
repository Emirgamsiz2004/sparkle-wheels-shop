ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS google_event_id TEXT;
CREATE INDEX IF NOT EXISTS idx_appointments_google_event_id ON public.appointments(google_event_id);
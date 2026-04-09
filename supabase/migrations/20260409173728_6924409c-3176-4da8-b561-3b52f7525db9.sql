
-- Table to permanently track which Slack notifications have been sent
CREATE TABLE public.slack_notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_key text NOT NULL UNIQUE, -- unique key like "apk_expired:vehicle_id"
  notification_type text NOT NULL,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  entity_id text, -- generic ID for non-vehicle entities (appointment, test_drive, sale)
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_slack_log_key ON public.slack_notification_log(notification_key);
CREATE INDEX idx_slack_log_type ON public.slack_notification_log(notification_type);

-- Enable RLS
ALTER TABLE public.slack_notification_log ENABLE ROW LEVEL SECURITY;

-- Only service role can manage this table
CREATE POLICY "Service role can manage slack_notification_log"
  ON public.slack_notification_log
  FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

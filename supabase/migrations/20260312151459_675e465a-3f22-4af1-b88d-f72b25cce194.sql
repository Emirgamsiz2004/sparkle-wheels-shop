
-- Add Google Drive columns to vehicles
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS google_drive_folder_id text,
  ADD COLUMN IF NOT EXISTS google_drive_folder_url text,
  ADD COLUMN IF NOT EXISTS google_drive_synced boolean DEFAULT false;

-- Add Google Drive columns to vehicle_documents
ALTER TABLE vehicle_documents
  ADD COLUMN IF NOT EXISTS google_drive_file_id text,
  ADD COLUMN IF NOT EXISTS google_drive_url text,
  ADD COLUMN IF NOT EXISTS synced_from_drive boolean DEFAULT false;

-- Add Google Drive columns to vehicle_photos
ALTER TABLE vehicle_photos
  ADD COLUMN IF NOT EXISTS google_drive_file_id text,
  ADD COLUMN IF NOT EXISTS google_drive_url text;

-- Create settings table for app-wide config
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can CRUD app_settings"
  ON public.app_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

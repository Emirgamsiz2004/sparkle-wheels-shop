
CREATE TABLE public.document_archive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  document_type text NOT NULL,
  kenteken text,
  klant_naam text,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  test_drive_id uuid REFERENCES public.test_drives(id) ON DELETE SET NULL,
  consignatie_overeenkomst_id uuid REFERENCES public.consignatie_overeenkomsten(id) ON DELETE SET NULL,
  file_path text,
  storage_bucket text DEFAULT 'vehicle-documents',
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.document_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can CRUD document_archive"
  ON public.document_archive FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_document_archive_vehicle ON public.document_archive(vehicle_id);
CREATE INDEX idx_document_archive_type ON public.document_archive(document_type);
CREATE INDEX idx_document_archive_kenteken ON public.document_archive(kenteken);

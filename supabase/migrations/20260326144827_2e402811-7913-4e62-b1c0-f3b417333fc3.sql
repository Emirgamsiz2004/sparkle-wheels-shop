CREATE TABLE public.proefrit_pdf_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_drive_id uuid NOT NULL REFERENCES public.test_drives(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  actie text NOT NULL DEFAULT 'download',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proefrit_pdf_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can CRUD proefrit_pdf_logs"
  ON public.proefrit_pdf_logs FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- Add document_nummer to test_drives
ALTER TABLE public.test_drives ADD COLUMN IF NOT EXISTS document_nummer text;
ALTER TABLE public.test_drives ADD COLUMN IF NOT EXISTS email_verzonden_op timestamptz;
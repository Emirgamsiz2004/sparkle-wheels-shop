-- Add signature_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url text;

-- Create public signatures bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Public can read signatures"
ON storage.objects FOR SELECT
USING (bucket_id = 'signatures');

-- Authenticated users manage own folder
CREATE POLICY "Users can upload own signature"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own signature"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own signature"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);
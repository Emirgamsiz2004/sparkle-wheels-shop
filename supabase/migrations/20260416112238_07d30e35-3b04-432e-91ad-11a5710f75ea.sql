
CREATE TABLE public.contact_aanmeldingen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  naam TEXT NOT NULL,
  email TEXT NOT NULL,
  telefoon TEXT,
  bericht TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'nieuw',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_aanmeldingen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact form"
ON public.contact_aanmeldingen
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Auth users can read contact_aanmeldingen"
ON public.contact_aanmeldingen
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Auth users can update contact_aanmeldingen"
ON public.contact_aanmeldingen
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Auth users can delete contact_aanmeldingen"
ON public.contact_aanmeldingen
FOR DELETE
TO authenticated
USING (true);

-- Allow authenticated users to read all consignatie aanmeldingen
CREATE POLICY "Authenticated users can view consignatie"
ON public.consignatie_aanmeldingen
FOR SELECT
TO authenticated
USING (true);
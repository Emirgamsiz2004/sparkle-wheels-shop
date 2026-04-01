-- Allow anon to insert customers (auto-create from proefrit form)
CREATE POLICY "Anon can insert customers"
  ON public.customers FOR INSERT TO anon
  WITH CHECK (true);

-- Allow anon to update customers (update existing profile from proefrit form)
CREATE POLICY "Anon can update customers"
  ON public.customers FOR UPDATE TO anon
  USING (true) WITH CHECK (true);

-- Allow anon to read customers by email (for upsert check)
CREATE POLICY "Anon can read customers by email"
  ON public.customers FOR SELECT TO anon
  USING (true);
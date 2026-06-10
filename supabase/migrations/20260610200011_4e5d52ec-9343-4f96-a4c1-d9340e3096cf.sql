
-- appointments
DROP POLICY IF EXISTS "Auth users can CRUD appointments" ON public.appointments;
CREATE POLICY "Staff can manage appointments" ON public.appointments FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- automation_results
DROP POLICY IF EXISTS "Auth users can CRUD automation_results" ON public.automation_results;
CREATE POLICY "Staff can manage automation_results" ON public.automation_results FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- automation_searches
DROP POLICY IF EXISTS "Auth users can CRUD automation_searches" ON public.automation_searches;
CREATE POLICY "Staff can manage automation_searches" ON public.automation_searches FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- automation_templates
DROP POLICY IF EXISTS "Auth users can CRUD automation_templates" ON public.automation_templates;
CREATE POLICY "Staff can manage automation_templates" ON public.automation_templates FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- inkoop_candidates
DROP POLICY IF EXISTS "Auth users can CRUD inkoop_candidates" ON public.inkoop_candidates;
CREATE POLICY "Staff can manage inkoop_candidates" ON public.inkoop_candidates FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- deals
DROP POLICY IF EXISTS "Auth users can CRUD deals" ON public.deals;
CREATE POLICY "Staff can manage deals" ON public.deals FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- consignatie_aanmeldingen
DROP POLICY IF EXISTS "Authenticated can delete consignatie aanmeldingen" ON public.consignatie_aanmeldingen;
DROP POLICY IF EXISTS "Authenticated can update consignatie aanmeldingen" ON public.consignatie_aanmeldingen;
DROP POLICY IF EXISTS "Authenticated users can view consignatie" ON public.consignatie_aanmeldingen;
CREATE POLICY "Staff can view consignatie aanmeldingen" ON public.consignatie_aanmeldingen FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "Staff can update consignatie aanmeldingen" ON public.consignatie_aanmeldingen FOR UPDATE TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff can delete consignatie aanmeldingen" ON public.consignatie_aanmeldingen FOR DELETE TO authenticated USING (is_staff(auth.uid()));

-- contact_aanmeldingen
DROP POLICY IF EXISTS "Auth users can delete contact_aanmeldingen" ON public.contact_aanmeldingen;
DROP POLICY IF EXISTS "Auth users can read contact_aanmeldingen" ON public.contact_aanmeldingen;
DROP POLICY IF EXISTS "Auth users can update contact_aanmeldingen" ON public.contact_aanmeldingen;
CREATE POLICY "Staff can read contact_aanmeldingen" ON public.contact_aanmeldingen FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "Staff can update contact_aanmeldingen" ON public.contact_aanmeldingen FOR UPDATE TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff can delete contact_aanmeldingen" ON public.contact_aanmeldingen FOR DELETE TO authenticated USING (is_staff(auth.uid()));

-- kosten
DROP POLICY IF EXISTS "Auth users can CRUD kosten" ON public.kosten;
CREATE POLICY "Staff can manage kosten" ON public.kosten FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- vehicle_costs
DROP POLICY IF EXISTS "Auth users can CRUD vehicle_costs" ON public.vehicle_costs;
CREATE POLICY "Staff can manage vehicle_costs" ON public.vehicle_costs FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- handmatige_verkopen
DROP POLICY IF EXISTS "Auth users can CRUD handmatige_verkopen" ON public.handmatige_verkopen;
CREATE POLICY "Staff can manage handmatige_verkopen" ON public.handmatige_verkopen FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- kosten_categorieen
DROP POLICY IF EXISTS "Auth users can CRUD kosten_categorieen" ON public.kosten_categorieen;
CREATE POLICY "Staff can manage kosten_categorieen" ON public.kosten_categorieen FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- aflevering_taken
DROP POLICY IF EXISTS "Auth users can CRUD aflevering_taken" ON public.aflevering_taken;
CREATE POLICY "Staff can manage aflevering_taken" ON public.aflevering_taken FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- vehicle_tasks
DROP POLICY IF EXISTS "Auth users can CRUD vehicle_tasks" ON public.vehicle_tasks;
CREATE POLICY "Staff can manage vehicle_tasks" ON public.vehicle_tasks FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- vehicle_activity_log
DROP POLICY IF EXISTS "Auth users can CRUD vehicle_activity_log" ON public.vehicle_activity_log;
CREATE POLICY "Staff can manage vehicle_activity_log" ON public.vehicle_activity_log FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- vehicle_documents
DROP POLICY IF EXISTS "Auth users can CRUD vehicle_documents" ON public.vehicle_documents;
CREATE POLICY "Staff can manage vehicle_documents" ON public.vehicle_documents FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- vehicle_photos
DROP POLICY IF EXISTS "Auth users can CRUD vehicle_photos" ON public.vehicle_photos;
CREATE POLICY "Staff can manage vehicle_photos" ON public.vehicle_photos FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- document_archive
DROP POLICY IF EXISTS "Auth users can CRUD document_archive" ON public.document_archive;
CREATE POLICY "Staff can manage document_archive" ON public.document_archive FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- document_checklist_items
DROP POLICY IF EXISTS "Auth users can CRUD document_checklist_items" ON public.document_checklist_items;
CREATE POLICY "Staff can manage document_checklist_items" ON public.document_checklist_items FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- time_entries
DROP POLICY IF EXISTS "Auth users can CRUD time_entries" ON public.time_entries;
CREATE POLICY "Staff can manage time_entries" ON public.time_entries FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- proefrit_pdf_logs
DROP POLICY IF EXISTS "Auth users can CRUD proefrit_pdf_logs" ON public.proefrit_pdf_logs;
CREATE POLICY "Staff can manage proefrit_pdf_logs" ON public.proefrit_pdf_logs FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- make_events
DROP POLICY IF EXISTS "Auth users can CRUD make_events" ON public.make_events;
CREATE POLICY "Staff can manage make_events" ON public.make_events FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- vehicle_sales
DROP POLICY IF EXISTS "Auth users can CRUD vehicle_sales" ON public.vehicle_sales;
CREATE POLICY "Staff can manage vehicle_sales" ON public.vehicle_sales FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- verkoop_documenten
DROP POLICY IF EXISTS "Auth users can CRUD verkoop_documenten" ON public.verkoop_documenten;
CREATE POLICY "Staff can manage verkoop_documenten" ON public.verkoop_documenten FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- diensten
DROP POLICY IF EXISTS "Auth users can CRUD diensten" ON public.diensten;
CREATE POLICY "Staff can manage diensten" ON public.diensten FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Public can read active diensten" ON public.diensten FOR SELECT TO anon USING (true);

-- app_settings: restrict SELECT to staff
DROP POLICY IF EXISTS "Auth users can read app_settings" ON public.app_settings;
CREATE POLICY "Staff can read app_settings" ON public.app_settings FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- lead_history
DROP POLICY IF EXISTS "Auth users can CRUD lead_history" ON public.lead_history;
CREATE POLICY "Staff can manage lead_history" ON public.lead_history FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- leads
DROP POLICY IF EXISTS "Auth users can CRUD leads" ON public.leads;
CREATE POLICY "Staff can manage leads" ON public.leads FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

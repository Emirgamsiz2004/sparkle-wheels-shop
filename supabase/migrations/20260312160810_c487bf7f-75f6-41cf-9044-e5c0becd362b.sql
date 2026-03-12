
-- Add new columns to vehicle_costs
ALTER TABLE vehicle_costs ADD COLUMN IF NOT EXISTS leverancier text;
ALTER TABLE vehicle_costs ADD COLUMN IF NOT EXISTS file_path text;
ALTER TABLE vehicle_costs ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE vehicle_costs ADD COLUMN IF NOT EXISTS moneybird_id text;
ALTER TABLE vehicle_costs ADD COLUMN IF NOT EXISTS moneybird_synced_at timestamp with time zone;

-- Add totale_kosten, kostprijs, betaalmethode to vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS totale_kosten numeric(10,2) DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS kostprijs numeric(10,2) DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS betaalmethode text;

-- Create document_checklist_items table
CREATE TABLE IF NOT EXISTS document_checklist_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  naam text NOT NULL,
  verplicht boolean DEFAULT true,
  voltooid boolean DEFAULT false,
  document_id uuid REFERENCES vehicle_documents(id),
  voltooid_op timestamp with time zone
);

ALTER TABLE document_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD document_checklist_items" ON document_checklist_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create make_events table for webhook events
CREATE TABLE IF NOT EXISTS make_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  event_type text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  processed boolean DEFAULT false,
  processed_at timestamp with time zone
);

ALTER TABLE make_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD make_events" ON make_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

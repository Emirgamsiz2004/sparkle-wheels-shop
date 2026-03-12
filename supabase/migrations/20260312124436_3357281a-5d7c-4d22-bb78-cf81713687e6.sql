
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'medewerker');

-- User roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- has_role function (security definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Authenticated users can read roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

-- RLS for profiles
CREATE POLICY "Users can read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Vehicles table
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  merk text NOT NULL,
  model text NOT NULL,
  bouwjaar integer,
  brandstof text DEFAULT 'benzine',
  kilometerstand integer DEFAULT 0,
  kleur text,
  kenteken text,
  inkoopprijs numeric(10,2) DEFAULT 0,
  verkoopprijs numeric(10,2) DEFAULT 0,
  status text DEFAULT 'inkoop',
  inkoop_datum date,
  verkoop_datum date,
  opmerkingen text,
  koper_naam text,
  koper_email text,
  koper_telefoon text
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD vehicles" ON public.vehicles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Vehicle costs table
CREATE TABLE public.vehicle_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  category text DEFAULT 'overig',
  date date DEFAULT current_date,
  invoice_ref text,
  btw_percentage numeric(5,2) DEFAULT 21
);
ALTER TABLE public.vehicle_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD vehicle_costs" ON public.vehicle_costs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Vehicle documents table
CREATE TABLE public.vehicle_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  naam text NOT NULL,
  type text,
  file_path text NOT NULL,
  file_size integer,
  mime_type text
);
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD vehicle_documents" ON public.vehicle_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Vehicle photos table
CREATE TABLE public.vehicle_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  file_path text NOT NULL,
  volgorde integer DEFAULT 0,
  is_hoofdfoto boolean DEFAULT false
);
ALTER TABLE public.vehicle_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD vehicle_photos" ON public.vehicle_photos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inkoop candidates table
CREATE TABLE public.inkoop_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  bron text NOT NULL DEFAULT 'marktplaats',
  bron_link text,
  kenteken text,
  merk text NOT NULL,
  model text NOT NULL,
  bouwjaar integer NOT NULL DEFAULT 2020,
  brandstof text DEFAULT 'benzine',
  kilometerstand integer DEFAULT 0,
  kleur text,
  transmissie text,
  vraagprijs numeric(10,2) DEFAULT 0,
  geschatte_inkoopprijs numeric(10,2) DEFAULT 0,
  geschatte_kosten numeric(10,2) DEFAULT 0,
  geschatte_verkoopprijs numeric(10,2) DEFAULT 0,
  interesse_status text DEFAULT 'nieuw',
  opmerkingen text,
  datum_toegevoegd date DEFAULT current_date
);
ALTER TABLE public.inkoop_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD inkoop_candidates" ON public.inkoop_candidates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Automation searches table
CREATE TABLE public.automation_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  naam text NOT NULL,
  merken text[] DEFAULT '{}',
  modellen text[] DEFAULT '{}',
  bouwjaar_van integer,
  bouwjaar_tot integer,
  km_max integer,
  prijs_max integer,
  brandstof text[] DEFAULT '{}',
  transmissie text[] DEFAULT '{}',
  landen text[] DEFAULT '{nederland}',
  kleuren text[] DEFAULT '{}',
  schade_acceptabel boolean DEFAULT false,
  platforms text[] DEFAULT '{marktplaats}',
  actief boolean DEFAULT true,
  interval_uren integer DEFAULT 24,
  laatst_gedraaid timestamp with time zone
);
ALTER TABLE public.automation_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD automation_searches" ON public.automation_searches FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Automation results table
CREATE TABLE public.automation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  search_id uuid REFERENCES public.automation_searches(id) ON DELETE CASCADE,
  platform text NOT NULL DEFAULT 'marktplaats',
  externe_url text,
  externe_id text,
  kenteken text,
  merk text NOT NULL,
  model text NOT NULL,
  bouwjaar integer,
  brandstof text,
  kilometerstand integer,
  kleur text,
  transmissie text,
  vraagprijs numeric(10,2) DEFAULT 0,
  rdw_data jsonb,
  rdw_checked boolean DEFAULT false,
  geschatte_marktwaarde numeric(10,2),
  geschatte_inkoopprijs numeric(10,2),
  geschatte_winstmarge numeric(10,2),
  deal_score integer,
  ai_analyse jsonb,
  ai_analyzed boolean DEFAULT false,
  bpm_bedrag numeric(10,2),
  is_import boolean DEFAULT false,
  status text DEFAULT 'nieuw',
  opmerkingen text,
  afbeelding_url text,
  contact_status text DEFAULT 'geen',
  contact_naam text,
  contact_telefoon text,
  contact_email text,
  laatste_contact timestamp with time zone
);
ALTER TABLE public.automation_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD automation_results" ON public.automation_results FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Automation templates table
CREATE TABLE public.automation_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  naam text NOT NULL,
  type text DEFAULT 'eerste_contact',
  onderwerp text,
  inhoud text NOT NULL DEFAULT '',
  is_default boolean DEFAULT false
);
ALTER TABLE public.automation_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD automation_templates" ON public.automation_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-documents', 'vehicle-documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-photos', 'vehicle-photos', true) ON CONFLICT DO NOTHING;

-- Storage policies for vehicle-documents (private, auth only)
CREATE POLICY "Auth users can upload vehicle docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'vehicle-documents');
CREATE POLICY "Auth users can view vehicle docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'vehicle-documents');
CREATE POLICY "Auth users can delete vehicle docs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'vehicle-documents');

-- Storage policies for vehicle-photos (public read, auth write)
CREATE POLICY "Anyone can view vehicle photos" ON storage.objects FOR SELECT USING (bucket_id = 'vehicle-photos');
CREATE POLICY "Auth users can upload vehicle photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'vehicle-photos');
CREATE POLICY "Auth users can delete vehicle photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'vehicle-photos');

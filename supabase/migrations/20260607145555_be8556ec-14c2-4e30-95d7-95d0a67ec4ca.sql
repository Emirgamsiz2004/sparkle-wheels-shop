-- Add origin tracking for trade-in vehicles
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS herkomst text NOT NULL DEFAULT 'inkoop',
  ADD COLUMN IF NOT EXISTS inruil_van_verkoop_id uuid REFERENCES public.verkopen(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vehicles_herkomst ON public.vehicles(herkomst);
CREATE INDEX IF NOT EXISTS idx_vehicles_inruil_van_verkoop_id ON public.vehicles(inruil_van_verkoop_id);

-- Trigger: when an inruil is set 'op naam', create a vehicle row in stock
CREATE OR REPLACE FUNCTION public.create_vehicle_from_inruil()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists boolean;
BEGIN
  IF COALESCE(NEW.inruil, false) = false THEN RETURN NEW; END IF;
  IF COALESCE(NEW.inruil_op_naam, false) = false THEN RETURN NEW; END IF;
  IF COALESCE(OLD.inruil_op_naam, false) = true THEN RETURN NEW; END IF;
  IF NEW.inruil_kenteken IS NULL OR length(trim(NEW.inruil_kenteken)) = 0 THEN RETURN NEW; END IF;

  SELECT EXISTS(SELECT 1 FROM public.vehicles WHERE inruil_van_verkoop_id = NEW.id) INTO v_exists;
  IF v_exists THEN RETURN NEW; END IF;

  INSERT INTO public.vehicles (
    merk, model, bouwjaar, kenteken, kilometerstand, kleur, chassis_nummer,
    inkoopprijs, inkoop_datum, status, herkomst, inruil_van_verkoop_id
  ) VALUES (
    COALESCE(NULLIF(NEW.inruil_merk,''), 'Onbekend'),
    COALESCE(NULLIF(NEW.inruil_model,''), 'Onbekend'),
    NEW.inruil_bouwjaar,
    NEW.inruil_kenteken,
    COALESCE(NEW.inruil_km, 0),
    NEW.inruil_kleur,
    NEW.inruil_chassis,
    COALESCE(NEW.inruil_waarde, 0),
    COALESCE(NEW.inruil_op_naam_at::date, CURRENT_DATE),
    'inkoop',
    'inruil',
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_vehicle_from_inruil ON public.verkopen;
CREATE TRIGGER trg_create_vehicle_from_inruil
AFTER UPDATE OF inruil_op_naam ON public.verkopen
FOR EACH ROW
EXECUTE FUNCTION public.create_vehicle_from_inruil();
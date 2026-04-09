
ALTER TABLE public.vehicles
ADD COLUMN btw_marge_type text NOT NULL DEFAULT 'marge'
CHECK (btw_marge_type IN ('marge', 'btw'));

COMMENT ON COLUMN public.vehicles.btw_marge_type IS 'marge = margeregeling (BTW over winst), btw = BTW-auto (21% over verkoopprijs)';

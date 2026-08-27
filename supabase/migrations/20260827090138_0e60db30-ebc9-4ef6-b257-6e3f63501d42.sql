-- 1. Verwijder duplicaat-voertuigen die de kapotte feed-sync op 2026-08-26 aanmaakte
DELETE FROM public.vehicles v
WHERE v.created_at::date = '2026-08-26'
  AND v.feed_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.vehicles o
    WHERE o.feed_id = v.feed_id AND o.created_at < '2026-08-26'::date
  )
  AND NOT EXISTS (SELECT 1 FROM public.verkopen s WHERE s.vehicle_id = v.id);

-- 2. Zet voertuigen die onterecht op verkocht zijn gezet terug op te_koop
UPDATE public.vehicles v
SET status = 'te_koop', verkoop_datum = NULL
WHERE v.status = 'verkocht'
  AND v.verkoop_datum = '2026-08-26'
  AND v.koper_naam IS NULL
  AND v.koper_email IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.verkopen s WHERE s.vehicle_id = v.id);

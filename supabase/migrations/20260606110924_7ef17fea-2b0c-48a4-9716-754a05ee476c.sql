
UPDATE public.vehicles v
SET 
  koper_naam = COALESCE(NULLIF(v.koper_naam, ''), 
    NULLIF(TRIM(CASE WHEN c.bedrijfsnaam IS NOT NULL AND TRIM(c.bedrijfsnaam) <> '' 
      THEN c.bedrijfsnaam 
      ELSE CONCAT_WS(' ', c.voornaam, c.achternaam) END), '')),
  koper_email = COALESCE(NULLIF(v.koper_email, ''), c.email),
  koper_telefoon = COALESCE(NULLIF(v.koper_telefoon, ''), c.telefoon),
  verkoop_datum = COALESCE(v.verkoop_datum, vk.leverdatum),
  verkoopprijs = COALESCE(NULLIF(v.verkoopprijs, 0), vk.verkoopprijs)
FROM public.verkopen vk
LEFT JOIN public.customers c ON c.id = vk.customer_id
WHERE vk.vehicle_id = v.id
  AND v.status = 'verkocht'
  AND vk.customer_id IS NOT NULL
  AND vk.wizard_status IN ('afgerond','bezig','geannuleerd');

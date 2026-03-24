import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VoorraadVoertuig {
  id: string;
  merk: string;
  model: string;
  type: string;
  bouwjaar: string;
  brandstof: string;
  transmissie: string;
  kilometerstand: string;
  carrosserie: string;
  kleur: string;
  prijs: number;
  vermogen_pk: string;
  afbeelding: string;
  url: string;
  kenteken: string;
}

async function fetchVoorraad(): Promise<VoorraadVoertuig[]> {
  const { data, error } = await supabase.functions.invoke("fetch-voorraad");
  if (error) throw new Error(error.message || "Feed niet beschikbaar");
  if (data?.error) throw new Error(data.error);
  return data?.vehicles ?? [];
}

export function useVoorraadFeed() {
  return useQuery({
    queryKey: ["voorraad-feed"],
    queryFn: fetchVoorraad,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

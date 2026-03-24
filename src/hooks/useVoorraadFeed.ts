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
  kenteken: string;
}

export interface VoorraadVoertuigDetail extends VoorraadVoertuig {
  fotos: string[];
  beschrijving: string;
  opties: string[];
  nap: string;
  bovag_garantie: string;
  garantie_maanden: string;
  extra: {
    topsnelheid: string;
    verbruik: string;
    co2: string;
    energielabel: string;
    bekleding: string;
    aandrijving: string;
    deuren: string;
    cilinders: string;
    gewicht: string;
    tankinhoud: string;
    apk: string;
    zitplaatsen: string;
    acceleratie: string;
  };
}

async function fetchVoorraad(): Promise<VoorraadVoertuig[]> {
  const { data, error } = await supabase.functions.invoke("fetch-voorraad");
  if (error) throw new Error(error.message || "Feed niet beschikbaar");
  if (data?.error) throw new Error(data.error);
  return data?.vehicles ?? [];
}

async function fetchVoorraadDetail(id: string): Promise<VoorraadVoertuigDetail> {
  const { data, error } = await supabase.functions.invoke("fetch-voorraad", {
    body: {},
    headers: {},
  });

  // We need to pass the id as a query param - use direct fetch
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const res = await fetch(
    `https://${projectId}.supabase.co/functions/v1/fetch-voorraad?id=${encodeURIComponent(id)}`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Voertuig niet gevonden");
  }

  const result = await res.json();
  return result.vehicle;
}

export function useVoorraadFeed() {
  return useQuery({
    queryKey: ["voorraad-feed"],
    queryFn: fetchVoorraad,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useVoorraadDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["voorraad-detail", id],
    queryFn: () => fetchVoorraadDetail(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type KostFrequentie = "eenmalig" | "maandelijks" | "kwartaal" | "jaarlijks";
export type KostCategorie =
  | "vaste_kosten"
  | "advertentiekosten"
  | "abonnementen"
  | "personeelskosten"
  | "voertuigkosten"
  | "overig";

export interface Kost {
  id: string;
  naam: string;
  categorie: KostCategorie;
  categorie_id?: string | null;
  bedrag: number;
  frequentie: KostFrequentie;
  datum: string;
  leverancier: string | null;
  notities: string | null;
  actief: boolean;
  created_at: string;
  updated_at: string;
}

export const kostCategorieLabels: Record<KostCategorie, string> = {
  vaste_kosten: "Vaste kosten",
  advertentiekosten: "Advertentiekosten",
  abonnementen: "Abonnementen",
  personeelskosten: "Personeelskosten",
  voertuigkosten: "Voertuigkosten",
  overig: "Overig",
};

export const kostFrequentieLabels: Record<KostFrequentie, string> = {
  eenmalig: "Eenmalig",
  maandelijks: "Maandelijks",
  kwartaal: "Per kwartaal",
  jaarlijks: "Jaarlijks",
};

export const useKosten = () => {
  const [kosten, setKosten] = useState<Kost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("kosten")
      .select("*")
      .order("datum", { ascending: false });
    if (error) {
      toast.error("Kon kosten niet laden");
      console.error(error);
    } else {
      setKosten((data as Kost[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (input: Partial<Kost>) => {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("kosten").insert({
      naam: input.naam!,
      categorie: input.categorie || "overig",
      categorie_id: input.categorie_id || null,
      bedrag: input.bedrag || 0,
      frequentie: input.frequentie || "eenmalig",
      datum: input.datum || new Date().toISOString().slice(0, 10),
      leverancier: input.leverancier || null,
      notities: input.notities || null,
      actief: input.actief ?? true,
      user_id: userData.user?.id,
    });
    if (error) {
      toast.error("Kon kost niet opslaan");
      throw error;
    }
    toast.success("Kost toegevoegd");
    await load();
  };

  const update = async (id: string, input: Partial<Kost>) => {
    const { error } = await supabase.from("kosten").update(input).eq("id", id);
    if (error) {
      toast.error("Kon kost niet bijwerken");
      throw error;
    }
    toast.success("Kost bijgewerkt");
    await load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("kosten").delete().eq("id", id);
    if (error) {
      toast.error("Kon kost niet verwijderen");
      throw error;
    }
    toast.success("Kost verwijderd");
    await load();
  };

  return { kosten, loading, reload: load, create, update, remove };
};

/**
 * Bereken hoeveel een kost in een gegeven periode (from..to inclusive) telt.
 * Eenmalig: alleen meegeteld als datum binnen periode valt.
 * Terugkerend: bedrag * aantal "betaalmomenten" tussen max(start,datum) en to.
 */
export const kostBedragInPeriode = (kost: Kost, from: Date, to: Date): number => {
  if (!kost.actief && kost.frequentie !== "eenmalig") return 0;
  const datum = new Date(kost.datum);
  if (datum > to) return 0;

  if (kost.frequentie === "eenmalig") {
    return datum >= from && datum <= to ? Number(kost.bedrag) : 0;
  }

  // Bereken per-maand bedrag
  let perMaand = 0;
  if (kost.frequentie === "maandelijks") perMaand = Number(kost.bedrag);
  else if (kost.frequentie === "kwartaal") perMaand = Number(kost.bedrag) / 3;
  else if (kost.frequentie === "jaarlijks") perMaand = Number(kost.bedrag) / 12;

  // Aantal maanden tussen max(start, datum) en to (inclusive)
  const start = datum > from ? datum : from;
  const months =
    (to.getFullYear() - start.getFullYear()) * 12 +
    (to.getMonth() - start.getMonth()) +
    1;
  return Math.max(0, months) * perMaand;
};

export const formatEuro = (n: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n || 0);

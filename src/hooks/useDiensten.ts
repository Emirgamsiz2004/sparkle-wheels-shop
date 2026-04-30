import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type DienstCategorie = "detailing" | "onderhoud" | "reparatie" | "overig";

export interface Dienst {
  id: string;
  naam: string;
  categorie: DienstCategorie;
  duur_minuten: number;
  volgorde: number;
  actief: boolean;
  created_at: string;
  updated_at: string;
}

export const dienstCategorieLabels: Record<DienstCategorie, string> = {
  detailing: "Detailing & reiniging",
  onderhoud: "Onderhoud",
  reparatie: "Reparatie",
  overig: "Overig",
};

export const useDiensten = () => {
  const [diensten, setDiensten] = useState<Dienst[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("diensten" as any)
      .select("*")
      .eq("actief", true)
      .order("volgorde", { ascending: true });
    if (error) {
      console.error(error);
      toast.error("Kon diensten niet laden");
    } else {
      setDiensten((data as any as Dienst[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (input: Partial<Dienst>) => {
    const { error } = await supabase.from("diensten" as any).insert({
      naam: input.naam!,
      categorie: input.categorie || "overig",
      duur_minuten: input.duur_minuten || 60,
      volgorde: input.volgorde ?? 999,
      actief: input.actief ?? true,
    } as any);
    if (error) {
      toast.error("Kon dienst niet opslaan");
      throw error;
    }
    toast.success("Dienst toegevoegd");
    await load();
  };

  const update = async (id: string, input: Partial<Dienst>) => {
    const { error } = await supabase.from("diensten" as any).update(input as any).eq("id", id);
    if (error) {
      toast.error("Kon dienst niet bijwerken");
      throw error;
    }
    await load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("diensten" as any).delete().eq("id", id);
    if (error) {
      toast.error("Kon dienst niet verwijderen");
      throw error;
    }
    toast.success("Dienst verwijderd");
    await load();
  };

  const reorder = async (id: string, direction: "up" | "down") => {
    const sorted = [...diensten].sort((a, b) => a.volgorde - b.volgorde);
    const idx = sorted.findIndex((d) => d.id === id);
    if (idx === -1) return;
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapWith];
    await Promise.all([
      supabase.from("diensten" as any).update({ volgorde: b.volgorde } as any).eq("id", a.id),
      supabase.from("diensten" as any).update({ volgorde: a.volgorde } as any).eq("id", b.id),
    ]);
    await load();
  };

  return { diensten, loading, reload: load, create, update, remove, reorder };
};

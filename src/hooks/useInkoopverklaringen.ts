import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Inkoopverklaring {
  id: string;
  documentNaam: string;
  verkoperNaam: string;
  verkoperEmail?: string;
  verkoperTelefoon: string;
  verkoperAdres: string;
  verkoperWoonplaats: string;
  kenteken?: string;
  merk: string;
  model: string;
  bouwjaar?: number;
  kilometerstand?: number;
  chassisnummer?: string;
  legitimatieType: string;
  legitimatieNummer: string;
  inkoopprijs: number;
  datum: string;
  handtekeningData?: string;
  pdfPath?: string;
  status: string;
  vehicleId?: string;
  userId?: string;
  moneybirdReceiptId?: string;
  moneybirdSyncedAt?: string;
  createdAt: string;
}

export function useInkoopverklaringen() {
  const [verklaringen, setVerklaringen] = useState<Inkoopverklaring[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("inkoopverklaringen")
      .select("*")
      .order("datum", { ascending: false });

    if (error) {
      console.error("Error fetching inkoopverklaringen:", error);
      return;
    }

    setVerklaringen(
      (data || []).map((r: any) => ({
        id: r.id,
        documentNaam: r.document_naam,
        verkoperNaam: r.verkoper_naam,
        verkoperEmail: r.verkoper_email,
        verkoperTelefoon: r.verkoper_telefoon,
        verkoperAdres: r.verkoper_adres,
        verkoperWoonplaats: r.verkoper_woonplaats,
        kenteken: r.kenteken,
        merk: r.merk,
        model: r.model,
        bouwjaar: r.bouwjaar,
        kilometerstand: r.kilometerstand,
        chassisnummer: r.chassisnummer,
        legitimatieType: r.legitimatie_type,
        legitimatieNummer: r.legitimatie_nummer,
        inkoopprijs: Number(r.inkoopprijs),
        datum: r.datum,
        handtekeningData: r.handtekening_data,
        pdfPath: r.pdf_path,
        status: r.status,
        vehicleId: r.vehicle_id,
        userId: r.user_id,
        moneybirdReceiptId: r.moneybird_receipt_id,
        moneybirdSyncedAt: r.moneybird_synced_at,
        createdAt: r.created_at,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addVerklaring = useCallback(async (data: Omit<Inkoopverklaring, "id" | "createdAt">) => {
    const { data: user } = await supabase.auth.getUser();
    const { data: result, error } = await supabase.from("inkoopverklaringen").insert({
      document_naam: data.documentNaam,
      verkoper_naam: data.verkoperNaam,
      verkoper_email: data.verkoperEmail || null,
      verkoper_telefoon: data.verkoperTelefoon,
      verkoper_adres: data.verkoperAdres,
      verkoper_woonplaats: data.verkoperWoonplaats,
      kenteken: data.kenteken || null,
      merk: data.merk,
      model: data.model,
      bouwjaar: data.bouwjaar || null,
      kilometerstand: data.kilometerstand || null,
      chassisnummer: data.chassisnummer || null,
      legitimatie_type: data.legitimatieType,
      legitimatie_nummer: data.legitimatieNummer,
      inkoopprijs: data.inkoopprijs,
      datum: data.datum,
      handtekening_data: data.handtekeningData || null,
      pdf_path: data.pdfPath || null,
      status: data.status,
      vehicle_id: data.vehicleId || null,
      user_id: user?.user?.id || null,
    } as any).select().single();

    if (error) {
      toast.error("Fout bij opslaan inkoopverklaring");
      console.error(error);
      return null;
    }
    await fetch();
    return result;
  }, [fetch]);

  const linkToVehicle = useCallback(async (id: string, vehicleId: string) => {
    const { error } = await supabase
      .from("inkoopverklaringen")
      .update({ vehicle_id: vehicleId } as any)
      .eq("id", id);

    if (error) {
      toast.error("Fout bij koppelen");
      return;
    }
    toast.success("Inkoopverklaring gekoppeld aan voertuig");
    await fetch();
  }, [fetch]);

  return { verklaringen, loading, addVerklaring, linkToVehicle, refetch: fetch };
}

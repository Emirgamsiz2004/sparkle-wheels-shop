import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Vehicle, CostItem } from '@/types/vehicle';
import { toast } from 'sonner';

const mapDbToVehicle = (row: any, costs: any[]): Vehicle => ({
  id: row.id,
  kenteken: row.kenteken || '',
  merk: row.merk,
  model: row.model,
  bouwjaar: row.bouwjaar || 0,
  brandstof: row.brandstof || 'benzine',
  kilometerstand: row.kilometerstand || 0,
  kleur: row.kleur || '',
  inkoopprijs: Number(row.inkoopprijs) || 0,
  verkoopprijs: Number(row.verkoopprijs) || 0,
  status: row.status || 'inkoop',
  inkoopDatum: row.inkoop_datum || new Date().toISOString().split('T')[0],
  verkoopDatum: row.verkoop_datum || undefined,
  opmerkingen: row.opmerkingen || undefined,
  koperNaam: row.koper_naam || undefined,
  koperEmail: row.koper_email || undefined,
  koperTelefoon: row.koper_telefoon || undefined,
  googleDriveFolderId: row.google_drive_folder_id || null,
  googleDriveFolderUrl: row.google_drive_folder_url || null,
  googleDriveSynced: row.google_drive_synced || false,
  verkoopType: row.verkoop_type || 'regulier',
  consignatieCommissiePerc: Number(row.consignatie_commissie_perc) || 10,
  consignatieEigenaarNaam: row.consignatie_eigenaar_naam || undefined,
  consignatieEigenaarTelefoon: row.consignatie_eigenaar_telefoon || undefined,
  consignatieEigenaarEmail: row.consignatie_eigenaar_email || undefined,
  kosten: costs.map(c => ({
    id: c.id,
    description: c.description,
    amount: Number(c.amount),
    category: c.category,
    date: c.date,
    invoiceRef: c.invoice_ref || undefined,
    btwPercentage: Number(c.btw_percentage) || 21,
    leverancier: c.leverancier || undefined,
    filePath: c.file_path || undefined,
    fileName: c.file_name || undefined,
    moneybirdId: c.moneybird_id || undefined,
    moneybirdSyncedAt: c.moneybird_synced_at || undefined,
  })),
  betaalmethode: row.betaalmethode || undefined,
  totaleKosten: Number(row.totale_kosten) || 0,
  kostprijsCalc: Number(row.kostprijs) || 0,
  marktplaatsUrl: row.marktplaats_url || undefined,
  feedId: row.feed_id || undefined,
  apkVervaldatum: row.apk_vervaldatum || undefined,
});

export function useVehicles() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = useCallback(async () => {
    if (!user) { setVehicles([]); setLoading(false); return; }
    
    const { data: vData, error: vErr } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (vErr) { toast.error('Fout bij laden voertuigen'); setLoading(false); return; }

    const { data: cData } = await supabase
      .from('vehicle_costs')
      .select('*')
      .order('date', { ascending: true });

    const costsMap: Record<string, any[]> = {};
    (cData || []).forEach((c: any) => {
      if (!costsMap[c.vehicle_id]) costsMap[c.vehicle_id] = [];
      costsMap[c.vehicle_id].push(c);
    });

    setVehicles((vData || []).map((v: any) => mapDbToVehicle(v, costsMap[v.id] || [])));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const addVehicle = async (data: Omit<Vehicle, 'id' | 'kosten'>) => {
    if (!user) return;
    const { error } = await supabase.from('vehicles').insert({
      user_id: user.id,
      kenteken: data.kenteken,
      merk: data.merk,
      model: data.model,
      bouwjaar: data.bouwjaar,
      brandstof: data.brandstof,
      kilometerstand: data.kilometerstand,
      kleur: data.kleur,
      inkoopprijs: data.inkoopprijs,
      verkoopprijs: data.verkoopprijs,
      status: data.status,
      inkoop_datum: data.inkoopDatum,
      verkoop_datum: data.verkoopDatum || null,
      opmerkingen: data.opmerkingen || null,
      koper_naam: data.koperNaam || null,
      koper_email: data.koperEmail || null,
      koper_telefoon: data.koperTelefoon || null,
      verkoop_type: data.verkoopType || 'regulier',
      consignatie_commissie_perc: data.consignatieCommissiePerc || 10,
      consignatie_eigenaar_naam: data.consignatieEigenaarNaam || null,
      consignatie_eigenaar_telefoon: data.consignatieEigenaarTelefoon || null,
      consignatie_eigenaar_email: data.consignatieEigenaarEmail || null,
      apk_vervaldatum: data.apkVervaldatum || null,
    } as any);
    if (error) { toast.error('Fout bij toevoegen voertuig'); return; }
    toast.success('Voertuig toegevoegd');
    fetchVehicles();
  };

  const updateVehicle = async (updated: Vehicle) => {
    const { error } = await supabase.from('vehicles').update({
      kenteken: updated.kenteken,
      merk: updated.merk,
      model: updated.model,
      bouwjaar: updated.bouwjaar,
      brandstof: updated.brandstof,
      kilometerstand: updated.kilometerstand,
      kleur: updated.kleur,
      inkoopprijs: updated.inkoopprijs,
      verkoopprijs: updated.verkoopprijs,
      status: updated.status,
      inkoop_datum: updated.inkoopDatum,
      verkoop_datum: updated.verkoopDatum || null,
      opmerkingen: updated.opmerkingen || null,
      koper_naam: updated.koperNaam || null,
      koper_email: updated.koperEmail || null,
      koper_telefoon: updated.koperTelefoon || null,
      verkoop_type: updated.verkoopType || 'regulier',
      consignatie_commissie_perc: updated.consignatieCommissiePerc || 10,
      consignatie_eigenaar_naam: updated.consignatieEigenaarNaam || null,
      consignatie_eigenaar_telefoon: updated.consignatieEigenaarTelefoon || null,
      consignatie_eigenaar_email: updated.consignatieEigenaarEmail || null,
      marktplaats_url: updated.marktplaatsUrl || null,
      kostprijs: updated.kostprijsCalc || null,
      apk_vervaldatum: updated.apkVervaldatum || null,
    } as any).eq('id', updated.id);
    if (error) { toast.error('Fout bij bijwerken voertuig'); return; }
    toast.success('Voertuig bijgewerkt');
    fetchVehicles();
  };

  const deleteVehicle = async (id: string) => {
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) { toast.error('Fout bij verwijderen voertuig'); return; }
    toast.success('Voertuig verwijderd');
    fetchVehicles();
  };

  const addCost = async (vehicleId: string, cost: Omit<CostItem, 'id'>) => {
    const { error } = await supabase.from('vehicle_costs').insert({
      vehicle_id: vehicleId,
      description: cost.description,
      amount: cost.amount,
      category: cost.category,
      date: cost.date,
      invoice_ref: cost.invoiceRef || null,
      btw_percentage: cost.btwPercentage || 21,
      leverancier: cost.leverancier || null,
      file_path: cost.filePath || null,
      file_name: cost.fileName || null,
    } as any);
    if (error) { toast.error('Fout bij toevoegen kosten'); return; }
    // Recalculate totale_kosten and kostprijs
    await recalcVehicleCosts(vehicleId);
    // Insert make_event
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      await supabase.from('make_events').insert({
        event_type: 'vehicle_cost.created',
        payload: { ...cost, vehicle_id: vehicleId, kenteken: vehicle.kenteken, merk: vehicle.merk, model: vehicle.model },
      } as any);
    }
    toast.success('Kosten toegevoegd');
    fetchVehicles();
  };

  const recalcVehicleCosts = async (vehicleId: string) => {
    const { data: costs } = await supabase.from('vehicle_costs').select('amount').eq('vehicle_id', vehicleId);
    const totalKosten = (costs || []).reduce((s: number, c: any) => s + Number(c.amount), 0);
    const { data: vData } = await supabase.from('vehicles').select('inkoopprijs').eq('id', vehicleId).single();
    const inkoopprijs = Number(vData?.inkoopprijs) || 0;
    await supabase.from('vehicles').update({
      totale_kosten: totalKosten,
      kostprijs: inkoopprijs + totalKosten,
    } as any).eq('id', vehicleId);
  };

  const removeCost = async (costId: string, vehicleId?: string) => {
    const { error } = await supabase.from('vehicle_costs').delete().eq('id', costId);
    if (error) { toast.error('Fout bij verwijderen kosten'); return; }
    if (vehicleId) await recalcVehicleCosts(vehicleId);
    fetchVehicles();
  };

  return { vehicles, loading, addVehicle, updateVehicle, deleteVehicle, addCost, removeCost, refetch: fetchVehicles };
}

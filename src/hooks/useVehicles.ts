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
  kosten: costs.map(c => ({
    id: c.id,
    description: c.description,
    amount: Number(c.amount),
    category: c.category,
    date: c.date,
    invoiceRef: c.invoice_ref || undefined,
    btwPercentage: Number(c.btw_percentage) || 21,
  })),
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
    } as any);
    if (error) { toast.error('Fout bij toevoegen kosten'); return; }
    toast.success('Kosten toegevoegd');
    fetchVehicles();
  };

  const removeCost = async (costId: string) => {
    const { error } = await supabase.from('vehicle_costs').delete().eq('id', costId);
    if (error) { toast.error('Fout bij verwijderen kosten'); return; }
    fetchVehicles();
  };

  return { vehicles, loading, addVehicle, updateVehicle, deleteVehicle, addCost, removeCost, refetch: fetchVehicles };
}

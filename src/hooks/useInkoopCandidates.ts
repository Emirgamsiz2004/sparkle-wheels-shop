import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { InkoopCandidate } from '@/types/vehicle';
import { toast } from 'sonner';

const mapDbToCandidate = (row: any): InkoopCandidate => ({
  id: row.id,
  bron: row.bron,
  bronLink: row.bron_link || undefined,
  kenteken: row.kenteken || undefined,
  merk: row.merk,
  model: row.model,
  bouwjaar: row.bouwjaar,
  brandstof: row.brandstof || 'benzine',
  kilometerstand: row.kilometerstand || 0,
  kleur: row.kleur || undefined,
  transmissie: row.transmissie || undefined,
  vraagprijs: Number(row.vraagprijs) || 0,
  geschatteInkoopprijs: Number(row.geschatte_inkoopprijs) || 0,
  geschatteKosten: Number(row.geschatte_kosten) || 0,
  geschatteVerkoopprijs: Number(row.geschatte_verkoopprijs) || 0,
  interesseStatus: row.interesse_status || 'nieuw',
  opmerkingen: row.opmerkingen || undefined,
  datumToegevoegd: row.datum_toegevoegd || new Date().toISOString().split('T')[0],
});

export function useInkoopCandidates() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<InkoopCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCandidates = useCallback(async () => {
    if (!user) { setCandidates([]); setLoading(false); return; }
    
    const { data, error } = await supabase
      .from('inkoop_candidates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { toast.error('Fout bij laden inkoop kandidaten'); setLoading(false); return; }
    setCandidates((data || []).map(mapDbToCandidate));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  const addCandidate = async (data: Omit<InkoopCandidate, 'id'>) => {
    if (!user) return;
    const { error } = await supabase.from('inkoop_candidates').insert({
      user_id: user.id,
      bron: data.bron,
      bron_link: data.bronLink || null,
      kenteken: data.kenteken || null,
      merk: data.merk,
      model: data.model,
      bouwjaar: data.bouwjaar,
      brandstof: data.brandstof,
      kilometerstand: data.kilometerstand,
      kleur: data.kleur || null,
      transmissie: data.transmissie || null,
      vraagprijs: data.vraagprijs,
      geschatte_inkoopprijs: data.geschatteInkoopprijs,
      geschatte_kosten: data.geschatteKosten,
      geschatte_verkoopprijs: data.geschatteVerkoopprijs,
      interesse_status: data.interesseStatus,
      opmerkingen: data.opmerkingen || null,
      datum_toegevoegd: data.datumToegevoegd,
    } as any);
    if (error) { toast.error('Fout bij toevoegen kandidaat'); return; }
    toast.success('Kandidaat toegevoegd');
    fetchCandidates();
  };

  const updateCandidate = async (id: string, data: Omit<InkoopCandidate, 'id'>) => {
    const { error } = await supabase.from('inkoop_candidates').update({
      bron: data.bron,
      bron_link: data.bronLink || null,
      kenteken: data.kenteken || null,
      merk: data.merk,
      model: data.model,
      bouwjaar: data.bouwjaar,
      brandstof: data.brandstof,
      kilometerstand: data.kilometerstand,
      kleur: data.kleur || null,
      transmissie: data.transmissie || null,
      vraagprijs: data.vraagprijs,
      geschatte_inkoopprijs: data.geschatteInkoopprijs,
      geschatte_kosten: data.geschatteKosten,
      geschatte_verkoopprijs: data.geschatteVerkoopprijs,
      interesse_status: data.interesseStatus,
      opmerkingen: data.opmerkingen || null,
      datum_toegevoegd: data.datumToegevoegd,
    } as any).eq('id', id);
    if (error) { toast.error('Fout bij bijwerken kandidaat'); return; }
    toast.success('Kandidaat bijgewerkt');
    fetchCandidates();
  };

  const removeCandidate = async (id: string) => {
    const { error } = await supabase.from('inkoop_candidates').delete().eq('id', id);
    if (error) { toast.error('Fout bij verwijderen kandidaat'); return; }
    fetchCandidates();
  };

  return { candidates, loading, addCandidate, updateCandidate, removeCandidate, refetch: fetchCandidates };
}

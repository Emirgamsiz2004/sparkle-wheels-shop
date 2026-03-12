import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface AutomationSearch {
  id: string;
  naam: string;
  merken: string[];
  modellen: string[];
  bouwjaar_van: number | null;
  bouwjaar_tot: number | null;
  km_max: number | null;
  prijs_max: number | null;
  brandstof: string[];
  transmissie: string[];
  landen: string[];
  kleuren: string[];
  schade_acceptabel: boolean;
  platforms: string[];
  actief: boolean;
  interval_uren: number;
  laatst_gedraaid: string | null;
  created_at: string;
}

export interface AutomationResult {
  id: string;
  search_id: string;
  platform: string;
  externe_url: string | null;
  externe_id: string | null;
  kenteken: string | null;
  merk: string;
  model: string;
  bouwjaar: number | null;
  brandstof: string | null;
  kilometerstand: number | null;
  kleur: string | null;
  transmissie: string | null;
  vraagprijs: number;
  rdw_data: any;
  rdw_checked: boolean;
  geschatte_marktwaarde: number | null;
  geschatte_inkoopprijs: number | null;
  geschatte_winstmarge: number | null;
  deal_score: number | null;
  ai_analyse: any;
  ai_analyzed: boolean;
  bpm_bedrag: number | null;
  is_import: boolean;
  status: string;
  opmerkingen: string | null;
  afbeelding_url: string | null;
  contact_status: string;
  contact_naam: string | null;
  contact_telefoon: string | null;
  contact_email: string | null;
  laatste_contact: string | null;
  created_at: string;
}

export interface AutomationTemplate {
  id: string;
  naam: string;
  type: string;
  onderwerp: string | null;
  inhoud: string;
  is_default: boolean;
  created_at: string;
}

export const platformLabels: Record<string, string> = {
  marktplaats: 'Marktplaats.nl',
  autoscout24_nl: 'AutoScout24.nl',
  autoscout24_de: 'AutoScout24.de',
  autotrack: 'AutoTrack.nl',
  facebook: 'Facebook Marketplace',
  mobile_de: 'Mobile.de',
  bca: 'BCA Veilingen',
  autobid: 'Autobid',
  pkw_de: 'Pkw.de',
};

export const statusLabels: Record<string, string> = {
  nieuw: 'Nieuw',
  beoordeeld: 'Beoordeeld',
  goedgekeurd: 'Goedgekeurd',
  afgekeurd: 'Afgekeurd',
  ingekocht: 'Ingekocht',
};

export const contactStatusLabels: Record<string, string> = {
  geen: 'Geen contact',
  benaderd: 'Benaderd',
  in_onderhandeling: 'In onderhandeling',
  afgewezen: 'Afgewezen',
  akkoord: 'Akkoord',
};

export function useAutomationSearches() {
  const { user } = useAuth();
  const [searches, setSearches] = useState<AutomationSearch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    if (!user) { setSearches([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from('automation_searches')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { toast.error('Fout bij laden zoekopdrachten'); setLoading(false); return; }
    setSearches((data || []) as any);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const addSearch = async (s: Partial<AutomationSearch>) => {
    if (!user) return;
    const { error } = await supabase.from('automation_searches').insert({ ...s, user_id: user.id } as any);
    if (error) { toast.error('Fout bij aanmaken zoekopdracht'); return; }
    toast.success('Zoekopdracht aangemaakt');
    fetch_();
  };

  const updateSearch = async (id: string, s: Partial<AutomationSearch>) => {
    const { error } = await supabase.from('automation_searches').update(s as any).eq('id', id);
    if (error) { toast.error('Fout bij bijwerken'); return; }
    toast.success('Zoekopdracht bijgewerkt');
    fetch_();
  };

  const removeSearch = async (id: string) => {
    const { error } = await supabase.from('automation_searches').delete().eq('id', id);
    if (error) { toast.error('Fout bij verwijderen'); return; }
    toast.success('Zoekopdracht verwijderd');
    fetch_();
  };

  return { searches, loading, addSearch, updateSearch, removeSearch, refetch: fetch_ };
}

export function useAutomationResults(searchId?: string) {
  const { user } = useAuth();
  const [results, setResults] = useState<AutomationResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    if (!user) { setResults([]); setLoading(false); return; }
    let query = supabase.from('automation_results').select('*').order('deal_score', { ascending: false, nullsFirst: false });
    if (searchId) query = query.eq('search_id', searchId);
    const { data, error } = await query;
    if (error) { toast.error('Fout bij laden resultaten'); setLoading(false); return; }
    setResults((data || []) as any);
    setLoading(false);
  }, [user, searchId]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const updateResult = async (id: string, updates: Partial<AutomationResult>) => {
    const { error } = await supabase.from('automation_results').update(updates as any).eq('id', id);
    if (error) { toast.error('Fout bij bijwerken'); return; }
    fetch_();
  };

  const removeResult = async (id: string) => {
    const { error } = await supabase.from('automation_results').delete().eq('id', id);
    if (error) { toast.error('Fout bij verwijderen'); return; }
    fetch_();
  };

  return { results, loading, updateResult, removeResult, refetch: fetch_ };
}

export function useAutomationTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    if (!user) { setTemplates([]); setLoading(false); return; }
    const { data, error } = await supabase.from('automation_templates').select('*').order('created_at', { ascending: false });
    if (error) { toast.error('Fout bij laden templates'); setLoading(false); return; }
    setTemplates((data || []) as any);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const addTemplate = async (t: Partial<AutomationTemplate>) => {
    if (!user) return;
    const { error } = await supabase.from('automation_templates').insert({ ...t, user_id: user.id } as any);
    if (error) { toast.error('Fout bij aanmaken template'); return; }
    toast.success('Template aangemaakt');
    fetch_();
  };

  const updateTemplate = async (id: string, t: Partial<AutomationTemplate>) => {
    const { error } = await supabase.from('automation_templates').update(t as any).eq('id', id);
    if (error) { toast.error('Fout bij bijwerken'); return; }
    toast.success('Template bijgewerkt');
    fetch_();
  };

  const removeTemplate = async (id: string) => {
    const { error } = await supabase.from('automation_templates').delete().eq('id', id);
    if (error) { toast.error('Fout bij verwijderen'); return; }
    fetch_();
  };

  return { templates, loading, addTemplate, updateTemplate, removeTemplate, refetch: fetch_ };
}

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface TestDriveCustomer {
  id: string;
  voornaam: string;
  achternaam: string;
  email: string;
  telefoon: string;
  adres?: string;
  postcode?: string;
  plaats?: string;
  geboortedatum?: string;
  rijbewijsnummer?: string;
  rijbewijscategorie?: string;
  rijbewijs_foto_path?: string;
  created_at: string;
}

export interface TestDrive {
  id: string;
  created_at: string;
  vehicle_id?: string;
  customer_id?: string;
  token: string;
  status: 'wacht_op_klant' | 'actief' | 'afgesloten' | 'onvolledig';
  km_voor: number;
  km_na?: number;
  start_tijd: string;
  eind_tijd?: string;
  opmerkingen_voor?: string;
  opmerkingen_na?: string;
  handtekening_data?: string;
  ip_adres?: string;
  formulier_ingevuld_op?: string;
  pdf_path?: string;
  pdf_definitief_path?: string;
  document_nummer?: string;
  email_verzonden_op?: string;
  schade_fotos: string[];
  voertuig_merk?: string;
  voertuig_model?: string;
  voertuig_kenteken?: string;
  voertuig_bouwjaar?: number;
  // joined
  customer?: TestDriveCustomer;
}

export function useTestDrives() {
  const { user } = useAuth();
  const [testDrives, setTestDrives] = useState<TestDrive[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTestDrives = useCallback(async () => {
    if (!user) { setTestDrives([]); setLoading(false); return; }
    
    const { data, error } = await supabase
      .from('test_drives')
      .select('*, test_drive_customers(*)')
      .order('created_at', { ascending: false });

    if (error) { 
      console.error('Error fetching test drives:', error);
      toast.error('Fout bij laden proefriten'); 
      setLoading(false); 
      return; 
    }

    setTestDrives((data || []).map((td: any) => ({
      ...td,
      schade_fotos: td.schade_fotos || [],
      customer: td.test_drive_customers || undefined,
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTestDrives(); }, [fetchTestDrives]);

  const startTestDrive = async (vehicleId: string, kmVoor: number, voertuigInfo: { merk: string; model: string; kenteken?: string; bouwjaar?: number }, begeleidendeMedewerker?: string) => {
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    
    const { data, error } = await supabase.from('test_drives').insert({
      vehicle_id: vehicleId,
      token,
      km_voor: kmVoor,
      status: 'wacht_op_klant',
      voertuig_merk: voertuigInfo.merk,
      voertuig_model: voertuigInfo.model,
      voertuig_kenteken: voertuigInfo.kenteken || null,
      voertuig_bouwjaar: voertuigInfo.bouwjaar || null,
      begeleidende_medewerker: begeleidendeMedewerker || null,
    } as any).select().single();

    if (error) { toast.error('Fout bij starten proefrit'); return null; }
    toast.success('Proefrit gestart');
    fetchTestDrives();
    return data as TestDrive;
  };

  const endTestDrive = async (id: string, kmNa: number, opmerkingenNa?: string, schadeFotos?: string[]) => {
    const { error } = await supabase.from('test_drives').update({
      km_na: kmNa,
      eind_tijd: new Date().toISOString(),
      opmerkingen_na: opmerkingenNa || null,
      schade_fotos: schadeFotos || [],
      status: 'afgesloten',
    } as any).eq('id', id);

    if (error) { toast.error('Fout bij beëindigen proefrit'); return; }
    toast.success('Proefrit beëindigd');
    fetchTestDrives();
  };

  const deleteTestDrive = async (id: string) => {
    const { error } = await supabase.from('test_drives').delete().eq('id', id);
    if (error) { toast.error('Fout bij verwijderen proefrit'); return false; }
    toast.success('Proefrit verwijderd');
    fetchTestDrives();
    return true;
  };

  return { testDrives, loading, startTestDrive, endTestDrive, deleteTestDrive, refetch: fetchTestDrives };
}

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
  begeleidende_medewerker?: string;
  email_verzonden_op?: string;
  schade_fotos: string[];
  voertuig_merk?: string;
  voertuig_model?: string;
  voertuig_kenteken?: string;
  voertuig_bouwjaar?: number;
  vertrek_tijd?: string;
  terugkomst_tijd?: string;
  gereden_km?: number;
  max_duur_minuten?: number;
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

  const startTestDrive = async (
    vehicleId: string,
    kmVoor: number,
    voertuigInfo: { merk: string; model: string; kenteken?: string; bouwjaar?: number },
    begeleidendeMedewerker?: string,
    customer?: { id?: string; voornaam?: string; achternaam?: string; email?: string; telefoon?: string } | string,
  ) => {
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16);

    // Resolve customer_id → must reference test_drive_customers(id).
    // If a CRM customer object is passed, upsert into test_drive_customers by email.
    let tdCustomerId: string | null = null;
    let canSkipForm = false;
    try {
      if (customer && typeof customer === 'object') {
        const email = (customer.email || '').trim().toLowerCase();
        if (email) {
          const { data: existing } = await supabase
            .from('test_drive_customers')
            .select('id, rijbewijsnummer')
            .eq('email', email)
            .maybeSingle();
          if (existing?.id) {
            tdCustomerId = existing.id;
            // Klant heeft eerder formulier ingevuld (rijbewijs bekend) → formulier overslaan
            canSkipForm = !!(existing as any).rijbewijsnummer;
          } else {
            const { data: created, error: insErr } = await supabase
              .from('test_drive_customers')
              .insert({
                voornaam: customer.voornaam || '',
                achternaam: customer.achternaam || '',
                email,
                telefoon: customer.telefoon || '',
              } as any)
              .select('id')
              .single();
            if (insErr) {
              console.error('test_drive_customers insert failed:', insErr);
            } else {
              tdCustomerId = created?.id || null;
            }
          }
        }
      } else if (typeof customer === 'string') {
        tdCustomerId = customer;
        const { data: existing } = await supabase
          .from('test_drive_customers')
          .select('rijbewijsnummer')
          .eq('id', customer)
          .maybeSingle();
        canSkipForm = !!(existing as any)?.rijbewijsnummer;
      }
    } catch (e) {
      console.error('Resolving customer for test drive failed:', e);
    }

    const nowIso = new Date().toISOString();
    const insertPayload: any = {
      vehicle_id: vehicleId,
      customer_id: tdCustomerId,
      token,
      km_voor: kmVoor,
      status: canSkipForm ? 'actief' : 'wacht_op_klant',
      voertuig_merk: voertuigInfo.merk,
      voertuig_model: voertuigInfo.model,
      voertuig_kenteken: voertuigInfo.kenteken || null,
      voertuig_bouwjaar: voertuigInfo.bouwjaar || null,
      begeleidende_medewerker: begeleidendeMedewerker || null,
    };
    if (canSkipForm) {
      insertPayload.formulier_ingevuld_op = nowIso;
      insertPayload.vertrek_tijd = nowIso;
      insertPayload.start_tijd = nowIso;
    }

    const { data, error } = await supabase.from('test_drives').insert(insertPayload).select().single();

    if (error) {
      console.error('startTestDrive insert failed:', error);
      toast.error('Fout bij starten proefrit');
      return null;
    }
    toast.success(canSkipForm ? 'Proefrit direct gestart (klant bekend)' : 'Proefrit gestart');
    fetchTestDrives();
    return data as TestDrive;
  };

  const endTestDrive = async (id: string, kmNa: number, opmerkingenNa?: string, schadeFotos?: string[]) => {
    const td = testDrives.find((t) => t.id === id);
    const geredenKm = td ? Math.max(0, kmNa - td.km_voor) : null;
    const nowIso = new Date().toISOString();
    const { error } = await supabase.from('test_drives').update({
      km_na: kmNa,
      eind_tijd: nowIso,
      terugkomst_tijd: nowIso,
      gereden_km: geredenKm,
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

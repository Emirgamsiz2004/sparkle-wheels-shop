import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Vehicle } from '@/types/vehicle';

export function useMoneybird() {
  const [loading, setLoading] = useState(false);

  const invoke = useCallback(async (action: string, params: Record<string, any> = {}) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Niet ingelogd');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moneybird`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action, ...params }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Onbekende fout' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      console.error('Moneybird error:', err);
      toast.error(`Moneybird: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAdministration = useCallback(() => invoke('get_administration'), [invoke]);

  const createVehicleInvoice = useCallback(
    (vehicle: Vehicle, buyerName: string, buyerEmail?: string, buyerPhone?: string) =>
      invoke('create_vehicle_invoice', {
        vehicle: {
          id: vehicle.id,
          merk: vehicle.merk,
          model: vehicle.model,
          bouwjaar: vehicle.bouwjaar,
          kenteken: vehicle.kenteken,
          verkoopprijs: vehicle.verkoopprijs,
        },
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_phone: buyerPhone,
      }),
    [invoke]
  );

  const syncVehicleCosts = useCallback(
    (vehicle: Vehicle) =>
      invoke('sync_vehicle_costs', {
        vehicle: {
          id: vehicle.id,
          merk: vehicle.merk,
          model: vehicle.model,
          kenteken: vehicle.kenteken,
        },
        costs: vehicle.kosten.map((k) => ({
          id: k.id,
          description: k.description,
          amount: k.amount,
          date: k.date,
          category: k.category,
        })),
      }),
    [invoke]
  );

  const getSalesInvoices = useCallback(
    (page?: number, filter?: string) => invoke('get_sales_invoices', { page, filter }),
    [invoke]
  );

  const sendInvoice = useCallback(
    (invoiceId: string, method = 'Manual') =>
      invoke('send_sales_invoice', { invoice_id: invoiceId, delivery_method: method }),
    [invoke]
  );

  const getTaxRates = useCallback(() => invoke('get_tax_rates'), [invoke]);
  const getLedgerAccounts = useCallback(() => invoke('get_ledger_accounts'), [invoke]);
  const getFinancialStatements = useCallback((year?: number) => invoke('get_financial_statements', { year }), [invoke]);
  const getReceipts = useCallback((page?: number, filter?: string) => invoke('get_receipts', { page, filter }), [invoke]);
  const getPurchaseInvoices = useCallback((page?: number, filter?: string) => invoke('get_purchase_invoices', { page, filter }), [invoke]);
  const getContacts = useCallback((page?: number, query?: string) => invoke('get_contacts', { page, query }), [invoke]);

  const downloadInvoicePdf = useCallback(
    (invoiceId: string) => invoke('download_invoice_pdf', { invoice_id: invoiceId }),
    [invoke]
  );

  return {
    loading,
    invoke,
    getAdministration,
    createVehicleInvoice,
    syncVehicleCosts,
    getSalesInvoices,
    sendInvoice,
    downloadInvoicePdf,
    getTaxRates,
    getLedgerAccounts,
    getFinancialStatements,
    getReceipts,
    getPurchaseInvoices,
    getContacts,
  };
}

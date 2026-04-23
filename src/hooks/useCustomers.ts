import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Customer {
  id: string;
  voornaam: string;
  achternaam: string;
  email: string;
  telefoon: string;
  adres?: string;
  postcode?: string;
  plaats?: string;
  geboortedatum?: string;
  status: "prospect" | "klant" | "inactief";
  notities?: string;
  laatste_contact?: string;
  created_at: string;
  updated_at: string;
  // Computed
  proefritten_count?: number;
}

export const statusLabels: Record<Customer["status"], string> = {
  prospect: "Prospect",
  klant: "Klant",
  inactief: "Inactief",
};

export const statusColors: Record<Customer["status"], string> = {
  prospect: "bg-muted text-muted-foreground border-border",
  klant: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  inactief: "bg-muted text-muted-foreground border-border",
};

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching customers:", error);
      toast.error("Fout bij laden klanten");
    } else {
      setCustomers((data || []) as unknown as Customer[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const addCustomer = async (customer: Omit<Customer, "id" | "created_at" | "updated_at">) => {
    const { error } = await supabase.from("customers").insert(customer as any);
    if (error) {
      toast.error("Fout bij toevoegen klant");
      throw error;
    }
    toast.success("Klant toegevoegd");
    await fetchCustomers();
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    const { error } = await supabase.from("customers").update(updates as any).eq("id", id);
    if (error) {
      toast.error("Fout bij bijwerken klant");
      throw error;
    }
    await fetchCustomers();
  };

  const deleteCustomer = async (id: string) => {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) {
      toast.error("Fout bij verwijderen klant");
      throw error;
    }
    toast.success("Klant verwijderd");
    await fetchCustomers();
  };

  return { customers, loading, fetchCustomers, addCustomer, updateCustomer, deleteCustomer };
};

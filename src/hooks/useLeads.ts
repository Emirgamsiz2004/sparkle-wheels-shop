import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Lead {
  id: string;
  customer_id: string;
  vehicle_id: string | null;
  status: "nieuw" | "in_gesprek" | "offerte" | "beslissing" | "gewonnen" | "verloren";
  bron: string;
  notities_log: { tekst: string; datum: string }[];
  volgende_actie: string | null;
  volgende_actie_datum: string | null;
  verloren_reden: string | null;
  laatste_activiteit: string;
  created_at: string;
  updated_at: string;
  // Joined
  customer?: { id: string; voornaam: string; achternaam: string; telefoon: string; email: string };
  vehicle?: { id: string; merk: string; model: string; kenteken: string; bouwjaar: number } | null;
}

export const leadStatusLabels: Record<string, string> = {
  nieuw: "Nieuw",
  in_gesprek: "In gesprek",
  offerte: "Offerte gedaan",
  beslissing: "Beslissing",
  gewonnen: "Gewonnen",
  verloren: "Verloren",
};

export const leadStatusColors: Record<string, string> = {
  nieuw: "bg-muted text-muted-foreground border-border",
  in_gesprek: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  offerte: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  beslissing: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  gewonnen: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  verloren: "bg-red-500/10 text-red-400 border-red-500/30",
};

export const bronOptions = ["website", "telefonisch", "proefrit", "via via", "social media"];
export const verlorenRedenen = ["Te duur", "Gevonden elders", "Geen interesse meer", "Anders"];

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*, customers!inner(id, voornaam, achternaam, telefoon, email), vehicles(id, merk, model, kenteken, bouwjaar)")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching leads:", error);
    } else {
      const mapped = (data || []).map((row: any) => ({
        ...row,
        notities_log: Array.isArray(row.notities_log) ? row.notities_log : [],
        customer: row.customers,
        vehicle: row.vehicles,
      }));
      setLeads(mapped as Lead[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const addLead = async (lead: { customer_id: string; vehicle_id?: string; bron: string; volgende_actie?: string; volgende_actie_datum?: string; notities_log?: any[] }) => {
    const { error } = await supabase.from("leads").insert(lead as any);
    if (error) { toast.error("Fout bij aanmaken lead"); throw error; }
    toast.success("Lead aangemaakt");
    await fetchLeads();
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    const { error } = await supabase.from("leads").update({ ...updates, laatste_activiteit: new Date().toISOString() } as any).eq("id", id);
    if (error) { toast.error("Fout bij bijwerken lead"); throw error; }
    await fetchLeads();
  };

  const updateLeadStatus = async (id: string, newStatus: string, beschrijving?: string) => {
    const lead = leads.find(l => l.id === id);
    const oudeStatus = lead?.status || "";
    await supabase.from("lead_history").insert({ lead_id: id, oude_status: oudeStatus, nieuwe_status: newStatus, beschrijving: beschrijving || `Status gewijzigd naar ${leadStatusLabels[newStatus]}` } as any);
    await updateLead(id, { status: newStatus as Lead["status"] });
  };

  const addNote = async (id: string, tekst: string) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    const newLog = [...lead.notities_log, { tekst, datum: new Date().toISOString() }];
    await updateLead(id, { notities_log: newLog } as any);
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) { toast.error("Fout bij verwijderen"); throw error; }
    toast.success("Lead verwijderd");
    await fetchLeads();
  };

  // Count overdue leads
  const overdueCount = leads.filter(l => {
    if (l.status === "gewonnen" || l.status === "verloren") return false;
    if (!l.volgende_actie_datum) return false;
    return new Date(l.volgende_actie_datum) < new Date();
  }).length;

  return { leads, loading, fetchLeads, addLead, updateLead, updateLeadStatus, addNote, deleteLead, overdueCount };
};

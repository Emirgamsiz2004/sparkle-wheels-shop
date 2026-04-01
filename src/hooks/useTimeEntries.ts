import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface TimeEntry {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  customer_id: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  description: string;
  category: string;
  end_note: string | null;
  hourly_rate: number;
  created_at: string;
  // joined
  vehicles?: { id: string; merk: string; model: string; kenteken: string | null } | null;
  customers?: { id: string; voornaam: string; achternaam: string } | null;
  profiles?: { display_name: string | null; user_id: string } | null;
}

export const categoryLabels: Record<string, string> = {
  verkoop: "Verkoop",
  onderhoud: "Onderhoud",
  reparatie: "Reparatie",
  administratie: "Administratie",
  schoonmaak: "Schoonmaak",
  overig: "Overig",
};

export const categoryColors: Record<string, string> = {
  verkoop: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  onderhoud: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  reparatie: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  administratie: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  schoonmaak: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  overig: "bg-muted text-muted-foreground border-border",
};

export const useTimeEntries = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("time_entries")
      .select("*, vehicles(id, merk, model, kenteken), customers(id, voornaam, achternaam), profiles!time_entries_user_id_fkey(display_name, user_id)")
      .order("start_time", { ascending: false })
      .limit(500);

    if (error) {
      // Fallback without profiles join if FK doesn't exist
      const { data: d2 } = await supabase
        .from("time_entries")
        .select("*, vehicles(id, merk, model, kenteken), customers(id, voornaam, achternaam)")
        .order("start_time", { ascending: false })
        .limit(500);
      setEntries((d2 || []) as TimeEntry[]);
    } else {
      setEntries((data || []) as TimeEntry[]);
    }

    // Check for active timer
    if (user) {
      const { data: active } = await supabase
        .from("time_entries")
        .select("*, vehicles(id, merk, model, kenteken), customers(id, voornaam, achternaam)")
        .eq("user_id", user.id)
        .is("end_time", null)
        .limit(1)
        .maybeSingle();
      setActiveTimer(active as TimeEntry | null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const startTimer = async (data: { vehicle_id?: string; customer_id?: string; description: string; category: string }) => {
    if (!user) return;
    const { error } = await supabase.from("time_entries").insert({
      user_id: user.id,
      vehicle_id: data.vehicle_id || null,
      customer_id: data.customer_id || null,
      description: data.description,
      category: data.category,
    } as any);
    if (error) { toast.error("Fout bij starten timer"); throw error; }
    toast.success("Timer gestart");
    await fetchEntries();
  };

  const stopTimer = async (id: string, endNote?: string) => {
    const now = new Date().toISOString();
    const entry = activeTimer || entries.find(e => e.id === id);
    const startMs = entry ? new Date(entry.start_time).getTime() : 0;
    const durationMin = Math.round((Date.now() - startMs) / 60000);

    const { error } = await supabase.from("time_entries").update({
      end_time: now,
      duration_minutes: durationMin,
      end_note: endNote || null,
    } as any).eq("id", id);
    if (error) { toast.error("Fout bij stoppen timer"); throw error; }
    toast.success("Timer gestopt");
    await fetchEntries();
  };

  const addManualEntry = async (data: {
    vehicle_id?: string; customer_id?: string; description: string; category: string;
    date: string; start_hour: string; end_hour: string;
  }) => {
    if (!user) return;
    const startTime = `${data.date}T${data.start_hour}:00`;
    const endTime = `${data.date}T${data.end_hour}:00`;
    const durationMin = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000);
    if (durationMin <= 0) { toast.error("Eindtijd moet na starttijd zijn"); return; }

    const { error } = await supabase.from("time_entries").insert({
      user_id: user.id,
      vehicle_id: data.vehicle_id || null,
      customer_id: data.customer_id || null,
      description: data.description,
      category: data.category,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: durationMin,
    } as any);
    if (error) { toast.error("Fout bij opslaan"); throw error; }
    toast.success("Uren opgeslagen");
    await fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("time_entries").delete().eq("id", id);
    if (error) { toast.error("Fout bij verwijderen"); throw error; }
    toast.success("Verwijderd");
    await fetchEntries();
  };

  return { entries, activeTimer, loading, fetchEntries, startTimer, stopTimer, addManualEntry, deleteEntry };
};

export const formatDuration = (minutes: number | null) => {
  if (!minutes || minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}u ${m}m` : `${m}m`;
};

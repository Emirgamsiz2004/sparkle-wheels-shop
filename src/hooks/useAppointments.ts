import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AppointmentType = "bezichtiging" | "proefrit" | "terugbelafspraak" | "aflevering" | "ophalen" | "onderhoud" | "anders";
export type AppointmentStatus = "gepland" | "voltooid" | "geannuleerd";

export interface Appointment {
  id: string;
  type: AppointmentType;
  datum_tijd: string;
  eind_datum_tijd: string | null;
  customer_id: string | null;
  vehicle_id: string | null;
  medewerker: string | null;
  notities: string | null;
  onderwerp: string | null;
  betalingsstatus: "volledig_betaald" | "openstaand" | null;
  voertuig_klaargemaakt: boolean;
  status: AppointmentStatus;
  google_event_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  customer?: { id: string; voornaam: string; achternaam: string; telefoon: string; email: string } | null;
  vehicle?: { id: string; merk: string; model: string; kenteken: string | null } | null;
}

export const typeLabels: Record<AppointmentType, string> = {
  bezichtiging: "Bezichtiging",
  proefrit: "Proefrit",
  terugbelafspraak: "Terugbelafspraak",
  aflevering: "Aflevering",
  ophalen: "Ophalen",
  onderhoud: "Onderhoud / reparatie",
  anders: "Anders",
};

export const typeColors: Record<AppointmentType, string> = {
  bezichtiging: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  proefrit: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  terugbelafspraak: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  aflevering: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  ophalen: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  onderhoud: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  anders: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

export const typeDotColors: Record<AppointmentType, string> = {
  bezichtiging: "bg-blue-400",
  proefrit: "bg-emerald-400",
  terugbelafspraak: "bg-orange-400",
  aflevering: "bg-purple-400",
  ophalen: "bg-cyan-400",
  onderhoud: "bg-yellow-400",
  anders: "bg-slate-400",
};

const SELECT = "*, customer:customers(id, voornaam, achternaam, telefoon, email), vehicle:vehicles(id, merk, model, kenteken)";

async function syncToGoogle(action: "create" | "update" | "delete", appointmentId: string) {
  try {
    const { data: appt } = await supabase.from("appointments").select(SELECT).eq("id", appointmentId).maybeSingle();
    if (!appt) return;
    const { data, error } = await supabase.functions.invoke("sync-google-calendar", {
      body: { action, appointment: appt },
    });
    if (error) {
      console.warn("Google Calendar sync warning:", error);
      return;
    }
    if (data?.google_event_id && data.google_event_id !== (appt as any).google_event_id) {
      await supabase.from("appointments").update({ google_event_id: data.google_event_id }).eq("id", appointmentId);
    }
  } catch (e) {
    console.warn("Google Calendar sync exception:", e);
  }
}

async function syncDeleteToGoogle(appointment: Appointment) {
  if (!appointment.google_event_id) return;
  try {
    await supabase.functions.invoke("sync-google-calendar", {
      body: { action: "delete", appointment },
    });
  } catch (e) {
    console.warn("Google Calendar delete warning:", e);
  }
}

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select(SELECT)
      .order("datum_tijd", { ascending: true });

    if (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Fout bij laden afspraken");
    } else {
      setAppointments((data || []) as unknown as Appointment[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const addAppointment = async (appointment: Omit<Appointment, "id" | "created_at" | "updated_at" | "customer" | "vehicle" | "google_event_id">) => {
    const { data, error } = await supabase.from("appointments").insert(appointment as any).select("id").maybeSingle();
    if (error) {
      toast.error("Fout bij aanmaken afspraak");
      throw error;
    }
    toast.success("Afspraak gepland");
    if (data?.id) syncToGoogle("create", data.id);
    await fetchAppointments();
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    const { customer, vehicle, ...clean } = updates as any;
    const { error } = await supabase.from("appointments").update(clean).eq("id", id);
    if (error) {
      toast.error("Fout bij bijwerken afspraak");
      throw error;
    }
    syncToGoogle("update", id);
    await fetchAppointments();
  };

  const deleteAppointment = async (id: string) => {
    const existing = appointments.find((a) => a.id === id);
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) {
      toast.error("Fout bij verwijderen afspraak");
      throw error;
    }
    if (existing) syncDeleteToGoogle(existing);
    toast.success("Afspraak verwijderd");
    await fetchAppointments();
  };

  return { appointments, loading, fetchAppointments, addAppointment, updateAppointment, deleteAppointment };
};

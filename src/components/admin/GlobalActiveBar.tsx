import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { X, Square, Clock, Car } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StopTimerDialog from "./StopTimerDialog";

interface ActiveTimer {
  id: string;
  description: string;
  start_time: string;
  vehicle_id: string | null;
  category: string;
  vehicles?: { merk: string; model: string; kenteken: string | null } | null;
}

interface ActiveTestDrive {
  id: string;
  voertuig_merk: string | null;
  voertuig_model: string | null;
  voertuig_kenteken: string | null;
  km_voor: number;
  start_tijd: string;
  customer?: { voornaam: string; achternaam: string } | null;
}

const GlobalActiveBar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timer, setTimer] = useState<ActiveTimer | null>(null);
  const [testDrive, setTestDrive] = useState<ActiveTestDrive | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [dismissedTimer, setDismissedTimer] = useState(false);
  const [dismissedTestDrive, setDismissedTestDrive] = useState(false);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);

  const fetchActive = useCallback(async () => {
    if (!user) return;

    // Active timer
    const { data: timerData } = await supabase
      .from("time_entries")
      .select("id, description, start_time, vehicle_id, category, vehicles:vehicle_id(merk, model, kenteken)")
      .eq("user_id", user.id)
      .is("end_time", null)
      .limit(1)
      .maybeSingle();

    const newTimer = timerData as ActiveTimer | null;
    // If timer changed (new one started), un-dismiss
    if (newTimer?.id !== timer?.id) setDismissedTimer(false);
    setTimer(newTimer);

    // Active test drive
    const { data: tdData } = await supabase
      .from("test_drives")
      .select("id, voertuig_merk, voertuig_model, voertuig_kenteken, km_voor, start_tijd, test_drive_customers(voornaam, achternaam)")
      .in("status", ["actief", "wacht_op_klant"])
      .limit(1)
      .maybeSingle();

    const newTd = tdData ? {
      ...tdData,
      customer: (tdData as any).test_drive_customers || null,
    } as ActiveTestDrive : null;
    if (newTd?.id !== testDrive?.id) setDismissedTestDrive(false);
    setTestDrive(newTd);
  }, [user]);

  useEffect(() => {
    fetchActive();
    const iv = setInterval(fetchActive, 15000);
    return () => clearInterval(iv);
  }, [fetchActive]);

  // Elapsed time for timer
  useEffect(() => {
    if (!timer) { setElapsed(0); return; }
    const calc = () => Math.floor((Date.now() - new Date(timer.start_time).getTime()) / 1000);
    setElapsed(calc());
    const iv = setInterval(() => setElapsed(calc()), 1000);
    return () => clearInterval(iv);
  }, [timer]);

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleStopTimer = () => {
    if (!timer) return;
    // Check if timer is linked to a vehicle task by matching description
    // If it has a vehicle_id, it's likely task-linked → stop directly without popup
    // We check if description matches a vehicle_task
    setStopDialogOpen(true);
  };

  const handleTimerStopped = () => {
    setStopDialogOpen(false);
    setTimer(null);
    setDismissedTimer(false);
    fetchActive();
  };

  const showTimer = timer && !dismissedTimer;
  const showTestDrive = testDrive && !dismissedTestDrive;

  if (!showTimer && !showTestDrive) return null;

  return (
    <>
      <AnimatePresence>
        {showTimer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-b border-emerald-500/20"
          >
            <div className="flex items-center justify-between px-4 py-2 bg-emerald-500/8">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shrink-0" />
                <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <p className="text-xs text-foreground truncate">
                  <span className="font-medium">{timer!.description}</span>
                  {timer!.vehicles && (
                    <span className="text-muted-foreground ml-1.5">· {timer!.vehicles.merk} {timer!.vehicles.model}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">{formatElapsed(elapsed)}</span>
                <button
                  onClick={handleStopTimer}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-md hover:bg-emerald-500/25 transition-colors"
                >
                  <Square className="w-3 h-3" /> Stop
                </button>
                <button
                  onClick={() => setDismissedTimer(true)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  title="Verberg (ga naar Uren om te stoppen)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {showTestDrive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-b border-blue-500/20"
          >
            <div className="flex items-center justify-between px-4 py-2 bg-blue-500/8">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse shrink-0" />
                <Car className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <p className="text-xs text-foreground truncate">
                  <span className="font-medium">Proefrit actief</span>
                  <span className="text-muted-foreground ml-1.5">
                    · {testDrive!.voertuig_merk} {testDrive!.voertuig_model}
                    {testDrive!.customer && ` — ${testDrive!.customer.voornaam} ${testDrive!.customer.achternaam}`}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <button
                  onClick={() => navigate("/admin/proefriten")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-md hover:bg-blue-500/25 transition-colors"
                >
                  <Square className="w-3 h-3" /> Beëindigen
                </button>
                <button
                  onClick={() => setDismissedTestDrive(true)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  title="Verberg"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {timer && (
        <StopTimerDialog
          open={stopDialogOpen}
          onClose={() => setStopDialogOpen(false)}
          timerId={timer.id}
          timerDescription={timer.description}
          timerVehicleId={timer.vehicle_id}
          timerStartTime={timer.start_time}
          timerCategory={timer.category}
          onStopped={handleTimerStopped}
        />
      )}
    </>
  );
};

export default GlobalActiveBar;

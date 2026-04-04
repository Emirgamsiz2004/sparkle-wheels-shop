import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

const categories = [
  { value: "verkoop", label: "Verkoop" },
  { value: "onderhoud", label: "Onderhoud" },
  { value: "reparatie", label: "Reparatie" },
  { value: "administratie", label: "Administratie" },
  { value: "schoonmaak", label: "Schoonmaak" },
  { value: "overig", label: "Overig" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  timerId: string;
  timerDescription: string;
  timerVehicleId: string | null;
  timerStartTime: string;
  timerCategory: string;
  onStopped: () => void;
}

const StopTimerDialog = ({
  open, onClose, timerId, timerDescription, timerVehicleId, timerStartTime, timerCategory, onStopped,
}: Props) => {
  const [isTaskLinked, setIsTaskLinked] = useState<boolean | null>(null);
  const [description, setDescription] = useState(timerDescription);
  const [category, setCategory] = useState(timerCategory);
  const [endNote, setEndNote] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if timer is linked to a task
  useEffect(() => {
    if (!open) return;
    setDescription(timerDescription);
    setCategory(timerCategory);
    setEndNote("");

    const check = async () => {
      if (!timerVehicleId) { setIsTaskLinked(false); return; }
      const { data } = await supabase
        .from("vehicle_tasks")
        .select("id")
        .eq("vehicle_id", timerVehicleId)
        .eq("omschrijving", timerDescription)
        .eq("voltooid", false)
        .limit(1)
        .maybeSingle();
      setIsTaskLinked(!!data);
    };
    check();
  }, [open, timerDescription, timerVehicleId, timerCategory]);

  // If task-linked, stop directly without popup
  useEffect(() => {
    if (open && isTaskLinked === true) {
      stopDirectly();
    }
  }, [isTaskLinked, open]);

  const stopDirectly = async () => {
    setLoading(true);
    const now = new Date().toISOString();
    const durationMin = Math.round((Date.now() - new Date(timerStartTime).getTime()) / 60000);
    await supabase.from("time_entries").update({
      end_time: now,
      duration_minutes: durationMin,
      end_note: "Gestopt via taak",
    } as any).eq("id", timerId);
    toast.success("Timer gestopt");
    setLoading(false);
    onStopped();
  };

  const handleStop = async () => {
    if (!description.trim()) {
      toast.error("Vul een omschrijving in");
      return;
    }
    setLoading(true);
    const now = new Date().toISOString();
    const durationMin = Math.round((Date.now() - new Date(timerStartTime).getTime()) / 60000);
    const { error } = await supabase.from("time_entries").update({
      end_time: now,
      duration_minutes: durationMin,
      description: description.trim(),
      category,
      end_note: endNote.trim() || null,
    } as any).eq("id", timerId);
    if (error) {
      toast.error("Fout bij stoppen timer");
      setLoading(false);
      return;
    }
    toast.success("Timer gestopt");
    setLoading(false);
    onStopped();
  };

  // If task-linked, don't show dialog (auto-stop)
  if (isTaskLinked === true || isTaskLinked === null) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">Timer stoppen</DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Omschrijving *</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Waar heb je aan gewerkt?"
              className="w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground placeholder:text-muted-foreground transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Categorie</label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    category === c.value
                      ? "bg-foreground text-background border-foreground"
                      : "bg-secondary/50 text-muted-foreground border-border hover:bg-accent"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Notitie (optioneel)</label>
            <textarea
              value={endNote}
              onChange={(e) => setEndNote(e.target.value)}
              placeholder="Extra opmerkingen..."
              rows={2}
              className="w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground placeholder:text-muted-foreground resize-none transition-all"
            />
          </div>

          <button
            onClick={handleStop}
            disabled={loading || !description.trim()}
            className="w-full py-2.5 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Bezig..." : "Opslaan & stoppen"}
          </button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default StopTimerDialog;

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Check, Trash2, Loader2, CheckCircle2, ClipboardList } from "lucide-react";

interface Props {
  vehicleId: string;
  /** Compact-modus: kleinere card, zonder presets/invoer — alleen lijst en afvinken */
  compact?: boolean;
  /** Verberg automatisch wanneer alles voldaan is (en er minimaal 1 taak was) */
  hideWhenAllDone?: boolean;
  /** Verberg component volledig wanneer er nog geen taken zijn */
  hideWhenEmpty?: boolean;
  /** Optionele callback wanneer er iets verandert */
  onChange?: () => void;
}

interface Taak {
  id: string;
  titel: string;
  klaar: boolean;
  volgorde: number;
}

export const AFLEVER_PRESETS = [
  "APK keuren",
  "Grote beurt / onderhoud",
  "Kleine beurt",
  "Banden vervangen",
  "Remmen controleren",
  "Poetsen & detailing",
  "Tanken",
  "Ruit / steenslag herstellen",
  "Reparatie",
];

const inputCls =
  "w-full px-3 py-2 text-sm bg-secondary/40 border border-border rounded-[3px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent/60";

const AfleverChecklist = ({ vehicleId, compact = false, hideWhenAllDone = false, onChange }: Props) => {
  const [taken, setTaken] = useState<Taak[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitel, setNewTitel] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("aflevering_taken")
      .select("id, titel, klaar, volgorde")
      .eq("vehicle_id", vehicleId)
      .order("klaar", { ascending: true })
      .order("volgorde", { ascending: true })
      .order("created_at", { ascending: true });
    setTaken((data || []) as Taak[]);
    setLoading(false);
  }, [vehicleId]);

  useEffect(() => { load(); }, [load]);

  const add = async (titel: string) => {
    const t = titel.trim();
    if (!t) return;
    const { error } = await (supabase as any).from("aflevering_taken").insert({
      vehicle_id: vehicleId,
      titel: t,
      volgorde: taken.length,
    });
    if (error) { toast.error("Toevoegen mislukt"); return; }
    setNewTitel("");
    await load();
    onChange?.();
  };

  const toggle = async (t: Taak) => {
    await (supabase as any)
      .from("aflevering_taken")
      .update({ klaar: !t.klaar, klaar_op: !t.klaar ? new Date().toISOString() : null })
      .eq("id", t.id);
    await load();
    onChange?.();
  };

  const remove = async (id: string) => {
    await (supabase as any).from("aflevering_taken").delete().eq("id", id);
    await load();
    onChange?.();
  };

  const open = taken.filter((t) => !t.klaar);
  const klaar = taken.filter((t) => t.klaar);
  const allesKlaar = taken.length > 0 && open.length === 0;
  const bestaande = new Set(taken.map((t) => t.titel.toLowerCase()));

  if (hideWhenAllDone && taken.length > 0 && allesKlaar) return null;

  return (
    <div className={`bg-card border border-border rounded-lg ${compact ? "p-3" : "p-5"} space-y-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-muted-foreground" />
          <h3 className={compact ? "text-xs font-medium text-muted-foreground uppercase tracking-wider" : "text-sm font-medium"}>
            Voorbereiding aflevering
          </h3>
        </div>
        {taken.length > 0 && (
          allesKlaar ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-[3px] text-emerald-400 text-[11px]">
              <CheckCircle2 className="w-3 h-3" /> Compleet
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              {open.length} open / {taken.length}
            </span>
          )
        )}
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {AFLEVER_PRESETS.map((p) => {
          const reeds = bestaande.has(p.toLowerCase());
          return (
            <button
              key={p}
              type="button"
              onClick={() => !reeds && add(p)}
              disabled={reeds}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-[3px] border transition-all ${
                reeds
                  ? "border-border/40 text-muted-foreground/50 cursor-not-allowed"
                  : "border-border text-foreground/80 hover:border-accent hover:bg-accent/10"
              }`}
            >
              {reeds ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />} {p}
            </button>
          );
        })}
      </div>

      {/* Eigen invoer */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Eigen taak toevoegen…"
          value={newTitel}
          onChange={(e) => setNewTitel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add(newTitel))}
          className={inputCls + " flex-1"}
        />
        <button
          type="button"
          onClick={() => add(newTitel)}
          disabled={!newTitel.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-border rounded-[3px] hover:bg-accent/20 disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5" /> Toevoegen
        </button>
      </div>

      {/* Lijst */}
      {loading ? (
        <div className="py-3 text-center"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto" /></div>
      ) : taken.length === 0 ? null : (
        <ul className="space-y-1">
          {[...open, ...klaar].map((t) => (
            <li
              key={t.id}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[3px] border ${
                t.klaar
                  ? "bg-secondary/20 border-border/40 opacity-60"
                  : "bg-secondary/40 border-border"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(t)}
                className={`w-4 h-4 rounded-[3px] border flex items-center justify-center flex-shrink-0 transition-all ${
                  t.klaar ? "bg-emerald-500 border-emerald-500 text-white" : "border-border hover:border-accent"
                }`}
                aria-label="Markeer als klaar"
              >
                {t.klaar && <Check className="w-3 h-3" />}
              </button>
              <span className={`flex-1 text-sm ${t.klaar ? "line-through" : ""}`}>{t.titel}</span>
              <button
                type="button"
                onClick={() => remove(t.id)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Verwijderen"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AfleverChecklist;

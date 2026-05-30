import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Vehicle } from "@/types/vehicle";
import {
  Plus, Trash2, Check, Loader2, MessageCircle, Mail, CheckCircle2, Calendar, Clock,
} from "lucide-react";

interface Props {
  vehicle: Vehicle;
  onVehicleUpdate?: () => void;
}

interface Taak {
  id: string;
  vehicle_id: string;
  titel: string;
  deadline: string | null;
  klaar: boolean;
  klaar_op: string | null;
  notitie: string | null;
  volgorde: number;
  created_at: string;
}

interface KlantInfo {
  voornaam?: string;
  achternaam?: string;
  email?: string;
  telefoon?: string;
}

const inputCls =
  "w-full px-3 py-2 text-sm bg-secondary/40 border border-border rounded-[3px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent/60 transition-all";

const VehicleAfleveringTab = ({ vehicle, onVehicleUpdate }: Props) => {
  const [taken, setTaken] = useState<Taak[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitel, setNewTitel] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [afleverDatum, setAfleverDatum] = useState<string>((vehicle as any).afleverDatum || (vehicle as any).aflever_datum || "");
  const [notities, setNotities] = useState<string>((vehicle as any).afleverNotities || (vehicle as any).aflever_notities || "");
  const [savingMeta, setSavingMeta] = useState(false);
  const [klant, setKlant] = useState<KlantInfo | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("aflevering_taken")
      .select("*")
      .eq("vehicle_id", vehicle.id)
      .order("klaar", { ascending: true })
      .order("deadline", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });
    setTaken((data || []) as Taak[]);
    setLoading(false);
  }, [vehicle.id]);

  const loadKlant = useCallback(async () => {
    // Probeer eerst aanbetalingen (meest accurate koper bij gereserveerd)
    const { data: aan } = await supabase
      .from("aanbetalingen")
      .select("klant_voornaam, klant_achternaam, klant_email, klant_telefoon")
      .eq("vehicle_id", vehicle.id)
      .order("datum", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (aan?.klant_email) {
      setKlant({
        voornaam: aan.klant_voornaam || "",
        achternaam: aan.klant_achternaam || "",
        email: aan.klant_email,
        telefoon: aan.klant_telefoon || "",
      });
      return;
    }
    // Fallback: laatste test drive klant
    const { data: td } = await (supabase as any)
      .from("test_drives")
      .select("customer_id")
      .eq("vehicle_id", vehicle.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (td?.customer_id) {
      const { data: c } = await supabase
        .from("test_drive_customers")
        .select("voornaam, achternaam, email, telefoon")
        .eq("id", td.customer_id)
        .maybeSingle();
      if (c) setKlant(c as KlantInfo);
    }
  }, [vehicle.id]);

  useEffect(() => {
    load();
    loadKlant();
  }, [load, loadKlant]);

  const addTaak = async (titelOverride?: string) => {
    const titel = (titelOverride ?? newTitel).trim();
    if (!titel) return;
    const { error } = await (supabase as any).from("aflevering_taken").insert({
      vehicle_id: vehicle.id,
      titel,
      deadline: titelOverride ? null : (newDeadline || null),
      volgorde: taken.length,
    });
    if (error) {
      toast.error("Toevoegen mislukt");
      return;
    }
    if (!titelOverride) {
      setNewTitel("");
      setNewDeadline("");
    }
    load();
  };

  const PRESETS = [
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
  const bestaandeTitels = new Set(taken.map((t) => t.titel.toLowerCase()));


  const toggleKlaar = async (t: Taak) => {
    await (supabase as any)
      .from("aflevering_taken")
      .update({
        klaar: !t.klaar,
        klaar_op: !t.klaar ? new Date().toISOString() : null,
      })
      .eq("id", t.id);
    load();
  };

  const removeTaak = async (id: string) => {
    await (supabase as any).from("aflevering_taken").delete().eq("id", id);
    load();
  };

  const saveMeta = async () => {
    setSavingMeta(true);
    const { error } = await (supabase as any)
      .from("vehicles")
      .update({
        aflever_datum: afleverDatum || null,
        aflever_notities: notities || null,
      })
      .eq("id", vehicle.id);
    setSavingMeta(false);
    if (error) {
      toast.error("Opslaan mislukt");
      return;
    }
    toast.success("Aflever-info opgeslagen");
    onVehicleUpdate?.();
  };

  const openTaken = taken.filter((t) => !t.klaar);
  const klaarTaken = taken.filter((t) => t.klaar);
  const allesKlaar = taken.length > 0 && openTaken.length === 0;

  const klantNaam = `${klant?.voornaam || ""} ${klant?.achternaam || ""}`.trim() || "daar";
  const voertuigOms = `${vehicle.merk} ${vehicle.model}${vehicle.kenteken ? ` (${vehicle.kenteken})` : ""}`;
  const whatsappTekst = encodeURIComponent(
    `Hoi ${klant?.voornaam || klantNaam},\n\nGoed nieuws — je ${voertuigOms} is helemaal klaar voor aflevering bij Platin Automotive. ${afleverDatum ? `We hebben de aflevering staan op ${new Date(afleverDatum).toLocaleDateString("nl-NL")}.` : "Laat ons weten wanneer het je uitkomt om langs te komen."}\n\nTot snel!\nPlatin Automotive`
  );
  const whatsappUrl = klant?.telefoon
    ? `https://wa.me/${klant.telefoon.replace(/[^\d]/g, "").replace(/^0/, "31")}?text=${whatsappTekst}`
    : `https://wa.me/?text=${whatsappTekst}`;
  const mailUrl = `mailto:${klant?.email || ""}?subject=${encodeURIComponent(`Je ${voertuigOms} staat klaar voor aflevering`)}&body=${whatsappTekst}`;

  return (
    <div className="space-y-5">
      {/* Header met klant en afleverdatum */}
      <div className="bg-card/50 border border-border rounded-[3px] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium">Aflevering</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {klant ? (
                <>Koper: <span className="text-foreground">{klant.voornaam} {klant.achternaam}</span></>
              ) : (
                "Geen gekoppelde koper gevonden"
              )}
            </p>
          </div>
          {allesKlaar && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-[3px] text-emerald-400 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" /> Alles afgerond
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> Geplande afleverdatum
            </label>
            <input
              type="date"
              value={afleverDatum}
              onChange={(e) => setAfleverDatum(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={saveMeta}
              disabled={savingMeta}
              className="px-4 py-2 text-xs border border-border rounded-[3px] hover:bg-accent/20 transition-all disabled:opacity-50"
            >
              {savingMeta ? <Loader2 className="w-3 h-3 animate-spin" /> : "Opslaan"}
            </button>
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-xs text-muted-foreground mb-1.5">Algemene notities</label>
          <textarea
            value={notities}
            onChange={(e) => setNotities(e.target.value)}
            rows={3}
            placeholder="Bijv. afspraken met klant, extra werk, levering met volle tank…"
            className={inputCls + " resize-y"}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-card/50 border border-border rounded-[3px] p-5">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Voorbereiding ({openTaken.length} open / {taken.length} totaal)
        </h4>

        {/* Nieuwe taak */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            placeholder="Bijv. banden vervangen, ruit vervangen, poetsen…"
            value={newTitel}
            onChange={(e) => setNewTitel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTaak()}
            className={inputCls + " flex-1"}
          />
          <input
            type="date"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
            className={inputCls + " sm:w-44"}
          />
          <button
            onClick={() => addTaak()}
            disabled={!newTitel.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium border border-border rounded-[3px] hover:bg-accent/20 transition-all disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" /> Toevoegen
          </button>
        </div>

        {loading ? (
          <div className="text-center py-6"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto" /></div>
        ) : taken.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Nog geen aflever-taken. Voeg ze hierboven toe.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {[...openTaken, ...klaarTaken].map((t) => {
              const overdue = !t.klaar && t.deadline && new Date(t.deadline) < new Date(new Date().toDateString());
              return (
                <li
                  key={t.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[3px] border transition-all ${
                    t.klaar
                      ? "bg-secondary/20 border-border/40 opacity-60"
                      : overdue
                      ? "bg-destructive/5 border-destructive/30"
                      : "bg-secondary/40 border-border hover:border-accent/40"
                  }`}
                >
                  <button
                    onClick={() => toggleKlaar(t)}
                    className={`w-5 h-5 rounded-[3px] border flex items-center justify-center flex-shrink-0 transition-all ${
                      t.klaar
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-border hover:border-accent"
                    }`}
                    aria-label="Markeer als klaar"
                  >
                    {t.klaar && <Check className="w-3 h-3" />}
                  </button>
                  <span className={`flex-1 text-sm ${t.klaar ? "line-through" : ""}`}>{t.titel}</span>
                  {t.deadline && (
                    <span className={`text-[11px] flex items-center gap-1 ${
                      overdue ? "text-destructive font-medium" : "text-muted-foreground"
                    }`}>
                      <Clock className="w-3 h-3" />
                      {new Date(t.deadline).toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })}
                    </span>
                  )}
                  <button
                    onClick={() => removeTaak(t.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Verwijderen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Klant informeren */}
      <div className="bg-card/50 border border-border rounded-[3px] p-5">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Klant informeren
        </h4>
        <p className="text-xs text-muted-foreground mb-4">
          {allesKlaar
            ? "Alles staat klaar — laat de klant weten dat de auto opgehaald kan worden."
            : "Open WhatsApp of e-mail met een ingevulde tekst voor de klant."}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-[3px] transition-all"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp sturen
          </a>
          <a
            href={mailUrl}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-border rounded-[3px] hover:bg-accent/20 transition-all"
          >
            <Mail className="w-4 h-4" /> E-mail openen
          </a>
        </div>
        {!klant?.telefoon && !klant?.email && (
          <p className="text-[11px] text-muted-foreground mt-3">
            Tip: koppel een aanbetaling of proefrit om klantgegevens automatisch in te vullen.
          </p>
        )}
      </div>
    </div>
  );
};

export default VehicleAfleveringTab;

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Lock, Loader2, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useVehicles } from "@/hooks/useVehicles";
import { brandstofLabels, Vehicle } from "@/types/vehicle";
import { fetchRdwData } from "@/lib/rdw";
import { formatKenteken, isValidKenteken } from "@/lib/kenteken";
import logo from "@/assets/logo.svg";
import { openAanbetalingsbewijsPdf } from "@/lib/aanbetalingsbewijsPdf";
import { FileText, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

type Betaalwijze = "cash" | "pin" | "ideal" | "overboeking" | "";

// ─────────────────────────────────────────────────────────────
// Stappen definitie
// ─────────────────────────────────────────────────────────────
type StepKey =
  | "voertuig"
  | "aflevering"
  | "klant"
  | "garantie"
  | "koopovereenkomst"
  | "inruil_doc"
  | "factuur"
  | "betaling"
  | "inruil_naam"
  | "vrijwaring"
  | "uitlevering"
  | "afsluiting";

interface StepDef {
  num: number;
  key: StepKey;
  title: string;
  description: string;
  optional?: boolean;
}

const STEPS: StepDef[] = [
  { num: 1, key: "voertuig", title: "Voertuig", description: "Voertuiggegevens, prijs en eventuele inruil" },
  { num: 2, key: "aflevering", title: "Aflevering & aanbetaling", description: "Plan aflevering en optionele aanbetaling" },
  { num: 3, key: "klant", title: "Klantgegevens", description: "Gegevens van de koper" },
  { num: 4, key: "garantie", title: "Garantie", description: "Garantie pakket en voorwaarden" },
  { num: 5, key: "koopovereenkomst", title: "Koopovereenkomst", description: "Genereer en onderteken de koopovereenkomst" },
  { num: 6, key: "inruil_doc", title: "Inruil document", description: "Inruil overeenkomst (alleen bij inruil)", optional: true },
  { num: 7, key: "factuur", title: "Factuur", description: "Factuur opmaken en versturen" },
  { num: 8, key: "betaling", title: "Betaling", description: "Bevestig betaling van de koper" },
  { num: 9, key: "inruil_naam", title: "Inruil op naam", description: "Inruil overzetten op eigen naam (alleen bij inruil)", optional: true },
  { num: 10, key: "vrijwaring", title: "Vrijwaring & overschrijving", description: "RDW vrijwaring en tenaamstelling koper" },
  { num: 11, key: "uitlevering", title: "Uitlevering", description: "Voertuig overhandigen aan koper" },
  { num: 12, key: "afsluiting", title: "Afsluiting", description: "Verkoop afronden en archiveren" },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const isStepDone = (stap: number, completed: Record<number, boolean>) => completed[stap] === true;

const isStepBlocked = (stap: number, completed: Record<number, boolean>, inruil: boolean): boolean => {
  // Optionele inruil-stappen
  if ((stap === 6 || stap === 9) && !inruil) return true;
  // Stappen 6-12 vereisen 5
  if (stap >= 6 && stap <= 12 && !completed[5]) return true;
  // Stappen 9-12 vereisen 8
  if (stap >= 9 && stap <= 12 && !completed[8]) return true;
  // Stappen 11-12 vereisen 10
  if (stap >= 11 && stap <= 12 && !completed[10]) return true;
  return false;
};

// ─────────────────────────────────────────────────────────────
// Hoofdcomponent
// ─────────────────────────────────────────────────────────────
const AdminVerkoopWizardPage = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { vehicles, loading: loadingVehicles } = useVehicles();

  const vehicle = vehicles.find((v) => v.id === vehicleId);

  const [verkoopId, setVerkoopId] = useState<string | null>(null);
  const [activeStap, setActiveStap] = useState<number>(1);
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Stap 1 state
  const [kmStand, setKmStand] = useState<number | "">("");
  const [verkoopprijs, setVerkoopprijs] = useState<number | "">("");
  const [voertuigType, setVoertuigType] = useState<"marge" | "btw" | "consignatie">("marge");
  const [afleverkosten, setAfleverkosten] = useState<number | "">("");
  const [leges, setLeges] = useState<number | "">("");
  const [inruil, setInruil] = useState(false);
  const [inruilKenteken, setInruilKenteken] = useState("");
  const [inruilMerk, setInruilMerk] = useState("");
  const [inruilModel, setInruilModel] = useState("");
  const [inruilKm, setInruilKm] = useState<number | "">("");
  const [inruilWaarde, setInruilWaarde] = useState<number | "">("");
  const [inruilVerkoper, setInruilVerkoper] = useState<"particulier" | "zakelijk">("particulier");
  const [inruilBedrijfsnaam, setInruilBedrijfsnaam] = useState("");
  const [inruilKvk, setInruilKvk] = useState("");
  const [inruilBtw, setInruilBtw] = useState("");

  // Stap 2 state
  const [laterOphalen, setLaterOphalen] = useState<boolean>(false);
  const [leverdatum, setLeverdatum] = useState<string>("");
  const [aanbetalingBedrag, setAanbetalingBedrag] = useState<number | "">("");
  const [aanbetalingBetaalwijze, setAanbetalingBetaalwijze] = useState<"cash" | "pin" | "ideal" | "">("");

  // ─── Init: laad of maak verkoop record ───
  useEffect(() => {
    if (!vehicleId || !vehicle) return;
    let cancelled = false;
    (async () => {
      // Bestaand 'bezig' record zoeken
      const { data: existing } = await supabase
        .from("verkopen")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .eq("wizard_status", "bezig")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (existing) {
        setVerkoopId(existing.id);
        setActiveStap(existing.wizard_stap || 1);
        setVerkoopprijs(existing.verkoopprijs ?? vehicle.verkoopprijs ?? "");
        setAfleverkosten(existing.afleverkosten ?? "");
        setLeges(existing.leges ?? "");
        if (existing.verkoop_type === "marge" || existing.verkoop_type === "btw" || existing.verkoop_type === "consignatie") {
          setVoertuigType(existing.verkoop_type);
        }
        setInruil(!!existing.inruil);
        setInruilKenteken(existing.inruil_kenteken || "");
        setInruilMerk(existing.inruil_merk || "");
        setInruilModel(existing.inruil_model || "");
        setInruilKm(existing.inruil_km ?? "");
        setInruilWaarde(existing.inruil_waarde ?? "");
        if (existing.inruil_bedrijfsnaam || existing.inruil_kvk || existing.inruil_btw) {
          setInruilVerkoper("zakelijk");
        }
        setInruilBedrijfsnaam(existing.inruil_bedrijfsnaam || "");
        setInruilKvk(existing.inruil_kvk || "");
        setInruilBtw(existing.inruil_btw || "");
        // Stap 2 hydration
        setLaterOphalen(!!existing.later_ophalen);
        setLeverdatum(existing.leverdatum || "");
        setAanbetalingBedrag(existing.aanbetaling_bedrag ?? "");
        if (existing.aanbetaling_betaalwijze === "cash" || existing.aanbetaling_betaalwijze === "pin" || existing.aanbetaling_betaalwijze === "ideal") {
          setAanbetalingBetaalwijze(existing.aanbetaling_betaalwijze);
        }
        // Voltooide stappen herleiden
        const done: Record<number, boolean> = {};
        for (let i = 1; i <= 12; i++) {
          if ((existing as any)[`stap${i}_afgerond`]) done[i] = true;
        }
        setCompleted(done);
      } else {
        // Nieuw record aanmaken
        const { data: created, error } = await supabase
          .from("verkopen")
          .insert({
            vehicle_id: vehicleId,
            wizard_stap: 1,
            wizard_status: "bezig",
            verkoopprijs: vehicle.verkoopprijs || 0,
            verkoop_type: vehicle.btwMargeType || "marge",
          })
          .select()
          .single();

        if (error) {
          toast.error("Kon verkoop niet starten");
          console.error(error);
          return;
        }
        setVerkoopId(created.id);
        setVerkoopprijs(vehicle.verkoopprijs || "");
        setVoertuigType((vehicle.btwMargeType as any) || "marge");
        if (vehicle.kilometerstand) setKmStand(vehicle.kilometerstand);
      }

      if (vehicle.kilometerstand && kmStand === "") setKmStand(vehicle.kilometerstand);
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, vehicle?.id]);

  // ─── Opslaan ───
  const saveCurrent = useCallback(async (extra: Record<string, any> = {}) => {
    if (!verkoopId) return;
    setSaving(true);
    const payload: any = {
      wizard_stap: activeStap,
      verkoopprijs: verkoopprijs === "" ? 0 : Number(verkoopprijs),
      verkoop_type: voertuigType,
      afleverkosten: afleverkosten === "" ? null : Number(afleverkosten),
      leges: leges === "" ? null : Number(leges),
      inruil,
      inruil_kenteken: inruil ? inruilKenteken || null : null,
      inruil_merk: inruil ? inruilMerk || null : null,
      inruil_model: inruil ? inruilModel || null : null,
      inruil_km: inruil && inruilKm !== "" ? Number(inruilKm) : null,
      inruil_waarde: inruil && inruilWaarde !== "" ? Number(inruilWaarde) : null,
      inruil_bedrijfsnaam: inruil && inruilVerkoper === "zakelijk" ? inruilBedrijfsnaam || null : null,
      inruil_kvk: inruil && inruilVerkoper === "zakelijk" ? inruilKvk || null : null,
      inruil_btw: inruil && inruilVerkoper === "zakelijk" ? inruilBtw || null : null,
      later_ophalen: laterOphalen,
      leverdatum: laterOphalen ? (leverdatum || null) : new Date().toISOString().slice(0, 10),
      aanbetaling_bedrag: laterOphalen && aanbetalingBedrag !== "" ? Number(aanbetalingBedrag) : null,
      aanbetaling_betaalwijze: laterOphalen && aanbetalingBetaalwijze ? aanbetalingBetaalwijze : null,
      ...extra,
    };
    const { error } = await supabase.from("verkopen").update(payload).eq("id", verkoopId);
    setSaving(false);
    if (error) {
      toast.error("Opslaan mislukt");
      console.error(error);
      return false;
    }
    return true;
  }, [verkoopId, activeStap, verkoopprijs, voertuigType, afleverkosten, leges, inruil, inruilKenteken, inruilMerk, inruilModel, inruilKm, inruilWaarde, inruilVerkoper, inruilBedrijfsnaam, inruilKvk, inruilBtw, laterOphalen, leverdatum, aanbetalingBedrag, aanbetalingBetaalwijze]);

  const handleVolgende = async () => {
    // Stap-specifieke validatie
    if (activeStap === 2) {
      if (laterOphalen) {
        if (!leverdatum) { toast.error("Verwachte leverdatum is verplicht"); return; }
        if (aanbetalingBedrag === "" || Number(aanbetalingBedrag) <= 0) {
          toast.error("Aanbetalingsbedrag is verplicht"); return;
        }
        if (!aanbetalingBetaalwijze) { toast.error("Kies een betaalmethode"); return; }
      }
    }
    const ok = await saveCurrent({ [`stap${activeStap}_afgerond`]: true });
    if (!ok) return;
    setCompleted((p) => ({ ...p, [activeStap]: true }));
    // Volgende non-blocked stap zoeken
    let next = activeStap + 1;
    const nextCompleted = { ...completed, [activeStap]: true };
    while (next <= 12 && isStepBlocked(next, nextCompleted, inruil)) next++;
    if (next <= 12) setActiveStap(next);
    toast.success("Stap opgeslagen");
  };

  const handleVorige = () => {
    let prev = activeStap - 1;
    while (prev >= 1 && isStepBlocked(prev, completed, inruil)) prev--;
    if (prev >= 1) setActiveStap(prev);
  };

  const handleStepClick = (stap: number) => {
    if (isStepBlocked(stap, completed, inruil)) return;
    setActiveStap(stap);
  };

  const handleTerug = async () => {
    await saveCurrent();
    navigate(`/admin/voertuigen/${vehicleId}`);
  };

  const totalSteps = STEPS.filter((s) => !s.optional || (s.optional && inruil)).length;
  const doneCount = Object.values(completed).filter(Boolean).length;
  const progressPct = Math.round((doneCount / totalSteps) * 100);

  const currentStep = STEPS.find((s) => s.num === activeStap)!;

  if (loadingVehicles || !vehicle) {
    return (
      <div className="admin-theme min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  return (
    <div className="admin-theme min-h-screen bg-background text-foreground">
      {/* Fixed sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-[280px] z-10 border-r border-border bg-sidebar flex flex-col overflow-y-auto">
          <div className="p-5 border-b border-sidebar-border">
            <img src={logo} alt="Platin Automotive" className="h-7 w-auto" />
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {STEPS.map((step) => {
              const blocked = isStepBlocked(step.num, completed, inruil);
              const done = isStepDone(step.num, completed);
              const active = step.num === activeStap;
              const nvt = step.optional && !inruil;

              return (
                <button
                  key={step.key}
                  onClick={() => handleStepClick(step.num)}
                  disabled={blocked}
                  className={[
                    "w-full text-left px-3 py-2.5 flex items-center gap-3 rounded-[10px] transition-colors",
                    active && !blocked ? "bg-sidebar-accent text-sidebar-accent-foreground" : "",
                    !active && !blocked ? "hover:bg-sidebar-accent/50 text-sidebar-foreground" : "",
                    blocked ? "opacity-40 cursor-not-allowed text-sidebar-foreground" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "w-6 h-6 shrink-0 flex items-center justify-center rounded-full text-[11px] font-medium border",
                      done ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400" : "",
                      !done && active ? "bg-foreground/10 border-foreground/40 text-foreground" : "",
                      !done && !active ? "border-sidebar-border text-sidebar-foreground/60" : "",
                    ].join(" ")}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : nvt ? <Lock className="w-3 h-3" /> : step.num}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-medium truncate">{step.title}</span>
                    {nvt && <span className="block text-[10px] text-muted-foreground mt-0.5">Nvt</span>}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Voertuig</div>
            <div className="text-sm font-medium text-foreground truncate">
              {vehicle.merk} {vehicle.model}
            </div>
            {vehicle.kenteken && (
              <div className="text-[11px] font-mono text-muted-foreground uppercase mt-0.5">{vehicle.kenteken}</div>
            )}
          </div>
        </aside>

      {/* Hoofdinhoud */}
      <main className="ml-[280px] min-h-screen">
        <div className="px-8 pt-6 pb-32">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handleTerug}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Terug naar voertuig
              </button>
              <div className="text-xs text-muted-foreground">
                {doneCount}/{totalSteps} stappen voltooid
              </div>
            </div>

            <div className="mb-8">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                Stap {currentStep.num} van 12
              </div>
              <h1 className="text-2xl font-semibold text-foreground mb-1">{currentStep.title}</h1>
              <p className="text-sm text-muted-foreground">{currentStep.description}</p>
            </div>

            {/* Stap inhoud */}
            {activeStap === 1 && (
              <Stap1Voertuig
                vehicle={vehicle}
                kmStand={kmStand}
                setKmStand={setKmStand}
                verkoopprijs={verkoopprijs}
                setVerkoopprijs={setVerkoopprijs}
                voertuigType={voertuigType}
                setVoertuigType={setVoertuigType}
                afleverkosten={afleverkosten}
                setAfleverkosten={setAfleverkosten}
                leges={leges}
                setLeges={setLeges}
                inruil={inruil}
                setInruil={setInruil}
                inruilKenteken={inruilKenteken}
                setInruilKenteken={setInruilKenteken}
                inruilMerk={inruilMerk}
                setInruilMerk={setInruilMerk}
                inruilModel={inruilModel}
                setInruilModel={setInruilModel}
                inruilKm={inruilKm}
                setInruilKm={setInruilKm}
                inruilWaarde={inruilWaarde}
                setInruilWaarde={setInruilWaarde}
                inruilVerkoper={inruilVerkoper}
                setInruilVerkoper={setInruilVerkoper}
                inruilBedrijfsnaam={inruilBedrijfsnaam}
                setInruilBedrijfsnaam={setInruilBedrijfsnaam}
                inruilKvk={inruilKvk}
                setInruilKvk={setInruilKvk}
                inruilBtw={inruilBtw}
                setInruilBtw={setInruilBtw}
              />
            )}

            {activeStap === 2 && (
              <Stap2Aflevering
                vehicle={vehicle}
                verkoopprijs={verkoopprijs === "" ? 0 : Number(verkoopprijs)}
                laterOphalen={laterOphalen}
                setLaterOphalen={setLaterOphalen}
                leverdatum={leverdatum}
                setLeverdatum={setLeverdatum}
                aanbetalingBedrag={aanbetalingBedrag}
                setAanbetalingBedrag={setAanbetalingBedrag}
                aanbetalingBetaalwijze={aanbetalingBetaalwijze}
                setAanbetalingBetaalwijze={setAanbetalingBetaalwijze}
              />
            )}

            {activeStap !== 1 && activeStap !== 2 && (
              <div className="rounded-[14px] border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Inhoud voor deze stap volgt binnenkort.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Fixed footer met navigatie */}
      <div className="fixed bottom-0 left-[280px] right-0 z-10 border-t border-border bg-card/95 backdrop-blur px-8 py-4 flex items-center justify-between">
        <button
          onClick={handleVorige}
          disabled={activeStap === 1}
          className="px-5 py-2.5 text-sm border border-border rounded-[10px] hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Vorige
        </button>
        <div className="text-[11px] text-muted-foreground">
          {saving ? "Opslaan…" : "Wijzigingen worden automatisch bewaard"}
        </div>
        <button
          onClick={handleVolgende}
          disabled={saving}
          className="px-5 py-2.5 text-sm bg-foreground text-background rounded-[10px] hover:bg-foreground/90 disabled:opacity-50 transition-colors font-medium"
        >
          {activeStap === 12 ? "Bevestigen" : "Volgende"}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Stap 1
// ─────────────────────────────────────────────────────────────
interface Stap1Props {
  vehicle: any;
  kmStand: number | "";
  setKmStand: (v: number | "") => void;
  verkoopprijs: number | "";
  setVerkoopprijs: (v: number | "") => void;
  voertuigType: "marge" | "btw" | "consignatie";
  setVoertuigType: (v: "marge" | "btw" | "consignatie") => void;
  afleverkosten: number | "";
  setAfleverkosten: (v: number | "") => void;
  leges: number | "";
  setLeges: (v: number | "") => void;
  inruil: boolean;
  setInruil: (v: boolean) => void;
  inruilKenteken: string;
  setInruilKenteken: (v: string) => void;
  inruilMerk: string;
  setInruilMerk: (v: string) => void;
  inruilModel: string;
  setInruilModel: (v: string) => void;
  inruilKm: number | "";
  setInruilKm: (v: number | "") => void;
  inruilWaarde: number | "";
  setInruilWaarde: (v: number | "") => void;
  inruilVerkoper: "particulier" | "zakelijk";
  setInruilVerkoper: (v: "particulier" | "zakelijk") => void;
  inruilBedrijfsnaam: string;
  setInruilBedrijfsnaam: (v: string) => void;
  inruilKvk: string;
  setInruilKvk: (v: string) => void;
  inruilBtw: string;
  setInruilBtw: (v: string) => void;
}

const inputCls =
  "w-full px-3 py-2.5 bg-input border border-border rounded-[10px] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors";
const labelCls = "block text-xs font-medium text-muted-foreground mb-1.5";

const Stap1Voertuig = (p: Stap1Props) => {
  const v = p.vehicle;
  const { refetch } = useVehicles();
  const radioCls = (active: boolean) =>
    `flex-1 px-4 py-2.5 text-sm rounded-[10px] border transition-colors cursor-pointer text-center ${
      active
        ? "bg-foreground/10 border-foreground/40 text-foreground"
        : "border-border text-muted-foreground hover:bg-accent/50"
    }`;

  // Bewerk-modus state voor voertuiggegevens
  const [editMode, setEditMode] = useState(false);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [inruilLookupLoading, setInruilLookupLoading] = useState(false);
  const inruilSectionRef = useRef<HTMLDivElement>(null);
  const [edit, setEdit] = useState({
    merk: v.merk || "",
    model: v.model || "",
    bouwjaar: v.bouwjaar || ("" as number | ""),
    kleur: v.kleur || "",
    brandstof: v.brandstof || "benzine",
    kenteken: v.kenteken || "",
    chassisNummer: v.chassisNummer || "",
    apkVervaldatum: v.apkVervaldatum || "",
  });

  const startEdit = () => {
    setEdit({
      merk: v.merk || "",
      model: v.model || "",
      bouwjaar: v.bouwjaar || "",
      kleur: v.kleur || "",
      brandstof: v.brandstof || "benzine",
      kenteken: v.kenteken || "",
      chassisNummer: v.chassisNummer || "",
      apkVervaldatum: v.apkVervaldatum || "",
    });
    setEditMode(true);
  };

  const cancelEdit = () => setEditMode(false);

  const saveVehicle = async () => {
    setSavingVehicle(true);
    const { error } = await supabase
      .from("vehicles")
      .update({
        merk: edit.merk,
        model: edit.model,
        bouwjaar: edit.bouwjaar === "" ? null : Number(edit.bouwjaar),
        kleur: edit.kleur || null,
        brandstof: edit.brandstof,
        kenteken: edit.kenteken || null,
        chassis_nummer: edit.chassisNummer || null,
        apk_vervaldatum: edit.apkVervaldatum || null,
      } as any)
      .eq("id", v.id);
    setSavingVehicle(false);
    if (error) {
      toast.error("Opslaan voertuig mislukt");
      console.error(error);
      return;
    }
    toast.success("Voertuiggegevens opgeslagen");
    setEditMode(false);
    refetch();
  };

  const fieldLabel = "block text-[11px] uppercase tracking-wide text-muted-foreground mb-1";

  // Crossfade-veld: read-only tekst en input nemen exact dezelfde ruimte in
  // (zelfde padding/border/hoogte) en faden in/uit afhankelijk van editMode.
  const Field = ({
    children,
    display,
    mono,
  }: {
    children: React.ReactNode;
    display: React.ReactNode;
    mono?: boolean;
  }) => (
    <div className="relative">
      {/* Display laag */}
      <div
        className={[
          "px-3 py-2.5 text-sm border border-transparent rounded-[10px] transition-opacity duration-300 ease-out",
          mono ? "font-mono uppercase" : "",
          editMode ? "opacity-0 pointer-events-none" : "opacity-100",
        ].join(" ")}
      >
        {display}
      </div>
      {/* Edit laag — absoluut overlay zodat layout stabiel blijft */}
      <div
        className={[
          "absolute inset-0 transition-opacity duration-300 ease-out",
          editMode ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Voertuig gegevens (read-only of bewerkbaar) */}
      <div className="rounded-[14px] border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Voertuig</div>
          {!editMode ? (
            <button
              type="button"
              onClick={startEdit}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-[8px] hover:bg-accent/50"
              aria-label="Voertuig bewerken"
            >
              <Pencil className="w-3.5 h-3.5" />
              Bewerken
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={savingVehicle}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-[8px] hover:bg-accent/50"
              >
                <X className="w-3.5 h-3.5" />
                Annuleren
              </button>
              <button
                type="button"
                onClick={saveVehicle}
                disabled={savingVehicle}
                className="inline-flex items-center gap-1.5 text-xs text-foreground bg-foreground/10 hover:bg-foreground/15 transition-colors px-3 py-1.5 rounded-[8px] border border-foreground/30 disabled:opacity-50"
              >
                {savingVehicle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Opslaan
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {/* Linker kolom */}
          <div className="space-y-4">
            <div>
              <label className={fieldLabel}>Merk + Model</label>
              <Field display={`${v.merk} ${v.model}`.trim() || "-"}>
                <div className="flex gap-2">
                  <input
                    value={edit.merk}
                    onChange={(e) => setEdit({ ...edit, merk: e.target.value })}
                    className={inputCls}
                    placeholder="Merk"
                  />
                  <input
                    value={edit.model}
                    onChange={(e) => setEdit({ ...edit, model: e.target.value })}
                    className={inputCls}
                    placeholder="Model"
                  />
                </div>
              </Field>
            </div>

            <div>
              <label className={fieldLabel}>Bouwjaar</label>
              <Field display={v.bouwjaar || "-"}>
                <input
                  type="number"
                  inputMode="numeric"
                  value={edit.bouwjaar}
                  onChange={(e) => setEdit({ ...edit, bouwjaar: e.target.value === "" ? "" : Number(e.target.value) })}
                  className={inputCls}
                  placeholder="2020"
                />
              </Field>
            </div>

            <div>
              <label className={fieldLabel}>Kleur</label>
              <Field display={v.kleur || "-"}>
                <input
                  value={edit.kleur}
                  onChange={(e) => setEdit({ ...edit, kleur: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>

            <div>
              <label className={fieldLabel}>Brandstof</label>
              <Field display={v.brandstof ? brandstofLabels[v.brandstof as keyof typeof brandstofLabels] : "-"}>
                <select
                  value={edit.brandstof}
                  onChange={(e) => setEdit({ ...edit, brandstof: e.target.value as any })}
                  className={inputCls}
                >
                  {Object.entries(brandstofLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* Rechter kolom */}
          <div className="space-y-4">
            <div>
              <label className={fieldLabel}>Kenteken</label>
              <Field display={v.kenteken || "-"} mono>
                <input
                  value={edit.kenteken}
                  onChange={(e) => setEdit({ ...edit, kenteken: e.target.value.toUpperCase() })}
                  className={`${inputCls} font-mono uppercase`}
                  placeholder="XX-XX-XX"
                />
              </Field>
            </div>

            <div>
              <label className={fieldLabel}>Chassisnummer</label>
              <Field display={v.chassisNummer || "-"} mono>
                <input
                  value={edit.chassisNummer}
                  onChange={(e) => setEdit({ ...edit, chassisNummer: e.target.value.toUpperCase() })}
                  className={`${inputCls} font-mono uppercase`}
                  placeholder="VIN"
                />
              </Field>
            </div>

            <div>
              <label className={fieldLabel}>APK tot</label>
              <Field display={v.apkVervaldatum || "-"}>
                <input
                  type="date"
                  value={edit.apkVervaldatum}
                  onChange={(e) => setEdit({ ...edit, apkVervaldatum: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>

            {/* KM-stand altijd bewerkbaar */}
            <div>
              <label className={fieldLabel}>KM-stand</label>
              <input
                type="number"
                inputMode="numeric"
                value={p.kmStand}
                onChange={(e) => p.setKmStand(e.target.value === "" ? "" : Number(e.target.value))}
                className={inputCls}
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Prijs en type */}
      <div className="rounded-[14px] border border-border bg-card p-5 space-y-5">
        <div>
          <label className={labelCls}>Verkoopprijs (€)</label>
          <input
            type="number"
            inputMode="numeric"
            value={p.verkoopprijs}
            onChange={(e) => p.setVerkoopprijs(e.target.value === "" ? "" : Number(e.target.value))}
            className={inputCls}
            placeholder="0"
          />
        </div>

        <div>
          <label className={labelCls}>Voertuigtype</label>
          <div className="flex gap-2">
            {(["marge", "btw", "consignatie"] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => p.setVoertuigType(t)}
                className={radioCls(p.voertuigType === t)}
              >
                {t === "marge" ? "Marge" : t === "btw" ? "BTW" : "Consignatie"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Afleverkosten (€)</label>
            <input
              type="number"
              inputMode="numeric"
              value={p.afleverkosten}
              onChange={(e) => p.setAfleverkosten(e.target.value === "" ? "" : Number(e.target.value))}
              className={inputCls}
              placeholder="Optioneel"
            />
          </div>
          <div>
            <label className={labelCls}>Leges (€)</label>
            <input
              type="number"
              inputMode="numeric"
              value={p.leges}
              onChange={(e) => p.setLeges(e.target.value === "" ? "" : Number(e.target.value))}
              className={inputCls}
              placeholder="Optioneel"
            />
          </div>
        </div>
      </div>

      {/* Inruil */}
      <div ref={inruilSectionRef} className="rounded-[14px] border border-border bg-card p-5 scroll-mt-24">
        <TogglePill
          active={p.inruil}
          onChange={(v) => {
            p.setInruil(v);
            if (v) {
              setTimeout(() => {
                inruilSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 350);
            }
          }}
          label="Inruil van toepassing"
        />

        <div
          className={`grid transition-all duration-300 ease-out ${
            p.inruil ? "grid-rows-[1fr] opacity-100 mt-5" : "grid-rows-[0fr] opacity-0 mt-0"
          }`}
        >
          <div className="overflow-hidden">
          <div className="space-y-4 border-t border-border pt-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Kenteken inruil</label>
                <div className="relative">
                  <input
                    value={p.inruilKenteken}
                    onChange={(e) => p.setInruilKenteken(formatKenteken(e.target.value))}
                    onBlur={async () => {
                      const k = formatKenteken(p.inruilKenteken);
                      if (!isValidKenteken(k)) return;
                      p.setInruilKenteken(k);
                      if (inruilLookupLoading) return;
                      setInruilLookupLoading(true);
                      const data = await fetchRdwData(k);
                      setInruilLookupLoading(false);
                      if (!data) return;
                      if (data.merk) p.setInruilMerk(data.merk);
                      if (data.model) p.setInruilModel(data.model);
                    }}
                    className={`${inputCls} font-mono uppercase pr-9`}
                    placeholder="XX-XX-XX"
                  />
                  {inruilLookupLoading && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>
              </div>
              <div>
                <label className={labelCls}>Kilometerstand inruil</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={p.inruilKm}
                  onChange={(e) => p.setInruilKm(e.target.value === "" ? "" : Number(e.target.value))}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelCls}>Merk inruil</label>
                <input value={p.inruilMerk} onChange={(e) => p.setInruilMerk(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Model inruil</label>
                <input value={p.inruilModel} onChange={(e) => p.setInruilModel(e.target.value)} className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Inruilwaarde (€)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={p.inruilWaarde}
                  onChange={(e) => p.setInruilWaarde(e.target.value === "" ? "" : Number(e.target.value))}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Type verkoper</label>
              <div className="flex gap-2">
                {(["particulier", "zakelijk"] as const).map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => p.setInruilVerkoper(t)}
                    className={radioCls(p.inruilVerkoper === t)}
                  >
                    {t === "particulier" ? "Particulier" : "Zakelijk"}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`grid transition-all duration-300 ease-out ${
                p.inruilVerkoper === "zakelijk" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                  <div className="col-span-2">
                    <label className={labelCls}>Bedrijfsnaam</label>
                    <input value={p.inruilBedrijfsnaam} onChange={(e) => p.setInruilBedrijfsnaam(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>KVK-nummer</label>
                    <input value={p.inruilKvk} onChange={(e) => p.setInruilKvk(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>BTW-nummer</label>
                    <input value={p.inruilBtw} onChange={(e) => p.setInruilBtw(e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div>
    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className={`text-sm text-foreground ${mono ? "font-mono uppercase" : ""}`}>{value}</div>
  </div>
);

// Toggle switch — aan/uit schakelaar
const TogglePill = ({
  active,
  onChange,
  label,
}: {
  active: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) => (
  <label className="flex items-center justify-between gap-4 cursor-pointer select-none">
    <span className="text-sm font-medium text-foreground">{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={() => onChange(!active)}
      className={[
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
        active ? "bg-foreground" : "bg-muted border border-border",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-4 w-4 rounded-full shadow-sm transition-transform",
          active ? "translate-x-6 bg-background" : "translate-x-1 bg-muted-foreground/70",
        ].join(" ")}
      />
    </button>
  </label>
);

// ─────────────────────────────────────────────────────────────
// Stap 2 — Aflevering & aanbetaling
// ─────────────────────────────────────────────────────────────
interface Stap2Props {
  vehicle: any;
  verkoopprijs: number;
  laterOphalen: boolean;
  setLaterOphalen: (v: boolean) => void;
  leverdatum: string;
  setLeverdatum: (v: string) => void;
  aanbetalingBedrag: number | "";
  setAanbetalingBedrag: (v: number | "") => void;
  aanbetalingBetaalwijze: "cash" | "pin" | "ideal" | "";
  setAanbetalingBetaalwijze: (v: "cash" | "pin" | "ideal" | "") => void;
}

const Stap2Aflevering = (p: Stap2Props) => {
  const aanbetaling = p.aanbetalingBedrag === "" ? 0 : Number(p.aanbetalingBedrag);
  const restbedrag = Math.max(0, (p.verkoopprijs || 0) - aanbetaling);
  const today = new Date().toISOString().slice(0, 10);

  const optionCls = (active: boolean) =>
    `flex-1 px-4 py-3 text-sm rounded-[10px] border transition-colors cursor-pointer text-center font-medium ${
      active
        ? "bg-foreground/10 border-foreground/40 text-foreground"
        : "border-border text-muted-foreground hover:bg-accent/50"
    }`;

  const payCls = (active: boolean) =>
    `flex-1 px-4 py-2.5 text-sm rounded-[10px] border transition-colors cursor-pointer text-center ${
      active
        ? "bg-foreground/10 border-foreground/40 text-foreground"
        : "border-border text-muted-foreground hover:bg-accent/50"
    }`;

  const handlePdf = () => {
    if (aanbetaling <= 0) {
      toast.error("Vul eerst een aanbetalingsbedrag in");
      return;
    }
    openAanbetalingsbewijsPdf({
      voertuig: {
        merk: p.vehicle.merk,
        model: p.vehicle.model,
        bouwjaar: p.vehicle.bouwjaar,
        kenteken: p.vehicle.kenteken,
      },
      verkoopprijs: p.verkoopprijs,
      aanbetalingsbedrag: aanbetaling,
      restbedrag,
      betaalwijze:
        p.aanbetalingBetaalwijze === "cash"
          ? "Cash"
          : p.aanbetalingBetaalwijze === "pin"
          ? "Pin"
          : p.aanbetalingBetaalwijze === "ideal"
          ? "iDEAL"
          : undefined,
      leverdatum: p.leverdatum,
      datum: today,
    });
  };

  return (
    <div className="space-y-6">
      {/* Sectie 1 — Aflevering */}
      <div className="rounded-[14px] border border-border bg-card p-5 space-y-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Aflevering</div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => p.setLaterOphalen(false)}
            className={optionCls(!p.laterOphalen)}
          >
            Vandaag afleveren
          </button>
          <button
            type="button"
            onClick={() => p.setLaterOphalen(true)}
            className={optionCls(p.laterOphalen)}
          >
            Wordt later opgehaald
          </button>
        </div>

        <div
          className={`grid transition-all duration-300 ease-out ${
            p.laterOphalen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 mt-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="border-t border-border pt-4">
              <label className={labelCls}>Verwachte leverdatum *</label>
              <input
                type="date"
                value={p.leverdatum}
                min={today}
                onChange={(e) => p.setLeverdatum(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {!p.laterOphalen && (
          <div className="text-xs text-muted-foreground border-t border-border pt-4">
            Leverdatum wordt automatisch op vandaag ({formatDateNl(today)}) gezet. Geen aanbetaling vereist.
          </div>
        )}
      </div>

      {/* Sectie 2 — Aanbetaling */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          p.laterOphalen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="rounded-[14px] border border-border bg-card p-5 space-y-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Aanbetaling</div>

            <div>
              <label className={labelCls}>Aanbetalingsbedrag (€) *</label>
              <input
                type="number"
                inputMode="numeric"
                value={p.aanbetalingBedrag}
                onChange={(e) =>
                  p.setAanbetalingBedrag(e.target.value === "" ? "" : Number(e.target.value))
                }
                className={inputCls}
                placeholder="0"
              />
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Restbedrag</span>
                <span className="font-medium text-foreground">
                  {new Intl.NumberFormat("nl-NL", {
                    style: "currency",
                    currency: "EUR",
                  }).format(restbedrag)}
                </span>
              </div>
            </div>

            <div>
              <label className={labelCls}>Betaalmethode *</label>
              <div className="flex gap-2">
                {(["cash", "pin", "ideal"] as const).map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => p.setAanbetalingBetaalwijze(m)}
                    className={payCls(p.aanbetalingBetaalwijze === m)}
                  >
                    {m === "cash" ? "Cash" : m === "pin" ? "Pin" : "iDEAL"}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handlePdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm border border-border rounded-[10px] hover:bg-accent transition-colors"
            >
              <FileText className="w-4 h-4" />
              Aanbetalingsbewijs genereren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatDateNl = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
};

export default AdminVerkoopWizardPage;

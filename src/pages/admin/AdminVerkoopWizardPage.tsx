import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useVehicles } from "@/hooks/useVehicles";
import { brandstofLabels } from "@/types/vehicle";
import logo from "@/assets/logo.svg";

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
  }, [verkoopId, activeStap, verkoopprijs, voertuigType, afleverkosten, leges, inruil, inruilKenteken, inruilMerk, inruilModel, inruilKm, inruilWaarde, inruilVerkoper, inruilBedrijfsnaam, inruilKvk, inruilBtw]);

  const handleVolgende = async () => {
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
    <div className="admin-theme min-h-screen bg-background text-foreground flex flex-col">
      {/* Top bar + voortgang */}
      <header className="border-b border-border bg-card/40 backdrop-blur sticky top-0 z-10">
        <div className="px-6 h-14 flex items-center justify-between">
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
        <div className="h-1 bg-muted/40">
          <div
            className="h-full bg-foreground/80 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-[280px] shrink-0 border-r border-border bg-sidebar flex flex-col">
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
        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-8 py-10">
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

              {activeStap !== 1 && (
                <div className="rounded-[14px] border border-border bg-card p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Inhoud voor deze stap volgt binnenkort.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer met navigatie */}
          <div className="border-t border-border bg-card/40 px-8 py-4 flex items-center justify-between">
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
        </main>
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
  const radioCls = (active: boolean) =>
    `flex-1 px-4 py-2.5 text-sm rounded-[10px] border transition-colors cursor-pointer text-center ${
      active
        ? "bg-foreground/10 border-foreground/40 text-foreground"
        : "border-border text-muted-foreground hover:bg-accent/50"
    }`;

  return (
    <div className="space-y-6">
      {/* Read-only voertuig samenvatting */}
      <div className="rounded-[14px] border border-border bg-card p-5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Voertuig</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <InfoRow label="Merk + model" value={`${v.merk} ${v.model} ${v.bouwjaar || ""}`} />
          <InfoRow label="Kenteken" value={v.kenteken || "-"} mono />
          <InfoRow label="Kleur" value={v.kleur || "-"} />
          <InfoRow label="Brandstof" value={v.brandstof ? brandstofLabels[v.brandstof as keyof typeof brandstofLabels] : "-"} />
          <InfoRow label="APK tot" value={v.apkVervaldatum || "-"} />
          <div>
            <label className={labelCls}>KM-stand</label>
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
      <div className="rounded-[14px] border border-border bg-card p-5">
        <TogglePill
          active={p.inruil}
          onChange={p.setInruil}
          label="Inruil van toepassing"
        />

        {p.inruil && (
          <div className="mt-5 space-y-4 border-t border-border pt-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Kenteken inruil</label>
                <input value={p.inruilKenteken} onChange={(e) => p.setInruilKenteken(e.target.value.toUpperCase())} className={inputCls} placeholder="XX-XX-XX" />
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

            {p.inruilVerkoper === "zakelijk" && (
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
            )}
          </div>
        )}
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

export default AdminVerkoopWizardPage;

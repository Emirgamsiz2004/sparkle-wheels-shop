import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Lock, Loader2, Pencil, Save, X, Search, User, Building2, UserPlus } from "lucide-react";
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
import { useMoneybird } from "@/hooks/useMoneybird";

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
  const { invoke: invokeMoneybird } = useMoneybird();

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
  const [afleverwijze, setAfleverwijze] = useState<"vandaag" | "later" | "aflevering">("vandaag");
  const [afleveradres, setAfleveradres] = useState<string>("");
  const [leverdatum, setLeverdatum] = useState<string>("");
  const [aanbetalingBedrag, setAanbetalingBedrag] = useState<number | "">("");
  const [aanbetalingBetaalwijze, setAanbetalingBetaalwijze] = useState<Betaalwijze>("");
  const [aanbetalingBankrekening, setAanbetalingBankrekening] = useState<string>("");
  // Compat: laterOphalen blijft afgeleid
  const laterOphalen = afleverwijze !== "vandaag";

  // Stap 3 state
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [klantVoornaam, setKlantVoornaam] = useState("");
  const [klantAchternaam, setKlantAchternaam] = useState("");
  const [klantGeboortedatum, setKlantGeboortedatum] = useState("");
  const [klantAdres, setKlantAdres] = useState("");
  const [klantPostcode, setKlantPostcode] = useState("");
  const [klantWoonplaats, setKlantWoonplaats] = useState("");
  const [klantLand, setKlantLand] = useState("Nederland");
  const [klantTelefoon, setKlantTelefoon] = useState("");
  const [klantEmail, setKlantEmail] = useState("");
  const [klantZakelijk, setKlantZakelijk] = useState(false);
  const [klantBedrijfsnaam, setKlantBedrijfsnaam] = useState("");
  const [klantKvk, setKlantKvk] = useState("");
  const [klantBtw, setKlantBtw] = useState("");

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
        // Stap 2 hydration
        const aw = (existing as any).afleverwijze;
        if (aw === "vandaag" || aw === "later" || aw === "aflevering") {
          setAfleverwijze(aw);
        } else {
          setAfleverwijze(existing.later_ophalen ? "later" : "vandaag");
        }
        setAfleveradres((existing as any).afleveradres || "");
        setLeverdatum(existing.leverdatum || "");
        setAanbetalingBedrag(existing.aanbetaling_bedrag ?? "");
        if (["cash", "pin", "ideal", "overboeking"].includes(existing.aanbetaling_betaalwijze)) {
          setAanbetalingBetaalwijze(existing.aanbetaling_betaalwijze as Betaalwijze);
        }
        setAanbetalingBankrekening((existing as any).aanbetaling_bankrekening || "");
        // Stap 3 hydration
        if ((existing as any).klant_type === "zakelijk") setKlantZakelijk(true);
        else if ((existing as any).klant_type === "particulier") setKlantZakelijk(false);
        if (existing.customer_id) {
          setCustomerId(existing.customer_id);
          const { data: cust } = await supabase
            .from("customers")
            .select("*")
            .eq("id", existing.customer_id)
            .maybeSingle();
          if (cust) {
            setKlantVoornaam(cust.voornaam || "");
            setKlantAchternaam(cust.achternaam || "");
            setKlantGeboortedatum(cust.geboortedatum || "");
            setKlantAdres(cust.adres || "");
            setKlantPostcode(cust.postcode || "");
            setKlantWoonplaats(cust.woonplaats || cust.plaats || "");
            setKlantLand(cust.land || "Nederland");
            setKlantTelefoon(cust.telefoon || "");
            setKlantEmail(cust.email || "");
            if ((existing as any).klant_type == null) setKlantZakelijk(!!cust.is_zakelijk);
            setKlantBedrijfsnaam(cust.bedrijfsnaam || "");
            setKlantKvk(cust.kvk_nummer || "");
            setKlantBtw(cust.btw_nummer || "");
          }
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
      afleverwijze,
      afleveradres: afleverwijze === "aflevering" ? (afleveradres || null) : null,
      leverdatum: laterOphalen ? (leverdatum || null) : new Date().toISOString().slice(0, 10),
      aanbetaling_bedrag: laterOphalen && aanbetalingBedrag !== "" ? Number(aanbetalingBedrag) : null,
      aanbetaling_betaalwijze: laterOphalen && aanbetalingBetaalwijze ? aanbetalingBetaalwijze : null,
      aanbetaling_bankrekening: laterOphalen && aanbetalingBetaalwijze === "overboeking" ? (aanbetalingBankrekening || null) : null,
      customer_id: customerId,
      klant_type: klantZakelijk ? "zakelijk" : "particulier",
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
  }, [verkoopId, activeStap, verkoopprijs, voertuigType, afleverkosten, leges, inruil, inruilKenteken, inruilMerk, inruilModel, inruilKm, inruilWaarde, inruilVerkoper, inruilBedrijfsnaam, inruilKvk, inruilBtw, afleverwijze, afleveradres, laterOphalen, leverdatum, aanbetalingBedrag, aanbetalingBetaalwijze, aanbetalingBankrekening, customerId, klantZakelijk]);

  const handleVolgende = async () => {
    // Stap-specifieke validatie
    if (activeStap === 2) {
      if (afleverwijze === "later") {
        if (!leverdatum) { toast.error("Verwachte leverdatum is verplicht"); return; }
        // Aanbetaling is optioneel
      } else if (afleverwijze === "aflevering") {
        if (!leverdatum) { toast.error("Verwachte leverdatum is verplicht"); return; }
        if (!afleveradres.trim()) { toast.error("Afleveradres is verplicht"); return; }
      }
    }
    if (activeStap === 3) {
      if (klantZakelijk) {
        if (!klantBedrijfsnaam.trim()) { toast.error("Bedrijfsnaam is verplicht"); return; }
        if (!klantKvk.trim()) { toast.error("KVK-nummer is verplicht"); return; }
      }
      if (!klantVoornaam.trim() || !klantAchternaam.trim()) {
        toast.error(klantZakelijk ? "Contactpersoon voor- en achternaam zijn verplicht" : "Voor- en achternaam zijn verplicht");
        return;
      }
      if (!klantAdres.trim() || !klantPostcode.trim() || !klantWoonplaats.trim()) { toast.error("Adres, postcode en woonplaats zijn verplicht"); return; }
      if (!klantTelefoon.trim()) { toast.error("Telefoonnummer is verplicht"); return; }
      // Klant aanmaken of bijwerken
      const customerPayload: any = {
        voornaam: klantVoornaam.trim(),
        achternaam: klantAchternaam.trim(),
        geboortedatum: !klantZakelijk ? (klantGeboortedatum || null) : null,
        adres: klantAdres.trim() || null,
        postcode: klantPostcode.trim() || null,
        woonplaats: klantWoonplaats.trim() || null,
        plaats: klantWoonplaats.trim() || null,
        land: klantLand || "Nederland",
        telefoon: klantTelefoon.trim(),
        email: klantEmail.trim() || `${klantVoornaam.trim().toLowerCase()}.${klantAchternaam.trim().toLowerCase()}@geen-email.local`,
        is_zakelijk: klantZakelijk,
        bedrijfsnaam: klantZakelijk ? klantBedrijfsnaam.trim() : null,
        kvk_nummer: klantZakelijk ? klantKvk.trim() : null,
        btw_nummer: klantZakelijk ? (klantBtw.trim() || null) : null,
        status: "klant",
      };
      let custId = customerId;
      let existingMbId: string | null = null;
      if (custId) {
        const { data: prev } = await supabase.from("customers").select("moneybird_contact_id").eq("id", custId).maybeSingle();
        existingMbId = (prev as any)?.moneybird_contact_id ?? null;
        const { error: updErr } = await supabase.from("customers").update(customerPayload).eq("id", custId);
        if (updErr) { toast.error("Opslaan klant mislukt"); console.error(updErr); return; }
      } else {
        const { data: created, error: insErr } = await supabase.from("customers").insert(customerPayload).select().single();
        if (insErr || !created) { toast.error("Aanmaken klant mislukt"); console.error(insErr); return; }
        custId = created.id;
        setCustomerId(custId);
        existingMbId = (created as any).moneybird_contact_id ?? null;
      }

      // Sync naar Moneybird (alleen als nog geen contact gekoppeld is)
      let mbContactId = existingMbId;
      if (!mbContactId) {
        try {
          const mbPayload: Record<string, any> = {
            firstname: klantVoornaam.trim(),
            lastname: klantAchternaam.trim(),
            address1: klantAdres.trim(),
            zipcode: klantPostcode.trim(),
            city: klantWoonplaats.trim(),
            country: klantLand || "Nederland",
            phone: klantTelefoon.trim(),
            email: klantEmail.trim() || undefined,
          };
          if (klantZakelijk) {
            mbPayload.company_name = klantBedrijfsnaam.trim();
            mbPayload.chamber_of_commerce = klantKvk.trim();
            if (klantBtw.trim()) mbPayload.tax_number = klantBtw.trim();
          }
          const mbContact = await invokeMoneybird("create_contact", mbPayload);
          if (mbContact?.id) {
            mbContactId = String(mbContact.id);
            await supabase.from("customers").update({ moneybird_contact_id: mbContactId } as any).eq("id", custId);
            toast.success("Klant aangemaakt in Moneybird");
          }
        } catch (e) {
          console.error("Moneybird contact sync mislukt:", e);
          toast.error("Klant opgeslagen, maar Moneybird-sync mislukt");
        }
      } else {
        toast.success("Klant opgeslagen");
      }

      const ok = await saveCurrent({ stap3_afgerond: true, customer_id: custId });
      if (!ok) return;
      setCompleted((p) => ({ ...p, [activeStap]: true }));
      let next = activeStap + 1;
      const nextCompleted = { ...completed, [activeStap]: true };
      while (next <= 12 && isStepBlocked(next, nextCompleted, inruil)) next++;
      if (next <= 12) setActiveStap(next);
      return;
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
                afleverwijze={afleverwijze}
                setAfleverwijze={setAfleverwijze}
                afleveradres={afleveradres}
                setAfleveradres={setAfleveradres}
                leverdatum={leverdatum}
                setLeverdatum={setLeverdatum}
                aanbetalingBedrag={aanbetalingBedrag}
                setAanbetalingBedrag={setAanbetalingBedrag}
                aanbetalingBetaalwijze={aanbetalingBetaalwijze}
                setAanbetalingBetaalwijze={setAanbetalingBetaalwijze}
                aanbetalingBankrekening={aanbetalingBankrekening}
                setAanbetalingBankrekening={setAanbetalingBankrekening}
                onAutoSave={() => saveCurrent()}
              />
            )}

            {activeStap === 3 && (
              <Stap3Klant
                customerId={customerId}
                setCustomerId={setCustomerId}
                voornaam={klantVoornaam} setVoornaam={setKlantVoornaam}
                achternaam={klantAchternaam} setAchternaam={setKlantAchternaam}
                geboortedatum={klantGeboortedatum} setGeboortedatum={setKlantGeboortedatum}
                adres={klantAdres} setAdres={setKlantAdres}
                postcode={klantPostcode} setPostcode={setKlantPostcode}
                woonplaats={klantWoonplaats} setWoonplaats={setKlantWoonplaats}
                land={klantLand} setLand={setKlantLand}
                telefoon={klantTelefoon} setTelefoon={setKlantTelefoon}
                email={klantEmail} setEmail={setKlantEmail}
                zakelijk={klantZakelijk} setZakelijk={setKlantZakelijk}
                bedrijfsnaam={klantBedrijfsnaam} setBedrijfsnaam={setKlantBedrijfsnaam}
                kvk={klantKvk} setKvk={setKlantKvk}
                btw={klantBtw} setBtw={setKlantBtw}
              />
            )}

            {activeStap !== 1 && activeStap !== 2 && activeStap !== 3 && (
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
  afleverwijze: "vandaag" | "later" | "aflevering";
  setAfleverwijze: (v: "vandaag" | "later" | "aflevering") => void;
  afleveradres: string;
  setAfleveradres: (v: string) => void;
  leverdatum: string;
  setLeverdatum: (v: string) => void;
  aanbetalingBedrag: number | "";
  setAanbetalingBedrag: (v: number | "") => void;
  aanbetalingBetaalwijze: Betaalwijze;
  setAanbetalingBetaalwijze: (v: Betaalwijze) => void;
  aanbetalingBankrekening: string;
  setAanbetalingBankrekening: (v: string) => void;
  onAutoSave?: () => void | Promise<any>;
}

const Stap2Aflevering = (p: Stap2Props) => {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const aanbetaling = p.aanbetalingBedrag === "" ? 0 : Number(p.aanbetalingBedrag);
  const restbedrag = Math.max(0, (p.verkoopprijs || 0) - aanbetaling);
  const today = new Date().toISOString().slice(0, 10);
  const laterOphalen = p.afleverwijze !== "vandaag";
  const isAflevering = p.afleverwijze === "aflevering";

  // Bij "Aflevering": forceer betaalmethode op overboeking
  useEffect(() => {
    if (isAflevering && p.aanbetalingBetaalwijze !== "overboeking") {
      p.setAanbetalingBetaalwijze("overboeking");
    }
  }, [isAflevering]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autosave bij later ophalen / aflevering: zodra leverdatum + (aanbetaling of adres) ingevuld zijn
  const autoSaveSig = useMemo(() => {
    if (!laterOphalen) return null;
    const filledAanbet = p.aanbetalingBedrag !== "" && Number(p.aanbetalingBedrag) > 0;
    const filledAdres = p.afleverwijze === "aflevering" ? p.afleveradres.trim().length > 0 : true;
    if (!p.leverdatum) return null;
    if (p.afleverwijze === "later" && !filledAanbet) return null;
    if (p.afleverwijze === "aflevering" && !filledAdres) return null;
    return [
      p.afleverwijze,
      p.leverdatum,
      String(p.aanbetalingBedrag),
      p.aanbetalingBetaalwijze,
      p.aanbetalingBankrekening,
      p.afleveradres,
    ].join("|");
  }, [laterOphalen, p.afleverwijze, p.leverdatum, p.aanbetalingBedrag, p.aanbetalingBetaalwijze, p.aanbetalingBankrekening, p.afleveradres]);

  useEffect(() => {
    if (!autoSaveSig || !p.onAutoSave) return;
    const t = setTimeout(() => { p.onAutoSave?.(); }, 600);
    return () => clearTimeout(t);
  }, [autoSaveSig]); // eslint-disable-line react-hooks/exhaustive-deps

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
          : p.aanbetalingBetaalwijze === "overboeking"
          ? `Overboeking${p.aanbetalingBankrekening ? ` (${p.aanbetalingBankrekening})` : ""}`
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => p.setAfleverwijze("vandaag")}
            className={optionCls(p.afleverwijze === "vandaag")}
          >
            Vandaag afleveren
          </button>
          <button
            type="button"
            onClick={() => p.setAfleverwijze("later")}
            className={optionCls(p.afleverwijze === "later")}
          >
            Wordt later opgehaald
          </button>
          <button
            type="button"
            onClick={() => p.setAfleverwijze("aflevering")}
            className={optionCls(p.afleverwijze === "aflevering")}
          >
            Aflevering
          </button>
        </div>

        <div
          className={`grid transition-all duration-300 ease-out ${
            laterOphalen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 mt-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="border-t border-border pt-4 space-y-4">
              <div>
                <label className={labelCls}>Verwachte leverdatum *</label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "flex h-10 w-full items-center justify-between rounded-[10px] border-[0.5px] border-input bg-transparent px-3 py-2 text-sm text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        !p.leverdatum && "text-muted-foreground",
                      )}
                    >
                      <span>
                        {p.leverdatum
                          ? format(parseISO(p.leverdatum), "d MMMM yyyy", { locale: nl })
                          : "Kies een datum"}
                      </span>
                      <CalendarIcon className="h-4 w-4 text-foreground/70" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                    <Calendar
                      mode="single"
                      selected={p.leverdatum ? parseISO(p.leverdatum) : undefined}
                      onSelect={(d) => {
                        if (d) {
                          const yyyy = d.getFullYear();
                          const mm = String(d.getMonth() + 1).padStart(2, "0");
                          const dd = String(d.getDate()).padStart(2, "0");
                          p.setLeverdatum(`${yyyy}-${mm}-${dd}`);
                          setDatePickerOpen(false);
                        }
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      locale={nl}
                      className={cn("p-3 pointer-events-auto")}
                      classNames={{
                        day_selected:
                          "bg-emerald-600 text-white rounded-full border-0 ring-0 hover:bg-emerald-600 hover:text-white focus:bg-emerald-600 focus:text-white focus:ring-0 focus:outline-none",
                        day_today: "bg-muted text-foreground font-semibold",
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {p.afleverwijze === "aflevering" && (
                <div>
                  <label className={labelCls}>Afleveradres *</label>
                  <input
                    type="text"
                    value={p.afleveradres}
                    onChange={(e) => p.setAfleveradres(e.target.value)}
                    className={inputCls}
                    placeholder="Straat 1, 1234 AB Plaats"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {p.afleverwijze === "vandaag" && (
          <div className="text-xs text-muted-foreground border-t border-border pt-4">
            Leverdatum wordt automatisch op vandaag ({formatDateNl(today)}) gezet. Geen aanbetaling vereist.
          </div>
        )}
      </div>

      {/* Sectie 2 — Aanbetaling */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          laterOphalen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="rounded-[14px] border border-border bg-card p-5 space-y-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {isAflevering ? "Betaling vooraf" : "Aanbetaling"}
            </div>

            {isAflevering ? (
              <>
                <div className="rounded-[10px] border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground leading-relaxed">
                  Bij aflevering wordt de volledige betaling vooraf geregeld via overboeking.
                  De auto wordt afgeleverd zodra de betaling ontvangen is.
                </div>

                <div>
                  <label className={labelCls}>Betaalmethode</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      disabled
                      className={`${payCls(true)} cursor-default opacity-100`}
                    >
                      Overboeking
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className={labelCls}>Aanbetalingsbedrag (€)</label>
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
                  <label className={labelCls}>Betaalmethode</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(["cash", "pin", "ideal", "overboeking"] as const).map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => p.setAanbetalingBetaalwijze(m)}
                        className={payCls(p.aanbetalingBetaalwijze === m)}
                      >
                        {m === "cash" ? "Cash" : m === "pin" ? "Pin" : m === "ideal" ? "iDEAL" : "Overboeking"}
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
              </>
            )}
          </div>
        </div>
      </div>

      {laterOphalen && (
        <p className="text-xs text-muted-foreground text-center pt-1">
          Wijzigingen worden automatisch bewaard
        </p>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Stap 3 — Klantgegevens
// ─────────────────────────────────────────────────────────────
interface Stap3Props {
  customerId: string | null;
  setCustomerId: (v: string | null) => void;
  voornaam: string; setVoornaam: (v: string) => void;
  achternaam: string; setAchternaam: (v: string) => void;
  geboortedatum: string; setGeboortedatum: (v: string) => void;
  adres: string; setAdres: (v: string) => void;
  postcode: string; setPostcode: (v: string) => void;
  woonplaats: string; setWoonplaats: (v: string) => void;
  land: string; setLand: (v: string) => void;
  telefoon: string; setTelefoon: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  zakelijk: boolean; setZakelijk: (v: boolean) => void;
  bedrijfsnaam: string; setBedrijfsnaam: (v: string) => void;
  kvk: string; setKvk: (v: string) => void;
  btw: string; setBtw: (v: string) => void;
}

interface CustomerSuggestion {
  id: string;
  voornaam: string;
  achternaam: string;
  email: string;
  telefoon: string;
  bedrijfsnaam: string | null;
  adres: string | null;
  postcode: string | null;
  woonplaats: string | null;
  plaats: string | null;
  land: string | null;
  geboortedatum: string | null;
  is_zakelijk: boolean | null;
  kvk_nummer: string | null;
  btw_nummer: string | null;
}

const Stap3Klant = (p: Stap3Props) => {
  const [mode, setMode] = useState<"existing" | "new">(p.customerId ? "existing" : "new");
  const [zoekterm, setZoekterm] = useState("");
  const [suggesties, setSuggesties] = useState<CustomerSuggestion[]>([]);
  const [zoeken, setZoeken] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Debounced search — filter op klanttype (zakelijk/particulier)
  useEffect(() => {
    if (mode !== "existing") return;
    const term = zoekterm.trim();
    if (term.length < 2) { setSuggesties([]); return; }
    const t = setTimeout(async () => {
      setZoeken(true);
      const { data, error } = await supabase
        .from("customers")
        .select("id,voornaam,achternaam,email,telefoon,bedrijfsnaam,adres,postcode,woonplaats,plaats,land,geboortedatum,is_zakelijk,kvk_nummer,btw_nummer")
        .eq("is_zakelijk", p.zakelijk)
        .or(`voornaam.ilike.%${term}%,achternaam.ilike.%${term}%,email.ilike.%${term}%,telefoon.ilike.%${term}%,bedrijfsnaam.ilike.%${term}%`)
        .limit(8);
      setZoeken(false);
      if (!error && data) setSuggesties(data as CustomerSuggestion[]);
    }, 250);
    return () => clearTimeout(t);
  }, [zoekterm, mode, p.zakelijk]);

  const selectKlant = (c: CustomerSuggestion) => {
    p.setCustomerId(c.id);
    p.setVoornaam(c.voornaam || "");
    p.setAchternaam(c.achternaam || "");
    p.setGeboortedatum(c.geboortedatum || "");
    p.setAdres(c.adres || "");
    p.setPostcode(c.postcode || "");
    p.setWoonplaats(c.woonplaats || c.plaats || "");
    p.setLand(c.land || "Nederland");
    p.setTelefoon(c.telefoon || "");
    p.setEmail(c.email || "");
    // klanttype blijft gestuurd door de top-toggle; matched al via filter
    p.setBedrijfsnaam(c.bedrijfsnaam || "");
    p.setKvk(c.kvk_nummer || "");
    p.setBtw(c.btw_nummer || "");
    setSuggesties([]);
    setZoekterm(`${c.voornaam} ${c.achternaam}`.trim());
  };

  const switchToNew = () => {
    setMode("new");
    p.setCustomerId(null);
    setSuggesties([]);
    setZoekterm("");
  };

  const switchToExisting = () => {
    setMode("existing");
    p.setCustomerId(null);
  };

  const switchKlantType = (zakelijk: boolean) => {
    if (p.zakelijk === zakelijk) return;
    p.setZakelijk(zakelijk);
    // Reset selectie & zoek bij wisselen klanttype
    p.setCustomerId(null);
    setSuggesties([]);
    setZoekterm("");
  };

  const toggleCls = (active: boolean) =>
    `flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-[10px] border transition-colors cursor-pointer ${
      active
        ? "bg-foreground/10 border-foreground/40 text-foreground font-medium"
        : "border-border text-muted-foreground hover:bg-accent/50"
    }`;

  return (
    <div className="space-y-6">
      {/* Klanttype switcher */}
      <div className="flex gap-3">
        <button type="button" onClick={() => switchKlantType(false)} className={toggleCls(!p.zakelijk)}>
          <User className="w-4 h-4" />
          Particulier
        </button>
        <button type="button" onClick={() => switchKlantType(true)} className={toggleCls(p.zakelijk)}>
          <Building2 className="w-4 h-4" />
          Zakelijk
        </button>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-3">
        <button type="button" onClick={switchToExisting} className={toggleCls(mode === "existing")}>
          <Search className="w-4 h-4" />
          Bestaande klant selecteren
        </button>
        <button type="button" onClick={switchToNew} className={toggleCls(mode === "new")}>
          <UserPlus className="w-4 h-4" />
          Nieuwe klant
        </button>
      </div>

      {/* Existing klant zoeker */}
      {mode === "existing" && (
        <div className="rounded-[14px] border border-border bg-card p-6 space-y-4">
          <div>
            <label className={labelCls}>Zoek klant</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={zoekterm}
                onChange={(e) => { setZoekterm(e.target.value); if (p.customerId) p.setCustomerId(null); }}
                placeholder="Zoek op naam, telefoon of email..."
                className={cn(inputCls, "pl-9")}
                autoFocus
              />
            </div>
          </div>

          {zoeken && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Zoeken...
            </div>
          )}

          {suggesties.length > 0 && (
            <div className="border border-border rounded-[10px] divide-y divide-border overflow-hidden">
              {suggesties.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectKlant(c)}
                  className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                    {c.is_zakelijk ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground font-medium truncate">
                      {c.voornaam} {c.achternaam}
                      {c.is_zakelijk && c.bedrijfsnaam ? ` — ${c.bedrijfsnaam}` : ""}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.email}{c.telefoon ? ` · ${c.telefoon}` : ""}{c.woonplaats ? ` · ${c.woonplaats}` : ""}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {p.customerId && (
            <div className="rounded-[10px] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-emerald-400 font-medium mb-1">
                <Check className="w-4 h-4" /> Klant geselecteerd
              </div>
              <div className="text-foreground">
                {p.voornaam} {p.achternaam}
                {p.zakelijk && p.bedrijfsnaam ? ` — ${p.bedrijfsnaam}` : ""}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {p.email}{p.telefoon ? ` · ${p.telefoon}` : ""}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nieuwe klant formulier */}
      {mode === "new" && (
        <div className="rounded-[14px] border border-border bg-card p-6 space-y-5">
          {/* Zakelijk: bedrijfsgegevens bovenaan */}
          {p.zakelijk && (
            <>
              <div>
                <label className={labelCls}>Bedrijfsnaam *</label>
                <input type="text" value={p.bedrijfsnaam} onChange={(e) => p.setBedrijfsnaam(e.target.value)} className={inputCls} maxLength={150} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>KVK-nummer *</label>
                  <input type="text" value={p.kvk} onChange={(e) => p.setKvk(e.target.value)} className={inputCls} maxLength={20} />
                </div>
                <div>
                  <label className={labelCls}>BTW-nummer (optioneel)</label>
                  <input type="text" value={p.btw} onChange={(e) => p.setBtw(e.target.value)} className={inputCls} maxLength={30} />
                </div>
              </div>
              <div className="border-t border-border pt-5">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Contactpersoon</div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{p.zakelijk ? "Voornaam contactpersoon *" : "Voornaam *"}</label>
              <input type="text" value={p.voornaam} onChange={(e) => p.setVoornaam(e.target.value)} className={inputCls} maxLength={80} />
            </div>
            <div>
              <label className={labelCls}>{p.zakelijk ? "Achternaam contactpersoon *" : "Achternaam *"}</label>
              <input type="text" value={p.achternaam} onChange={(e) => p.setAchternaam(e.target.value)} className={inputCls} maxLength={80} />
            </div>
          </div>

          {/* Geboortedatum alleen voor particulier */}
          {!p.zakelijk && (
            <div>
              <label className={labelCls}>Geboortedatum *</label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex h-10 w-full items-center justify-between rounded-[10px] border-[0.5px] border-input bg-transparent px-3 py-2 text-sm text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      !p.geboortedatum && "text-muted-foreground",
                    )}
                  >
                    <span>
                      {p.geboortedatum
                        ? format(parseISO(p.geboortedatum), "d MMMM yyyy", { locale: nl })
                        : "Kies een datum"}
                    </span>
                    <CalendarIcon className="h-4 w-4 text-foreground/70" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={p.geboortedatum ? parseISO(p.geboortedatum) : undefined}
                    onSelect={(d) => {
                      if (d) {
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, "0");
                        const dd = String(d.getDate()).padStart(2, "0");
                        p.setGeboortedatum(`${yyyy}-${mm}-${dd}`);
                        setDatePickerOpen(false);
                      }
                    }}
                    captionLayout="dropdown-buttons"
                    fromYear={1920}
                    toYear={new Date().getFullYear()}
                    defaultMonth={p.geboortedatum ? parseISO(p.geboortedatum) : new Date(1990, 0, 1)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    locale={nl}
                    className={cn("p-3 pointer-events-auto")}
                    classNames={{
                      day_selected:
                        "bg-emerald-600 text-white rounded-full border-0 ring-0 hover:bg-emerald-600 hover:text-white focus:bg-emerald-600 focus:text-white focus:ring-0 focus:outline-none",
                      day_today: "bg-muted text-foreground font-semibold",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div>
            <label className={labelCls}>Adres *</label>
            <input type="text" value={p.adres} onChange={(e) => p.setAdres(e.target.value)} className={inputCls} placeholder="Straat 1" maxLength={150} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Postcode *</label>
              <input type="text" value={p.postcode} onChange={(e) => p.setPostcode(e.target.value)} className={inputCls} placeholder="1234 AB" maxLength={10} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Woonplaats *</label>
              <input type="text" value={p.woonplaats} onChange={(e) => p.setWoonplaats(e.target.value)} className={inputCls} maxLength={100} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Land</label>
              <input type="text" value={p.land} onChange={(e) => p.setLand(e.target.value)} className={inputCls} maxLength={60} />
            </div>
            <div>
              <label className={labelCls}>Telefoonnummer *</label>
              <input type="tel" value={p.telefoon} onChange={(e) => p.setTelefoon(e.target.value)} className={inputCls} placeholder="06-12345678" maxLength={30} />
            </div>
          </div>

          <div>
            <label className={labelCls}>E-mailadres (optioneel)</label>
            <input type="email" value={p.email} onChange={(e) => p.setEmail(e.target.value)} className={inputCls} placeholder="naam@voorbeeld.nl" maxLength={150} />
          </div>
        </div>
      )}
    </div>
  );
};

const formatDateNl = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
};

export default AdminVerkoopWizardPage;

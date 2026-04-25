import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Lock, Loader2, Pencil, Plus, Save, X, Search, User, Building2, UserPlus, ShieldCheck, ShieldOff, AlertTriangle, Info } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { useMoneybird } from "@/hooks/useMoneybird";
import AddressAutocomplete from "@/components/admin/AddressAutocomplete";
import Stap6InruilDocument from "@/components/admin/verkoop/Stap6InruilDocument";
import Stap7FactuurMoneybird from "@/components/admin/verkoop/Stap7FactuurMoneybird";
import Stap8Betaling from "@/components/admin/verkoop/Stap8Betaling";
import Stap9InruilOpNaam from "@/components/admin/verkoop/Stap9InruilOpNaam";
import Stap10Vrijwaring from "@/components/admin/verkoop/Stap10Vrijwaring";
import Stap12Afsluiting from "@/components/admin/verkoop/Stap12Afsluiting";
import CancelVerkoopDialog from "@/components/admin/verkoop/CancelVerkoopDialog";
import { validateStap, getStapWarnings, type WizardState } from "@/lib/verkoopWizardValidation";

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
  | "tenaamstelling"
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
  { num: 10, key: "tenaamstelling", title: "Tenaamstelling", description: "Machtiging aanvragen en voertuig overschrijven via VWE" },
  { num: 11, key: "afsluiting", title: "Afsluiting", description: "Uitlevering en verkoop afronden" },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const isStepDone = (stap: number, completed: Record<number, boolean>) => completed[stap] === true;

const isStepBlocked = (stap: number, completed: Record<number, boolean>, inruil: boolean): boolean => {
  // Stap 6 (inruil document) en 9 (inruil op naam) volledig verbergen zonder inruil
  if ((stap === 6 || stap === 9) && !inruil) return true;
  // Stappen 6-11 vereisen 5
  if (stap >= 6 && stap <= 11 && !completed[5]) return true;
  // Stappen 9-11 vereisen 8 (betaling bevestigd)
  if (stap >= 9 && stap <= 11 && !completed[8]) return true;
  // Stap 10+ vereist 9 (inruil op naam) — alleen relevant bij inruil
  if (stap >= 10 && stap <= 11 && inruil && !completed[9]) return true;
  // Stap 11 (afsluiting) vereist 10 (tenaamstelling)
  if (stap === 11 && !completed[10]) return true;
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
  const [cancelOpen, setCancelOpen] = useState(false);
  const [activeStap, setActiveStap] = useState<number>(1);
  const [touchedSteps, setTouchedSteps] = useState<Set<number>>(new Set([1]));
  const [completed, setCompleted] = useState<Record<number, boolean>>({});

  // Mark step as touched whenever the user navigates to it
  useEffect(() => {
    setTouchedSteps((prev) => {
      if (prev.has(activeStap)) return prev;
      const n = new Set(prev);
      n.add(activeStap);
      return n;
    });
  }, [activeStap]);
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

  // Stap 4 state
  const [garantieType, setGarantieType] = useState<"geen" | "autotrust">("geen");
  const [garantiePakket, setGarantiePakket] = useState("");
  const [garantieLooptijd, setGarantieLooptijd] = useState<number | "">("");
  const [garantiePrijs, setGarantiePrijs] = useState<number | "">("");

  // Stap 5 state
  const [overeenkomstnummer, setOvereenkomstnummer] = useState<string>("");
  const [opmerkingen, setOpmerkingen] = useState<string>("");
  const [contractGetekend, setContractGetekend] = useState<boolean>(false);
  const [pdfGenereerd, setPdfGenereerd] = useState<boolean>(false);
  const [restBetaalwijze, setRestBetaalwijze] = useState<"cash" | "pin" | "ideal" | "overboeking" | "financiering">("overboeking");
  const [financieringMaatschappij, setFinancieringMaatschappij] = useState<string>("");
  const [betaalwijzeDetails, setBetaalwijzeDetails] = useState<Array<{ methode: "cash" | "pin" | "ideal" | "overboeking" | "financiering"; bedrag: number }>>([]);

  // Stap 6 state — Inruil document
  const [stap6DocType, setStap6DocType] = useState<"particulier" | "zakelijk">("particulier");
  const [inrVerkVoornaam, setInrVerkVoornaam] = useState("");
  const [inrVerkAchternaam, setInrVerkAchternaam] = useState("");
  const [inrVerkGeboortedatum, setInrVerkGeboortedatum] = useState("");
  const [inrVerkAdres, setInrVerkAdres] = useState("");
  const [inrVerkPostcode, setInrVerkPostcode] = useState("");
  const [inrVerkWoonplaats, setInrVerkWoonplaats] = useState("");
  const [inrVerkTelefoon, setInrVerkTelefoon] = useState("");
  const [inrContactpersoon, setInrContactpersoon] = useState("");
  const [inrBedrijfAdres, setInrBedrijfAdres] = useState("");
  const [inrBedrijfPostcode, setInrBedrijfPostcode] = useState("");
  const [inrBedrijfWoonplaats, setInrBedrijfWoonplaats] = useState("");
  const [inrBetaalwijze, setInrBetaalwijze] = useState<"verrekend" | "contant" | "overboeking" | "">("");
  const [inkoopverklaringId, setInkoopverklaringId] = useState<string | null>(null);

  // Stap 7 state — Factuur Moneybird
  const [factuurMbId, setFactuurMbId] = useState<string | null>(null);
  const [factuurMbUrl, setFactuurMbUrl] = useState<string | null>(null);
  const [factuurMbNummer, setFactuurMbNummer] = useState<string | null>(null);
  const [factuurDatum, setFactuurDatum] = useState<string | null>(null);
  const [factuurReferentie, setFactuurReferentie] = useState<string | null>(null);
  const [factuurEmailVerzondenOp, setFactuurEmailVerzondenOp] = useState<string | null>(null);
  const [factuurVerstuurd, setFactuurVerstuurd] = useState<boolean>(false);
  const [factuurEmail, setFactuurEmail] = useState<string | null>(null);

  // Stap 8 state — Betaling
  const [betalingDatum, setBetalingDatum] = useState<string | null>(null);
  const [betalingOpmerking, setBetalingOpmerking] = useState<string | null>(null);
  const [moneybirdPaymentId, setMoneybirdPaymentId] = useState<string | null>(null);
  const [betalingOntvangen, setBetalingOntvangen] = useState<boolean>(false);
  const [restbedragLater, setRestbedragLater] = useState<boolean>(false);
  const [restbedragVerwachteDatum, setRestbedragVerwachteDatum] = useState<string | null>(null);
  const [openstaandRestbedrag, setOpenstaandRestbedrag] = useState<number | null>(null);

  // Stap 9 state — Inruil op naam
  const [inruilOpNaam, setInruilOpNaam] = useState<boolean>(false);
  const [inruilOpNaamAt, setInruilOpNaamAt] = useState<string | null>(null);

  // Stap 10 state — Tenaamstelling (machtiging RDW + VWE)
  const [machtigingsnummer, setMachtigingsnummer] = useState<string | null>(null);
  const [machtigingDatum, setMachtigingDatum] = useState<string | null>(null);
  const [machtigingOntvangen, setMachtigingOntvangen] = useState<boolean>(false);
  const [tenaamstellingBevestigd, setTenaamstellingBevestigd] = useState<boolean>(false);
  const [tenaamstellingDatum, setTenaamstellingDatum] = useState<string | null>(null);

  // Stap 11 state — Uitlevering
  const [autoSchoongemaakt, setAutoSchoongemaakt] = useState<boolean>(false);
  const [apkGecommuniceerd, setApkGecommuniceerd] = useState<boolean>(false);
  const [sleutelsOverhandigd, setSleutelsOverhandigd] = useState<boolean>(false);
  const [sleutelsAantal, setSleutelsAantal] = useState<number | null>(null);
  const [gebrekenBesproken, setGebrekenBesproken] = useState<boolean>(false);
  const [gebrekenOmschrijving, setGebrekenOmschrijving] = useState<string | null>(null);
  const [tenaamstellingsbewijsMeegegeven, setTenaamstellingsbewijsMeegegeven] = useState<boolean>(false);
  const [uitleveringFotos, setUitleveringFotos] = useState<string[]>([]);
  const [uitleveringDatum, setUitleveringDatum] = useState<string | null>(null);
  const [uitleveringVoltooid, setUitleveringVoltooid] = useState<boolean>(false);

  // Lock body scroll — alleen de wizard content kolom scrollt
  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  // Auto-genereer overeenkomstnummer wanneer stap 5 voor het eerst actief is
  useEffect(() => {
    if (activeStap === 5 && !overeenkomstnummer && verkoopId) {
      const year = new Date().getFullYear();
      (async () => {
        const { count } = await supabase
          .from("verkopen")
          .select("id", { count: "exact", head: true })
          .not("overeenkomstnummer", "is", null);
        const nextNum = String((count || 0) + 1).padStart(3, "0");
        setOvereenkomstnummer(`PA-${year}-${nextNum}`);
      })();
    }
  }, [activeStap, verkoopId, overeenkomstnummer]);

  // Zonder inruil: stap 6 en 9 automatisch afronden
  useEffect(() => {
    if (!verkoopId || inruil) return;
    const updates: Record<string, any> = {};
    if (!completed[6]) updates.stap6_afgerond = true;
    if (!completed[9]) updates.stap9_afgerond = true;
    if (Object.keys(updates).length === 0) return;
    setCompleted((p) => ({ ...p, 6: true, 9: true }));
    saveCurrent(updates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verkoopId, inruil]);

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
        // Stap 4 hydration
        if (existing.garantie_type === "geen" || existing.garantie_type === "autotrust") {
          setGarantieType(existing.garantie_type);
        }
        setGarantiePakket(existing.garantie_pakket || "");
        setGarantieLooptijd(existing.garantie_looptijd ?? "");
        setGarantiePrijs(existing.garantie_prijs ?? "");
        // Stap 5 hydration
        setOvereenkomstnummer((existing as any).overeenkomstnummer || "");
        setOpmerkingen((existing as any).opmerkingen || "");
        setContractGetekend(!!existing.contract_getekend);
        const bw = (existing as any).betaalwijze;
        if (["cash", "pin", "ideal", "overboeking", "financiering"].includes(bw)) {
          setRestBetaalwijze(bw);
        }
        setFinancieringMaatschappij((existing as any).financiering_maatschappij || "");
        const det = (existing as any).betaalwijze_details;
        if (Array.isArray(det)) {
          setBetaalwijzeDetails(
            det
              .filter((d: any) => d && typeof d === "object")
              .map((d: any) => ({
                methode: ["cash", "pin", "ideal", "overboeking", "financiering"].includes(d.methode) ? d.methode : "overboeking",
                bedrag: Number(d.bedrag) || 0,
              }))
          );
        }
        // Stap 6 hydration
        const e: any = existing;
        if (e.inruil_type === "particulier" || e.inruil_type === "zakelijk") setStap6DocType(e.inruil_type);
        setInrVerkVoornaam(e.inruil_verkoper_voornaam || "");
        setInrVerkAchternaam(e.inruil_verkoper_achternaam || "");
        setInrVerkGeboortedatum(e.inruil_verkoper_geboortedatum || "");
        setInrVerkAdres(e.inruil_verkoper_adres || "");
        setInrVerkPostcode(e.inruil_verkoper_postcode || "");
        setInrVerkWoonplaats(e.inruil_verkoper_woonplaats || "");
        setInrVerkTelefoon(e.inruil_verkoper_telefoon || "");
        setInrContactpersoon(e.inruil_contactpersoon || "");
        if (["verrekend", "contant", "overboeking"].includes(e.inruil_betaalwijze)) setInrBetaalwijze(e.inruil_betaalwijze);
        setInkoopverklaringId(e.inruil_inkoopverklaring_id || null);
        // Stap 7 hydration — Factuur Moneybird
        setFactuurMbId((e.moneybird_factuur_id as string) || null);
        setFactuurMbUrl((e.moneybird_factuur_url as string) || null);
        setFactuurMbNummer((e.moneybird_factuur_nummer as string) || null);
        setFactuurDatum((e.factuurdatum as string) || null);
        setFactuurReferentie((e.factuur_referentie as string) || null);
        setFactuurEmailVerzondenOp((e.factuur_email_verzonden_op as string) || null);
        setFactuurVerstuurd(!!(e as any).factuur_verstuurd);
        setFactuurEmail(((e as any).factuur_email as string) || null);
        // Stap 8 hydration — Betaling
        setBetalingDatum((e.betaling_datum as string) || null);
        setBetalingOpmerking(((e as any).betaling_opmerking as string) || null);
        setMoneybirdPaymentId(((e as any).moneybird_payment_id as string) || null);
        setBetalingOntvangen(!!(e as any).betaling_ontvangen);
        setRestbedragLater(!!(e as any).restbedrag_later);
        setRestbedragVerwachteDatum(((e as any).restbedrag_verwachte_datum as string) || null);
        if ((e as any).restbedrag_later) {
          const r = (e as any).restbedrag;
          setOpenstaandRestbedrag(typeof r === "number" ? r : r ? Number(r) : null);
        }
        // Stap 9 hydration — Inruil op naam
        setInruilOpNaam(!!(e as any).inruil_op_naam);
        setInruilOpNaamAt(((e as any).inruil_op_naam_at as string) || null);
        // Stap 10 hydration — Tenaamstelling
        setMachtigingsnummer(((e as any).machtigingsnummer as string) || null);
        setMachtigingDatum(((e as any).machtiging_datum as string) || null);
        setMachtigingOntvangen(!!(e as any).machtiging_ontvangen);
        setTenaamstellingBevestigd(!!(e as any).tenaamstelling_bevestigd);
        setTenaamstellingDatum(((e as any).tenaamstelling_datum as string) || null);
        // Stap 11 hydration — Uitlevering
        setAutoSchoongemaakt(!!(e as any).auto_schoongemaakt);
        setApkGecommuniceerd(!!(e as any).apk_gecommuniceerd);
        setSleutelsOverhandigd(!!(e as any).sleutels_overhandigd);
        setSleutelsAantal(
          typeof (e as any).sleutels_aantal === "number" ? (e as any).sleutels_aantal : null,
        );
        setGebrekenBesproken(!!(e as any).gebreken_besproken);
        setGebrekenOmschrijving(((e as any).gebreken_omschrijving as string) || null);
        setTenaamstellingsbewijsMeegegeven(!!(e as any).tenaamstellingsbewijs_meegegeven);
        setUitleveringFotos(Array.isArray((e as any).uitlevering_fotos) ? (e as any).uitlevering_fotos : []);
        setUitleveringDatum(((e as any).uitlevering_datum as string) || null);
        setUitleveringVoltooid(!!(e as any).uitlevering_voltooid);
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
      garantie_type: garantieType,
      garantie_pakket: garantieType === "autotrust" ? (garantiePakket.trim() || null) : null,
      garantie_looptijd: garantieType === "autotrust" && garantieLooptijd !== "" ? Number(garantieLooptijd) : null,
      garantie_prijs: garantieType === "autotrust" && garantiePrijs !== "" ? Number(garantiePrijs) : 0,
      overeenkomstnummer: overeenkomstnummer.trim() || null,
      opmerkingen: opmerkingen.trim() || null,
      contract_getekend: contractGetekend,
      contract_getekend_datum: contractGetekend ? new Date().toISOString().slice(0, 10) : null,
      betaalwijze: restBetaalwijze,
      financiering: restBetaalwijze === "financiering" || betaalwijzeDetails.some(d => d.methode === "financiering"),
      financiering_maatschappij: (restBetaalwijze === "financiering" || betaalwijzeDetails.some(d => d.methode === "financiering"))
        ? (financieringMaatschappij.trim() || null) : null,
      betaalwijze_details: betaalwijzeDetails as any,
      // Stap 6 — inruil document
      inruil_type: inruil ? stap6DocType : null,
      inruil_verkoper_voornaam: inruil && stap6DocType === "particulier" ? (inrVerkVoornaam.trim() || null) : null,
      inruil_verkoper_achternaam: inruil && stap6DocType === "particulier" ? (inrVerkAchternaam.trim() || null) : null,
      inruil_verkoper_geboortedatum: inruil && stap6DocType === "particulier" && inrVerkGeboortedatum ? inrVerkGeboortedatum : null,
      inruil_verkoper_adres: inruil && stap6DocType === "particulier" ? (inrVerkAdres.trim() || null) : null,
      inruil_verkoper_postcode: inruil && stap6DocType === "particulier" ? (inrVerkPostcode.trim() || null) : null,
      inruil_verkoper_woonplaats: inruil && stap6DocType === "particulier" ? (inrVerkWoonplaats.trim() || null) : null,
      inruil_verkoper_telefoon: inruil && stap6DocType === "particulier" ? (inrVerkTelefoon.trim() || null) : null,
      inruil_contactpersoon: inruil && stap6DocType === "zakelijk" ? (inrContactpersoon.trim() || null) : null,
      inruil_betaalwijze: inruil && inrBetaalwijze ? inrBetaalwijze : null,
      inruil_inkoopverklaring_id: inkoopverklaringId,
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
  }, [verkoopId, activeStap, verkoopprijs, voertuigType, afleverkosten, leges, inruil, inruilKenteken, inruilMerk, inruilModel, inruilKm, inruilWaarde, inruilVerkoper, inruilBedrijfsnaam, inruilKvk, inruilBtw, afleverwijze, afleveradres, laterOphalen, leverdatum, aanbetalingBedrag, aanbetalingBetaalwijze, aanbetalingBankrekening, customerId, klantZakelijk, garantieType, garantiePakket, garantieLooptijd, garantiePrijs, overeenkomstnummer, opmerkingen, contractGetekend, restBetaalwijze, financieringMaatschappij, betaalwijzeDetails, stap6DocType, inrVerkVoornaam, inrVerkAchternaam, inrVerkGeboortedatum, inrVerkAdres, inrVerkPostcode, inrVerkWoonplaats, inrVerkTelefoon, inrContactpersoon, inrBetaalwijze, inkoopverklaringId]);

  const handleVolgende = async () => {
    // Centrale validatie eerst
    const errors = validateStap(activeStap, {
      verkoopprijs, voertuigType, kmStand, inruil, inruilKenteken, inruilMerk, inruilModel,
      inruilWaarde, inruilVerkoper, inruilBedrijfsnaam, inruilKvk,
      afleverwijze, leverdatum, afleveradres, aanbetalingBedrag, aanbetalingBetaalwijze,
      klantVoornaam, klantAchternaam, klantGeboortedatum, klantAdres, klantPostcode,
      klantWoonplaats, klantTelefoon, klantEmail, klantZakelijk, klantBedrijfsnaam, klantKvk,
      garantieType, garantiePakket, garantieLooptijd, garantiePrijs,
      pdfGenereerd, contractGetekend, restBetaalwijze, betaalwijzeDetails, restbedrag: restbedragGlobal,
      inrVerkVoornaam, inrVerkAchternaam, inrVerkAdres, inrBetaalwijze, inkoopverklaringId,
      factuurMbId, factuurVerstuurd,
    });
    if (errors.length > 0) {
      setShowErrorsForStap((s) => new Set(s).add(activeStap));
      // Scroll naar boven van content om foutenlijst te tonen
      const main = document.querySelector(".wizard-content");
      if (main) main.scrollTo({ top: 0, behavior: "smooth" });
      toast.error(`${errors.length} ontbrekend${errors.length === 1 ? "" : "e"} veld${errors.length === 1 ? "" : "en"}`);
      return;
    }

    // Stap 3: klant aanmaken/bijwerken + Moneybird sync
    if (activeStap === 3) {
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
      setShowErrorsForStap((s) => { const n = new Set(s); n.delete(activeStap); return n; });
      setCompleted((p) => ({ ...p, [activeStap]: true }));
      let next = activeStap + 1;
      const nextCompleted = { ...completed, [activeStap]: true };
      while (next <= 11 && isStepBlocked(next, nextCompleted, inruil)) next++;
      if (next <= 11) setActiveStap(next);
      return;
    }

    const ok = await saveCurrent({ [`stap${activeStap}_afgerond`]: true });
    if (!ok) return;
    setShowErrorsForStap((s) => { const n = new Set(s); n.delete(activeStap); return n; });
    setCompleted((p) => ({ ...p, [activeStap]: true }));
    // Volgende non-blocked stap zoeken
    let next = activeStap + 1;
    const nextCompleted = { ...completed, [activeStap]: true };
    while (next <= 11 && isStepBlocked(next, nextCompleted, inruil)) next++;
    if (next <= 11) setActiveStap(next);
    toast.success("Stap opgeslagen");
  };

  const handleVorige = () => {
    let prev = activeStap - 1;
    while (prev >= 1 && isStepBlocked(prev, completed, inruil)) prev--;
    if (prev >= 1) setActiveStap(prev);
  };

  const handleStepClick = (stap: number) => {
    if (isStepBlocked(stap, completed, inruil)) {
      if (completed[5]) {
        const missing: string[] = [];
        if (!completed[8]) missing.push("stap 8 (betaling bevestigen)");
        if (stap >= 10 && inruil && !completed[9]) missing.push("stap 9 (inruil op naam zetten)");
        if (stap === 11 && !completed[10]) missing.push("stap 10 (tenaamstelling)");
        if (missing.length > 0) {
          toast.error(`Rond eerst ${missing.join(" en ")} af.`);
        }
      }
      return;
    }
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
  const visibleSteps = STEPS.filter((s) => inruil || (s.num !== 6 && s.num !== 9));
  const currentDisplayNum = visibleSteps.findIndex((s) => s.num === activeStap) + 1;

  // ───────────────────────────────────────────────────────────
  // Centrale validatie
  // ───────────────────────────────────────────────────────────
  const verkoopprijsNum = verkoopprijs === "" ? 0 : Number(verkoopprijs);
  const afleverkostenNum = afleverkosten === "" ? 0 : Number(afleverkosten);
  const legesNum = leges === "" ? 0 : Number(leges);
  const garantiePrijsNum = garantieType === "autotrust" && garantiePrijs !== "" ? Number(garantiePrijs) : 0;
  const aanbetalingNum = aanbetalingBedrag === "" ? 0 : Number(aanbetalingBedrag);
  const restbedragGlobal = Math.max(
    0,
    verkoopprijsNum + afleverkostenNum + legesNum + garantiePrijsNum - aanbetalingNum,
  );

  const wizardState: WizardState = useMemo(
    () => ({
      verkoopprijs,
      voertuigType,
      kmStand,
      inruil,
      inruilKenteken,
      inruilMerk,
      inruilModel,
      inruilWaarde,
      inruilVerkoper,
      inruilBedrijfsnaam,
      inruilKvk,
      afleverwijze,
      leverdatum,
      afleveradres,
      aanbetalingBedrag,
      aanbetalingBetaalwijze,
      klantVoornaam,
      klantAchternaam,
      klantGeboortedatum,
      klantAdres,
      klantPostcode,
      klantWoonplaats,
      klantTelefoon,
      klantEmail,
      klantZakelijk,
      klantBedrijfsnaam,
      klantKvk,
      garantieType,
      garantiePakket,
      garantieLooptijd,
      garantiePrijs,
      pdfGenereerd,
      contractGetekend,
      restBetaalwijze,
      betaalwijzeDetails,
      restbedrag: restbedragGlobal,
      inrVerkVoornaam,
      inrVerkAchternaam,
      inrVerkAdres,
      inrBetaalwijze,
      inkoopverklaringId,
      factuurMbId,
      factuurVerstuurd,
    }),
    [
      verkoopprijs, voertuigType, kmStand, inruil, inruilKenteken, inruilMerk, inruilModel,
      inruilWaarde, inruilVerkoper, inruilBedrijfsnaam, inruilKvk,
      afleverwijze, leverdatum, afleveradres, aanbetalingBedrag, aanbetalingBetaalwijze,
      klantVoornaam, klantAchternaam, klantGeboortedatum, klantAdres, klantPostcode,
      klantWoonplaats, klantTelefoon, klantEmail, klantZakelijk, klantBedrijfsnaam, klantKvk,
      garantieType, garantiePakket, garantieLooptijd, garantiePrijs,
      pdfGenereerd, contractGetekend, restBetaalwijze, betaalwijzeDetails, restbedragGlobal,
      inrVerkVoornaam, inrVerkAchternaam, inrVerkAdres, inrBetaalwijze, inkoopverklaringId,
      factuurMbId, factuurVerstuurd,
    ],
  );

  // Welke stappen tonen hun foutenlijst (na klik op Volgende)
  const [showErrorsForStap, setShowErrorsForStap] = useState<Set<number>>(new Set());

  const currentErrors = useMemo(() => validateStap(activeStap, wizardState), [activeStap, wizardState]);
  const currentWarnings = useMemo(() => getStapWarnings(activeStap, wizardState), [activeStap, wizardState]);
  const showErrors = showErrorsForStap.has(activeStap) && currentErrors.length > 0;

  // Bereken voor sidebar: per stap of er ontbrekende info is
  const stepHasIssues = (stapNum: number): boolean => {
    if (stapNum === 6 && !inruil) return false; // n.v.t.
    return validateStap(stapNum, wizardState).length > 0;
  };


  if (loadingVehicles || !vehicle) {
    return (
      <div className="admin-theme min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────

  return (
    <div className="admin-theme h-screen overflow-hidden bg-background text-foreground">
      {/* Fixed sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-[280px] z-10 border-r border-border bg-sidebar flex flex-col">
          <div className="p-5 border-b border-sidebar-border">
            <img src={logo} alt="Platin Automotive" className="h-7 w-auto" />
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {STEPS.filter((s) => inruil || (s.num !== 6 && s.num !== 9)).map((step, visibleIdx) => {
              const displayNum = visibleIdx + 1;
              const blocked = isStepBlocked(step.num, completed, inruil);
              const done = isStepDone(step.num, completed);
              const active = step.num === activeStap;
              const hasIssues = !blocked && stepHasIssues(step.num);
              // Slot tonen bij prerequisite-blokkade (betaling/inruil-op-naam/tenaamstelling)
              const lockedByPrereq =
                blocked &&
                step.num >= 9 &&
                step.num <= 11 &&
                !!completed[5] &&
                ((!completed[8]) ||
                  (step.num >= 10 && inruil && !completed[9]) ||
                  (step.num === 11 && !completed[10]));

              return (
                <button
                  key={step.key}
                  onClick={() => handleStepClick(step.num)}
                  className={[
                    "w-full text-left px-3 py-2.5 flex items-center gap-3 rounded-[10px] transition-colors",
                    active && !blocked ? "bg-sidebar-accent text-sidebar-accent-foreground" : "",
                    !active && !blocked ? "hover:bg-sidebar-accent/50 text-sidebar-foreground" : "",
                    blocked && !lockedByPrereq ? "opacity-40 cursor-not-allowed text-sidebar-foreground" : "",
                    lockedByPrereq ? "opacity-60 cursor-not-allowed text-sidebar-foreground hover:bg-sidebar-accent/30" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "w-6 h-6 shrink-0 flex items-center justify-center rounded-full text-[11px] font-medium border",
                      done && !hasIssues ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400" : "",
                      hasIssues && !active ? "bg-amber-500/15 border-amber-500/40 text-amber-400" : "",
                      hasIssues && active ? "bg-amber-500/20 border-amber-500/60 text-amber-300" : "",
                      !done && !hasIssues && active ? "bg-foreground/10 border-foreground/40 text-foreground" : "",
                      !done && !hasIssues && !active && !lockedByPrereq ? "border-sidebar-border text-sidebar-foreground/60" : "",
                      lockedByPrereq ? "border-sidebar-border text-sidebar-foreground/60" : "",
                    ].join(" ")}
                  >
                    {hasIssues ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : done ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : lockedByPrereq ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      displayNum
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-medium truncate">{step.title}</span>
                    {hasIssues && (
                      <span className="block text-[10px] text-amber-400/80 mt-0.5">Ontbrekende info</span>
                    )}
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
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="mt-3 text-[11px] text-muted-foreground hover:text-destructive transition-colors underline-offset-2 hover:underline"
            >
              Verkoop annuleren
            </button>
          </div>
        </aside>

        <CancelVerkoopDialog
          open={cancelOpen}
          onOpenChange={setCancelOpen}
          verkoopId={verkoopId}
          vehicleId={vehicle.id}
          kenteken={vehicle.kenteken || ""}
          merk={vehicle.merk || ""}
          model={vehicle.model || ""}
          bouwjaar={vehicle.bouwjaar}
        />

      {/* Hoofdinhoud */}
      <main className="ml-[280px] h-screen overflow-y-scroll wizard-content" style={{ scrollbarGutter: "stable" }}>
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
                Stap {currentDisplayNum > 0 ? currentDisplayNum : currentStep.num} van {visibleSteps.length}
              </div>
              <h1 className="text-2xl font-semibold text-foreground mb-1">{currentStep.title}</h1>
              <p className="text-sm text-muted-foreground">{currentStep.description}</p>
            </div>

            {/* Foutenlijst — verschijnt na klik op Volgende met ontbrekende info */}
            {showErrors && (
              <div className="mb-6 rounded-[10px] border border-destructive/40 bg-destructive/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-destructive mb-2">
                      Let op — de volgende informatie ontbreekt:
                    </div>
                    <ul className="space-y-1">
                      {currentErrors.map((err, i) => (
                        <li key={i} className="text-[13px] text-destructive/90 flex items-start gap-2">
                          <span className="text-destructive/60">•</span>
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Optionele waarschuwingen */}
            {currentWarnings.length > 0 && (
              <div className="mb-6 rounded-[10px] border border-amber-500/40 bg-amber-500/10 p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <ul className="space-y-1 flex-1">
                    {currentWarnings.map((w, i) => (
                      <li key={i} className="text-[13px] text-amber-200">{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

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

            {activeStap === 4 && (
              <Stap4Garantie
                garantieType={garantieType}
                setGarantieType={setGarantieType}
                pakket={garantiePakket}
                setPakket={setGarantiePakket}
                looptijd={garantieLooptijd}
                setLooptijd={setGarantieLooptijd}
                prijs={garantiePrijs}
                setPrijs={setGarantiePrijs}
              />
            )}

            {activeStap === 5 && (
              <Stap5Koopovereenkomst
                vehicle={vehicle}
                kmStand={kmStand === "" ? (vehicle.kilometerstand || 0) : Number(kmStand)}
                voertuigType={voertuigType}
                verkoopprijs={verkoopprijs === "" ? 0 : Number(verkoopprijs)}
                afleverkosten={afleverkosten === "" ? 0 : Number(afleverkosten)}
                leges={leges === "" ? 0 : Number(leges)}
                aanbetalingBedrag={aanbetalingBedrag === "" ? 0 : Number(aanbetalingBedrag)}
                aanbetalingBetaalwijze={aanbetalingBetaalwijze}
                leverdatum={leverdatum}
                klant={{
                  voornaam: klantVoornaam,
                  achternaam: klantAchternaam,
                  adres: klantAdres,
                  postcode: klantPostcode,
                  woonplaats: klantWoonplaats,
                  land: klantLand,
                  telefoon: klantTelefoon,
                  email: klantEmail,
                  geboortedatum: klantGeboortedatum,
                  zakelijk: klantZakelijk,
                  bedrijfsnaam: klantBedrijfsnaam,
                  kvk: klantKvk,
                  btw: klantBtw,
                }}
                garantie={{
                  type: garantieType,
                  pakket: garantiePakket,
                  looptijd: garantieLooptijd === "" ? 0 : Number(garantieLooptijd),
                  prijs: garantiePrijs === "" ? 0 : Number(garantiePrijs),
                }}
                inruil={inruil ? {
                  kenteken: inruilKenteken,
                  merk: inruilMerk,
                  model: inruilModel,
                  km: inruilKm === "" ? 0 : Number(inruilKm),
                  waarde: inruilWaarde === "" ? 0 : Number(inruilWaarde),
                } : null}
                overeenkomstnummer={overeenkomstnummer}
                setOvereenkomstnummer={setOvereenkomstnummer}
                opmerkingen={opmerkingen}
                setOpmerkingen={setOpmerkingen}
                contractGetekend={contractGetekend}
                setContractGetekend={(v) => {
                  setContractGetekend(v);
                  // Direct opslaan zodat status persistent is
                  if (verkoopId) {
                    supabase.from("verkopen").update({
                      contract_getekend: v,
                      contract_getekend_datum: v ? new Date().toISOString().slice(0, 10) : null,
                    }).eq("id", verkoopId);
                  }
                }}
                pdfGenereerd={pdfGenereerd}
                setPdfGenereerd={setPdfGenereerd}
                restBetaalwijze={restBetaalwijze}
                setRestBetaalwijze={setRestBetaalwijze}
                financieringMaatschappij={financieringMaatschappij}
                setFinancieringMaatschappij={setFinancieringMaatschappij}
                betaalwijzeDetails={betaalwijzeDetails}
                setBetaalwijzeDetails={setBetaalwijzeDetails}
                onAutoSave={() => saveCurrent()}
                verkoopId={verkoopId}
              />
            )}

            {activeStap === 6 && (
              <Stap6InruilDocument
                verkoopId={verkoopId}
                inruil={inruil}
                inruilKenteken={inruilKenteken}
                inruilMerk={inruilMerk}
                inruilModel={inruilModel}
                inruilKm={inruilKm}
                inruilWaarde={inruilWaarde}
                inruilType={inruilVerkoper}
                docType={stap6DocType}
                setDocType={setStap6DocType}
                verkoperVoornaam={inrVerkVoornaam} setVerkoperVoornaam={setInrVerkVoornaam}
                verkoperAchternaam={inrVerkAchternaam} setVerkoperAchternaam={setInrVerkAchternaam}
                verkoperGeboortedatum={inrVerkGeboortedatum} setVerkoperGeboortedatum={setInrVerkGeboortedatum}
                verkoperAdres={inrVerkAdres} setVerkoperAdres={setInrVerkAdres}
                verkoperPostcode={inrVerkPostcode} setVerkoperPostcode={setInrVerkPostcode}
                verkoperWoonplaats={inrVerkWoonplaats} setVerkoperWoonplaats={setInrVerkWoonplaats}
                verkoperTelefoon={inrVerkTelefoon} setVerkoperTelefoon={setInrVerkTelefoon}
                bedrijfsnaam={inruilBedrijfsnaam} setBedrijfsnaam={setInruilBedrijfsnaam}
                kvk={inruilKvk} setKvk={setInruilKvk}
                btw={inruilBtw} setBtw={setInruilBtw}
                contactpersoon={inrContactpersoon} setContactpersoon={setInrContactpersoon}
                bedrijfAdres={inrBedrijfAdres} setBedrijfAdres={setInrBedrijfAdres}
                bedrijfPostcode={inrBedrijfPostcode} setBedrijfPostcode={setInrBedrijfPostcode}
                bedrijfWoonplaats={inrBedrijfWoonplaats} setBedrijfWoonplaats={setInrBedrijfWoonplaats}
                inruilBetaalwijze={inrBetaalwijze}
                setInruilBetaalwijze={setInrBetaalwijze}
                inkoopverklaringId={inkoopverklaringId}
                setInkoopverklaringId={setInkoopverklaringId}
                klantVoornaam={klantVoornaam}
                klantAchternaam={klantAchternaam}
                klantGeboortedatum={klantGeboortedatum}
                klantAdres={klantAdres}
                klantPostcode={klantPostcode}
                klantWoonplaats={klantWoonplaats}
                klantTelefoon={klantTelefoon}
                onAutoSave={async () => { await saveCurrent(); }}
              />
            )}

            {activeStap === 7 && (
              <Stap7FactuurMoneybird
                verkoopId={verkoopId}
                voertuigKenteken={vehicle?.kenteken || ""}
                voertuigMerk={vehicle?.merk || ""}
                voertuigModel={vehicle?.model || ""}
                voertuigBouwjaar={vehicle?.bouwjaar ?? null}
                voertuigChassisnummer={vehicle?.chassisNummer ?? null}
                voertuigKilometerstand={vehicle?.kilometerstand ?? null}
                voertuigType={voertuigType}
                verkoopprijs={verkoopprijs}
                afleverkosten={afleverkosten}
                leges={leges}
                aanbetalingBedrag={aanbetalingBedrag}
                garantieType={garantieType}
                garantiePakket={garantiePakket}
                garantieLooptijd={garantieLooptijd}
                garantiePrijs={garantiePrijs}
                klantVoornaam={klantVoornaam}
                klantAchternaam={klantAchternaam}
                klantBedrijfsnaam={klantBedrijfsnaam}
                klantZakelijk={klantZakelijk}
                klantAdres={klantAdres}
                klantPostcode={klantPostcode}
                klantWoonplaats={klantWoonplaats}
                klantLand={klantLand}
                klantTelefoon={klantTelefoon}
                klantEmail={klantEmail}
                klantKvk={klantKvk}
                klantBtw={klantBtw}
                customerId={customerId}
                initialFactuurId={factuurMbId}
                initialFactuurUrl={factuurMbUrl}
                initialFactuurNummer={factuurMbNummer}
                initialFactuurdatum={factuurDatum}
                initialReferentie={factuurReferentie}
                initialEmailVerzondenOp={factuurEmailVerzondenOp}
                initialFactuurVerstuurd={factuurVerstuurd}
                initialFactuurEmail={factuurEmail}
                onSaved={async (extra) => {
                  if (extra.moneybird_factuur_id !== undefined) setFactuurMbId(extra.moneybird_factuur_id);
                  if (extra.moneybird_factuur_url !== undefined) setFactuurMbUrl(extra.moneybird_factuur_url);
                  if (extra.moneybird_factuur_nummer !== undefined) setFactuurMbNummer(extra.moneybird_factuur_nummer);
                  if (extra.factuurdatum !== undefined) setFactuurDatum(extra.factuurdatum);
                  if (extra.factuur_referentie !== undefined) setFactuurReferentie(extra.factuur_referentie);
                  if (extra.factuur_email_verzonden_op !== undefined) setFactuurEmailVerzondenOp(extra.factuur_email_verzonden_op);
                  if (extra.factuur_verstuurd !== undefined) setFactuurVerstuurd(!!extra.factuur_verstuurd);
                  if (extra.factuur_email !== undefined) setFactuurEmail(extra.factuur_email);
                  await saveCurrent(extra);
                }}
              />
            )}

            {activeStap === 8 && (
              <Stap8Betaling
                verkoopId={verkoopId}
                voertuigKenteken={vehicle?.kenteken || ""}
                voertuigMerk={vehicle?.merk || ""}
                voertuigModel={vehicle?.model || ""}
                voertuigBouwjaar={vehicle?.bouwjaar ?? null}
                klantVoornaam={klantVoornaam}
                klantAchternaam={klantAchternaam}
                klantAdres={klantAdres}
                klantPostcode={klantPostcode}
                klantWoonplaats={klantWoonplaats}
                factuurMbId={factuurMbId}
                factuurMbNummer={factuurMbNummer}
                factuurTotaal={
                  verkoopprijsNum + afleverkostenNum + legesNum + garantiePrijsNum
                }
                aanbetalingBedrag={aanbetalingNum}
                initialBetaaldatum={betalingDatum}
                initialBetaalwijze={restBetaalwijze}
                initialBetaalwijzeDetails={betaalwijzeDetails as any}
                initialBetalingOpmerking={betalingOpmerking}
                initialMoneybirdPaymentId={moneybirdPaymentId}
                initialBetalingOntvangen={betalingOntvangen}
                initialRestbedragLater={restbedragLater}
                initialRestbedragVerwachteDatum={restbedragVerwachteDatum}
                initialOpenstaandRestbedrag={openstaandRestbedrag}
                onSaved={async (extra) => {
                  if (extra.betaling_datum !== undefined) setBetalingDatum(extra.betaling_datum);
                  if (extra.betaling_opmerking !== undefined)
                    setBetalingOpmerking(extra.betaling_opmerking);
                  if (extra.moneybird_payment_id !== undefined)
                    setMoneybirdPaymentId(extra.moneybird_payment_id);
                  if (extra.betaling_ontvangen !== undefined)
                    setBetalingOntvangen(!!extra.betaling_ontvangen);
                  if (extra.betaalwijze_details !== undefined)
                    setBetaalwijzeDetails(extra.betaalwijze_details || []);
                  if (extra.restbedrag_later !== undefined)
                    setRestbedragLater(!!extra.restbedrag_later);
                  if (extra.restbedrag_verwachte_datum !== undefined)
                    setRestbedragVerwachteDatum(extra.restbedrag_verwachte_datum);
                  if (extra.restbedrag !== undefined)
                    setOpenstaandRestbedrag(
                      typeof extra.restbedrag === "number" ? extra.restbedrag : null,
                    );
                  if (extra.stap8_afgerond !== undefined) {
                    setCompleted((p) => ({ ...p, 8: !!extra.stap8_afgerond }));
                  }
                  await saveCurrent(extra);
                }}
              />
            )}

            {activeStap === 9 && (
              <Stap9InruilOpNaam
                inruil={inruil}
                inruilKenteken={inruilKenteken}
                inruilMerk={inruilMerk}
                inruilModel={inruilModel}
                inruilKm={inruilKm}
                inruilWaarde={inruilWaarde}
                initialInruilOpNaam={inruilOpNaam}
                initialInruilOpNaamAt={inruilOpNaamAt}
                onSaved={async (extra) => {
                  if (extra.inruil_op_naam !== undefined)
                    setInruilOpNaam(!!extra.inruil_op_naam);
                  if (extra.inruil_op_naam_at !== undefined)
                    setInruilOpNaamAt(extra.inruil_op_naam_at);
                  if (extra.stap9_afgerond !== undefined)
                    setCompleted((p) => ({ ...p, 9: !!extra.stap9_afgerond }));
                  await saveCurrent(extra);
                }}
              />
            )}

            {activeStap === 10 && (
              <Stap10Vrijwaring
                voertuigKenteken={vehicle?.kenteken || ""}
                voertuigMerk={vehicle?.merk || ""}
                voertuigModel={vehicle?.model || ""}
                voertuigBouwjaar={vehicle?.bouwjaar || null}
                initialMachtigingsnummer={machtigingsnummer}
                initialMachtigingDatum={machtigingDatum}
                initialMachtigingOntvangen={machtigingOntvangen}
                initialTenaamstellingBevestigd={tenaamstellingBevestigd}
                initialTenaamstellingDatum={tenaamstellingDatum}
                onSaved={async (extra) => {
                  if (extra.machtigingsnummer !== undefined)
                    setMachtigingsnummer(extra.machtigingsnummer);
                  if (extra.machtiging_datum !== undefined)
                    setMachtigingDatum(extra.machtiging_datum);
                  if (extra.machtiging_ontvangen !== undefined)
                    setMachtigingOntvangen(!!extra.machtiging_ontvangen);
                  if (extra.tenaamstelling_bevestigd !== undefined)
                    setTenaamstellingBevestigd(!!extra.tenaamstelling_bevestigd);
                  if (extra.tenaamstelling_datum !== undefined)
                    setTenaamstellingDatum(extra.tenaamstelling_datum);
                  if (extra.stap10_afgerond !== undefined)
                    setCompleted((p) => ({ ...p, 10: !!extra.stap10_afgerond }));
                  await saveCurrent(extra);
                }}
              />
            )}

            {activeStap === 11 && (
              <Stap12Afsluiting
                verkoopId={verkoopId}
                vehicleId={vehicleId}
                completed={completed}
                inruil={inruil}
                voertuigKenteken={vehicle?.kenteken || null}
                voertuigMerk={vehicle?.merk || null}
                voertuigModel={vehicle?.model || null}
                voertuigApkVervaldatum={(vehicle as any)?.apkVervaldatum || null}
                afleverwijze={afleverwijze}
                aanbetalingBedrag={aanbetalingBedrag}
                klantVoornaam={klantVoornaam}
                klantAchternaam={klantAchternaam}
                klantTelefoon={klantTelefoon}
                garantieType={garantieType}
                contractGetekend={contractGetekend}
                factuurMbNummer={factuurMbNummer}
                factuurVerstuurd={factuurVerstuurd}
                ontvangenBedrag={typeof restbedragGlobal === "number" ? restbedragGlobal - (openstaandRestbedrag ?? 0) : null}
                restbedragLater={restbedragLater}
                restbedragBedrag={openstaandRestbedrag}
                machtigingsnummer={machtigingsnummer}
                machtigingDatum={machtigingDatum}
                initialUitleveringDatum={uitleveringDatum}
                initialApkGecommuniceerd={apkGecommuniceerd}
                initialGebrekenBesproken={gebrekenBesproken}
                initialGebrekenOmschrijving={gebrekenOmschrijving}
                initialTenaamstellingsbewijsMeegegeven={tenaamstellingsbewijsMeegegeven}
                onUitleveringChange={async (extra) => {
                  if (extra.uitlevering_datum !== undefined) setUitleveringDatum(extra.uitlevering_datum);
                  if (extra.apk_gecommuniceerd !== undefined) setApkGecommuniceerd(!!extra.apk_gecommuniceerd);
                  if (extra.gebreken_besproken !== undefined) setGebrekenBesproken(!!extra.gebreken_besproken);
                  if (extra.gebreken_omschrijving !== undefined) setGebrekenOmschrijving(extra.gebreken_omschrijving);
                  if (extra.tenaamstellingsbewijs_meegegeven !== undefined)
                    setTenaamstellingsbewijsMeegegeven(!!extra.tenaamstellingsbewijs_meegegeven);
                  await saveCurrent(extra);
                }}
                onNavigateToStap={(s) => handleStepClick(s)}
              />
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
        {activeStap < 11 ? (
          <button
            onClick={handleVolgende}
            disabled={saving}
            className="px-5 py-2.5 text-sm bg-foreground text-background rounded-[10px] hover:bg-foreground/90 disabled:opacity-50 transition-colors font-medium"
          >
            Volgende
          </button>
        ) : (
          <div />
        )}
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
                  <input autoComplete="off"
                    value={edit.merk}
                    onChange={(e) => setEdit({ ...edit, merk: e.target.value })}
                    className={inputCls}
                    placeholder="Merk"
                  />
                  <input autoComplete="off"
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
                <input autoComplete="off"
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
                <input autoComplete="off"
                  value={edit.kleur}
                  onChange={(e) => setEdit({ ...edit, kleur: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>

            <div>
              <label className={fieldLabel}>Brandstof</label>
              <Field display={v.brandstof ? brandstofLabels[v.brandstof as keyof typeof brandstofLabels] : "-"}>
                <select autoComplete="off"
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
                <input autoComplete="off"
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
                <input autoComplete="off"
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
                <input autoComplete="off"
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
              <input autoComplete="off"
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
          <input autoComplete="off"
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
            <input autoComplete="off"
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
            <input autoComplete="off"
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
                  <input autoComplete="off"
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
                <input autoComplete="off"
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
                <input autoComplete="off" value={p.inruilMerk} onChange={(e) => p.setInruilMerk(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Model inruil</label>
                <input autoComplete="off" value={p.inruilModel} onChange={(e) => p.setInruilModel(e.target.value)} className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Inruilwaarde (€)</label>
                <input autoComplete="off"
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
                    <input autoComplete="off" value={p.inruilBedrijfsnaam} onChange={(e) => p.setInruilBedrijfsnaam(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>KVK-nummer</label>
                    <input autoComplete="off" value={p.inruilKvk} onChange={(e) => p.setInruilKvk(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>BTW-nummer</label>
                    <input autoComplete="off" value={p.inruilBtw} onChange={(e) => p.setInruilBtw(e.target.value)} className={inputCls} />
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
  const [inruilOpBewijs, setInruilOpBewijs] = useState(false);
  const [inruilBewKenteken, setInruilBewKenteken] = useState("");
  const [inruilBewMerkModel, setInruilBewMerkModel] = useState("");
  const [inruilBewWaarde, setInruilBewWaarde] = useState<number | "">("");
  const aanbetaling = p.aanbetalingBedrag === "" ? 0 : Number(p.aanbetalingBedrag);
  const inruilWaardeNum = inruilOpBewijs && inruilBewWaarde !== "" ? Number(inruilBewWaarde) : 0;
  const restbedrag = Math.max(0, (p.verkoopprijs || 0) - aanbetaling - inruilWaardeNum);
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
    if (inruilOpBewijs && (inruilBewWaarde === "" || Number(inruilBewWaarde) <= 0)) {
      toast.error("Vul de inruilwaarde in");
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
      inruil: inruilOpBewijs
        ? {
            merk: inruilBewMerkModel.split(" ")[0] || inruilBewMerkModel,
            model: inruilBewMerkModel.split(" ").slice(1).join(" "),
            kenteken: inruilBewKenteken || undefined,
            waarde: Number(inruilBewWaarde) || 0,
          }
        : undefined,
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
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-full border-0 outline-none ring-0 shadow-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
                        day_selected:
                          "!bg-emerald-600 !text-white !rounded-full !border-0 !outline-none !ring-0 !shadow-none hover:!bg-emerald-600 hover:!text-white focus:!bg-emerald-600 focus:!text-white focus:!outline-none focus:!ring-0 focus-visible:!outline-none focus-visible:!ring-0",
                        day_today: "bg-muted text-foreground font-semibold rounded-full border-0 outline-none ring-0 aria-selected:bg-emerald-600 aria-selected:text-white",
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {p.afleverwijze === "aflevering" && (
                <div>
                  <label className={labelCls}>Afleveradres *</label>
                  <AddressAutocomplete
                    value={p.afleveradres}
                    onChange={p.setAfleveradres}
                    onAddressSelected={(d) => {
                      const full = [d.adres, [d.postcode, d.woonplaats].filter(Boolean).join(" ")]
                        .filter(Boolean)
                        .join(", ");
                      p.setAfleveradres(full || d.adres);
                    }}
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
                  <input autoComplete="off"
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

                {/* Optionele inruil op aanbetalingsbewijs */}
                <div className="border-t border-border pt-4 space-y-3">
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <span className="text-sm text-foreground">Inruil vermelden op aanbetalingsbewijs</span>
                    <Switch
                      checked={inruilOpBewijs}
                      onCheckedChange={setInruilOpBewijs}
                      className="data-[state=checked]:bg-foreground data-[state=unchecked]:bg-muted [&>span]:data-[state=checked]:bg-background [&>span]:data-[state=unchecked]:bg-foreground/60"
                    />
                  </label>

                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      inruilOpBewijs ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div>
                          <label className={labelCls}>Kenteken inruil</label>
                          <input
                            autoComplete="off"
                            type="text"
                            value={inruilBewKenteken}
                            onChange={(e) => setInruilBewKenteken(e.target.value.toUpperCase())}
                            className={inputCls}
                            placeholder="XX-000-X"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Merk + model</label>
                          <input
                            autoComplete="off"
                            type="text"
                            value={inruilBewMerkModel}
                            onChange={(e) => setInruilBewMerkModel(e.target.value)}
                            className={inputCls}
                            placeholder="Bijv. Volkswagen Golf"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Inruilwaarde (€) *</label>
                          <input
                            autoComplete="off"
                            type="number"
                            inputMode="numeric"
                            value={inruilBewWaarde}
                            onChange={(e) =>
                              setInruilBewWaarde(e.target.value === "" ? "" : Number(e.target.value))
                            }
                            className={inputCls}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
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

const InlineKlantTypeToggle = ({ zakelijk, onChange }: { zakelijk: boolean; onChange: (z: boolean) => void }) => (
  <div className="flex items-center justify-end gap-3">
    <span className={cn("text-xs transition-colors", !zakelijk ? "text-foreground font-medium" : "text-muted-foreground")}>
      Particulier
    </span>
    <Switch
      checked={zakelijk}
      onCheckedChange={onChange}
      aria-label="Klanttype"
      className="data-[state=checked]:bg-foreground data-[state=unchecked]:bg-muted [&>span]:data-[state=checked]:bg-background [&>span]:data-[state=unchecked]:bg-foreground/60"
    />
    <span className={cn("text-xs transition-colors", zakelijk ? "text-foreground font-medium" : "text-muted-foreground")}>
      Zakelijk
    </span>
  </div>
);

// === Geboortedatum: 3 losse invoervelden DD / MM / JJJJ ===
const GeboortedatumInputs = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  // value is "YYYY-MM-DD" (or "")
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  const initialDay = parts ? parts[3] : "";
  const initialMonth = parts ? parts[2] : "";
  const initialYear = parts ? parts[1] : "";

  const [dag, setDag] = useState(initialDay);
  const [maand, setMaand] = useState(initialMonth);
  const [jaar, setJaar] = useState(initialYear);
  const [error, setError] = useState<string | null>(null);

  const maandRef = useRef<HTMLInputElement>(null);
  const jaarRef = useRef<HTMLInputElement>(null);

  // Keep local state in sync if parent value changes externally (e.g. selecting existing klant)
  useEffect(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    setDag(m ? m[3] : "");
    setMaand(m ? m[2] : "");
    setJaar(m ? m[1] : "");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const validateAndEmit = (d: string, mo: string, y: string) => {
    if (!d && !mo && !y) {
      setError(null);
      onChange("");
      return;
    }
    if (d.length < 1 || mo.length < 1 || y.length < 4) {
      setError(null);
      onChange("");
      return;
    }
    const di = parseInt(d, 10);
    const mi = parseInt(mo, 10);
    const yi = parseInt(y, 10);
    if (isNaN(di) || di < 1 || di > 31) {
      setError("Dag moet tussen 1 en 31 zijn");
      onChange("");
      return;
    }
    if (isNaN(mi) || mi < 1 || mi > 12) {
      setError("Maand moet tussen 1 en 12 zijn");
      onChange("");
      return;
    }
    const currentYear = new Date().getFullYear();
    if (isNaN(yi) || yi < 1900 || yi > currentYear) {
      setError(`Jaar moet tussen 1900 en ${currentYear} zijn`);
      onChange("");
      return;
    }
    // Check real calendar validity
    const dt = new Date(yi, mi - 1, di);
    if (dt.getFullYear() !== yi || dt.getMonth() !== mi - 1 || dt.getDate() !== di) {
      setError("Ongeldige datum");
      onChange("");
      return;
    }
    setError(null);
    onChange(`${String(yi).padStart(4, "0")}-${String(mi).padStart(2, "0")}-${String(di).padStart(2, "0")}`);
  };

  const handleDag = (v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 2);
    setDag(clean);
    validateAndEmit(clean, maand, jaar);
    if (clean.length === 2) maandRef.current?.focus();
  };
  const handleMaand = (v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 2);
    setMaand(clean);
    validateAndEmit(dag, clean, jaar);
    if (clean.length === 2) jaarRef.current?.focus();
  };
  const handleJaar = (v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 4);
    setJaar(clean);
    validateAndEmit(dag, maand, clean);
  };

  const baseCls =
    "h-10 rounded-[10px] border-[0.5px] border-input bg-transparent px-3 py-2 text-sm text-center tabular-nums focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors";

  return (
    <div>
      <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2 items-center">
        <input autoComplete="off"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="DD"
          value={dag}
          onChange={(e) => handleDag(e.target.value)}
          maxLength={2}
          className={cn(baseCls, error && "border-destructive")}
          aria-label="Dag"
        />
        <input autoComplete="off"
          ref={maandRef}
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="MM"
          value={maand}
          onChange={(e) => handleMaand(e.target.value)}
          maxLength={2}
          className={cn(baseCls, error && "border-destructive")}
          aria-label="Maand"
        />
        <input autoComplete="off"
          ref={jaarRef}
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="JJJJ"
          value={jaar}
          onChange={(e) => handleJaar(e.target.value)}
          maxLength={4}
          className={cn(baseCls, error && "border-destructive")}
          aria-label="Jaar"
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
};

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

  const klantTypeKey = p.zakelijk ? "zakelijk" : "particulier";

  return (
    <div className="space-y-6">
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
        <div className="w-full rounded-[14px] border border-border bg-card p-6 space-y-4">
          <InlineKlantTypeToggle zakelijk={p.zakelijk} onChange={switchKlantType} />
          <div>
            <label className={labelCls}>Zoek klant</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input autoComplete="off"
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
        <div className="w-full rounded-[14px] border border-border bg-card p-6 space-y-5">
          <InlineKlantTypeToggle zakelijk={p.zakelijk} onChange={switchKlantType} />

          {/* Zakelijk: bedrijfsgegevens bovenaan — smooth height + fade + slide */}
          <div
            className={cn(
              "grid transition-all duration-[250ms] ease-out",
              p.zakelijk ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none",
            )}
          >
            <div className="overflow-hidden min-h-0">
              <div
                className={cn(
                  "space-y-5 transition-all duration-[250ms] ease-out",
                  p.zakelijk ? "translate-y-0" : "-translate-y-2",
                )}
              >
                <div>
                  <label className={labelCls}>Bedrijfsnaam *</label>
                  <input autoComplete="off" type="text" value={p.bedrijfsnaam} onChange={(e) => p.setBedrijfsnaam(e.target.value)} className={inputCls} maxLength={150} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>KVK-nummer *</label>
                    <input autoComplete="off" type="text" value={p.kvk} onChange={(e) => p.setKvk(e.target.value)} className={inputCls} maxLength={20} />
                  </div>
                  <div>
                    <label className={labelCls}>BTW-nummer (optioneel)</label>
                    <input autoComplete="off" type="text" value={p.btw} onChange={(e) => p.setBtw(e.target.value)} className={inputCls} maxLength={30} />
                  </div>
                </div>
                <div className="border-t border-border pt-5">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Contactpersoon</div>
                </div>
              </div>
            </div>
          </div>

          <div key={`names-${klantTypeKey}`} className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
            <div>
              <label className={labelCls}>{p.zakelijk ? "Voornaam contactpersoon *" : "Voornaam *"}</label>
              <input autoComplete="off" type="text" value={p.voornaam} onChange={(e) => p.setVoornaam(e.target.value)} className={inputCls} maxLength={80} />
            </div>
            <div>
              <label className={labelCls}>{p.zakelijk ? "Achternaam contactpersoon *" : "Achternaam *"}</label>
              <input autoComplete="off" type="text" value={p.achternaam} onChange={(e) => p.setAchternaam(e.target.value)} className={inputCls} maxLength={80} />
            </div>
          </div>

          {/* Geboortedatum alleen voor particulier — smooth height + fade + slide */}
          <div
            className={cn(
              "grid transition-all duration-[250ms] ease-out",
              !p.zakelijk ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none",
            )}
          >
            <div className="overflow-hidden min-h-0">
              <div
                className={cn(
                  "transition-all duration-[250ms] ease-out",
                  !p.zakelijk ? "translate-y-0" : "-translate-y-2",
                )}
              >
                <label className={labelCls}>Geboortedatum *</label>
                <GeboortedatumInputs value={p.geboortedatum} onChange={p.setGeboortedatum} />
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Adres *</label>
            <AddressAutocomplete
              value={p.adres}
              onChange={p.setAdres}
              onAddressSelected={(d) => {
                p.setAdres(d.adres);
                if (d.postcode) p.setPostcode(d.postcode);
                if (d.woonplaats) p.setWoonplaats(d.woonplaats);
                if (d.land) p.setLand(d.land);
              }}
              className={inputCls}
              placeholder="Straat 1"
              maxLength={150}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Postcode *</label>
              <input autoComplete="off" type="text" value={p.postcode} onChange={(e) => p.setPostcode(e.target.value)} className={inputCls} placeholder="1234 AB" maxLength={10} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Woonplaats *</label>
              <input autoComplete="off" type="text" value={p.woonplaats} onChange={(e) => p.setWoonplaats(e.target.value)} className={inputCls} maxLength={100} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Land</label>
              <input autoComplete="off" type="text" value={p.land} onChange={(e) => p.setLand(e.target.value)} className={inputCls} maxLength={60} />
            </div>
            <div>
              <label className={labelCls}>Telefoonnummer *</label>
              <input autoComplete="off" type="tel" value={p.telefoon} onChange={(e) => p.setTelefoon(e.target.value)} className={inputCls} placeholder="06-12345678" maxLength={30} />
            </div>
          </div>

          <div>
            <label className={labelCls}>E-mailadres (optioneel)</label>
            <input autoComplete="off" type="email" value={p.email} onChange={(e) => p.setEmail(e.target.value)} className={inputCls} placeholder="naam@voorbeeld.nl" maxLength={150} />
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

// ─────────────────────────────────────────────────────────────
// Stap 4 — Garantie
// ─────────────────────────────────────────────────────────────
interface Stap4Props {
  garantieType: "geen" | "autotrust";
  setGarantieType: (v: "geen" | "autotrust") => void;
  pakket: string;
  setPakket: (v: string) => void;
  looptijd: number | "";
  setLooptijd: (v: number | "") => void;
  prijs: number | "";
  setPrijs: (v: number | "") => void;
}

const Stap4Garantie = ({
  garantieType, setGarantieType,
  pakket, setPakket,
  looptijd, setLooptijd,
  prijs, setPrijs,
}: Stap4Props) => {
  const looptijdOpties = [3, 6, 12, 24];

  return (
    <div className="space-y-6">
      {/* Twee garantie kaarten */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Geen garantie */}
        <button
          type="button"
          onClick={() => setGarantieType("geen")}
          className={cn(
            "text-left rounded-[14px] border bg-card p-6 transition-all hover:border-emerald-500/50",
            garantieType === "geen"
              ? "border-emerald-500 ring-2 ring-emerald-500/20"
              : "border-border"
          )}
        >
          <div className="flex items-start gap-4">
            <div className={cn(
              "h-11 w-11 rounded-full flex items-center justify-center shrink-0 transition-colors",
              garantieType === "geen" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
            )}>
              <ShieldOff className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-base font-semibold text-foreground">Geen garantie</h3>
                {garantieType === "geen" && (
                  <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Voertuig wordt verkocht in huidige staat zonder garantie
              </p>
            </div>
          </div>
        </button>

        {/* Autotrust */}
        <button
          type="button"
          onClick={() => setGarantieType("autotrust")}
          className={cn(
            "text-left rounded-[14px] border bg-card p-6 transition-all hover:border-emerald-500/50",
            garantieType === "autotrust"
              ? "border-emerald-500 ring-2 ring-emerald-500/20"
              : "border-border"
          )}
        >
          <div className="flex items-start gap-4">
            <div className={cn(
              "h-11 w-11 rounded-full flex items-center justify-center shrink-0 transition-colors",
              garantieType === "autotrust" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
            )}>
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-base font-semibold text-foreground">Autotrust garantiepakket</h3>
                {garantieType === "autotrust" && (
                  <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Garantie via Autotrust — klant regelt claims rechtstreeks met Autotrust
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Geen garantie info */}
      {garantieType === "geen" && (
        <div className="rounded-[12px] border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-foreground">
                De volgende tekst wordt automatisch vermeld op de koopovereenkomst en factuur:
              </p>
              <p className="text-muted-foreground italic leading-relaxed">
                "Het voertuig wordt verkocht zonder garantie, in de staat zoals bezichtigd en geaccepteerd door koper. Koper doet uitdrukkelijk afstand van elk recht op non-conformiteit als bedoeld in artikel 7:17 BW."
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Autotrust velden */}
      {garantieType === "autotrust" && (
        <div className="rounded-[14px] border border-border bg-card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Pakket naam <span className="text-destructive">*</span>
            </label>
            <input autoComplete="off"
              type="text"
              value={pakket}
              onChange={(e) => setPakket(e.target.value)}
              placeholder="bijv. Autotrust Basis"
              className="w-full h-10 px-3 text-sm bg-background border border-input rounded-[10px] focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Looptijd in maanden <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {looptijdOpties.map((opt) => {
                const active = Number(looptijd) === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setLooptijd(opt)}
                    className={cn(
                      "px-4 h-10 rounded-[10px] border text-sm font-medium transition-colors",
                      active
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                        : "border-border bg-background text-foreground hover:bg-accent"
                    )}
                  >
                    {opt} mnd
                  </button>
                );
              })}
              <input autoComplete="off"
                type="number"
                min={1}
                value={looptijd === "" ? "" : looptijd}
                onChange={(e) => setLooptijd(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Anders…"
                className="w-28 h-10 px-3 text-sm bg-background border border-input rounded-[10px] focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Garantieprijs <span className="text-destructive">*</span>
            </label>
            <div className="relative max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
              <input autoComplete="off"
                type="number"
                min={0}
                step="0.01"
                value={prijs === "" ? "" : prijs}
                onChange={(e) => setPrijs(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0,00"
                className="w-full h-10 pl-7 pr-3 text-sm bg-background border border-input rounded-[10px] focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Info tekst */}
          <div className="rounded-[12px] border border-amber-500/30 bg-amber-500/5 p-4 mt-2">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">
                  De volgende tekst wordt automatisch vermeld op de koopovereenkomst en factuur:
                </p>
                <p className="text-muted-foreground italic leading-relaxed">
                  "Voertuig wordt verkocht met <span className="not-italic font-medium text-foreground">{pakket || "[pakket]"}</span> garantie, looptijd <span className="not-italic font-medium text-foreground">{looptijd || "[X]"}</span> maanden via Autotrust. Garantie wordt rechtstreeks afgehandeld tussen koper en Autotrust. Verkoper is na overdracht niet aansprakelijk voor garantieclaims."
                </p>
              </div>
            </div>
          </div>

          {/* Reminder */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            Vergeet niet het garantiepakket aan te vragen via het Autotrust / VWE portaal
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Stap 5 — Koopovereenkomst
// ─────────────────────────────────────────────────────────────
interface Stap5Props {
  vehicle: any;
  kmStand: number;
  voertuigType: "marge" | "btw" | "consignatie";
  verkoopprijs: number;
  afleverkosten: number;
  leges: number;
  aanbetalingBedrag: number;
  aanbetalingBetaalwijze: Betaalwijze;
  leverdatum: string;
  klant: {
    voornaam: string;
    achternaam: string;
    adres: string;
    postcode: string;
    woonplaats: string;
    land: string;
    telefoon: string;
    email: string;
    geboortedatum: string;
    zakelijk: boolean;
    bedrijfsnaam: string;
    kvk: string;
    btw: string;
  };
  garantie: {
    type: "geen" | "autotrust";
    pakket: string;
    looptijd: number;
    prijs: number;
  };
  inruil: { kenteken: string; merk: string; model: string; km: number; waarde: number } | null;
  overeenkomstnummer: string;
  setOvereenkomstnummer: (v: string) => void;
  opmerkingen: string;
  setOpmerkingen: (v: string) => void;
  contractGetekend: boolean;
  setContractGetekend: (v: boolean) => void;
  pdfGenereerd: boolean;
  setPdfGenereerd: (v: boolean) => void;
  restBetaalwijze: "cash" | "pin" | "ideal" | "overboeking" | "financiering";
  setRestBetaalwijze: (v: "cash" | "pin" | "ideal" | "overboeking" | "financiering") => void;
  financieringMaatschappij: string;
  setFinancieringMaatschappij: (v: string) => void;
  betaalwijzeDetails: Array<{ methode: "cash" | "pin" | "ideal" | "overboeking" | "financiering"; bedrag: number }>;
  setBetaalwijzeDetails: (v: Array<{ methode: "cash" | "pin" | "ideal" | "overboeking" | "financiering"; bedrag: number }>) => void;
  onAutoSave: () => Promise<any>;
  verkoopId: string | null;
}

const Stap5Koopovereenkomst: React.FC<Stap5Props> = (p) => {
  const fmtEur = (n: number) =>
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n || 0);

  const garantieKosten = p.garantie.type === "autotrust" ? (p.garantie.prijs || 0) : 0;
  const totaal = p.verkoopprijs + (p.afleverkosten || 0) + (p.leges || 0) + garantieKosten;
  const restbedrag = totaal - (p.aanbetalingBedrag || 0);

  const klantNaam = p.klant.zakelijk && p.klant.bedrijfsnaam
    ? p.klant.bedrijfsnaam
    : `${p.klant.voornaam} ${p.klant.achternaam}`.trim();

  const voertuigTypeLabel = p.voertuigType === "marge" ? "Marge" : p.voertuigType === "btw" ? "BTW" : "Consignatie";

  const handleGenereerPdf = async () => {
    try {
      // Eerst opslaan
      await p.onAutoSave();

      const { buildKoopovereenkomstDoc } = await import("@/lib/koopovereenkomstPdf");
      const doc = await buildKoopovereenkomstDoc({
        voertuig: {
          merk: p.vehicle.merk,
          model: p.vehicle.model,
          bouwjaar: p.vehicle.bouwjaar || 0,
          kenteken: p.vehicle.kenteken || "",
          kilometerstand: p.kmStand,
          vin: p.vehicle.chassisNummer || p.vehicle.chassis_nummer,
          kleur: p.vehicle.kleur,
          brandstof: p.vehicle.brandstof,
          uitvoering: p.vehicle.uitvoering,
          apkTot: (p.vehicle as any).apkTot || (p.vehicle as any).apk_tot,
          nap: (p.vehicle as any).nap !== false,
          btwType: voertuigTypeLabel,
        },
        klant: {
          voornaam: p.klant.voornaam,
          achternaam: p.klant.achternaam,
          adres: p.klant.adres,
          postcode: p.klant.postcode,
          woonplaats: p.klant.woonplaats,
          telefoon: p.klant.telefoon,
          email: p.klant.email,
          geboortedatum: p.klant.geboortedatum,
          bedrijfsnaam: (p.klant as any).bedrijfsnaam,
          kvk: (p.klant as any).kvk,
          isZakelijk: !!(p.klant as any).zakelijk,
        },
        financieel: {
          verkoopprijs: p.verkoopprijs,
          afleverkosten: p.afleverkosten,
          leges: p.leges,
          betaalwijze: (p.betaalwijzeDetails && p.betaalwijzeDetails.length > 0)
            ? p.betaalwijzeDetails.map(d => {
                const labels: Record<string, string> = { cash: "Cash", pin: "Pin", ideal: "iDEAL", overboeking: "Overboeking", financiering: "Financiering" };
                return `${labels[d.methode] || d.methode}: ${new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(d.bedrag || 0)}`;
              }).join(" + ") + (p.betaalwijzeDetails.some(d => d.methode === "financiering") && p.financieringMaatschappij ? ` (${p.financieringMaatschappij})` : "")
            : p.restBetaalwijze + (p.restBetaalwijze === "financiering" && p.financieringMaatschappij ? ` (${p.financieringMaatschappij})` : ""),
          betalingen: (p.betaalwijzeDetails && p.betaalwijzeDetails.length > 0)
            ? p.betaalwijzeDetails.map(d => ({
                methode: d.methode,
                bedrag: d.bedrag || 0,
                maatschappij: d.methode === "financiering" ? p.financieringMaatschappij : undefined,
              }))
            : undefined,
          aanbetalingActief: (p.aanbetalingBedrag || 0) > 0,
          aanbetalingsbedrag: p.aanbetalingBedrag,
          restbedrag,
        },
        garantie: {
          type: p.garantie.type,
          maanden: p.garantie.looptijd,
          kosten: garantieKosten,
          betaler: garantieKosten > 0 ? "klant" : "geen",
        },
        overeenkomstnummer: p.overeenkomstnummer,
        wwftBevestigd: false,
        datum: new Date().toISOString().slice(0, 10),
        plaats: "Roelofarendsveen",
        afleverDatum: p.leverdatum,
        opmerkingen: p.opmerkingen,
      });

      // Open PDF in nieuw tabblad
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      // Upload naar storage en koppel aan verkoop_documenten
      if (p.verkoopId) {
        try {
          const fileName = `koopovereenkomst-${p.overeenkomstnummer || p.verkoopId}.pdf`;
          const path = `verkopen/${p.verkoopId}/${fileName}`;
          const { error: upErr } = await supabase.storage
            .from("vehicle-documents")
            .upload(path, blob, { contentType: "application/pdf", upsert: true });
          if (!upErr) {
            const { data: signed } = await supabase.storage
              .from("vehicle-documents")
              .createSignedUrl(path, 60 * 60 * 24 * 365);
            await supabase.from("verkoop_documenten").insert({
              verkoop_id: p.verkoopId,
              type: "koopovereenkomst",
              pdf_url: signed?.signedUrl || path,
            });
          }
        } catch (err) {
          console.warn("Upload koopovereenkomst mislukt", err);
        }
      }

      p.setPdfGenereerd(true);
      toast.success("Koopovereenkomst gegenereerd");
    } catch (err) {
      console.error(err);
      toast.error("Genereren van PDF mislukt");
    }
  };

  return (
    <div className="space-y-6">
      {/* Sectie 1 — Samenvatting */}
      <div>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">Samenvatting</div>
        {/* Rij 1: Voertuig 60% + Klant 40% */}
        <div className="grid md:grid-cols-5 gap-4 mb-4">
          {/* Voertuig — 3/5 */}
          <div className="md:col-span-3 rounded-[14px] border border-border bg-card px-6 py-5">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.1em] mb-4">Voertuig</div>
            <div className="space-y-3">
              <div className="text-[14px] font-semibold text-foreground">{p.vehicle.merk} {p.vehicle.model}</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <div className="text-[11px] text-muted-foreground mb-0.5">Bouwjaar</div>
                  <div className="text-[14px] text-foreground">{p.vehicle.bouwjaar || "—"}</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground mb-0.5">Kenteken</div>
                  <div className="text-[14px] font-mono uppercase text-foreground">{p.vehicle.kenteken || "—"}</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground mb-0.5">Kilometerstand</div>
                  <div className="text-[14px] text-foreground">{p.kmStand.toLocaleString("nl-NL")} km</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground mb-0.5">Voertuigtype</div>
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-foreground/10 text-foreground text-[12px] font-medium">{voertuigTypeLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Klant — 2/5 */}
          <div className="md:col-span-2 rounded-[14px] border border-border bg-card px-6 py-5">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.1em] mb-4">Klant</div>
            <div className="space-y-3">
              <div className="text-[14px] font-semibold text-foreground">{klantNaam || "—"}</div>
              {p.klant.zakelijk && p.klant.bedrijfsnaam && (
                <div>
                  <div className="text-[11px] text-muted-foreground mb-0.5">Contactpersoon</div>
                  <div className="text-[14px] text-foreground">{p.klant.voornaam} {p.klant.achternaam}</div>
                </div>
              )}
              <div>
                <div className="text-[11px] text-muted-foreground mb-0.5">Adres</div>
                <div className="text-[14px] text-foreground">{p.klant.adres || "—"}</div>
                <div className="text-[14px] text-foreground">{p.klant.postcode} {p.klant.woonplaats}</div>
              </div>
              {p.klant.zakelijk ? (
                <div>
                  <div className="text-[11px] text-muted-foreground mb-0.5">KVK-nummer</div>
                  <div className="text-[14px] text-foreground">{p.klant.kvk || "—"}</div>
                </div>
              ) : (
                <div>
                  <div className="text-[11px] text-muted-foreground mb-0.5">Geboortedatum</div>
                  <div className="text-[14px] text-foreground">{p.klant.geboortedatum ? new Date(p.klant.geboortedatum).toLocaleDateString("nl-NL") : "—"}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rij 2: Financieel — volle breedte */}
        <div className="rounded-[14px] border border-border bg-card px-6 py-5">
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.1em] mb-4">Financieel</div>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
            <div className="space-y-2.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Verkoopprijs</span>
                <span className="text-[14px] text-foreground">{fmtEur(p.verkoopprijs)}</span>
              </div>
              {p.afleverkosten > 0 && (
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Afleverkosten</span>
                  <span className="text-[14px] text-foreground">{fmtEur(p.afleverkosten)}</span>
                </div>
              )}
              {p.leges > 0 && (
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Leges</span>
                  <span className="text-[14px] text-foreground">{fmtEur(p.leges)}</span>
                </div>
              )}
              {garantieKosten > 0 && (
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Garantie</span>
                  <span className="text-[14px] text-foreground">{fmtEur(garantieKosten)}</span>
                </div>
              )}
              {(p.aanbetalingBedrag || 0) > 0 && (
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Aanbetaling</span>
                  <span className="text-[14px] text-foreground">- {fmtEur(p.aanbetalingBedrag)}</span>
                </div>
              )}
              <div className="border-t border-border pt-2.5 mt-1 flex justify-between items-baseline">
                <span className="text-[12px] font-semibold text-foreground uppercase tracking-wide">Restbedrag</span>
                <span className="text-[16px] font-semibold text-foreground">{fmtEur(restbedrag)}</span>
              </div>
              <div className="pt-1 text-[12px] text-muted-foreground">
                Garantie: {p.garantie.type === "geen" ? "Geen" : `${p.garantie.pakket || "Autotrust"} — ${p.garantie.looptijd || 0} mnd`}
              </div>
            </div>

            {/* Betaalwijze restbedrag — meerdere methodes mogelijk */}
            {(() => {
              const methodeLabels: Record<string, string> = {
                cash: "Cash", pin: "Pin", ideal: "iDEAL", overboeking: "Overboeking", financiering: "Financiering",
              };
              const totaalIngevuld = p.betaalwijzeDetails.reduce((s, d) => s + (Number(d.bedrag) || 0), 0);
              const verschil = +(restbedrag - totaalIngevuld).toFixed(2);
              const klopt = Math.abs(verschil) < 0.01 && p.betaalwijzeDetails.length > 0;
              const heeftFinanciering = p.betaalwijzeDetails.some((d) => d.methode === "financiering");

              const updateRow = (idx: number, patch: Partial<{ methode: typeof p.betaalwijzeDetails[number]["methode"]; bedrag: number }>) => {
                const next = p.betaalwijzeDetails.map((r, i) => (i === idx ? { ...r, ...patch } : r));
                p.setBetaalwijzeDetails(next);
              };
              const removeRow = (idx: number) => p.setBetaalwijzeDetails(p.betaalwijzeDetails.filter((_, i) => i !== idx));
              const addRow = () => {
                const nogToeTeWijzen = Math.max(0, +(restbedrag - totaalIngevuld).toFixed(2));
                p.setBetaalwijzeDetails([
                  ...p.betaalwijzeDetails,
                  { methode: "overboeking", bedrag: nogToeTeWijzen },
                ]);
              };

              return (
                <div className="space-y-3">
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Betaalwijze restbedrag</div>

                  {p.betaalwijzeDetails.length === 0 && (
                    <div className="text-[12px] text-muted-foreground italic">
                      Nog geen betaalwijze toegevoegd. Klik op "+ Betaalwijze toevoegen".
                    </div>
                  )}

                  <div className="space-y-2">
                    {p.betaalwijzeDetails.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <select
                          autoComplete="off"
                          value={row.methode}
                          onChange={(e) => updateRow(idx, { methode: e.target.value as any })}
                          className={cn(inputCls, "flex-1 max-w-[180px]")}
                        >
                          {Object.entries(methodeLabels).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                        <div className="relative flex-1 max-w-[200px]">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[13px]">€</span>
                          <input
                            autoComplete="off"
                            type="number"
                            step="0.01"
                            min="0"
                            value={row.bedrag === 0 ? "" : row.bedrag}
                            onChange={(e) => updateRow(idx, { bedrag: e.target.value === "" ? 0 : Number(e.target.value) })}
                            placeholder="0,00"
                            className={cn(inputCls, "pl-7")}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRow(idx)}
                          className="h-9 w-9 rounded-[10px] border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors flex items-center justify-center"
                          aria-label="Verwijder regel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addRow}
                    className="text-[12px] font-medium text-foreground hover:text-foreground/70 transition-colors inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Betaalwijze toevoegen
                  </button>

                  {p.betaalwijzeDetails.length > 0 && (
                    <div className="pt-2 space-y-1 border-t border-border/50">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-muted-foreground">Totaal ingevuld</span>
                        <span className="font-medium text-foreground">{fmtEur(totaalIngevuld)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-muted-foreground">Restbedrag nog toe te wijzen</span>
                        <span className={cn("font-medium", klopt ? "text-emerald-500" : Math.abs(verschil) > 0.01 ? "text-destructive" : "text-foreground")}>
                          {fmtEur(verschil)}
                        </span>
                      </div>
                      {klopt && (
                        <div className="flex items-center gap-1.5 text-[12px] text-emerald-500 pt-1">
                          <Check className="w-3.5 h-3.5" /> Totaal klopt met restbedrag
                        </div>
                      )}
                      {!klopt && p.betaalwijzeDetails.length > 0 && Math.abs(verschil) >= 0.01 && (
                        <div className="text-[12px] text-destructive pt-1">
                          {verschil > 0 ? `Nog ${fmtEur(verschil)} toe te wijzen` : `${fmtEur(Math.abs(verschil))} te veel ingevuld`}
                        </div>
                      )}
                    </div>
                  )}

                  {heeftFinanciering && (
                    <div className="pt-2">
                      <label className={labelCls}>Financieringsmaatschappij (optioneel)</label>
                      <input
                        autoComplete="off"
                        type="text"
                        value={p.financieringMaatschappij}
                        onChange={(e) => p.setFinancieringMaatschappij(e.target.value)}
                        placeholder="Bijv. Santander, Hiltermann, ..."
                        className={inputCls}
                      />
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>


      {/* Sectie 2 — Extra opties */}
      <div className="rounded-[14px] border border-border bg-card p-6 space-y-4">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Extra</div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Overeenkomstnummer</label>
            <input autoComplete="off"
              type="text"
              value={p.overeenkomstnummer}
              onChange={(e) => p.setOvereenkomstnummer(e.target.value)}
              placeholder="PA-2026-001"
              className={`${inputCls} font-mono`}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Opmerkingen / bijzonderheden (optioneel)</label>
          <textarea autoComplete="off"
            value={p.opmerkingen}
            onChange={(e) => p.setOpmerkingen(e.target.value)}
            rows={3}
            placeholder="Vermeld bijzonderheden die op de koopovereenkomst moeten verschijnen…"
            className={`${inputCls} resize-y min-h-[80px]`}
          />
        </div>
      </div>

      {/* Sectie 3 — Genereren */}
      <div className="rounded-[14px] border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-sm font-medium text-foreground mb-1">Koopovereenkomst genereren</div>
            <p className="text-xs text-muted-foreground max-w-md">
              Genereer een professionele PDF op basis van bovenstaande gegevens. De overeenkomst opent in een nieuw tabblad om te printen.
            </p>
          </div>
          <button
            onClick={handleGenereerPdf}
            className="inline-flex items-center gap-2 px-5 py-3 bg-foreground text-background rounded-[10px] hover:bg-foreground/90 transition-colors text-sm font-medium"
          >
            <FileText className="w-4 h-4" />
            Koopovereenkomst genereren (PDF)
          </button>
        </div>
        {p.pdfGenereerd && (
          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
            <Check className="w-4 h-4" />
            PDF is gegenereerd en geopend in nieuw tabblad
          </div>
        )}
      </div>

      {/* Sectie 4 — Bevestiging */}
      <div className={cn(
        "rounded-[14px] border p-6 transition-colors",
        p.contractGetekend ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-card"
      )}>
        <label className="flex items-start gap-4 cursor-pointer">
          <div className="pt-0.5">
            <Switch
              checked={p.contractGetekend}
              onCheckedChange={p.setContractGetekend}
            />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">
              Koopovereenkomst is uitgeprint en door beide partijen ondertekend
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Stap 6 en verder zijn pas beschikbaar zodra deze bevestiging is aangevinkt.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};

export default AdminVerkoopWizardPage;

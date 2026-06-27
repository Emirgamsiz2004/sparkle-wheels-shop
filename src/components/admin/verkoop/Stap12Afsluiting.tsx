import { useEffect, useMemo, useState } from "react";
import { Check, AlertCircle, MessageCircle, Lock, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SummaryStep {
  num: number;
  title: string;
  detail: string;
  done: boolean;
  visible: boolean;
}

export interface Stap12AfsluitingProps {
  verkoopId: string | null;
  vehicleId: string | null | undefined;
  completed: Record<number, boolean>;
  inruil: boolean;

  voertuigKenteken?: string | null;
  voertuigMerk?: string | null;
  voertuigModel?: string | null;
  voertuigApkVervaldatum?: string | null;

  afleverwijze?: string | null;
  aanbetalingBedrag?: number | "" | null;

  klantVoornaam?: string;
  klantAchternaam?: string;
  klantTelefoon?: string;

  garantieType?: string | null;
  contractGetekend?: boolean;

  factuurMbNummer?: string | null;
  factuurVerstuurd?: boolean;

  ontvangenBedrag?: number | null;
  restbedragLater?: boolean;
  restbedragBedrag?: number | null;

  machtigingsnummer?: string | null;
  machtigingDatum?: string | null;

  // Uitlevering (verplaatst naar deze stap)
  initialUitleveringDatum?: string | null;
  initialApkGecommuniceerd?: boolean;
  initialGebrekenBesproken?: boolean;
  initialGebrekenOmschrijving?: string | null;
  initialTenaamstellingsbewijsMeegegeven?: boolean;
  onUitleveringChange?: (extra: Record<string, any>) => void | Promise<void>;

  onNavigateToStap: (stap: number) => void;
}

// ISO -> "yyyy-MM-ddTHH:mm" voor <input type="datetime-local">
const isoToLocalInput = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const localInputToIso = (local: string): string | null => {
  if (!local) return null;
  const d = new Date(local);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

const Stap12Afsluiting: React.FC<Stap12AfsluitingProps> = (p) => {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  // Uitlevering local state — standaard nu indien leeg
  const [uitleveringDatum, setUitleveringDatum] = useState<string>(
    isoToLocalInput(p.initialUitleveringDatum) || isoToLocalInput(new Date().toISOString()),
  );
  const [apkGecommuniceerd, setApkGecommuniceerd] = useState<boolean>(!!p.initialApkGecommuniceerd);
  const [gebrekenBesproken, setGebrekenBesproken] = useState<boolean>(!!p.initialGebrekenBesproken);
  const [gebrekenOmschrijving, setGebrekenOmschrijving] = useState<string>(p.initialGebrekenOmschrijving || "");
  const [tenaamstellingsbewijsMeegegeven, setTenaamstellingsbewijsMeegegeven] = useState<boolean>(
    !!p.initialTenaamstellingsbewijsMeegegeven,
  );

  // Init uitlevering_datum naar nu in de DB als nog niet gezet
  useEffect(() => {
    if (!p.initialUitleveringDatum) {
      p.onUitleveringChange?.({ uitlevering_datum: localInputToIso(uitleveringDatum) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const merkModel = `${p.voertuigMerk || ""} ${p.voertuigModel || ""}`.trim();
  const aanbetalingNum = typeof p.aanbetalingBedrag === "number" ? p.aanbetalingBedrag : 0;

  const summary: SummaryStep[] = useMemo(() => {
    return [
      {
        num: 1,
        title: "Voertuig",
        detail: [p.voertuigKenteken, merkModel].filter(Boolean).join(" — ") || "—",
        done: !!p.completed[1],
        visible: true,
      },
      {
        num: 2,
        title: "Aflevering & aanbetaling",
        detail:
          (p.afleverwijze || "—") +
          (aanbetalingNum > 0 ? ` · aanbetaling €${aanbetalingNum.toLocaleString("nl-NL")}` : ""),
        done: !!p.completed[2],
        visible: true,
      },
      {
        num: 3,
        title: "Klantgegevens",
        detail: `${p.klantVoornaam || ""} ${p.klantAchternaam || ""}`.trim() || "—",
        done: !!p.completed[3],
        visible: true,
      },
      {
        num: 4,
        title: "Garantie",
        detail: p.garantieType === "autotrust" ? "AutoTrust" : p.garantieType === "huis" ? "Platin Huisgarantie · 3 mnd" : "Geen garantie",
        done: !!p.completed[4],
        visible: true,
      },
      {
        num: 5,
        title: "Koopovereenkomst",
        detail: p.contractGetekend ? "Getekend" : "Niet getekend",
        done: !!p.completed[5],
        visible: true,
      },
      {
        num: 6,
        title: "Inruil document",
        detail: p.inruil ? "Inruil overeenkomst" : "—",
        done: !!p.completed[6],
        visible: p.inruil,
      },
      {
        num: 7,
        title: "Factuur",
        detail:
          (p.factuurMbNummer ? `Nr. ${p.factuurMbNummer}` : "—") +
          ` · ${p.factuurVerstuurd ? "verzonden" : "concept"}`,
        done: !!p.completed[7],
        visible: true,
      },
      {
        num: 8,
        title: "Betaling",
        detail:
          (typeof p.ontvangenBedrag === "number"
            ? `Ontvangen €${p.ontvangenBedrag.toLocaleString("nl-NL")}`
            : "—") +
          (p.restbedragLater && p.restbedragBedrag
            ? ` · restbedrag €${p.restbedragBedrag.toLocaleString("nl-NL")}`
            : ""),
        done: !!p.completed[8],
        visible: true,
      },
      {
        num: 12,
        title: "AutoTrust aanvraag",
        detail: p.completed[12] ? "Aangevraagd" : "Nog aanvragen",
        done: !!p.completed[12],
        visible: p.garantieType === "autotrust",
      },
      {
        num: 9,
        title: "Inruil op naam",
        detail: p.inruil ? "Inruil overgenomen" : "—",
        done: !!p.completed[9],
        visible: p.inruil,
      },
      {
        num: 10,
        title: "Tenaamstelling",
        detail:
          [p.machtigingsnummer ? `Nr. ${p.machtigingsnummer}` : null, p.machtigingDatum || null]
            .filter(Boolean)
            .join(" · ") || "—",
        done: !!p.completed[10],
        visible: true,
      },
    ];
  }, [p, merkModel, aanbetalingNum]);

  const visibleSteps = summary.filter((s) => s.visible);
  const openItems = visibleSteps.filter((s) => !s.done);
  const allDone = openItems.length === 0;

  const voornaam = (p.klantVoornaam || "").trim() || "klant";
  const merkModelText = merkModel || "nieuwe auto";
  const waMessage = `Beste ${voornaam}, hartelijk bedankt voor uw aankoop bij Platin Automotive. We hopen dat u veel rijplezier beleeft aan uw ${merkModelText}. Bent u tevreden? We zouden het heel fijn vinden als u een review wilt achterlaten - dat helpt ons enorm. https://g.page/r/CT1_sFLfuDgAEBM/review Heeft u vragen, dan staan we altijd voor u klaar. Met vriendelijke groet, Platin Automotive`;
  const rawPhone = (p.klantTelefoon || "").replace(/[^\d]/g, "").replace(/^0/, "");
  const waPhone = rawPhone ? `31${rawPhone}` : "";
  // WhatsApp Business: gebruik Android intent met package com.whatsapp.w4b,
  // val terug op api.whatsapp.com (opent WA Business als dat de standaard app is).
  const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
  const waUrl = waPhone
    ? isAndroid
      ? `intent://send?phone=${waPhone}&text=${encodeURIComponent(waMessage)}#Intent;scheme=whatsapp;package=com.whatsapp.w4b;end`
      : `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(waMessage)}`
    : "";

  const handleAfsluiten = async () => {
    if (!p.verkoopId || !p.vehicleId) {
      toast.error("Verkoop niet gevonden");
      return;
    }
    setClosing(true);
    try {
      const { error: e1 } = await supabase
        .from("verkopen")
        .update({
          wizard_status: "afgerond",
          stap11_afgerond: true,
          uitlevering_datum: localInputToIso(uitleveringDatum),
          apk_gecommuniceerd: apkGecommuniceerd,
          gebreken_besproken: gebrekenBesproken,
          gebreken_omschrijving: gebrekenBesproken ? gebrekenOmschrijving || null : null,
          tenaamstellingsbewijs_meegegeven: tenaamstellingsbewijsMeegegeven,
          uitlevering_voltooid: true,
        } as any)
        .eq("id", p.verkoopId);
      if (e1) throw e1;

      // Haal volledige verkoopregel + klant op om voertuigvelden te synchroniseren
      const { data: vkFull } = await supabase
        .from("verkopen")
        .select("*")
        .eq("id", p.verkoopId)
        .maybeSingle();

      let koperNaam: string | null = null;
      let koperEmail: string | null = null;
      let koperTelefoon: string | null = null;
      if (vkFull?.customer_id) {
        const { data: cust } = await supabase
          .from("customers")
          .select("voornaam, achternaam, bedrijfsnaam, email, telefoon")
          .eq("id", vkFull.customer_id)
          .maybeSingle();
        if (cust) {
          koperNaam = (cust.bedrijfsnaam?.trim()
            ? cust.bedrijfsnaam
            : `${cust.voornaam || ""} ${cust.achternaam || ""}`.trim()) || null;
          koperEmail = cust.email || null;
          koperTelefoon = cust.telefoon || null;
        }
      }

      const vkAny: any = vkFull || {};
      const vehicleSync: any = {
        status: "verkocht",
        verkoop_datum: vkAny.leverdatum || new Date().toISOString().split("T")[0],
        verkoopprijs: vkAny.verkoopprijs ?? null,
        koper_naam: koperNaam,
        koper_email: koperEmail,
        koper_telefoon: koperTelefoon,
        betaalmethode: vkAny.betaalwijze || null,
        contant_bedrag: 0,
        overboeking_bedrag: vkAny.overboeking_bedrag || 0,
        financiering_actief: !!vkAny.financiering,
        aanbetalingsbedrag: vkAny.aanbetaling_bedrag || 0,
        inruil_kenteken: vkAny.inruil ? (vkAny.inruil_kenteken || null) : null,
        inruil_merk: vkAny.inruil ? (vkAny.inruil_merk || null) : null,
        inruil_model: vkAny.inruil ? (vkAny.inruil_model || null) : null,
        inruil_waarde: vkAny.inruil ? (vkAny.inruil_waarde || 0) : 0,
      };
      // Verwijder null/undefined velden niet — we willen ze juist overschrijven
      const { error: e2 } = await supabase
        .from("vehicles")
        .update(vehicleSync)
        .eq("id", p.vehicleId);
      if (e2) throw e2;

      // Sluit alle andere openstaande verkoopwizards voor dit voertuig
      await supabase
        .from("verkopen")
        .update({ wizard_status: "geannuleerd" } as any)
        .eq("vehicle_id", p.vehicleId)
        .eq("wizard_status", "bezig")
        .neq("id", p.verkoopId);

      toast.success("Verkoop succesvol afgesloten");
      navigate("/admin/verkopen");
    } catch (err) {
      console.error(err);
      toast.error("Afsluiten mislukt");
    } finally {
      setClosing(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Uitlevering — compacte kaart */}
      <div className="rounded-[14px] border border-border bg-card p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Uitlevering</h2>
          <p className="text-sm text-muted-foreground">
            Leg het uitlevermoment vast. Niet verplicht voor afsluiten, wel opgeslagen.
          </p>
        </div>

        {/* Datum & tijdstip */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Datum & tijdstip uitlevering
          </label>
          <input
            type="datetime-local"
            value={uitleveringDatum}
            onChange={(e) => {
              setUitleveringDatum(e.target.value);
              p.onUitleveringChange?.({ uitlevering_datum: localInputToIso(e.target.value) });
            }}
            className="w-full sm:w-auto px-3 py-2 text-sm bg-background border border-border rounded-[10px] focus:outline-none focus:ring-1 focus:ring-foreground/30"
          />
        </div>

        {/* APK gecommuniceerd */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-foreground">
              APK-vervaldatum gecommuniceerd aan koper
            </div>
            {p.voertuigApkVervaldatum && (
              <div className="text-xs text-muted-foreground mt-0.5">
                APK geldig tot: {p.voertuigApkVervaldatum}
              </div>
            )}
          </div>
          <Switch
            checked={apkGecommuniceerd}
            onCheckedChange={(v) => {
              setApkGecommuniceerd(v);
              p.onUitleveringChange?.({ apk_gecommuniceerd: v });
            }}
          />
        </div>

        {/* Bekende gebreken */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="text-sm font-medium text-foreground">
              Bekende gebreken besproken en vastgelegd
            </div>
            <Switch
              checked={gebrekenBesproken}
              onCheckedChange={(v) => {
                setGebrekenBesproken(v);
                p.onUitleveringChange?.({
                  gebreken_besproken: v,
                  gebreken_omschrijving: v ? gebrekenOmschrijving || null : null,
                });
              }}
            />
          </div>
          {gebrekenBesproken && (
            <Textarea
              value={gebrekenOmschrijving}
              onChange={(e) => setGebrekenOmschrijving(e.target.value)}
              onBlur={() =>
                p.onUitleveringChange?.({
                  gebreken_omschrijving: gebrekenOmschrijving || null,
                })
              }
              placeholder="Omschrijving van besproken gebreken (optioneel)"
              className="text-sm"
              rows={3}
            />
          )}
        </div>

        {/* Tenaamstellingsbewijs */}
        <div className="flex items-start justify-between gap-4">
          <div className="text-sm font-medium text-foreground">
            Tenaamstellingsbewijs meegegeven aan koper
          </div>
          <Switch
            checked={tenaamstellingsbewijsMeegegeven}
            onCheckedChange={(v) => {
              setTenaamstellingsbewijsMeegegeven(v);
              p.onUitleveringChange?.({ tenaamstellingsbewijs_meegegeven: v });
            }}
          />
        </div>
      </div>

      {/* Dossieroverzicht */}
      <div className="rounded-[14px] border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">Dossieroverzicht</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Klik op een stap om er direct naartoe te gaan.
        </p>
        <div className="divide-y divide-border">
          {visibleSteps.map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => p.onNavigateToStap(s.num)}
              className="w-full flex items-center gap-4 py-3 text-left hover:bg-accent/40 px-2 -mx-2 rounded-[8px] transition-colors"
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  s.done ? "bg-green-600/20 text-green-600" : "bg-orange-500/20 text-orange-500"
                }`}
              >
                {s.done ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">
                  Stap {s.num} — {s.title}
                </div>
                <div className="text-xs text-muted-foreground truncate">{s.detail}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Acties */}
      <div className="rounded-[14px] border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Acties</h2>
        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-[10px] border border-border bg-background hover:bg-accent text-sm font-medium transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Stuur bedankbericht + review verzoek via WhatsApp Business
          </a>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[10px] border border-border bg-background text-sm font-medium opacity-50 cursor-not-allowed"
            >
              <MessageCircle className="w-4 h-4" />
              Stuur bedankbericht + review verzoek via WhatsApp Business
            </button>
            <p className="text-xs text-orange-500">
              Geen telefoonnummer bekend — voeg dit toe in stap 3
            </p>
          </div>
        )}
      </div>

      {/* Verkoop afsluiten */}
      <div className="rounded-[14px] border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">Verkoop afsluiten</h2>
        {!allDone ? (
          <div className="space-y-3">
            <p className="text-sm text-orange-500">
              Los eerst alle openstaande punten op voor je de verkoop afsluit.
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              {openItems.map((s) => (
                <li key={s.num}>
                  Stap {s.num} — {s.title}
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled
              className="mt-2 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[10px] bg-muted text-muted-foreground cursor-not-allowed text-sm font-medium"
            >
              <Lock className="w-4 h-4" />
              Verkoop afsluiten
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Alle stappen zijn afgerond. Je kunt deze verkoop nu definitief afsluiten.
            </p>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[10px] bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
            >
              <Check className="w-4 h-4" />
              Verkoop afsluiten
            </button>
          </div>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verkoop afsluiten</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je deze verkoop wilt afsluiten? Dit kan niet ongedaan
              worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closing}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleAfsluiten();
              }}
              disabled={closing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {closing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Bezig…
                </>
              ) : (
                "Ja, afsluiten"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Stap12Afsluiting;

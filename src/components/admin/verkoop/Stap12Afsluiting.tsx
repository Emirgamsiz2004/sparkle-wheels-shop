import { useMemo, useState } from "react";
import { Check, AlertCircle, MessageCircle, Star, Lock, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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

  // Voertuig
  voertuigKenteken?: string | null;
  voertuigMerk?: string | null;
  voertuigModel?: string | null;

  // Stap 2
  afleverwijze?: string | null;
  aanbetalingBedrag?: number | "" | null;

  // Stap 3
  klantVoornaam?: string;
  klantAchternaam?: string;
  klantTelefoon?: string;

  // Stap 4
  garantieType?: string | null;

  // Stap 5
  contractGetekend?: boolean;

  // Stap 7
  factuurMbNummer?: string | null;
  factuurVerstuurd?: boolean;

  // Stap 8
  ontvangenBedrag?: number | null;
  restbedragLater?: boolean;
  restbedragBedrag?: number | null;

  // Stap 10
  machtigingsnummer?: string | null;
  machtigingDatum?: string | null;

  // Stap 11
  uitleveringDatum?: string | null;

  onNavigateToStap: (stap: number) => void;
}

const Stap12Afsluiting: React.FC<Stap12AfsluitingProps> = (p) => {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const merkModel = `${p.voertuigMerk || ""} ${p.voertuigModel || ""}`.trim();

  const aanbetalingNum =
    typeof p.aanbetalingBedrag === "number" ? p.aanbetalingBedrag : 0;

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
          (aanbetalingNum > 0
            ? ` · aanbetaling €${aanbetalingNum.toLocaleString("nl-NL")}`
            : ""),
        done: !!p.completed[2],
        visible: true,
      },
      {
        num: 3,
        title: "Klantgegevens",
        detail:
          `${p.klantVoornaam || ""} ${p.klantAchternaam || ""}`.trim() || "—",
        done: !!p.completed[3],
        visible: true,
      },
      {
        num: 4,
        title: "Garantie",
        detail: p.garantieType === "autotrust" ? "AutoTrust" : "Geen garantie",
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
        num: 9,
        title: "Inruil op naam",
        detail: p.inruil ? "Inruil overgenomen" : "—",
        done: !!p.completed[9],
        visible: p.inruil,
      },
      {
        num: 10,
        title: "Tenaamstelling",
        detail: [
          p.machtigingsnummer ? `Nr. ${p.machtigingsnummer}` : null,
          p.machtigingDatum || null,
        ]
          .filter(Boolean)
          .join(" · ") || "—",
        done: !!p.completed[10],
        visible: true,
      },
      {
        num: 11,
        title: "Uitlevering",
        detail: p.uitleveringDatum
          ? new Date(p.uitleveringDatum).toLocaleString("nl-NL")
          : "—",
        done: !!p.completed[11],
        visible: true,
      },
    ];
  }, [p, merkModel, aanbetalingNum]);

  const visibleSteps = summary.filter((s) => s.visible);
  const openItems = visibleSteps.filter((s) => !s.done);
  const allDone = openItems.length === 0;

  const waMessage = `Bedankt voor uw aankoop bij Platin Automotive! We hopen dat u veel plezier beleeft aan uw ${merkModel || "nieuwe auto"}. Heeft u vragen, neem dan gerust contact op.`;
  const waPhone = (p.klantTelefoon || "").replace(/[^\d]/g, "").replace(/^0/, "31");
  const waUrl = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

  // Placeholder Google review link
  const googleReviewUrl = "https://g.page/r/platinautomotive/review";

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
          stap12_afgerond: true,
        } as any)
        .eq("id", p.verkoopId);
      if (e1) throw e1;

      const { error: e2 } = await supabase
        .from("vehicles")
        .update({ status: "verkocht" } as any)
        .eq("id", p.vehicleId);
      if (e2) throw e2;

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
                  s.done
                    ? "bg-green-600/20 text-green-600"
                    : "bg-orange-500/20 text-orange-500"
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
        <div className="grid sm:grid-cols-2 gap-3">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-[10px] border border-border bg-background hover:bg-accent text-sm font-medium transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Stuur bedankbericht via WhatsApp
          </a>
          <a
            href={googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-[10px] border border-border bg-background hover:bg-accent text-sm font-medium transition-colors"
          >
            <Star className="w-4 h-4" />
            Stuur Google review verzoek
          </a>
        </div>
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

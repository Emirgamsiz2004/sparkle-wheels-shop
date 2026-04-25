import { useEffect, useMemo, useState } from "react";
import { CalendarIcon, CheckCircle2, CreditCard, Loader2, Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMoneybird } from "@/hooks/useMoneybird";
import { supabase } from "@/integrations/supabase/client";
import { formatKenteken } from "@/lib/kenteken";

type Methode = "cash" | "pin" | "ideal" | "overboeking";

interface Rij {
  methode: Methode;
  bedrag: number | "";
  manueel?: boolean;
}

const METHODEN: { id: Methode; label: string }[] = [
  { id: "cash", label: "Cash" },
  { id: "pin", label: "Pin" },
  { id: "ideal", label: "iDEAL" },
  { id: "overboeking", label: "Overboeking" },
];

const fmtEur = (n: number) =>
  n.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });

interface Props {
  verkoopId: string | null;
  voertuigKenteken: string;
  voertuigMerk: string;
  voertuigModel: string;
  factuurMbId: string | null;
  factuurMbNummer: string | null;
  factuurTotaal: number;
  aanbetalingBedrag: number;
  initialBetaaldatum: string | null;
  initialBetaalwijze: string | null;
  initialBetaalwijzeDetails: Array<{ methode: string; bedrag: number }> | null;
  initialBetalingOpmerking: string | null;
  initialMoneybirdPaymentId: string | null;
  initialBetalingOntvangen: boolean;
  onSaved: (extra: Record<string, any>) => Promise<void>;
}

const Stap8Betaling = ({
  verkoopId,
  voertuigKenteken,
  voertuigMerk,
  voertuigModel,
  factuurMbId,
  factuurMbNummer,
  factuurTotaal,
  aanbetalingBedrag,
  initialBetaaldatum,
  initialBetaalwijze,
  initialBetaalwijzeDetails,
  initialBetalingOpmerking,
  initialMoneybirdPaymentId,
  initialBetalingOntvangen,
  onSaved,
}: Props) => {
  const { invoke, loading: mbLoading } = useMoneybird();

  const nogTeOntvangen = useMemo(
    () => Math.max(0, factuurTotaal - aanbetalingBedrag),
    [factuurTotaal, aanbetalingBedrag],
  );

  // ─── State ───
  const [rijen, setRijen] = useState<Rij[]>(() => {
    const seed = (initialBetaalwijzeDetails || []).filter(
      (d): d is { methode: Methode; bedrag: number } =>
        !!d && ["cash", "pin", "ideal", "overboeking"].includes(d.methode as string),
    );
    if (seed.length > 0)
      return seed.map((d) => ({ methode: d.methode, bedrag: d.bedrag, manueel: true }));
    const m = (initialBetaalwijze || "").toLowerCase();
    const startMethode: Methode = (["cash", "pin", "ideal", "overboeking"].includes(m)
      ? m
      : "pin") as Methode;
    return [{ methode: startMethode, bedrag: nogTeOntvangen, manueel: false }];
  });

  const [datum, setDatum] = useState<string>(
    initialBetaaldatum || new Date().toISOString().slice(0, 10),
  );
  const [opmerking, setOpmerking] = useState<string>(initialBetalingOpmerking || "");
  const [moneybirdPaymentId, setMoneybirdPaymentId] = useState<string | null>(
    initialMoneybirdPaymentId,
  );
  const [bevestigd, setBevestigd] = useState<boolean>(!!initialBetalingOntvangen);
  const [savingMb, setSavingMb] = useState(false);

  // ─── Auto-fill laatste rij met restbedrag (alleen als niet handmatig bewerkt) ───
  const totaalIngevuld = rijen
    .slice(0, -1)
    .reduce((sum, r) => sum + (typeof r.bedrag === "number" ? r.bedrag : 0), 0);
  const autoLaatste = Math.max(0, nogTeOntvangen - totaalIngevuld);

  useEffect(() => {
    setRijen((prev) => {
      if (prev.length === 0) return prev;
      const idx = prev.length - 1;
      const last = prev[idx];
      if (last.manueel) return prev;
      if (last.bedrag === autoLaatste) return prev;
      const next = [...prev];
      next[idx] = { ...last, bedrag: autoLaatste };
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLaatste, rijen.length]);

  const totaalRijen = rijen.reduce(
    (sum, r) => sum + (typeof r.bedrag === "number" ? r.bedrag : 0),
    0,
  );
  const verschil = totaalRijen - nogTeOntvangen;
  const klopt = Math.abs(verschil) <= 0.01 && nogTeOntvangen > 0;

  // ─── Persisteren ───
  const persist = async (overrides: Record<string, any> = {}) => {
    if (!verkoopId) return;
    const primaryMethod = rijen[0]?.methode || "pin";
    const details = rijen.map((r) => ({
      methode: r.methode,
      bedrag: typeof r.bedrag === "number" ? r.bedrag : 0,
    }));
    const payload: Record<string, any> = {
      betaalwijze: primaryMethod,
      betaalwijze_details: details,
      betaling_datum: datum,
      betaling_opmerking: opmerking || null,
      moneybird_payment_id: moneybirdPaymentId,
      betaling_ontvangen: bevestigd,
      ...overrides,
    };
    await onSaved(payload);
  };

  const handleAddRij = () => {
    // Voeg toe als nieuwe laatste (auto), maak vorige laatste handmatig zodat hij vast staat
    setRijen((p) => {
      const next = p.map((r, i) =>
        i === p.length - 1 ? { ...r, manueel: true } : r,
      );
      next.push({ methode: "pin", bedrag: "", manueel: false });
      return next;
    });
  };

  const handleRemoveRij = (idx: number) => {
    setRijen((p) => p.filter((_, i) => i !== idx));
  };

  const handleChangeMethode = (idx: number, m: Methode) => {
    setRijen((p) => p.map((r, i) => (i === idx ? { ...r, methode: m } : r)));
  };

  const handleUnlockLast = (idx: number) => {
    setRijen((p) => p.map((r, i) => (i === idx ? { ...r, manueel: true } : r)));
  };

  const handleChangeBedrag = (idx: number, v: string) => {
    const num = v === "" ? "" : Number(v);
    setRijen((p) =>
      p.map((r, i) => (i === idx ? { ...r, bedrag: num as any, manueel: true } : r)),
    );
  };

  // ─── Moneybird betaling registreren ───
  const handleRegisterPayment = async () => {
    if (!factuurMbId) {
      toast.error("Geen Moneybird factuur gekoppeld");
      return;
    }
    if (Math.abs(verschil) > 0.01) {
      toast.error("Totaal van betaalrijen moet gelijk zijn aan nog te ontvangen bedrag");
      return;
    }

    setSavingMb(true);
    try {
      // Optioneel: financial account uit app_settings ophalen op basis van methode
      let financialAccountId: string | null = null;
      try {
        const primaryMethod = rijen[0]?.methode || "pin";
        const settingsKey =
          primaryMethod === "cash"
            ? "moneybird_financial_account_cash"
            : "moneybird_financial_account_bank";
        const { data } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", settingsKey)
          .maybeSingle();
        financialAccountId = (data?.value as string) || null;
      } catch {
        // ignore — Moneybird kiest dan automatisch
      }

      const result = await invoke("register_payment_invoice", {
        invoice_id: factuurMbId,
        payment_date: datum,
        price: nogTeOntvangen.toFixed(2),
        ...(financialAccountId ? { financial_account_id: financialAccountId } : {}),
      });

      const paymentId = result?.id ? String(result.id) : null;
      setMoneybirdPaymentId(paymentId);
      setBevestigd(true);
      await persist({
        moneybird_payment_id: paymentId,
        betaling_ontvangen: true,
        stap8_afgerond: true,
        factuur_betaald: true,
      });
      toast.success("Betaling geregistreerd in Moneybird");
    } catch {
      // toast wordt al door useMoneybird getoond
    } finally {
      setSavingMb(false);
    }
  };

  // ─── Switch: handmatig bevestigen ───
  const handleToggleBevestigd = async (val: boolean) => {
    setBevestigd(val);
    await persist({
      betaling_ontvangen: val,
      stap8_afgerond: val,
      factuur_betaald: val,
    });
  };

  // ─── Auto-save bij wijziging van datum/opmerking/rijen (debounced via blur) ───
  const triggerSave = () => {
    persist();
  };

  return (
    <div className="space-y-6">
      {/* ─── Betalingsoverzicht ─── */}
      <div className="rounded-[14px] border border-border bg-card p-6">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-4">
          Betalingsoverzicht
        </div>

        <div className="space-y-3 text-sm">
          <Row label="Voertuig">
            <span className="text-foreground">
              {voertuigKenteken && (
                <span className="font-mono uppercase mr-2">
                  {formatKenteken(voertuigKenteken)}
                </span>
              )}
              {voertuigMerk} {voertuigModel}
            </span>
          </Row>

          {factuurMbNummer && (
            <Row label="Factuur">
              <span className="text-foreground">{factuurMbNummer}</span>
            </Row>
          )}

          <Row label="Factuurbedrag">
            <span className="text-foreground">{fmtEur(factuurTotaal)}</span>
          </Row>

          <Row label="Reeds voldaan via aanbetaling">
            <span className="text-foreground">{fmtEur(aanbetalingBedrag)}</span>
          </Row>

          <div className="h-px bg-border my-2" />

          <Row label="Nog te ontvangen" emphasized>
            <span className="inline-flex items-center gap-2">
              <span className="text-foreground font-semibold">{fmtEur(nogTeOntvangen)}</span>
              {klopt && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            </span>
          </Row>
        </div>
      </div>

      {/* ─── Betaling vastleggen ─── */}
      <div className="rounded-[14px] border border-border bg-card p-6">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-4">
          Betaling vastleggen
        </div>

        <div className="space-y-3">
          {rijen.map((rij, idx) => {
            const isLast = idx === rijen.length - 1;
            return (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-[10px] border border-border bg-background/40 p-2"
              >
                <div className="flex flex-1 flex-wrap gap-1">
                  {METHODEN.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleChangeMethode(idx, m.id)}
                      className={cn(
                        "px-3 py-1.5 text-[12px] rounded-[8px] border transition-colors",
                        rij.methode === m.id
                          ? "bg-foreground text-background border-foreground"
                          : "border-border text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">€</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={rij.bedrag === "" ? "" : rij.bedrag}
                    onChange={(e) => handleChangeBedrag(idx, e.target.value)}
                    onBlur={triggerSave}
                    className="w-28 bg-background border border-border rounded-[8px] px-2 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="0,00"
                  />
                  {rijen.length > 1 && !isLast && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRij(idx)}
                      className="text-muted-foreground hover:text-destructive p-1"
                      aria-label="Verwijderen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={handleAddRij}
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Extra betaling toevoegen
          </button>

          {Math.abs(verschil) > 0.01 && (
            <div className="text-[12px] text-amber-400 mt-2">
              {verschil > 0
                ? `${fmtEur(verschil)} te veel ingevuld`
                : `${fmtEur(-verschil)} resterend`}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div>
            <label className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 block">
              Datum ontvangst
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between gap-2 px-3 py-2 text-sm border border-border rounded-[10px] bg-background hover:bg-accent/50 transition-colors"
                >
                  <span>
                    {datum
                      ? format(parseISO(datum), "d MMMM yyyy", { locale: nl })
                      : "Kies datum"}
                  </span>
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={datum ? parseISO(datum) : undefined}
                  onSelect={(d) => {
                    if (d) {
                      const iso = format(d, "yyyy-MM-dd");
                      setDatum(iso);
                      setTimeout(triggerSave, 0);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 block">
              Opmerking (optioneel)
            </label>
            <input
              type="text"
              value={opmerking}
              onChange={(e) => setOpmerking(e.target.value)}
              onBlur={triggerSave}
              className="w-full bg-background border border-border rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Bijv. Pinbon nr. 4521"
            />
          </div>
        </div>
      </div>

      {/* ─── Moneybird koppeling ─── */}
      <div className="rounded-[14px] border border-border bg-card p-6">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-4">
          Moneybird
        </div>

        {!factuurMbId ? (
          <p className="text-sm text-muted-foreground">
            Geen Moneybird factuur gekoppeld in stap 7.
          </p>
        ) : moneybirdPaymentId ? (
          <div className="flex items-center gap-2 rounded-[10px] border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Betaling geregistreerd in Moneybird</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleRegisterPayment}
            disabled={savingMb || mbLoading || nogTeOntvangen <= 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm bg-foreground text-background rounded-[10px] hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {savingMb ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            Registreer betaling in Moneybird
          </button>
        )}
      </div>

      {/* ─── Bevestiging ─── */}
      <div className="flex items-center justify-between gap-4 py-2">
        <span className="text-sm text-foreground">Betaling volledig ontvangen</span>
        <Switch
          checked={bevestigd}
          onCheckedChange={handleToggleBevestigd}
          className="data-[state=unchecked]:bg-white/10 data-[state=unchecked]:border-white/30 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 [&>span]:bg-white"
        />
      </div>
    </div>
  );
};

const Row = ({
  label,
  children,
  emphasized,
}: {
  label: string;
  children: React.ReactNode;
  emphasized?: boolean;
}) => (
  <div className="flex items-center justify-between gap-4">
    <span
      className={cn(
        "text-[11px] uppercase tracking-wide",
        emphasized ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
    </span>
    <span className="text-right tabular-nums">{children}</span>
  </div>
);

export default Stap8Betaling;

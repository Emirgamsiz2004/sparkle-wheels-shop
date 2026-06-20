import { useEffect, useMemo, useState } from "react";
import { CalendarIcon, CheckCircle2, CreditCard, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { generateRestbetalingPDF } from "@/lib/restbetalingsafspraakPdf";
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

type Methode = "cash" | "bank";

interface Rij {
  methode: Methode;
  bedrag: number | "";
  manueel?: boolean;
}

const METHODEN: { id: Methode; label: string }[] = [
  { id: "cash", label: "Cash" },
  { id: "bank", label: "Bank" },
];

const fmtEur = (n: number) =>
  n.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });

interface Props {
  verkoopId: string | null;
  voertuigKenteken: string;
  voertuigMerk: string;
  voertuigModel: string;
  voertuigBouwjaar: number | null;
  klantVoornaam: string;
  klantAchternaam: string;
  klantAdres: string;
  klantPostcode: string;
  klantWoonplaats: string;
  factuurMbId: string | null;
  factuurMbNummer: string | null;
  factuurTotaal: number;
  aanbetalingBedrag: number;
  inruilBedrag: number;
  initialBetaaldatum: string | null;
  initialBetaalwijze: string | null;
  initialBetaalwijzeDetails: Array<{ methode: string; bedrag: number }> | null;
  initialBetalingOpmerking: string | null;
  initialMoneybirdPaymentId: string | null;
  initialBetalingOntvangen: boolean;
  initialRestbedragLater: boolean;
  initialRestbedragVerwachteDatum: string | null;
  initialOpenstaandRestbedrag?: number | null;
  onSaved: (extra: Record<string, any>) => Promise<void>;
}

const Stap8Betaling = ({
  verkoopId,
  voertuigKenteken,
  voertuigMerk,
  voertuigModel,
  voertuigBouwjaar,
  klantVoornaam,
  klantAchternaam,
  klantAdres,
  klantPostcode,
  klantWoonplaats,
  factuurMbId,
  factuurMbNummer,
  factuurTotaal,
  aanbetalingBedrag,
  inruilBedrag,
  initialBetaaldatum,
  initialBetaalwijze,
  initialBetaalwijzeDetails,
  initialBetalingOpmerking,
  initialMoneybirdPaymentId,
  initialBetalingOntvangen,
  initialRestbedragLater,
  initialRestbedragVerwachteDatum,
  initialOpenstaandRestbedrag,
  onSaved,
}: Props) => {
  const { invoke, loading: mbLoading } = useMoneybird();

  const nogTeOntvangen = useMemo(
    () => Math.max(0, factuurTotaal - aanbetalingBedrag - inruilBedrag),
    [factuurTotaal, aanbetalingBedrag, inruilBedrag],
  );
  const totaalVerrekend = aanbetalingBedrag + inruilBedrag;

  // ─── State ───
  const normalizeMethode = (raw: unknown): Methode => {
    const s = String(raw || "").toLowerCase();
    return s === "cash" ? "cash" : "bank";
  };

  const [rijen, setRijen] = useState<Rij[]>(() => {
    const seed = (initialBetaalwijzeDetails || []).filter(
      (d) => !!d && typeof d.bedrag === "number",
    );
    if (seed.length > 0)
      return seed.map((d) => ({
        methode: normalizeMethode(d.methode),
        bedrag: d.bedrag,
        manueel: true,
      }));
    return [
      { methode: normalizeMethode(initialBetaalwijze), bedrag: nogTeOntvangen, manueel: false },
    ];
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
  const [restbedragLater, setRestbedragLater] = useState<boolean>(!!initialRestbedragLater);
  const [verwachteDatum, setVerwachteDatum] = useState<string>(
    initialRestbedragVerwachteDatum || "",
  );
  const [openstaandRestbedrag, setOpenstaandRestbedrag] = useState<number | "">(
    typeof initialOpenstaandRestbedrag === "number" ? initialOpenstaandRestbedrag : "",
  );
  const [openstaandManueel, setOpenstaandManueel] = useState<boolean>(
    typeof initialOpenstaandRestbedrag === "number" && initialOpenstaandRestbedrag > 0,
  );
  const [generatingPdf, setGeneratingPdf] = useState(false);

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
  const openstaandNum = typeof openstaandRestbedrag === "number" ? openstaandRestbedrag : 0;
  const verschil = restbedragLater
    ? totaalRijen + openstaandNum - nogTeOntvangen
    : totaalRijen - nogTeOntvangen;
  const klopt = Math.abs(verschil) <= 0.01 && nogTeOntvangen > 0;

  // Auto-fill openstaand restbedrag wanneer toggle aan staat en niet handmatig bewerkt
  useEffect(() => {
    if (!restbedragLater) return;
    if (openstaandManueel) return;
    const auto = Math.max(0, nogTeOntvangen - totaalRijen);
    setOpenstaandRestbedrag(auto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restbedragLater, totaalRijen, nogTeOntvangen, openstaandManueel]);
  const persist = async (overrides: Record<string, any> = {}) => {
    if (!verkoopId) return;
    const primaryMethod: Methode = rijen[0]?.methode || "bank";
    const details = rijen.map((r) => ({
      methode: r.methode === "cash" ? "Cash" : "Bank",
      bedrag: typeof r.bedrag === "number" ? r.bedrag : 0,
    }));
    const payload: Record<string, any> = {
      betaalwijze: primaryMethod === "cash" ? "Cash" : "Bank",
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
    // Voeg toe als nieuwe rij. Markeer alle bestaande als handmatig zodat ze niet
    // automatisch leeg getrokken worden, en geef de nieuwe rij ook 'manueel' zodat
    // het bedrag direct bewerkbaar is.
    setRijen((p) => {
      const next = p.map((r) => ({ ...r, manueel: true }));
      const ingevuld = next.reduce(
        (sum, r) => sum + (typeof r.bedrag === "number" ? r.bedrag : 0),
        0,
      );
      const rest = Math.max(0, nogTeOntvangen - ingevuld);
      next.push({ methode: "bank", bedrag: rest, manueel: true });
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
      toast.error(
        restbedragLater
          ? "Som van betaalrijen + openstaand restbedrag moet gelijk zijn aan nog te ontvangen bedrag"
          : "Totaal van betaalrijen moet gelijk zijn aan nog te ontvangen bedrag",
      );
      return;
    }

    const teRegistreren = restbedragLater ? totaalRijen : nogTeOntvangen;
    if (teRegistreren <= 0) {
      toast.error("Geen bedrag om te registreren");
      return;
    }

    setSavingMb(true);
    try {
      // Optioneel: financial account uit app_settings ophalen op basis van methode
      let financialAccountId: string | null = null;
      try {
        const primaryMethod: Methode = rijen[0]?.methode || "bank";
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
        price: teRegistreren.toFixed(2),
        ...(financialAccountId ? { financial_account_id: financialAccountId } : {}),
      });

      const paymentId = result?.id ? String(result.id) : null;
      setMoneybirdPaymentId(paymentId);
      // Alleen volledig bevestigen als er geen restbedrag meer openstaat
      const volledig = !restbedragLater;
      setBevestigd(volledig);
      await persist({
        moneybird_payment_id: paymentId,
        betaling_ontvangen: volledig,
        stap8_afgerond: volledig,
        factuur_betaald: volledig,
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

  // ─── Restbedrag later toggle ───
  const handleToggleRestbedragLater = async (val: boolean) => {
    setRestbedragLater(val);
    if (!val) {
      setOpenstaandManueel(false);
      setOpenstaandRestbedrag("");
    }
    await persist({
      restbedrag_later: val,
      restbedrag_verwachte_datum: val ? verwachteDatum || null : null,
      restbedrag: val ? (typeof openstaandRestbedrag === "number" ? openstaandRestbedrag : 0) : 0,
    });
  };

  const handleVerwachteDatumChange = async (iso: string) => {
    setVerwachteDatum(iso);
    if (restbedragLater) {
      await persist({ restbedrag_later: true, restbedrag_verwachte_datum: iso || null });
    }
  };

  const handleChangeOpenstaand = (v: string) => {
    setOpenstaandManueel(true);
    setOpenstaandRestbedrag(v === "" ? "" : Number(v));
  };

  const handleBlurOpenstaand = async () => {
    if (!restbedragLater) return;
    await persist({
      restbedrag: typeof openstaandRestbedrag === "number" ? openstaandRestbedrag : 0,
    });
  };

  // ─── Restbetalingsafspraak PDF ───
  const handleGenerateRestbetalingPdf = async () => {
    if (!verkoopId) {
      toast.error("Geen verkoop gevonden");
      return;
    }
    if (!verwachteDatum) {
      toast.error("Vul eerst de uiterlijke betaaldatum in");
      return;
    }
    setGeneratingPdf(true);
    try {
      const primaryMethode: Methode = rijen[0]?.methode || "bank";
      const { getCurrentUserSignatureDataUrl } = await import("@/lib/userSignature");
      const verkoperHandtekeningDataUrl = (await getCurrentUserSignatureDataUrl()) || undefined;
      const { blob, fileName } = generateRestbetalingPDF({
        voertuig: {
          merk: voertuigMerk,
          model: voertuigModel,
          bouwjaar: voertuigBouwjaar,
          kenteken: voertuigKenteken,
        },
        klant: {
          voornaam: klantVoornaam,
          achternaam: klantAchternaam,
          adres: klantAdres,
          postcode: klantPostcode,
          woonplaats: klantWoonplaats,
        },
        reedsVoldaan: totaalVerrekend,
        restbedrag: nogTeOntvangen,
        uiterlijkeDatum: verwachteDatum,
        betaalwijze: primaryMethode === "cash" ? "cash" : "bank",
        opmerking: opmerking,
        datum: new Date().toISOString().slice(0, 10),
        verkoperHandtekeningDataUrl,
      });

      const localUrl = URL.createObjectURL(blob);
      window.open(localUrl, "_blank");

      try {
        const path = `verkopen/${verkoopId}/${fileName}`;
        const { error: upErr } = await supabase.storage
          .from("vehicle-documents")
          .upload(path, blob, { contentType: "application/pdf", upsert: true });
        if (!upErr) {
          const { data: signed } = await supabase.storage
            .from("vehicle-documents")
            .createSignedUrl(path, 60 * 60 * 24 * 365);
          await supabase.from("verkoop_documenten").insert({
            verkoop_id: verkoopId,
            type: "restbetalingsafspraak",
            pdf_url: signed?.signedUrl || path,
          });
        }
      } catch (err) {
        console.warn("Upload restbetalingsafspraak mislukt", err);
      }

      toast.success("Betalingsafspraak gegenereerd");
    } catch (err) {
      console.error(err);
      toast.error("Genereren van PDF mislukt");
    } finally {
      setGeneratingPdf(false);
    }
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

          {inruilBedrag > 0 && (
            <Row label="Verrekend via inruil">
              <span className="text-foreground">{fmtEur(inruilBedrag)}</span>
            </Row>
          )}

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
            const isAuto = isLast && !rij.manueel;
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
                    onFocus={() => isAuto && handleUnlockLast(idx)}
                    onClick={() => isAuto && handleUnlockLast(idx)}
                    onBlur={triggerSave}
                    readOnly={isAuto}
                    title={isAuto ? "Klik om handmatig te bewerken" : undefined}
                    className={cn(
                      "w-28 border border-border rounded-[8px] px-2 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-ring",
                      isAuto
                        ? "bg-muted/40 text-muted-foreground cursor-pointer"
                        : "bg-background",
                    )}
                    placeholder="0,00"
                  />
                  {rijen.length > 1 && (
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
            <div className="text-[12px] text-red-500 mt-2">
              Let op: bedragen komen niet overeen
              {" "}
              ({verschil > 0
                ? `${fmtEur(verschil)} te veel`
                : `${fmtEur(-verschil)} tekort`})
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
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleRegisterPayment}
              disabled={savingMb || mbLoading || (restbedragLater ? totaalRijen <= 0 : nogTeOntvangen <= 0)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm bg-foreground text-background rounded-[10px] hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {savingMb ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Registreer betaling in Moneybird
            </button>
            {restbedragLater && (
              <div className="text-[12px] text-muted-foreground">
                Registreert {fmtEur(totaalRijen)} — restbedrag {fmtEur(openstaandNum)} volgt later
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Restbedrag wordt later ontvangen ─── */}
      <div className="rounded-[14px] border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-foreground font-medium">
              Restbedrag wordt later ontvangen
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Leg een betalingsafspraak vast met een uiterlijke betaaldatum.
            </div>
          </div>
          <Switch
            checked={restbedragLater}
            onCheckedChange={handleToggleRestbedragLater}
            className="data-[state=unchecked]:bg-white/10 data-[state=unchecked]:border-white/30 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 [&>span]:bg-white"
          />
        </div>

        {restbedragLater && (
          <>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 block">
                Openstaand restbedrag
              </label>
              <div className="inline-flex items-center gap-2">
                <span className="text-muted-foreground text-sm">€</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={openstaandRestbedrag === "" ? "" : openstaandRestbedrag}
                  onChange={(e) => handleChangeOpenstaand(e.target.value)}
                  onBlur={handleBlurOpenstaand}
                  className="w-40 bg-background border border-border rounded-[8px] px-2 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="0,00"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 block">
                Uiterlijk te voldoen op
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full sm:w-auto inline-flex items-center justify-between gap-2 px-3 py-2 text-sm border border-border rounded-[10px] bg-background hover:bg-accent/50 transition-colors min-w-[220px]"
                  >
                    <span>
                      {verwachteDatum
                        ? format(parseISO(verwachteDatum), "d MMMM yyyy", { locale: nl })
                        : "Kies datum"}
                    </span>
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={verwachteDatum ? parseISO(verwachteDatum) : undefined}
                    onSelect={(d) => {
                      if (d) handleVerwachteDatumChange(format(d, "yyyy-MM-dd"));
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <button
              type="button"
              onClick={handleGenerateRestbetalingPdf}
              disabled={generatingPdf || !verwachteDatum || nogTeOntvangen <= 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm bg-foreground text-background rounded-[10px] hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {generatingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Restbetalingsafspraak genereren als PDF
            </button>
          </>
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

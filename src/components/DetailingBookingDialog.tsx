import { useEffect, useMemo, useState } from "react";
import { format, addDays, isSameDay, startOfDay } from "date-fns";
import { nl } from "date-fns/locale";
import { ArrowLeft, ArrowRight, Check, MapPin, Phone } from "lucide-react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// Openingstijden in minuten vanaf 00:00
const OPENING: Record<number, { open: number; close: number } | null> = {
  0: null, // zondag gesloten
  1: { open: 9 * 60, close: 18 * 60 },
  2: { open: 9 * 60, close: 18 * 60 },
  3: { open: 9 * 60, close: 18 * 60 },
  4: { open: 9 * 60, close: 18 * 60 },
  5: { open: 9 * 60, close: 18 * 60 },
  6: { open: 10 * 60, close: 17 * 60 }, // zaterdag
};

const SLOT_STEP = 30; // 30 min

const customerSchema = z.object({
  voornaam: z.string().trim().min(1, "Vul uw voornaam in").max(60),
  achternaam: z.string().trim().min(1, "Vul uw achternaam in").max(60),
  telefoon: z.string().trim().min(6, "Vul uw telefoonnummer in").max(25),
  email: z.string().trim().email("Vul een geldig e-mailadres in").max(255),
});

export interface DetailingBookingProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  summary: string;
  voertuigType: string;
  pakket: string;
  extras: string[];
  diensten: string[];
  totalPrice: number;
  totalMinuten: number;
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[10px] tracking-[0.14em] uppercase text-white/50 mb-1.5 font-semibold">{children}</label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={cn(
      "w-full bg-[#0f0f0f] border border-white/10 rounded-[10px] px-4 py-3 text-base text-white placeholder:text-white/30 outline-none focus:border-amber-400/60 transition-colors",
      props.className,
    )}
  />
);
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={cn(
      "w-full bg-[#0f0f0f] border border-white/10 rounded-[10px] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/60 transition-colors resize-none",
      props.className,
    )}
  />
);

const fmtMin = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} uur`;
  return `${h} uur ${m} min`;
};

const minToTime = (m: number) => {
  const hh = Math.floor(m / 60).toString().padStart(2, "0");
  const mm = (m % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
};
const timeToMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

interface Booking {
  datum: string;
  starttijd: string;
  eindtijd: string;
}

const DetailingBookingDialog = ({
  open, onOpenChange, summary, voertuigType, pakket, extras, diensten, totalPrice, totalMinuten,
}: DetailingBookingProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [date, setDate] = useState<Date | undefined>();
  const [startMin, setStartMin] = useState<number | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [form, setForm] = useState({ voornaam: "", achternaam: "", telefoon: "", email: "", opmerking: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep(1); setDate(undefined); setStartMin(null);
      setForm({ voornaam: "", achternaam: "", telefoon: "", email: "", opmerking: "" });
      setErrors({}); setDone(false);
    }
  }, [open]);

  // Laad bestaande bookings vanaf vandaag
  useEffect(() => {
    if (!open) return;
    const today = format(new Date(), "yyyy-MM-dd");
    supabase
      .from("bookings" as any)
      .select("datum, starttijd, eindtijd")
      .eq("status", "bevestigd")
      .gte("datum", today)
      .then(({ data }) => setBookings((data as any) || []));
  }, [open]);

  const dayBookings = useMemo(() => {
    if (!date) return [];
    const d = format(date, "yyyy-MM-dd");
    return bookings.filter((b) => b.datum === d);
  }, [bookings, date]);

  // Inlever-tijdsloten: elke 30 min binnen openingstijden.
  // We blokkeren alleen het inlever-window (30 min) zelf, niet de hele werktijd —
  // klanten leveren de auto in en halen 'm later (of de volgende dag) op.
  const DROPOFF_WINDOW = 30;
  const slots = useMemo(() => {
    if (!date) return [];
    const dow = date.getDay();
    const hours = OPENING[dow];
    if (!hours) return [];

    const result: { min: number; label: string; available: boolean }[] = [];
    // Laatste inlevermoment = 1 uur voor sluit, zodat er nog ingenomen kan worden
    const lastDropoff = hours.close - 60;
    for (let s = hours.open; s <= lastDropoff; s += SLOT_STEP) {
      const overlap = dayBookings.some((b) => {
        const bs = timeToMin(b.starttijd);
        return Math.abs(bs - s) < DROPOFF_WINDOW;
      });
      let inPast = false;
      if (isSameDay(date, new Date())) {
        const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
        if (s <= nowMin + 30) inPast = true; // minimaal 30 min vooruit boeken
      }
      result.push({ min: s, label: minToTime(s), available: !overlap && !inPast });
    }
    return result;
  }, [date, dayBookings]);

  // Suggereer automatisch het eerste beschikbare slot
  useEffect(() => {
    if (!date) { setStartMin(null); return; }
    const first = slots.find((s) => s.available);
    setStartMin(first ? first.min : null);
  }, [date, slots]);

  const validateCustomer = () => {
    const result = customerSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const submit = async () => {
    if (!validateCustomer() || !date || startMin === null) return;
    setSubmitting(true);
    try {
      const datumStr = format(date, "yyyy-MM-dd");
      const starttijd = minToTime(startMin);
      const eindtijd = minToTime(startMin + totalMinuten);

      // Re-check overlap (alleen inlever-window van 30 min)
      const { data: latest } = await supabase
        .from("bookings" as any)
        .select("starttijd")
        .eq("datum", datumStr)
        .eq("status", "bevestigd");
      const conflict = (latest as any[] | null)?.some((b) => {
        const bs = timeToMin(b.starttijd);
        return Math.abs(bs - startMin) < 30;
      });
      if (conflict) {
        setErrors({ form: "Dit inlevermoment is zojuist geboekt. Kies een ander tijdstip." });
        setStartMin(null);
        const { data } = await supabase
          .from("bookings" as any).select("datum, starttijd, eindtijd")
          .eq("status", "bevestigd").gte("datum", format(new Date(), "yyyy-MM-dd"));
        setBookings((data as any) || []);
        setSubmitting(false);
        return;
      }

      const naam = `${form.voornaam} ${form.achternaam}`.trim();
      const { data: inserted, error } = await (supabase
        .from("bookings" as any) as any)
        .insert({
          naam,
          telefoon: form.telefoon,
          email: form.email,
          voertuig_type: voertuigType,
          pakket,
          extras,
          totaal_prijs: totalPrice,
          totaal_minuten: totalMinuten,
          datum: datumStr,
          starttijd,
          eindtijd,
          status: "bevestigd",
          opmerking: form.opmerking || null,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Mirror naar appointments tabel (admin dashboard)
      const dtStart = new Date(date);
      dtStart.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
      const dtEnd = new Date(dtStart);
      dtEnd.setMinutes(dtEnd.getMinutes() + totalMinuten);

      const dienstenNotitie = `${summary}\nTotaalprijs: €${totalPrice} incl. BTW\nDuur: ${fmtMin(totalMinuten)}\n\nOnderdelen:\n- ${diensten.join("\n- ")}${form.opmerking ? `\n\nOpmerking klant: ${form.opmerking}` : ""}`;

      await (supabase.from("appointments") as any).insert({
        type: "poetsbeurt",
        datum_tijd: dtStart.toISOString(),
        eind_datum_tijd: dtEnd.toISOString(),
        status: "gepland",
        bron: "website",
        is_aanvraag: false,
        diensten: [pakket, ...extras],
        diensten_notitie: dienstenNotitie,
        geschatte_duur_minuten: totalMinuten,
        betalingsstatus: "openstaand",
        aanvrager_voornaam: form.voornaam,
        aanvrager_achternaam: form.achternaam,
        aanvrager_telefoon: form.telefoon,
        aanvrager_email: form.email,
        notities: form.opmerking || null,
        onderwerp: summary,
      });

      const datumLabel = format(date, "EEEE d MMMM yyyy", { locale: nl });

      // Mails (best-effort)
      await Promise.all([
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "afspraak-bevestiging",
            recipientEmail: form.email,
            idempotencyKey: `booking-bev-${inserted!.id}`,
            templateData: {
              naam: form.voornaam,
              type: "Poetsbeurt",
              datum: datumLabel,
              tijdstip: starttijd,
              omschrijving: `${summary} — Totaalprijs €${totalPrice} (afrekenen na de dienst). Duur: ±${fmtMin(totalMinuten)}.\n\nOnderdelen:\n- ${diensten.join("\n- ")}`,
            },
          },
        }).catch(() => null),
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "afspraak-notificatie-admin",
            recipientEmail: "info@platinautomotive.nl",
            idempotencyKey: `booking-adm-${inserted!.id}`,
            templateData: {
              isAanvraag: false,
              type: "Poetsbeurt",
              naam,
              email: form.email,
              telefoon: form.telefoon,
              datum: datumLabel,
              tijdstip: starttijd,
              voertuig: voertuigType,
              opmerking: `${summary} — €${totalPrice} (${fmtMin(totalMinuten)})\nOnderdelen: ${diensten.join(", ")}${form.opmerking ? `\nKlant: ${form.opmerking}` : ""}`,
            },
          },
        }).catch(() => null),
      ]);
      setDone(true);
    } catch (e: any) {
      setErrors({ form: e.message || "Er ging iets mis. Probeer opnieuw." });
    } finally {
      setSubmitting(false);
    }
  };

  // Calendar custom dark styling
  const calendarClassNames = {
    months: "flex flex-col space-y-4",
    month: "space-y-3",
    caption: "flex justify-center pt-1 relative items-center text-white",
    caption_label: "text-sm font-semibold tracking-wide",
    nav_button: "h-7 w-7 bg-transparent p-0 rounded-md border border-white/10 text-white/70 hover:text-white hover:border-white/30 inline-flex items-center justify-center transition-colors",
    nav_button_previous: "absolute left-1",
    nav_button_next: "absolute right-1",
    table: "w-full border-collapse",
    head_row: "flex",
    head_cell: "text-white/40 rounded-md w-9 h-8 font-normal text-[10px] tracking-[0.14em] uppercase inline-flex items-center justify-center",
    row: "flex w-full mt-1",
    cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
    day: "h-9 w-9 p-0 font-normal text-white/85 rounded-md inline-flex items-center justify-center hover:bg-white/8 transition-colors",
    day_selected: "!bg-amber-400 !text-background hover:!bg-amber-400 font-semibold rounded-md",
    day_today: "text-amber-400 font-semibold",
    day_outside: "text-white/15",
    day_disabled: "text-white/15 line-through hover:bg-transparent cursor-not-allowed",
    day_hidden: "invisible",
  } as any;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#0c0c0c] border-white/10 text-white max-h-[92vh] overflow-y-auto p-0">
        {/* Progress header */}
        <div className="border-b border-white/10 px-6 pt-6 pb-5">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {done ? "Afspraak bevestigd" : "Afspraak inplannen"}
            </DialogTitle>
            <DialogDescription className="text-white/55 text-sm">
              {done ? `U ontvangt een bevestigingsmail op ${form.email}.` : `${summary} — €${totalPrice} • ${fmtMin(totalMinuten)}`}
            </DialogDescription>
          </DialogHeader>
          {!done && (
            <div className="flex items-center gap-2 mt-4">
              {[1, 2].map((n) => (
                <div key={n} className="flex-1 flex items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold transition-colors",
                    step >= n ? "bg-amber-400 text-background" : "bg-white/5 text-white/40 border border-white/10",
                  )}>{n}</span>
                  <span className={cn("text-[11px] uppercase tracking-[0.14em]", step >= n ? "text-white" : "text-white/40")}>
                    {n === 1 ? "Datum & tijd" : "Uw gegevens"}
                  </span>
                  <div className={cn("flex-1 h-px ml-2", step > n ? "bg-amber-400" : "bg-white/10")} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-6">
          {done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center mb-4">
                <Check className="w-7 h-7" />
              </div>
              <p className="text-white/80 text-sm mb-1 font-medium">
                {date && startMin !== null && `${format(date, "EEEE d MMMM yyyy", { locale: nl })}`}
              </p>
              <p className="text-amber-400 text-lg font-display font-semibold mb-5">
                {startMin !== null && minToTime(startMin)} — {startMin !== null && minToTime(startMin + totalMinuten)}
              </p>
              <div className="max-w-md mx-auto bg-white/[0.03] border border-white/10 rounded-xl p-4 text-left mb-5 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-white/50">Pakket</span><span className="font-medium">{pakket}</span></div>
                <div className="flex justify-between"><span className="text-white/50">Voertuig</span><span>{voertuigType}</span></div>
                {extras.length > 0 && (
                  <div className="flex justify-between gap-3"><span className="text-white/50 flex-shrink-0">Extras</span><span className="text-right">{extras.join(", ")}</span></div>
                )}
                <div className="flex justify-between pt-2 border-t border-white/10"><span className="text-white/50">Totaal</span><span className="text-amber-400 font-semibold">€{totalPrice}</span></div>
              </div>
              <div className="text-xs text-white/60 space-y-1.5 mb-6">
                <p className="flex items-center justify-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Cilinderweg 99, Roelofarendsveen</p>
                <p className="flex items-center justify-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Wij nemen contact met u op ter bevestiging via 06-20686868</p>
              </div>
              <button onClick={() => onOpenChange(false)} className="px-6 py-2.5 bg-amber-400 text-background rounded-[10px] font-semibold text-sm hover:bg-amber-300 transition-colors">
                Sluiten
              </button>
            </div>
          ) : step === 1 ? (
            <div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>Datum</Label>
                  <div className="rounded-xl bg-[#111] border border-white/10 p-2 inline-block w-full">
                    <Calendar
                      mode="single" selected={date} onSelect={setDate}
                      disabled={(d) => d < startOfDay(new Date()) || d.getDay() === 0 || d > addDays(new Date(), 90)}
                      locale={nl}
                      weekStartsOn={1}
                      className="p-2 pointer-events-auto mx-auto"
                      classNames={calendarClassNames}
                    />
                  </div>
                </div>
                <div>
                  <Label>Inlevertijd</Label>
                  {!date && <p className="text-white/40 text-sm py-4">Kies eerst een datum.</p>}
                  {date && (
                    <>
                      <p className="text-xs text-white/55 mb-3">
                        Werkduur: <span className="text-amber-400 font-medium">{fmtMin(totalMinuten)}</span> · ophalen in overleg (vaak dezelfde dag, anders de dag erna)
                      </p>
                      {slots.length === 0 ? (
                        <p className="text-white/50 text-sm py-2">Geen tijden beschikbaar op deze dag.</p>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto pr-1">
                          {slots.map((s) => {
                            const selected = startMin === s.min;
                            return (
                              <button
                                key={s.min}
                                type="button"
                                disabled={!s.available}
                                onClick={() => setStartMin(s.min)}
                                className={cn(
                                  "py-2.5 rounded-lg text-sm font-medium transition-all border tabular-nums",
                                  !s.available && "bg-white/[0.02] text-white/25 border-white/5 cursor-not-allowed line-through",
                                  s.available && selected && "bg-amber-400 text-background border-amber-400 font-semibold",
                                  s.available && !selected && "bg-emerald-500/8 text-emerald-300/90 border-emerald-500/25 hover:border-emerald-400/60 hover:bg-emerald-500/15",
                                )}
                              >{s.label}</button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(2)}
                  disabled={!date || startMin === null}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-[10px] text-sm font-semibold bg-amber-400 text-background hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Volgende <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Voornaam *</Label><Input value={form.voornaam} onChange={(e) => setForm({ ...form, voornaam: e.target.value })} />{errors.voornaam && <p className="text-red-400 text-xs mt-1">{errors.voornaam}</p>}</div>
                <div><Label>Achternaam *</Label><Input value={form.achternaam} onChange={(e) => setForm({ ...form, achternaam: e.target.value })} />{errors.achternaam && <p className="text-red-400 text-xs mt-1">{errors.achternaam}</p>}</div>
                <div><Label>Telefoonnummer *</Label><Input type="tel" value={form.telefoon} onChange={(e) => setForm({ ...form, telefoon: e.target.value })} />{errors.telefoon && <p className="text-red-400 text-xs mt-1">{errors.telefoon}</p>}</div>
                <div><Label>E-mailadres *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />{errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}</div>
              </div>
              <div className="mt-4">
                <Label>Opmerking (optioneel)</Label>
                <Textarea rows={3} value={form.opmerking} onChange={(e) => setForm({ ...form, opmerking: e.target.value })} />
              </div>

              <div className="mt-5 p-4 rounded-lg bg-amber-400/5 border border-amber-400/30">
                <p className="text-[10px] tracking-[0.14em] uppercase text-white/50 mb-2 font-semibold">Uw afspraak</p>
                <p className="text-sm font-semibold">{summary}</p>
                {extras.length > 0 && (
                  <p className="text-xs text-white/65 mt-1">Extras: {extras.join(", ")}</p>
                )}
                <p className="text-xs text-white/70 mt-2">
                  {date && startMin !== null && `${format(date, "EEEE d MMMM yyyy", { locale: nl })} • ${minToTime(startMin)} – ${minToTime(startMin + totalMinuten)}`}
                </p>
                <p className="text-sm text-amber-400 mt-2 font-semibold">€{totalPrice} incl. BTW — afrekenen na de dienst</p>
              </div>

              {errors.form && <p className="text-red-400 text-sm mt-3">{errors.form}</p>}

              <div className="flex justify-between mt-6 gap-3">
                <button onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] text-sm font-semibold bg-white/5 text-white hover:bg-white/10 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Terug
                </button>
                <button onClick={submit} disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-[10px] text-sm font-semibold bg-amber-400 text-background hover:bg-amber-300 disabled:opacity-50 transition-colors">
                  {submitting ? "Bezig..." : "Afspraak bevestigen"}
                </button>
              </div>
            </div>
          )}

          <p className="text-[11px] text-white/40 mt-6 leading-relaxed text-center">
            Alle prijzen zijn inclusief 21% BTW · Locatie: Cilinderweg 99, Roelofarendsveen · Vragen? Bel{" "}
            <a href="tel:+31620686868" className="text-white/70 hover:text-amber-400">06-20686868</a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetailingBookingDialog;

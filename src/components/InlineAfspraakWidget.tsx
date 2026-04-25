import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, Check, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { format, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isBefore, startOfDay } from "date-fns";
import { nl } from "date-fns/locale";

type AfspraakType = "bezichtiging" | "proefrit";

interface Props {
  vehicleId: string;
  merk: string;
  model: string;
  initialOpen?: boolean;
  initialType?: AfspraakType | null;
}

const TIME_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
const TYPE_LABEL: Record<AfspraakType, string> = { bezichtiging: "Bezichtiging", proefrit: "Proefrit" };

const customerSchema = z.object({
  voornaam: z.string().trim().min(1).max(60),
  achternaam: z.string().trim().min(1).max(60),
  telefoon: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(255),
});

const InlineAfspraakWidget = ({ vehicleId, merk, model, initialOpen = false, initialType = null }: Props) => {
  const [open, setOpen] = useState(initialOpen);
  const [type, setType] = useState<AfspraakType | null>(initialType);
  const [monthCursor, setMonthCursor] = useState<Date>(startOfMonth(new Date()));
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [busySlots, setBusySlots] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ voornaam: "", achternaam: "", telefoon: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<null | { naam: string; datumTijd: string }>(null);

  // Fetch busy slots when date changes
  useEffect(() => {
    if (!date) return;
    const dayStart = startOfDay(date);
    const dayEnd = addDays(dayStart, 1);
    supabase
      .from("appointments")
      .select("datum_tijd")
      .eq("vehicle_id", vehicleId)
      .gte("datum_tijd", dayStart.toISOString())
      .lt("datum_tijd", dayEnd.toISOString())
      .neq("status", "geannuleerd")
      .then(({ data }) => {
        const set = new Set<string>();
        (data || []).forEach((a: any) => {
          const d = new Date(a.datum_tijd);
          set.add(format(d, "HH:mm"));
        });
        setBusySlots(set);
      });
  }, [date, vehicleId]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monthCursor), { weekStartsOn: 1 });
    const days: Date[] = [];
    let cur = start;
    while (cur <= end) { days.push(cur); cur = addDays(cur, 1); }
    return days;
  }, [monthCursor]);

  const today = startOfDay(new Date());

  const openWith = (t: AfspraakType | null) => {
    setType(t);
    setOpen(true);
  };

  const reset = () => {
    setOpen(false);
    setType(null);
    setDate(null);
    setTime(null);
    setForm({ voornaam: "", achternaam: "", telefoon: "", email: "" });
    setErr(null);
    setDone(null);
  };

  const submit = async () => {
    setErr(null);
    if (!type || !date || !time) { setErr("Selecteer type, datum en tijd."); return; }
    const ok = customerSchema.safeParse(form);
    if (!ok.success) { setErr("Vul alle gegevens correct in."); return; }

    setSubmitting(true);
    try {
      const [hh, mm] = time.split(":").map(Number);
      const dt = new Date(date); dt.setHours(hh, mm, 0, 0);
      const eind = new Date(dt); eind.setHours(eind.getHours() + 1);

      const { data: inserted, error } = await supabase.from("appointments").insert({
        type, datum_tijd: dt.toISOString(), eind_datum_tijd: eind.toISOString(),
        vehicle_id: vehicleId, status: "gepland", bron: "website", is_aanvraag: false,
        aanvrager_voornaam: form.voornaam, aanvrager_achternaam: form.achternaam,
        aanvrager_telefoon: form.telefoon, aanvrager_email: form.email,
      }).select("id").single();
      if (error) throw error;

      const voertuig = `${merk} ${model}`;
      const datumStr = format(dt, "EEEE d MMMM yyyy", { locale: nl });

      await Promise.all([
        supabase.functions.invoke("send-transactional-email", { body: {
          templateName: "afspraak-bevestiging", recipientEmail: form.email,
          idempotencyKey: `afspraak-bev-${inserted!.id}`,
          templateData: { naam: form.voornaam, type: TYPE_LABEL[type], datum: datumStr, tijdstip: time, voertuig },
        }}),
        supabase.functions.invoke("send-transactional-email", { body: {
          templateName: "afspraak-notificatie-admin", recipientEmail: "info@platinautomotive.nl",
          idempotencyKey: `afspraak-adm-${inserted!.id}`,
          templateData: { isAanvraag: false, type: TYPE_LABEL[type],
            naam: `${form.voornaam} ${form.achternaam}`, email: form.email, telefoon: form.telefoon,
            datum: datumStr, tijdstip: time, voertuig },
        }}),
      ]);

      setDone({ naam: form.voornaam, datumTijd: `${format(dt, "d MMM", { locale: nl })} om ${time}` });
    } catch (e: any) {
      setErr(e?.message || "Er ging iets mis.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
      {!open && (
        <div className="p-4 space-y-3">
          <button
            type="button"
            onClick={() => openWith(null)}
            className="btn-public btn-primary-public w-full"
          >
            <CalendarIcon className="w-4 h-4" />
            Afspraak maken
          </button>
          <div className="flex items-center justify-center gap-4 text-[11px] font-body">
            <button
              onClick={() => openWith("bezichtiging")}
              className="text-muted-foreground hover:text-foreground tracking-wide uppercase transition-colors"
            >
              Bezichtiging
            </button>
            <span className="text-border">·</span>
            <button
              onClick={() => openWith("proefrit")}
              className="text-muted-foreground hover:text-foreground tracking-wide uppercase transition-colors"
            >
              Proefrit
            </button>
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] tracking-[0.15em] uppercase font-body text-muted-foreground">
                  {done ? "Bevestigd" : "Afspraak maken"}
                </p>
                <button onClick={reset} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Sluiten">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {done ? (
                <div className="py-4 text-center space-y-3">
                  <div className="mx-auto w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
                    <Check className="w-5 h-5 text-foreground" />
                  </div>
                  <p className="text-sm font-body text-foreground">
                    Bedankt {done.naam}! Uw {type && TYPE_LABEL[type].toLowerCase()} voor de {merk} {model} op {done.datumTijd} is bevestigd.
                  </p>
                  <p className="text-[11px] font-body text-muted-foreground">U ontvangt een bevestigingsmail.</p>
                  <button onClick={reset} className="btn-public btn-secondary-public mt-2">Sluiten</button>
                </div>
              ) : (
                <>
                  {/* Step 1: type */}
                  {!type && (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setType("bezichtiging")} className="btn-public btn-secondary-public">Bezichtiging</button>
                      <button onClick={() => setType("proefrit")} className="btn-public btn-secondary-public">Proefrit</button>
                    </div>
                  )}

                  {/* Step 2: datum + tijd */}
                  {type && (
                    <div className="space-y-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setMonthCursor((m) => addMonths(m, -1))}
                          disabled={isSameMonth(monthCursor, today)}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                          aria-label="Vorige maand"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-body font-medium text-foreground capitalize">
                          {format(monthCursor, "MMMM yyyy", { locale: nl })}
                        </span>
                        <button
                          onClick={() => setMonthCursor((m) => addMonths(m, 1))}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Volgende maand"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-0.5">
                        {["M", "D", "W", "D", "V", "Z", "Z"].map((d, i) => (
                          <div key={i} className="text-center text-[10px] font-body text-muted-foreground py-1">{d}</div>
                        ))}
                        {calendarDays.map((d) => {
                          const dow = d.getDay(); // 0 = sun
                          const inMonth = isSameMonth(d, monthCursor);
                          const past = isBefore(d, today);
                          const isSunday = dow === 0;
                          const disabled = past || isSunday || !inMonth;
                          const selected = date && isSameDay(d, date);
                          return (
                            <button
                              key={d.toISOString()}
                              disabled={disabled}
                              onClick={() => { setDate(d); setTime(null); }}
                              className={`min-h-[36px] text-xs font-body transition-colors ${
                                disabled ? "text-muted-foreground/30 cursor-not-allowed" :
                                selected ? "bg-foreground text-background" :
                                "text-foreground hover:bg-foreground/10"
                              }`}
                            >
                              {format(d, "d")}
                            </button>
                          );
                        })}
                      </div>

                      {date && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {TIME_SLOTS.map((t) => {
                            const busy = busySlots.has(t);
                            const sel = time === t;
                            return (
                              <button
                                key={t}
                                disabled={busy}
                                onClick={() => setTime(t)}
                                className={`px-3 py-1.5 text-xs font-body rounded-full border transition-colors ${
                                  busy ? "border-border/50 text-muted-foreground/40 cursor-not-allowed line-through" :
                                  sel ? "border-foreground bg-foreground text-background" :
                                  "border-border text-foreground hover:border-foreground"
                                }`}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: gegevens */}
                  {type && date && time && (
                    <div className="space-y-2 pt-3 border-t border-border">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          placeholder="Voornaam"
                          value={form.voornaam}
                          onChange={(e) => setForm({ ...form, voornaam: e.target.value })}
                          className="bg-background border border-border rounded-md px-3 py-2 text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
                        />
                        <input
                          placeholder="Achternaam"
                          value={form.achternaam}
                          onChange={(e) => setForm({ ...form, achternaam: e.target.value })}
                          className="bg-background border border-border rounded-md px-3 py-2 text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
                        />
                      </div>
                      <input
                        placeholder="Telefoonnummer"
                        value={form.telefoon}
                        onChange={(e) => setForm({ ...form, telefoon: e.target.value })}
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
                      />
                      <input
                        type="email"
                        placeholder="E-mailadres"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
                      />

                      {err && <p className="text-[11px] text-destructive font-body">{err}</p>}

                      <button
                        onClick={submit}
                        disabled={submitting}
                        className="btn-public btn-primary-public w-full mt-2"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Bevestig afspraak
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InlineAfspraakWidget;

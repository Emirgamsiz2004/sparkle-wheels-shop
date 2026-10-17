import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar as CalIcon, Check } from "lucide-react";
import { format, addDays, isBefore, startOfDay, isSameDay } from "date-fns";
import { nl } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import MobileBookingSheet from "./MobileBookingSheet";
import { sendLeadToAutoRM } from "@/lib/autorm";
import { Button } from "@/components/ui/button";

interface Props {
  feedId: string;
  merk: string;
  model: string;
  kenteken: string;
}

type AppointmentType = "bezichtiging" | "proefrit";
type Step = 0 | 1 | 2 | 3 | 4;

const TIME_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

const VehicleBookingCard = ({ feedId, merk, model, kenteken }: Props) => {
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const type: AppointmentType = "proefrit";
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [busy, setBusy] = useState<string[]>([]); // HH:MM busy on selected date
  const [form, setForm] = useState({ voornaam: "", achternaam: "", telefoon: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [dbVehicleId, setDbVehicleId] = useState<string | null>(null);
  const [doneInfo, setDoneInfo] = useState<{ datum: string; tijd: string; email: string; type: AppointmentType } | null>(null);
  const stepHistory = useRef<Step[]>([]);

  // Lookup DB vehicle id by kenteken
  useEffect(() => {
    if (!kenteken) return;
    const norm = kenteken.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    supabase.from("vehicles").select("id, kenteken").then(({ data }) => {
      const match = data?.find((v) => (v.kenteken || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase() === norm);
      if (match) setDbVehicleId(match.id);
    });
  }, [kenteken]);

  // Fetch busy slots for this vehicle on selected date
  useEffect(() => {
    if (!date) { setBusy([]); return; }
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
    let q = supabase
      .from("appointments")
      .select("datum_tijd, vehicle_id")
      .gte("datum_tijd", dayStart.toISOString())
      .lte("datum_tijd", dayEnd.toISOString())
      .eq("status", "gepland");
    if (dbVehicleId) q = q.eq("vehicle_id", dbVehicleId);
    q.then(({ data }) => {
      const slots = (data || []).map((a) => {
        const d = new Date(a.datum_tijd);
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      });
      setBusy(slots);
    });
  }, [date, dbVehicleId]);

  const goTo = (next: Step) => {
    setDirection(next > step ? 1 : -1);
    if (next > step) stepHistory.current.push(step);
    setStep(next);
    setErrMsg(null);
  };
  const goBack = () => {
    const prev = stepHistory.current.pop();
    setDirection(-1);
    setStep(prev ?? 1);
    setErrMsg(null);
  };

  const reset = () => {
    setDate(null); setTime(null); setForm({ voornaam: "", achternaam: "", telefoon: "", email: "" });
    setDoneInfo(null); stepHistory.current = []; setDirection(-1); setStep(1);
  };

  const submit = async () => {
    setErrMsg(null);
    if (!type || !date || !time) { setErrMsg("Selecteer type, datum en tijd."); return; }
    if (!form.voornaam || !form.achternaam || !form.telefoon || !form.email) {
      setErrMsg("Vul alle gegevens in."); return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) { setErrMsg("Ongeldig e-mailadres."); return; }
    setSubmitting(true);
    try {
      const [hh, mm] = time.split(":").map(Number);
      const dt = new Date(date); dt.setHours(hh, mm, 0, 0);
      const eind = new Date(dt); eind.setHours(eind.getHours() + 1);
      const voertuig = `${merk} ${model}${kenteken ? ` (${kenteken})` : ""}`;
      const datumStr = format(dt, "EEEE d MMMM yyyy", { locale: nl });

      const { data: inserted, error } = await supabase.from("appointments").insert({
        type, datum_tijd: dt.toISOString(), eind_datum_tijd: eind.toISOString(),
        vehicle_id: dbVehicleId,
        status: "gepland", bron: "website", is_aanvraag: false,
        aanvrager_voornaam: form.voornaam, aanvrager_achternaam: form.achternaam,
        aanvrager_telefoon: form.telefoon, aanvrager_email: form.email,
        notities: dbVehicleId ? null : `Voertuig (geen DB-koppeling): ${voertuig}`,
      }).select("id").single();
      if (error) throw error;

      await sendLeadToAutoRM({
        name: `${form.voornaam} ${form.achternaam}`,
        email: form.email,
        phone: form.telefoon,
        subject: "Bezichtiging / proefrit",
        vehicle: voertuig,
        message: `Afspraak: ${datumStr} om ${time}`,
      });

      await Promise.all([
        supabase.functions.invoke("send-transactional-email", { body: {
          templateName: "afspraak-bevestiging", recipientEmail: form.email,
          idempotencyKey: `afspraak-bev-${inserted.id}`,
          templateData: { naam: form.voornaam, type: "Bezichtiging / proefrit",
            datum: datumStr, tijdstip: time, voertuig },
        }}),
        supabase.functions.invoke("send-transactional-email", { body: {
          templateName: "afspraak-notificatie-admin", recipientEmail: "info@platinautomotive.nl",
          idempotencyKey: `afspraak-adm-${inserted.id}`,
          templateData: { isAanvraag: false, type: "Bezichtiging / proefrit",
            naam: `${form.voornaam} ${form.achternaam}`, email: form.email, telefoon: form.telefoon,
            datum: datumStr, tijdstip: time, voertuig },
        }}),
      ]);

      setDoneInfo({ datum: format(dt, "d MMMM", { locale: nl }), tijd: time, email: form.email, type });
      goTo(4);
    } catch (e: any) {
      setErrMsg(e?.message || "Er ging iets mis.");
    } finally {
      setSubmitting(false);
    }
  };

  // Calendar generation: next 30 days, no Sundays, no past
  const days = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 35 }, (_, i) => addDays(today, i)).filter((d) => d.getDay() !== 0);
  }, []);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };
  const transition = { duration: 0.28, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] };

  const typeLabel = "Bezichtiging / proefrit";

  return (
    <div
      className="relative w-full font-body"
      style={{ minHeight: 400, padding: 4 }}
    >
      <div className="relative overflow-hidden" style={{ minHeight: 360 }}>
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        {step === 1 && (
          <motion.div
            key="s1" custom={direction} variants={slideVariants}
            initial="enter" animate="center" exit="exit" transition={transition}
            className="flex flex-col min-h-[360px]"
          >
            <div className="flex items-center gap-2">
              <CalIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
              <span className="text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-foreground/80 px-2 py-0.5 border border-border rounded">{typeLabel}</span>
            </div>
            <p className="text-[11px] font-body text-muted-foreground mt-3">Kies een datum</p>
            <div className="mt-2 flex-1 overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-5 gap-1.5">
                {days.slice(0, 25).map((d) => {
                  const sel = date && isSameDay(d, date);
                  return (
                    <Button
                      key={d.toISOString()}
                      onClick={() => { setDate(d); goTo(2); }}
                      className={`h-auto rounded-none flex flex-col items-center py-2 border transition-colors ${
                        sel ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/30 text-foreground"
                      }`}
                      style={{ borderRadius: 0 }}
                    >
                      <span className="text-[9px] uppercase tracking-wide opacity-70">{format(d, "EEE", { locale: nl })}</span>
                      <span className="text-sm font-display font-semibold leading-tight">{format(d, "d")}</span>
                      <span className="text-[9px] uppercase opacity-60">{format(d, "MMM", { locale: nl })}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && date && (
          <motion.div
            key="s2" custom={direction} variants={slideVariants}
            initial="enter" animate="center" exit="exit" transition={transition}
            className="flex flex-col min-h-[360px]"
          >
            <div className="flex items-center gap-2">
              <Button onClick={goBack} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /></Button>
              <span className="text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-foreground/80 px-2 py-0.5 border border-border rounded">{typeLabel}</span>
              <span className="text-[10px] font-body text-muted-foreground">{format(date, "EEE d MMM", { locale: nl })}</span>
            </div>
            <p className="text-[11px] font-body text-muted-foreground mt-3">Kies een tijd</p>
            <div className="mt-3 grid grid-cols-3 gap-2 flex-1 content-start">
              {TIME_SLOTS.map((t) => {
                const isBusy = busy.includes(t);
                const sel = time === t;
                return (
                  <Button
                    key={t}
                    disabled={isBusy}
                    onClick={() => { setTime(t); goTo(3); }}
                    className={`py-2.5 h-auto rounded-none text-sm font-display font-medium border transition-colors ${
                      isBusy
                        ? "border-border/50 bg-muted/20 text-muted-foreground/40 cursor-not-allowed line-through"
                        : sel
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground/30 text-foreground"
                    }`}
                    style={{ borderRadius: 0 }}
                  >
                    {t}
                  </Button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="s3" custom={direction} variants={slideVariants}
            initial="enter" animate="center" exit="exit" transition={transition}
            className="flex flex-col min-h-[360px]"
          >
            <div className="flex items-center gap-2">
              <Button onClick={goBack} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /></Button>
              <span className="text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-foreground/80 px-2 py-0.5 border border-border rounded">{typeLabel}</span>
              <span className="text-[10px] font-body text-muted-foreground">{date && format(date, "d MMM", { locale: nl })} · {time}</span>
            </div>
            <div className="mt-3 flex-1 flex flex-col gap-2 overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-2 gap-2">
                <input value={form.voornaam} onChange={(e) => setForm({ ...form, voornaam: e.target.value })}
                  placeholder="Voornaam" className="px-3 py-2 text-sm bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:border-foreground/30 outline-none transition-colors" style={{ borderRadius: 0 }} />
                <input value={form.achternaam} onChange={(e) => setForm({ ...form, achternaam: e.target.value })}
                  placeholder="Achternaam" className="px-3 py-2 text-sm bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:border-foreground/30 outline-none transition-colors" style={{ borderRadius: 0 }} />
              </div>
              <input value={form.telefoon} onChange={(e) => setForm({ ...form, telefoon: e.target.value })}
                placeholder="Telefoonnummer" type="tel" className="px-3 py-2 text-sm bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:border-foreground/30 outline-none transition-colors" style={{ borderRadius: 0 }} />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="E-mailadres" type="email" className="px-3 py-2 text-sm bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:border-foreground/30 outline-none transition-colors" style={{ borderRadius: 0 }} />
              {errMsg && <p className="text-[11px] text-destructive">{errMsg}</p>}
              <Button
                onClick={submit}
                disabled={submitting}
                className="mt-auto w-full py-3 h-auto rounded-none text-[11px] font-display font-semibold uppercase bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
                style={{ borderRadius: 0 }}
              >
                {submitting ? "Bezig…" : "Bevestig afspraak"}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 4 && doneInfo && (
          <motion.div
            key="s4" custom={direction} variants={slideVariants}
            initial="enter" animate="center" exit="exit" transition={transition}
            className="flex flex-col items-center justify-center text-center px-2 min-h-[360px]"
          >
            <div className="w-14 h-14 rounded-full border-2 border-foreground flex items-center justify-center">
              <Check className="w-7 h-7 text-foreground" />
            </div>
            <p className="text-lg font-display font-bold text-foreground mt-4">Bevestigd!</p>
            <p className="text-[12px] font-body text-muted-foreground mt-2 leading-relaxed">
              Uw bezichtiging / proefrit voor de <span className="text-foreground">{merk} {model}</span> op <span className="text-foreground">{doneInfo.datum}</span> om <span className="text-foreground">{doneInfo.tijd}</span> is ingepland.
            </p>
            <p className="text-[11px] font-body text-muted-foreground mt-2">U ontvangt een bevestigingsmail op <span className="text-foreground">{doneInfo.email}</span>.</p>
            <Button onClick={reset} className="mt-4 text-[11px] font-body underline text-muted-foreground hover:text-foreground">
              Nieuwe afspraak plannen
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

interface MobileBtnProps {
  merk: string;
  model: string;
  kenteken: string;
}

export const VehicleBookingMobileButton = ({ merk, model, kenteken }: MobileBtnProps) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2.5 w-full border-2 border-foreground bg-foreground text-background py-3 text-[11px] font-body font-semibold tracking-[0.15em] uppercase"
      >
        <CalIcon className="w-4 h-4" />
        Afspraak maken
      </Button>
      <MobileBookingSheet
        open={open}
        onClose={() => setOpen(false)}
        preselected={{ merk, model, kenteken }}
      />
    </>
  );
};

export default VehicleBookingCard;

import { useEffect, useState } from "react";
import { format, addDays, isSameDay, startOfDay } from "date-fns";
import { nl } from "date-fns/locale";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const TIMESLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

const customerSchema = z.object({
  voornaam: z.string().trim().min(1, "Vul uw voornaam in").max(60),
  achternaam: z.string().trim().min(1, "Vul uw achternaam in").max(60),
  telefoon: z.string().trim().min(6, "Vul uw telefoonnummer in").max(25),
  email: z.string().trim().email("Vul een geldig e-mailadres in").max(255),
});

export interface DetailingBookingProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  summary: string; // e.g. "Complete Reiniging — Grote auto"
  diensten: string[]; // labels of extras + base
  totalPrice: number;
  geschatteDuur?: number; // minutes
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[10px] tracking-[0.12em] uppercase text-white/50 mb-1.5 font-semibold">{children}</label>
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

const DetailingBookingDialog = ({ open, onOpenChange, summary, diensten, totalPrice, geschatteDuur }: DetailingBookingProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<{ datum_tijd: string }[]>([]);
  const [form, setForm] = useState({ voornaam: "", achternaam: "", telefoon: "", email: "", kenteken: "", opmerking: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep(1); setDate(undefined); setTime(null);
      setForm({ voornaam: "", achternaam: "", telefoon: "", email: "", kenteken: "", opmerking: "" });
      setErrors({}); setDone(false);
    }
  }, [open]);

  // Load booked poetsbeurt slots
  useEffect(() => {
    if (!open) return;
    supabase
      .from("appointments")
      .select("datum_tijd")
      .eq("type", "poetsbeurt")
      .gte("datum_tijd", new Date().toISOString())
      .then(({ data }) => setBookedSlots((data as any) || []));
  }, [open]);

  const slotTaken = (slot: string) => {
    if (!date) return false;
    return bookedSlots.some((b) => {
      const d = new Date(b.datum_tijd);
      return isSameDay(d, date) && format(d, "HH:mm") === slot;
    });
  };

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
    if (!validateCustomer() || !date || !time) return;
    setSubmitting(true);
    try {
      const [hh, mm] = time.split(":").map(Number);
      const dt = new Date(date);
      dt.setHours(hh, mm, 0, 0);
      const eind = new Date(dt);
      eind.setMinutes(eind.getMinutes() + (geschatteDuur || 120));

      const dienstenNotitie = `${summary}\nTotaalprijs: €${totalPrice}\n\nGekozen onderdelen:\n- ${diensten.join("\n- ")}${form.opmerking ? `\n\nOpmerking klant: ${form.opmerking}` : ""}${form.kenteken ? `\n\nKenteken: ${form.kenteken}` : ""}`;

      const { data: inserted, error } = await supabase.from("appointments").insert({
        type: "poetsbeurt",
        datum_tijd: dt.toISOString(),
        eind_datum_tijd: eind.toISOString(),
        status: "gepland",
        bron: "website",
        is_aanvraag: false,
        diensten,
        diensten_notitie: dienstenNotitie,
        geschatte_duur_minuten: geschatteDuur || 120,
        betalingsstatus: "openstaand",
        aanvrager_voornaam: form.voornaam,
        aanvrager_achternaam: form.achternaam,
        aanvrager_telefoon: form.telefoon,
        aanvrager_email: form.email,
        aanvrager_kenteken: form.kenteken || null,
        notities: form.opmerking || null,
        onderwerp: summary,
      } as any).select("id").single();

      if (error) throw error;

      const datumStr = format(dt, "EEEE d MMMM yyyy", { locale: nl });

      await Promise.all([
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "afspraak-bevestiging",
            recipientEmail: form.email,
            idempotencyKey: `afspraak-bev-${inserted!.id}`,
            templateData: {
              naam: form.voornaam,
              type: "Poetsbeurt",
              datum: datumStr,
              tijdstip: time,
              omschrijving: `${summary} — Totaalprijs €${totalPrice} (afrekenen na de dienst).\n\nOnderdelen:\n- ${diensten.join("\n- ")}`,
            },
          },
        }),
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "afspraak-notificatie-admin",
            recipientEmail: "info@platinautomotive.nl",
            idempotencyKey: `afspraak-adm-${inserted!.id}`,
            templateData: {
              isAanvraag: false,
              type: "Poetsbeurt",
              naam: `${form.voornaam} ${form.achternaam}`,
              email: form.email,
              telefoon: form.telefoon,
              datum: datumStr,
              tijdstip: time,
              voertuig: form.kenteken || "",
              opmerking: `${summary} — €${totalPrice}\nOnderdelen: ${diensten.join(", ")}${form.opmerking ? `\nKlant: ${form.opmerking}` : ""}`,
            },
          },
        }),
      ]);
      setDone(true);
    } catch (e: any) {
      setErrors({ form: e.message || "Er ging iets mis. Probeer opnieuw." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#181818] border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {done ? "Afspraak bevestigd" : "Afspraak inplannen"}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {done ? `U ontvangt een bevestigingsmail op ${form.email}.` : `${summary} — €${totalPrice} (afrekenen na de dienst)`}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center mb-4">
              <Check className="w-7 h-7" />
            </div>
            <p className="text-white/70 text-sm mb-6">
              {date && time && `${format(date, "EEEE d MMMM yyyy", { locale: nl })} om ${time}`}
            </p>
            <button onClick={() => onOpenChange(false)} className="px-5 py-2.5 bg-amber-400 text-background rounded-[10px] font-semibold text-sm">
              Sluiten
            </button>
          </div>
        ) : step === 1 ? (
          <div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Datum</Label>
                <Calendar
                  mode="single" selected={date} onSelect={setDate}
                  disabled={(d) => d < startOfDay(new Date()) || d.getDay() === 0 || d > addDays(new Date(), 90)}
                  locale={nl}
                  className={cn("p-3 pointer-events-auto rounded-lg bg-[#0f0f0f] border border-white/10")}
                />
              </div>
              <div>
                <Label>Tijdslot</Label>
                {!date && <p className="text-white/40 text-sm">Kies eerst een datum.</p>}
                {date && (
                  <div className="grid grid-cols-3 gap-2">
                    {TIMESLOTS.map((s) => {
                      const taken = slotTaken(s);
                      return (
                        <button key={s} disabled={taken} onClick={() => setTime(s)}
                          className={cn(
                            "py-2.5 rounded-lg text-sm font-medium transition-all border",
                            taken && "bg-white/5 text-white/30 border-white/5 cursor-not-allowed line-through",
                            !taken && time === s && "bg-amber-400 text-background border-amber-400",
                            !taken && time !== s && "bg-[#0f0f0f] text-white border-white/10 hover:border-amber-400/40",
                          )}
                        >{s}</button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setStep(2)} disabled={!date || !time}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-[10px] text-sm font-semibold bg-amber-400 text-background hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed">
                Volgende <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Voornaam</Label><Input value={form.voornaam} onChange={(e) => setForm({ ...form, voornaam: e.target.value })} />{errors.voornaam && <p className="text-red-400 text-xs mt-1">{errors.voornaam}</p>}</div>
              <div><Label>Achternaam</Label><Input value={form.achternaam} onChange={(e) => setForm({ ...form, achternaam: e.target.value })} />{errors.achternaam && <p className="text-red-400 text-xs mt-1">{errors.achternaam}</p>}</div>
              <div><Label>Telefoon</Label><Input value={form.telefoon} onChange={(e) => setForm({ ...form, telefoon: e.target.value })} />{errors.telefoon && <p className="text-red-400 text-xs mt-1">{errors.telefoon}</p>}</div>
              <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />{errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}</div>
              <div className="sm:col-span-2"><Label>Kenteken (optioneel)</Label><Input value={form.kenteken} onChange={(e) => setForm({ ...form, kenteken: e.target.value.toUpperCase() })} /></div>
            </div>
            <div className="mt-4">
              <Label>Opmerking (optioneel)</Label>
              <Textarea rows={3} value={form.opmerking} onChange={(e) => setForm({ ...form, opmerking: e.target.value })} />
            </div>

            <div className="mt-5 p-4 rounded-lg bg-amber-400/5 border border-amber-400/30">
              <p className="text-xs text-white/60 mb-1">Afspraak</p>
              <p className="text-sm font-semibold">{summary}</p>
              <p className="text-xs text-white/70 mt-1">
                {date && time && `${format(date, "EEEE d MMMM yyyy", { locale: nl })} om ${time}`}
              </p>
              <p className="text-xs text-amber-400 mt-2">Totaalprijs €{totalPrice} — afrekenen na de dienst.</p>
            </div>

            {errors.form && <p className="text-red-400 text-sm mt-3">{errors.form}</p>}

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] text-sm font-semibold bg-white/5 text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4" /> Terug
              </button>
              <button onClick={submit} disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-[10px] text-sm font-semibold bg-amber-400 text-background hover:bg-amber-300 disabled:opacity-50">
                {submitting ? "Bezig..." : "Bevestig afspraak"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DetailingBookingDialog;

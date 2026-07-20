import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, Car, Check, Eye, MessageSquare, Sparkles, Wrench } from "lucide-react";
import { z } from "zod";
import { format, addDays, isSameDay, startOfDay } from "date-fns";
import { nl } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type FlowAType = "bezichtiging_proefrit";
type FlowBType = "poetsbeurt" | "onderhoud" | "anders";
type AppType = FlowAType | FlowBType;

const TIMESLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

const TYPE_LABELS: Record<AppType, string> = {
  bezichtiging_proefrit: "Bezichtiging / proefrit",
  poetsbeurt: "Poetsbeurt",
  onderhoud: "Reparatie / onderhoud",
  anders: "Anders",
};

// Map de klant-optie naar het waarde-veld in de database (blijft "bezichtiging"
// zodat bestaande admin-filters en agenda-logica ongewijzigd blijven).
const DB_TYPE: Record<AppType, string> = {
  bezichtiging_proefrit: "bezichtiging",
  poetsbeurt: "poetsbeurt",
  onderhoud: "onderhoud",
  anders: "anders",
};

const flowAOptions: { type: FlowAType; icon: any; desc: string }[] = [
  { type: "bezichtiging_proefrit", icon: Car, desc: "Bekijk de auto in onze showroom — met optioneel een proefrit ter plekke." },
];
const flowBOptions: { type: FlowBType; icon: any; desc: string }[] = [
  { type: "poetsbeurt", icon: Sparkles, desc: "Detailing en interieurreiniging" },
  { type: "onderhoud", icon: Wrench, desc: "Onderhoud of reparatie" },
  { type: "anders", icon: MessageSquare, desc: "Iets anders bespreken" },
];

const customerSchema = z.object({
  voornaam: z.string().trim().min(1, "Vul uw voornaam in").max(60),
  achternaam: z.string().trim().min(1, "Vul uw achternaam in").max(60),
  telefoon: z.string().trim().min(6, "Vul uw telefoonnummer in").max(25),
  email: z.string().trim().email("Vul een geldig e-mailadres in").max(255),
});

interface Vehicle {
  id: string;
  merk: string;
  model: string;
  bouwjaar: number | null;
  kenteken: string | null;
  kilometerstand: number | null;
}

const StepIndicator = ({ step, total }: { step: number; total: number }) => (
  <div className="flex items-center justify-center gap-2 mb-8">
    {Array.from({ length: total }, (_, i) => (
      <div
        key={i}
        className={cn(
          "h-1 rounded-full transition-all duration-300",
          i + 1 === step ? "w-10 bg-primary" : i + 1 < step ? "w-6 bg-primary/60" : "w-6 bg-white/10"
        )}
      />
    ))}
  </div>
);

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-[#181818] border border-white/10 rounded-xl p-6 md:p-8", className)}>{children}</div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={cn(
      "w-full bg-[#0f0f0f] border border-white/10 rounded-[10px] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/60 transition-colors",
      props.className
    )}
  />
);
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={cn(
      "w-full bg-[#0f0f0f] border border-white/10 rounded-[10px] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/60 transition-colors resize-none",
      props.className
    )}
  />
);
const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[10px] tracking-[0.12em] uppercase text-white/50 mb-1.5 font-semibold">{children}</label>
);

const Afspraak = () => {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<AppType | null>(null);
  const isFlowA = type === "bezichtiging_proefrit";

  // Flow A state — vrij invulveld ipv voertuigkeuze
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [vehicleKleur, setVehicleKleur] = useState("");
  const [vehicleKenteken, setVehicleKenteken] = useState("");
  const [matchedVehicle, setMatchedVehicle] = useState<Vehicle | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<{ datum_tijd: string }[]>([]);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string | null>(null);

  // Customer state
  const [form, setForm] = useState({
    voornaam: "", achternaam: "", telefoon: "", email: "", opmerking: "",
    kenteken: "", omschrijving: "", voorkeursdatum: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Load vehicles when entering flow A step 2
  useEffect(() => {
    if (!isFlowA || step !== 2) return;
    supabase
      .from("vehicles")
      .select("id, merk, model, bouwjaar, kenteken, kilometerstand")
      .in("status", ["beschikbaar", "te_koop"])
      .order("merk")
      .then(({ data }) => setVehicles((data as any) || []));
  }, [isFlowA, step]);

  // Load booked slots wanneer we een echte match hebben (voor slot-blokkade)
  useEffect(() => {
    if (!isFlowA || !matchedVehicle) { setBookedSlots([]); return; }
    supabase
      .from("appointment_slots")
      .select("datum_tijd")
      .eq("vehicle_id", matchedVehicle.id)
      .gte("datum_tijd", new Date().toISOString())
      .then(({ data }) => setBookedSlots((data as any) || []));
  }, [matchedVehicle, isFlowA]);

  const vehicleSuggestions = useMemo(() => {
    const q = vehicleQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return vehicles
      .filter((v) =>
        [v.merk, v.model, v.kenteken, String(v.bouwjaar)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 6);
  }, [vehicles, vehicleQuery]);

  const slotTaken = (slot: string) => {
    if (!date) return false;
    return bookedSlots.some((b) => {
      const d = new Date(b.datum_tijd);
      return isSameDay(d, date) && format(d, "HH:mm") === slot;
    });
  };

  const reset = () => {
    setStep(1); setType(null); setMatchedVehicle(null); setDate(undefined); setTime(null);
    setVehicleQuery(""); setVehicleKleur(""); setVehicleKenteken(""); setShowSuggestions(false);
    setForm({ voornaam: "", achternaam: "", telefoon: "", email: "", opmerking: "", kenteken: "", omschrijving: "", voorkeursdatum: "" });
    setErrors({}); setDone(false);
  };

  const pickType = (t: AppType) => { setType(t); setStep(2); };

  const totalSteps = isFlowA ? 4 : 2;

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

  const submitFlowA = async () => {
    if (!validateCustomer() || !vehicleQuery.trim() || !date || !time || !type) return;
    setSubmitting(true);
    try {
      const [hh, mm] = time.split(":").map(Number);
      const dt = new Date(date);
      dt.setHours(hh, mm, 0, 0);
      const eind = new Date(dt);
      eind.setHours(eind.getHours() + 1);

      const autoDescriptor = [
        `Auto: ${vehicleQuery.trim()}`,
        vehicleKleur.trim() && `Kleur: ${vehicleKleur.trim()}`,
        vehicleKenteken.trim() && `Kenteken: ${vehicleKenteken.trim().toUpperCase()}`,
      ].filter(Boolean).join(" · ");

      const notitie = [autoDescriptor, form.opmerking].filter(Boolean).join("\n");

      const { data: inserted, error } = await supabase.from("appointments").insert({
        type: DB_TYPE[type],
        datum_tijd: dt.toISOString(),
        eind_datum_tijd: eind.toISOString(),
        vehicle_id: matchedVehicle?.id ?? null,
        status: "gepland",
        bron: "website",
        is_aanvraag: false,
        notities: notitie || null,
        aanvrager_voornaam: form.voornaam,
        aanvrager_achternaam: form.achternaam,
        aanvrager_telefoon: form.telefoon,
        aanvrager_email: form.email,
        aanvrager_kenteken: vehicleKenteken.trim().toUpperCase() || null,
      }).select("id").single();

      if (error) throw error;

      const voertuig = matchedVehicle
        ? `${matchedVehicle.merk} ${matchedVehicle.model}${matchedVehicle.kenteken ? ` (${matchedVehicle.kenteken})` : ""}`
        : autoDescriptor.replace(/^Auto: /, "");
      const datumStr = format(dt, "EEEE d MMMM yyyy", { locale: nl });

      await Promise.all([
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "afspraak-bevestiging",
            recipientEmail: form.email,
            idempotencyKey: `afspraak-bev-${inserted!.id}`,
            templateData: {
              naam: form.voornaam, type: TYPE_LABELS[type], datum: datumStr, tijdstip: time, voertuig,
            },
          },
        }),
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "afspraak-notificatie-admin",
            recipientEmail: "info@platinautomotive.nl",
            idempotencyKey: `afspraak-adm-${inserted!.id}`,
            templateData: {
              isAanvraag: false, type: TYPE_LABELS[type],
              naam: `${form.voornaam} ${form.achternaam}`, email: form.email, telefoon: form.telefoon,
              datum: datumStr, tijdstip: time, voertuig, opmerking: form.opmerking,
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

  const submitFlowB = async () => {
    if (!validateCustomer() || !type) return;
    if (!form.omschrijving.trim()) { setErrors({ omschrijving: "Vul een omschrijving in" }); return; }
    setSubmitting(true);
    try {
      const placeholderDt = form.voorkeursdatum
        ? new Date(`${form.voorkeursdatum}T09:00:00`).toISOString()
        : new Date().toISOString();

      const { data: inserted, error } = await supabase.from("appointments").insert({
        type,
        datum_tijd: placeholderDt,
        status: "gepland",
        bron: "website",
        is_aanvraag: true,
        aanvraag_omschrijving: form.omschrijving,
        voorkeursdatum: form.voorkeursdatum || null,
        aanvrager_voornaam: form.voornaam,
        aanvrager_achternaam: form.achternaam,
        aanvrager_telefoon: form.telefoon,
        aanvrager_email: form.email,
        aanvrager_kenteken: form.kenteken || null,
      }).select("id").single();

      if (error) throw error;

      await Promise.all([
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "afspraak-aanvraag-ontvangen",
            recipientEmail: form.email,
            idempotencyKey: `aanvraag-bev-${inserted!.id}`,
            templateData: { naam: form.voornaam },
          },
        }),
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "afspraak-notificatie-admin",
            recipientEmail: "info@platinautomotive.nl",
            idempotencyKey: `aanvraag-adm-${inserted!.id}`,
            templateData: {
              isAanvraag: true, type: TYPE_LABELS[type],
              naam: `${form.voornaam} ${form.achternaam}`, email: form.email, telefoon: form.telefoon,
              kenteken: form.kenteken, omschrijving: form.omschrijving, voorkeursdatum: form.voorkeursdatum,
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

  const Btn = ({ children, onClick, disabled, variant = "primary" }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 px-6 py-3 rounded-[10px] text-sm font-semibold transition-all",
        variant === "primary" && "bg-primary text-primary-foreground hover:opacity-90",
        variant === "ghost" && "bg-white/5 text-white hover:bg-white/10",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Helmet>
        <title>Afspraak maken — Platin Automotive</title>
        <meta name="description" content="Plan online een bezichtiging, proefrit of serviceafspraak bij Platin Automotive in Roelofarendsveen." />
        <link rel="canonical" href="https://www.platinautomotive.nl/afspraak" />
        <meta property="og:title" content="Afspraak maken — Platin Automotive" />
        <meta property="og:description" content="Plan online een bezichtiging, proefrit of serviceafspraak bij Platin Automotive in Roelofarendsveen." />
        <meta property="og:url" content="https://www.platinautomotive.nl/afspraak" />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content="Afspraak maken — Platin Automotive" />
        <meta name="twitter:description" content="Plan online een bezichtiging, proefrit of serviceafspraak bij Platin Automotive in Roelofarendsveen." />

      </Helmet>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-12 md:py-20">
        <header className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
            Afspraak maken
          </h1>
          <p className="text-white/60 text-sm">
            Kies wat u wilt en plan binnen een minuut uw afspraak.
          </p>
        </header>

        {!done && <StepIndicator step={step} total={totalSteps} />}

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center mb-4">
                  <Check className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold mb-2">
                  {isFlowA ? "Uw afspraak is bevestigd!" : "Uw aanvraag is ontvangen!"}
                </h2>
                <p className="text-white/60 text-sm mb-6">
                  {isFlowA
                    ? `U ontvangt een bevestigingsmail op ${form.email}.`
                    : "We nemen binnen 1 uur contact met u op."}
                </p>
                <Btn onClick={reset} variant="ghost">Nieuwe afspraak</Btn>
              </Card>
            </motion.div>
          ) : step === 1 ? (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <div className="mb-6">
                  <p className="text-[11px] tracking-[0.15em] uppercase text-emerald-400 font-semibold mb-3">Direct bevestigd</p>
                  <div className="grid grid-cols-1 gap-3">
                    {flowAOptions.map((opt) => (
                      <button key={opt.type} onClick={() => pickType(opt.type)}
                        className="text-left p-4 rounded-xl border border-white/10 hover:border-primary/40 hover:bg-white/[0.03] transition-all group">
                        <opt.icon className="w-5 h-5 text-primary mb-2" />
                        <div className="font-semibold text-sm">{TYPE_LABELS[opt.type]}</div>
                        <div className="text-xs text-white/50 mt-1">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] tracking-[0.15em] uppercase text-orange-400 font-semibold mb-3">Wij nemen contact op</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {flowBOptions.map((opt) => (
                      <button key={opt.type} onClick={() => pickType(opt.type)}
                        className="text-left p-4 rounded-xl border border-white/10 hover:border-orange-400/40 hover:bg-white/[0.03] transition-all">
                        <opt.icon className="w-5 h-5 text-orange-400 mb-2" />
                        <div className="font-semibold text-sm">{TYPE_LABELS[opt.type]}</div>
                        <div className="text-xs text-white/50 mt-1">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : isFlowA && step === 2 ? (
            <motion.div key="s2a" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <h2 className="text-lg font-semibold mb-1">Welke auto komt u bekijken?</h2>
                <p className="text-xs text-white/50 mb-5">Vul in wat u weet — merk en model volstaan.</p>

                <div className="space-y-4">
                  <div className="relative">
                    <Label>Auto (merk + model) *</Label>
                    <Input
                      placeholder="Bijv. BMW 3-serie"
                      value={vehicleQuery}
                      onChange={(e) => {
                        setVehicleQuery(e.target.value);
                        setMatchedVehicle(null);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    />
                    {showSuggestions && vehicleSuggestions.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-[#0f0f0f] border border-white/10 rounded-[10px] overflow-hidden shadow-2xl max-h-64 overflow-y-auto">
                        <p className="px-3 pt-2 pb-1 text-[10px] tracking-[0.14em] uppercase text-white/40 font-semibold">Uit onze voorraad</p>
                        {vehicleSuggestions.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setVehicleQuery(`${v.merk} ${v.model}${v.bouwjaar ? ` (${v.bouwjaar})` : ""}`);
                              if (v.kenteken) setVehicleKenteken(v.kenteken);
                              setMatchedVehicle(v);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-white/[0.06] transition-colors flex items-center gap-3 border-t border-white/5"
                          >
                            <Car className="w-4 h-4 text-white/40 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">{v.merk} {v.model}</div>
                              <div className="text-xs text-white/50 truncate">
                                {[v.bouwjaar, v.kenteken].filter(Boolean).join(" • ")}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {matchedVehicle && (
                      <p className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Gekoppeld aan onze voorraad
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Kleur (optioneel)</Label>
                      <Input placeholder="Bijv. antraciet" value={vehicleKleur}
                        onChange={(e) => setVehicleKleur(e.target.value)} />
                    </div>
                    <div>
                      <Label>Kenteken (optioneel)</Label>
                      <Input placeholder="XX-000-XX" value={vehicleKenteken}
                        onChange={(e) => setVehicleKenteken(e.target.value.toUpperCase())} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <Btn variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4" /> Terug</Btn>
                  <Btn onClick={() => setStep(3)} disabled={!vehicleQuery.trim()}>Volgende <ArrowRight className="w-4 h-4" /></Btn>
                </div>
              </Card>
            </motion.div>
          ) : isFlowA && step === 3 ? (
            <motion.div key="s3a" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <h2 className="text-lg font-semibold mb-1">Kies datum en tijd</h2>
                <p className="text-xs text-white/50 mb-4">{vehicleQuery || (matchedVehicle ? `${matchedVehicle.merk} ${matchedVehicle.model}` : "")}</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
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
                                !taken && time === s && "bg-primary text-primary-foreground border-primary",
                                !taken && time !== s && "bg-[#0f0f0f] text-white border-white/10 hover:border-primary/40"
                              )}
                            >{s}</button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between mt-6">
                  <Btn variant="ghost" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4" /> Terug</Btn>
                  <Btn onClick={() => setStep(4)} disabled={!date || !time}>Volgende <ArrowRight className="w-4 h-4" /></Btn>
                </div>
              </Card>
            </motion.div>
          ) : isFlowA && step === 4 ? (
            <motion.div key="s4a" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <h2 className="text-lg font-semibold mb-4">Uw gegevens</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Voornaam</Label><Input value={form.voornaam} onChange={(e) => setForm({ ...form, voornaam: e.target.value })} />{errors.voornaam && <p className="text-red-400 text-xs mt-1">{errors.voornaam}</p>}</div>
                  <div><Label>Achternaam</Label><Input value={form.achternaam} onChange={(e) => setForm({ ...form, achternaam: e.target.value })} />{errors.achternaam && <p className="text-red-400 text-xs mt-1">{errors.achternaam}</p>}</div>
                  <div><Label>Telefoon</Label><Input value={form.telefoon} onChange={(e) => setForm({ ...form, telefoon: e.target.value })} />{errors.telefoon && <p className="text-red-400 text-xs mt-1">{errors.telefoon}</p>}</div>
                  <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />{errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}</div>
                </div>
                <div className="mt-4">
                  <Label>Opmerking (optioneel)</Label>
                  <Textarea rows={3} value={form.opmerking} onChange={(e) => setForm({ ...form, opmerking: e.target.value })} />
                </div>
                {errors.form && <p className="text-red-400 text-sm mt-3">{errors.form}</p>}
                <div className="flex justify-between mt-6">
                  <Btn variant="ghost" onClick={() => setStep(3)}><ArrowLeft className="w-4 h-4" /> Terug</Btn>
                  <Btn onClick={submitFlowA} disabled={submitting}>{submitting ? "Bezig..." : "Bevestig afspraak"}</Btn>
                </div>
              </Card>
            </motion.div>
          ) : (
            // Flow B step 2
            <motion.div key="s2b" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <h2 className="text-lg font-semibold mb-1">Uw aanvraag — {type && TYPE_LABELS[type]}</h2>
                <p className="text-xs text-white/50 mb-4">We nemen binnen 1 uur contact met u op.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Voornaam</Label><Input value={form.voornaam} onChange={(e) => setForm({ ...form, voornaam: e.target.value })} />{errors.voornaam && <p className="text-red-400 text-xs mt-1">{errors.voornaam}</p>}</div>
                  <div><Label>Achternaam</Label><Input value={form.achternaam} onChange={(e) => setForm({ ...form, achternaam: e.target.value })} />{errors.achternaam && <p className="text-red-400 text-xs mt-1">{errors.achternaam}</p>}</div>
                  <div><Label>Telefoon</Label><Input value={form.telefoon} onChange={(e) => setForm({ ...form, telefoon: e.target.value })} />{errors.telefoon && <p className="text-red-400 text-xs mt-1">{errors.telefoon}</p>}</div>
                  <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />{errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}</div>
                  <div><Label>Kenteken (optioneel)</Label><Input value={form.kenteken} onChange={(e) => setForm({ ...form, kenteken: e.target.value.toUpperCase() })} /></div>
                  <div><Label>Voorkeursdatum (optioneel)</Label><Input type="date" value={form.voorkeursdatum} onChange={(e) => setForm({ ...form, voorkeursdatum: e.target.value })} /></div>
                </div>
                <div className="mt-4">
                  <Label>Omschrijving werkzaamheden</Label>
                  <Textarea rows={4} value={form.omschrijving} onChange={(e) => setForm({ ...form, omschrijving: e.target.value })} placeholder="Beschrijf kort waar het om gaat..." />
                  {errors.omschrijving && <p className="text-red-400 text-xs mt-1">{errors.omschrijving}</p>}
                </div>
                {errors.form && <p className="text-red-400 text-sm mt-3">{errors.form}</p>}
                <div className="flex justify-between mt-6">
                  <Btn variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4" /> Terug</Btn>
                  <Btn onClick={submitFlowB} disabled={submitting}>{submitting ? "Bezig..." : "Aanvraag versturen"}</Btn>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
};

export default Afspraak;

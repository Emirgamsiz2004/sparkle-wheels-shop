import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalIcon, Car, Check, Eye, MessageSquare, Search, Sparkles, Wrench, X, ArrowLeft } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { nl } from "date-fns/locale";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type FlowAType = "bezichtiging" | "proefrit";
type FlowBType = "poetsbeurt" | "onderhoud" | "anders";
type AppType = FlowAType | FlowBType;

const TIMESLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
const TYPE_LABELS: Record<AppType, string> = {
  bezichtiging: "Bezichtiging",
  proefrit: "Proefrit",
  poetsbeurt: "Poetsbeurt",
  onderhoud: "Reparatie / onderhoud",
  anders: "Anders",
};

const typeOptions: { type: AppType; icon: any }[] = [
  { type: "bezichtiging", icon: Eye },
  { type: "proefrit", icon: Car },
  { type: "poetsbeurt", icon: Sparkles },
  { type: "onderhoud", icon: Wrench },
  { type: "anders", icon: MessageSquare },
];

const customerSchema = z.object({
  voornaam: z.string().trim().min(1).max(60),
  achternaam: z.string().trim().min(1).max(60),
  telefoon: z.string().trim().min(6).max(25),
  email: z.string().trim().email().max(255),
});

interface Vehicle {
  id: string; merk: string; model: string;
  bouwjaar: number | null; kenteken: string | null; kilometerstand: number | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const AfspraakStickyPopover = ({ open, onClose }: Props) => {
  const isMobile = useIsMobile();

  // Step index drives the horizontal pager.
  // Flow A pages: 0=type, 1=voertuig, 2=datum, 3=tijd, 4=gegevens, 5=done
  // Flow B pages: 0=type, 1=gegevens, 2=done
  const [stepIndex, setStepIndex] = useState(0);
  const [type, setType] = useState<AppType | null>(null);
  const isFlowA = type === "bezichtiging" || type === "proefrit";

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [bookedSlots, setBookedSlots] = useState<{ datum_tijd: string }[]>([]);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string | null>(null);

  const [form, setForm] = useState({
    voornaam: "", achternaam: "", telefoon: "", email: "",
    kenteken: "", omschrijving: "", voorkeursdatum: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [doneInfo, setDoneInfo] = useState<{ naam: string; datum?: string; tijd?: string; email: string } | null>(null);

  // Pager refs for height measurement
  const slidesRef = useRef<Array<HTMLDivElement | null>>([]);
  const [pagerHeight, setPagerHeight] = useState<number | "auto">("auto");

  const totalSteps = isFlowA ? 6 : 3;
  const doneIndex = totalSteps - 1;

  // ESC + reset on close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStepIndex(0); setType(null); setSelectedVehicle(null); setDate(undefined);
        setTime(null); setVehicleSearch(""); setSubmitting(false); setErrMsg(null); setDoneInfo(null);
        setForm({ voornaam: "", achternaam: "", telefoon: "", email: "", kenteken: "", omschrijving: "", voorkeursdatum: "" });
      }, 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Load vehicles for flow A
  useEffect(() => {
    if (!open || !isFlowA) return;
    supabase.from("vehicles")
      .select("id, merk, model, bouwjaar, kenteken, kilometerstand")
      .in("status", ["beschikbaar", "te_koop"])
      .order("merk")
      .then(({ data }) => setVehicles((data as any) || []));
  }, [open, isFlowA]);

  useEffect(() => {
    if (!isFlowA || !selectedVehicle) return;
    supabase.from("appointment_slots")
      .select("datum_tijd")
      .eq("vehicle_id", selectedVehicle.id)
      .gte("datum_tijd", new Date().toISOString())
      .then(({ data }) => setBookedSlots((data as any) || []));
  }, [selectedVehicle, isFlowA]);

  const filteredVehicles = useMemo(() => {
    const q = vehicleSearch.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((v) =>
      [v.merk, v.model, v.kenteken, String(v.bouwjaar)].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [vehicles, vehicleSearch]);

  const slotTaken = (slot: string) => {
    if (!date) return false;
    return bookedSlots.some((b) => {
      const d = new Date(b.datum_tijd);
      return isSameDay(d, date) && format(d, "HH:mm") === slot;
    });
  };

  // Measure active slide height for smooth height transitions
  useLayoutEffect(() => {
    const el = slidesRef.current[stepIndex];
    if (!el) return;
    const update = () => {
      const h = el.scrollHeight;
      setPagerHeight(h);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [stepIndex, type, selectedVehicle, date, time, errMsg, vehicles, filteredVehicles, form, doneInfo, isFlowA]);

  const pickType = (t: AppType) => {
    setType(t);
    // For flow A go to vehicle (1), for flow B go to details (1)
    setStepIndex(1);
  };

  const goNext = () => setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  const goBack = () => {
    setErrMsg(null);
    setStepIndex((i) => {
      const next = Math.max(i - 1, 0);
      if (next === 0) setType(null);
      return next;
    });
  };

  const submit = async () => {
    setErrMsg(null);
    const baseValid = customerSchema.safeParse(form);
    if (!baseValid.success) { setErrMsg("Vul alle persoonsgegevens correct in."); return; }

    setSubmitting(true);
    try {
      if (isFlowA) {
        if (!selectedVehicle || !date || !time || !type) { setErrMsg("Selecteer voertuig, datum en tijdstip."); setSubmitting(false); return; }
        const [hh, mm] = time.split(":").map(Number);
        const dt = new Date(date); dt.setHours(hh, mm, 0, 0);
        const eind = new Date(dt); eind.setHours(eind.getHours() + 1);

        const { data: inserted, error } = await supabase.from("appointments").insert({
          type, datum_tijd: dt.toISOString(), eind_datum_tijd: eind.toISOString(),
          vehicle_id: selectedVehicle.id, status: "gepland", bron: "website", is_aanvraag: false,
          aanvrager_voornaam: form.voornaam, aanvrager_achternaam: form.achternaam,
          aanvrager_telefoon: form.telefoon, aanvrager_email: form.email,
        }).select("id").single();
        if (error) throw error;

        const voertuig = `${selectedVehicle.merk} ${selectedVehicle.model}${selectedVehicle.kenteken ? ` (${selectedVehicle.kenteken})` : ""}`;
        const datumStr = format(dt, "EEEE d MMMM yyyy", { locale: nl });

        await Promise.all([
          supabase.functions.invoke("send-transactional-email", { body: {
            templateName: "afspraak-bevestiging", recipientEmail: form.email,
            idempotencyKey: `afspraak-bev-${inserted!.id}`,
            templateData: { naam: form.voornaam, type: TYPE_LABELS[type], datum: datumStr, tijdstip: time, voertuig },
          }}),
          supabase.functions.invoke("send-transactional-email", { body: {
            templateName: "afspraak-notificatie-admin", recipientEmail: "info@platinautomotive.nl",
            idempotencyKey: `afspraak-adm-${inserted!.id}`,
            templateData: { isAanvraag: false, type: TYPE_LABELS[type],
              naam: `${form.voornaam} ${form.achternaam}`, email: form.email, telefoon: form.telefoon,
              datum: datumStr, tijdstip: time, voertuig },
          }}),
        ]);
        setDoneInfo({ naam: form.voornaam, datum: format(dt, "d MMM", { locale: nl }), tijd: time, email: form.email });
      } else {
        if (!type) return;
        if (!form.omschrijving.trim()) { setErrMsg("Vul een omschrijving in."); setSubmitting(false); return; }
        const placeholderDt = form.voorkeursdatum
          ? new Date(`${form.voorkeursdatum}T09:00:00`).toISOString()
          : new Date().toISOString();

        const { data: inserted, error } = await supabase.from("appointments").insert({
          type, datum_tijd: placeholderDt, status: "gepland", bron: "website", is_aanvraag: true,
          aanvraag_omschrijving: form.omschrijving, voorkeursdatum: form.voorkeursdatum || null,
          aanvrager_voornaam: form.voornaam, aanvrager_achternaam: form.achternaam,
          aanvrager_telefoon: form.telefoon, aanvrager_email: form.email,
          aanvrager_kenteken: form.kenteken || null,
        }).select("id").single();
        if (error) throw error;

        await Promise.all([
          supabase.functions.invoke("send-transactional-email", { body: {
            templateName: "afspraak-aanvraag-ontvangen", recipientEmail: form.email,
            idempotencyKey: `aanvraag-bev-${inserted!.id}`,
            templateData: { naam: form.voornaam },
          }}),
          supabase.functions.invoke("send-transactional-email", { body: {
            templateName: "afspraak-notificatie-admin", recipientEmail: "info@platinautomotive.nl",
            idempotencyKey: `aanvraag-adm-${inserted!.id}`,
            templateData: { isAanvraag: true, type: TYPE_LABELS[type],
              naam: `${form.voornaam} ${form.achternaam}`, email: form.email, telefoon: form.telefoon,
              kenteken: form.kenteken, omschrijving: form.omschrijving, voorkeursdatum: form.voorkeursdatum },
          }}),
        ]);
        setDoneInfo({ naam: form.voornaam, email: form.email });
      }
      setStepIndex(doneIndex);
    } catch (e: any) {
      setErrMsg(e?.message || "Er ging iets mis. Probeer opnieuw.");
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-close after 5s on done
  useEffect(() => {
    if (stepIndex !== doneIndex || !doneInfo) return;
    const t = setTimeout(() => onClose(), 5000);
    return () => clearTimeout(t);
  }, [stepIndex, doneIndex, doneInfo, onClose]);

  if (!open) return null;

  // shared field styles
  const fieldCls = "w-full bg-[#0f0f0f] border border-white/10 rounded-[10px] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/60 transition-colors";
  const labelCls = "block text-[10px] tracking-[0.12em] uppercase text-white/50 mb-1 font-semibold";

  const containerClass = isMobile
    ? "fixed left-0 right-0 bottom-0 z-[60] rounded-t-[16px] border-t border-x border-white/10 bg-[#111111] shadow-2xl overflow-hidden"
    : "fixed z-[60] right-8 bottom-8 w-[340px] rounded-[16px] border border-white/10 bg-[#111111] shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden";

  const BackChip = ({ label }: { label: string }) => (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors mb-3"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{label}</span>
    </button>
  );

  // Build step contents
  const slides: React.ReactNode[] = [];

  // Step 0 — Type
  slides.push(
    <div key="type" className="p-5">
      <h3 className="text-base font-semibold text-white mb-1" style={{ fontFamily: "Orbitron, sans-serif" }}>Afspraak maken</h3>
      <p className="text-xs text-white/50 mb-4">Waar kunnen we u mee helpen?</p>
      <ul className="flex flex-col gap-1">
        {typeOptions.map((opt) => (
          <li key={opt.type}>
            <button
              onClick={() => pickType(opt.type)}
              className="w-full flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-white/[0.06]"
            >
              <opt.icon className="w-4 h-4 text-primary shrink-0" />
              <span>{TYPE_LABELS[opt.type]}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  if (isFlowA && type) {
    // Step 1 — Voertuig
    slides.push(
      <div key="voertuig" className="p-5">
        <BackChip label={TYPE_LABELS[type]} />
        <label className={labelCls}>Voertuig</label>
        <div className="relative mb-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            className="w-full bg-[#0f0f0f] border border-white/10 rounded-[10px] pl-9 pr-3 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-primary/60 transition-colors"
            style={{ height: 44 }}
            placeholder="Zoek voertuig..."
            value={vehicleSearch}
            onChange={(e) => setVehicleSearch(e.target.value)}
          />
        </div>
        <div className="rounded-[10px] border border-white/10 bg-[#0f0f0f] overflow-hidden">
          {filteredVehicles.length === 0 && (
            <p className="text-white/40 text-xs text-center py-5">Geen voertuigen.</p>
          )}
          {filteredVehicles.map((v) => {
            const active = selectedVehicle?.id === v.id;
            return (
              <button
                key={v.id}
                onClick={() => { setSelectedVehicle(v); goNext(); }}
                className={cn(
                  "w-full flex items-center gap-3 text-left border-b border-white/5 last:border-b-0 transition-colors",
                  active ? "bg-primary/15" : "hover:bg-white/[0.06]"
                )}
                style={{ minHeight: 52, padding: "14px 16px" }}
              >
                <Car className="w-4 h-4 text-white/40 shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] text-white truncate leading-tight">
                    {v.merk} {v.model}
                  </span>
                  {v.kenteken && (
                    <span className="block text-[13px] text-white/50 truncate leading-tight mt-0.5">
                      {v.kenteken}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );

    // Step 2 — Datum
    slides.push(
      <div key="datum" className="p-5">
        <BackChip label={selectedVehicle ? `${selectedVehicle.merk} ${selectedVehicle.model}` : TYPE_LABELS[type]} />
        <label className={labelCls}>Kies een datum</label>
        <div className="rounded-[10px] border border-white/10 bg-[#0f0f0f] flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => { setDate(d); if (d) goNext(); }}
            locale={nl}
            className="p-2 pointer-events-auto"
            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0)) || d.getDay() === 0}
          />
        </div>
      </div>
    );

    // Step 3 — Tijd
    slides.push(
      <div key="tijd" className="p-5">
        <BackChip label={date ? format(date, "EEEE d MMMM", { locale: nl }) : "Datum"} />
        <label className={labelCls}>Kies een tijdstip</label>
        <div className="grid grid-cols-3 gap-2">
          {TIMESLOTS.map((s) => {
            const taken = slotTaken(s);
            const active = time === s;
            return (
              <button
                key={s}
                disabled={taken}
                onClick={() => { setTime(s); goNext(); }}
                className={cn(
                  "px-2 py-3 rounded-[10px] text-sm font-medium border transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : taken
                    ? "bg-white/[0.03] text-white/25 border-white/5 cursor-not-allowed line-through"
                    : "bg-[#0f0f0f] text-white border-white/10 hover:border-primary/40"
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
    );

    // Step 4 — Gegevens
    slides.push(
      <div key="gegevens" className="p-5 space-y-3">
        <BackChip label={time || "Tijd"} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Voornaam</label>
            <input className={fieldCls} value={form.voornaam} onChange={(e) => setForm({ ...form, voornaam: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Achternaam</label>
            <input className={fieldCls} value={form.achternaam} onChange={(e) => setForm({ ...form, achternaam: e.target.value })} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Telefoon</label>
          <input type="tel" className={fieldCls} value={form.telefoon} onChange={(e) => setForm({ ...form, telefoon: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>E-mail</label>
          <input type="email" className={fieldCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>

        {errMsg && <p className="text-xs text-red-400">{errMsg}</p>}

        <button
          onClick={submit}
          disabled={submitting}
          className={cn(
            "w-full mt-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] text-sm font-semibold transition-all",
            "bg-primary text-primary-foreground hover:opacity-90",
            submitting && "opacity-60 cursor-not-allowed"
          )}
        >
          {submitting ? "Bezig..." : "Bevestig afspraak"}
        </button>
      </div>
    );
  }

  if (!isFlowA && type) {
    // Step 1 — Aanvraag gegevens
    slides.push(
      <div key="aanvraag" className="p-5 space-y-3">
        <BackChip label={TYPE_LABELS[type]} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Voornaam</label>
            <input className={fieldCls} value={form.voornaam} onChange={(e) => setForm({ ...form, voornaam: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Achternaam</label>
            <input className={fieldCls} value={form.achternaam} onChange={(e) => setForm({ ...form, achternaam: e.target.value })} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Telefoon</label>
          <input type="tel" className={fieldCls} value={form.telefoon} onChange={(e) => setForm({ ...form, telefoon: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>E-mail</label>
          <input type="email" className={fieldCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Kenteken (optioneel)</label>
          <input className={fieldCls} value={form.kenteken} onChange={(e) => setForm({ ...form, kenteken: e.target.value.toUpperCase() })} />
        </div>
        <div>
          <label className={labelCls}>Omschrijving *</label>
          <textarea
            rows={3}
            className={cn(fieldCls, "resize-none")}
            value={form.omschrijving}
            onChange={(e) => setForm({ ...form, omschrijving: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>Voorkeursdatum (optioneel)</label>
          <input type="date" className={fieldCls} value={form.voorkeursdatum} onChange={(e) => setForm({ ...form, voorkeursdatum: e.target.value })} />
        </div>

        {errMsg && <p className="text-xs text-red-400">{errMsg}</p>}

        <button
          onClick={submit}
          disabled={submitting}
          className={cn(
            "w-full mt-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] text-sm font-semibold transition-all",
            "bg-primary text-primary-foreground hover:opacity-90",
            submitting && "opacity-60 cursor-not-allowed"
          )}
        >
          {submitting ? "Bezig..." : "Verstuur aanvraag"}
        </button>
      </div>
    );
  }

  // Final step — Done
  slides.push(
    <div key="done" className="p-5 text-center py-6">
      <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center mb-3">
        <Check className="w-7 h-7" />
      </div>
      {doneInfo ? (
        <>
          <h3 className="text-base font-semibold text-white mb-2">Bedankt {doneInfo.naam}!</h3>
          <p className="text-sm text-white/60 mb-5 leading-relaxed">
            {isFlowA
              ? <>Uw afspraak op <span className="text-white">{doneInfo.datum}</span> om <span className="text-white">{doneInfo.tijd}</span> is bevestigd. U ontvangt een bevestigingsmail op <span className="text-white">{doneInfo.email}</span>.</>
              : <>We hebben uw aanvraag ontvangen en nemen binnen 1 uur contact met u op.</>}
          </p>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center px-5 py-2 rounded-[10px] text-sm font-medium bg-white/5 text-white hover:bg-white/10 transition-colors"
          >
            Sluiten
          </button>
        </>
      ) : (
        <p className="text-sm text-white/50">Even geduld...</p>
      )}
    </div>
  );

  // Pad slides array to totalSteps to keep index math stable while type unset
  while (slides.length < totalSteps) {
    slides.push(<div key={`empty-${slides.length}`} className="p-5" />);
  }

  return createPortal(
    <motion.div
      layoutId="afspraak-cta"
      initial={isMobile ? { y: "100%", opacity: 0 } : false}
      animate={isMobile ? { y: 0, opacity: 1 } : undefined}
      exit={isMobile ? { y: "100%", opacity: 0 } : undefined}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className={containerClass}
      style={{
        ...(isMobile ? { paddingBottom: "env(safe-area-inset-bottom, 0px)" } : null),
        borderRadius: 16,
        willChange: "transform",
      }}
      role="dialog"
      aria-label="Afspraak maken"
    >
      {isMobile && (
        <div className="pt-2 pb-1 flex justify-center">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>
      )}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-10 h-8 w-8 inline-flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Sluiten"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Pager viewport — animates height, hides overflow */}
      <div
        style={{
          height: pagerHeight === "auto" ? "auto" : pagerHeight,
          transition: "height 350ms cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
          willChange: "height",
        }}
      >
        {/* Track */}
        <div
          style={{
            display: "flex",
            width: `${totalSteps * 100}%`,
            transform: `translateX(-${(stepIndex * 100) / totalSteps}%)`,
            transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform",
          }}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              ref={(el) => { slidesRef.current[i] = el; }}
              style={{ width: `${100 / totalSteps}%`, flexShrink: 0 }}
              aria-hidden={i !== stepIndex}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>
    </motion.div>,
    document.body
  );
};

export default AfspraakStickyPopover;

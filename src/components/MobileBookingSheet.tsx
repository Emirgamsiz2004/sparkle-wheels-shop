import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import {
  X, ArrowLeft, Eye, Car, Sparkles, Wrench, MessageSquare, Check, Search, Calendar as CalIcon,
} from "lucide-react";
import { format, addDays, startOfDay, isSameDay } from "date-fns";
import { nl } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

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

const directOptions: { type: FlowAType; icon: any; desc: string }[] = [
  { type: "bezichtiging", icon: Eye, desc: "Auto bekijken in onze showroom" },
  { type: "proefrit", icon: Car, desc: "Test een auto op de weg" },
];
const requestOptions: { type: FlowBType; icon: any; desc: string }[] = [
  { type: "poetsbeurt", icon: Sparkles, desc: "Offerte aanvragen" },
  { type: "onderhoud", icon: Wrench, desc: "Offerte aanvragen" },
  { type: "anders", icon: MessageSquare, desc: "Stel uw vraag" },
];

interface PreselectedVehicle {
  id?: string;          // DB vehicles.id (uuid) — optional
  merk: string;
  model: string;
  kenteken: string;
}

interface DBVehicle {
  id: string; merk: string; model: string;
  bouwjaar: number | null; kenteken: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  preselected?: PreselectedVehicle | null;
}

const MobileBookingSheet = ({ open, onClose, preselected = null }: Props) => {
  const [step, setStep] = useState(0); // see step indices below
  const [type, setType] = useState<AppType | null>(null);
  const isFlowA = type === "bezichtiging" || type === "proefrit";

  // Flow A vehicle picking
  const [vehicles, setVehicles] = useState<DBVehicle[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<DBVehicle | PreselectedVehicle | null>(null);

  // Flow A date/time
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [busy, setBusy] = useState<string[]>([]);

  // Form
  const [form, setForm] = useState({
    voornaam: "", achternaam: "", telefoon: "", email: "",
    omschrijving: "", voorkeursdatum: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Reset when closing
  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      setStep(0); setType(null); setSelectedVehicle(null);
      setVehicles([]); setVehicleSearch("");
      setDate(null); setTime(null); setBusy([]);
      setForm({ voornaam: "", achternaam: "", telefoon: "", email: "", omschrijving: "", voorkeursdatum: "" });
      setSubmitting(false); setErrMsg(null); setDone(false);
    }, 350);
    return () => clearTimeout(t);
  }, [open]);

  // Body scroll lock on mobile when open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Load vehicles for flow A (only if no preselected)
  useEffect(() => {
    if (!open || !isFlowA || preselected) return;
    if (vehicles.length > 0) return;
    supabase.from("vehicles")
      .select("id, merk, model, bouwjaar, kenteken")
      .in("status", ["beschikbaar", "te_koop"])
      .order("merk")
      .then(({ data }) => setVehicles((data as any) || []));
  }, [open, isFlowA, preselected, vehicles.length]);

  // Load busy slots for selected vehicle on selected date
  useEffect(() => {
    if (!isFlowA || !date) { setBusy([]); return; }
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
    const vehicleId = (selectedVehicle as DBVehicle | null)?.id;
    let q = supabase
      .from("appointments")
      .select("datum_tijd, vehicle_id")
      .gte("datum_tijd", dayStart.toISOString())
      .lte("datum_tijd", dayEnd.toISOString())
      .eq("status", "gepland");
    if (vehicleId) q = q.eq("vehicle_id", vehicleId);
    q.then(({ data }) => {
      setBusy((data || []).map((a) => {
        const d = new Date(a.datum_tijd);
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      }));
    });
  }, [date, selectedVehicle, isFlowA]);

  const filteredVehicles = useMemo(() => {
    const q = vehicleSearch.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((v) =>
      [v.merk, v.model, v.kenteken, String(v.bouwjaar)].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [vehicles, vehicleSearch]);

  const next30Days = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 35 }, (_, i) => addDays(today, i)).filter((d) => d.getDay() !== 0);
  }, []);

  const pickType = (t: AppType) => {
    setType(t);
    if (t === "bezichtiging" || t === "proefrit") {
      // If preselected vehicle, skip the vehicle pick step
      if (preselected) {
        setSelectedVehicle(preselected);
        setStep(2); // direct to date
      } else {
        setStep(1); // vehicle pick
      }
    } else {
      setStep(1); // request form
    }
    setErrMsg(null);
  };

  const goBack = () => {
    setErrMsg(null);
    if (step <= 1) { setType(null); setStep(0); return; }
    if (isFlowA) {
      // Flow A: 0 type, 1 vehicle, 2 date, 3 time, 4 form, 5 done
      // If preselected, skip vehicle step on the way back too
      if (step === 2 && preselected) { setType(null); setStep(0); return; }
      setStep((s) => s - 1);
    } else {
      setStep((s) => Math.max(0, s - 1));
    }
  };

  const submit = async () => {
    setErrMsg(null);
    if (!form.voornaam.trim() || !form.achternaam.trim() || !form.telefoon.trim() || !form.email.trim()) {
      setErrMsg("Vul alle gegevens in."); return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) { setErrMsg("Ongeldig e-mailadres."); return; }
    setSubmitting(true);
    try {
      if (isFlowA) {
        if (!selectedVehicle || !date || !time || !type) {
          setErrMsg("Selecteer voertuig, datum en tijd."); setSubmitting(false); return;
        }
        const [hh, mm] = time.split(":").map(Number);
        const dt = new Date(date); dt.setHours(hh, mm, 0, 0);
        const eind = new Date(dt); eind.setHours(eind.getHours() + 1);
        const sv = selectedVehicle as DBVehicle | PreselectedVehicle;
        const voertuig = `${sv.merk} ${sv.model}${sv.kenteken ? ` (${sv.kenteken})` : ""}`;
        const datumStr = format(dt, "EEEE d MMMM yyyy", { locale: nl });
        const vehicleId = (sv as DBVehicle).id;

        const { data: inserted, error } = await supabase.from("appointments").insert({
          type, datum_tijd: dt.toISOString(), eind_datum_tijd: eind.toISOString(),
          vehicle_id: vehicleId || null,
          status: "gepland", bron: "website", is_aanvraag: false,
          aanvrager_voornaam: form.voornaam, aanvrager_achternaam: form.achternaam,
          aanvrager_telefoon: form.telefoon, aanvrager_email: form.email,
          notities: vehicleId ? null : `Voertuig (geen DB-koppeling): ${voertuig}`,
        }).select("id").single();
        if (error) throw error;

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
              omschrijving: form.omschrijving, voorkeursdatum: form.voorkeursdatum },
          }}),
        ]);
      }
      setDone(true);
    } catch (e: any) {
      setErrMsg(e?.message || "Er ging iets mis. Probeer opnieuw.");
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-close after 3s on done
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(t);
  }, [done, onClose]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 500) onClose();
  };

  // Render steps as a single content area; horizontal slide between steps
  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  // Determine step content key + slide direction tracker
  const ease: [number, number, number, number] = [0.4, 0, 0.2, 1];

  const renderHeader = (label?: string) => (
    <div className="flex items-center gap-2 px-5 pt-2 pb-3">
      {step > 0 && !done && (
        <button onClick={goBack} className="text-white/60 hover:text-white -ml-1 p-1">
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}
      <span className="text-[10px] tracking-[0.18em] uppercase text-white/60 font-semibold">
        {label || "Afspraak maken"}
      </span>
    </div>
  );

  const fieldCls = "w-full bg-white/[0.04] border border-white/10 rounded-[10px] px-3 py-2.5 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/30 transition-colors";
  const labelCls = "block text-[10px] tracking-[0.12em] uppercase text-white/50 mb-1 font-semibold";

  // ===== Step content =====
  const renderStep = () => {
    if (done) {
      return (
        <div className="px-5 pt-2 pb-8 text-center">
          <div className="w-14 h-14 rounded-full border-2 border-white mx-auto flex items-center justify-center mb-3">
            <Check className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1" style={{ fontFamily: "Orbitron, sans-serif" }}>
            Bedankt {form.voornaam}!
          </h3>
          <p className="text-xs text-white/60 leading-relaxed">
            {isFlowA ? "Uw afspraak is bevestigd." : "We hebben uw aanvraag ontvangen."}
            <br />U ontvangt een bevestiging op {form.email}.
          </p>
        </div>
      );
    }

    // Step 0 — Type list
    if (step === 0 || !type) {
      return (
        <>
          {renderHeader("Waar kunnen we u mee helpen?")}
          <div className="px-2 pb-5">
            <ul className="flex flex-col">
              {directOptions.map((opt) => (
                <li key={opt.type}>
                  <button
                    onClick={() => pickType(opt.type)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-[10px] text-left active:bg-white/[0.08] hover:bg-white/[0.05] transition-colors"
                  >
                    <opt.icon className="w-5 h-5 text-white/80 shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-semibold tracking-[0.1em] uppercase text-white">{TYPE_LABELS[opt.type]}</span>
                      <span className="block text-[11px] text-white/50 mt-0.5">{opt.desc}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="my-2 h-px bg-white/10 mx-3" />
            <ul className="flex flex-col">
              {requestOptions.map((opt) => (
                <li key={opt.type}>
                  <button
                    onClick={() => pickType(opt.type)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-[10px] text-left active:bg-white/[0.08] hover:bg-white/[0.05] transition-colors"
                  >
                    <opt.icon className="w-5 h-5 text-white/80 shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-semibold tracking-[0.1em] uppercase text-white">{TYPE_LABELS[opt.type]}</span>
                      <span className="block text-[11px] text-white/50 mt-0.5">{opt.desc}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      );
    }

    // ===== FLOW A =====
    if (isFlowA) {
      // Step 1 — Voertuig
      if (step === 1) {
        return (
          <>
            {renderHeader(TYPE_LABELS[type])}
            <div className="px-5 pb-5">
              <div className="relative mb-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  className="w-full bg-white/[0.04] border border-white/10 rounded-[10px] pl-9 pr-3 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/30 transition-colors"
                  style={{ height: 44 }}
                  placeholder="Zoek voertuig..."
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                />
              </div>
              <div className="rounded-[10px] border border-white/10 bg-white/[0.02] overflow-hidden max-h-[50vh] overflow-y-auto">
                {filteredVehicles.length === 0 && (
                  <p className="text-white/40 text-xs text-center py-5">Geen voertuigen.</p>
                )}
                {filteredVehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => { setSelectedVehicle(v); setStep(2); }}
                    className="w-full flex items-center gap-3 text-left border-b border-white/5 last:border-b-0 hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors"
                    style={{ minHeight: 52, padding: "12px 14px" }}
                  >
                    <Car className="w-4 h-4 text-white/40 shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px] text-white truncate leading-tight">{v.merk} {v.model}</span>
                      {v.kenteken && (
                        <span className="block text-[12px] text-white/50 truncate leading-tight mt-0.5">{v.kenteken}</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        );
      }

      // Step 2 — Datum
      if (step === 2) {
        const sv = selectedVehicle as PreselectedVehicle | DBVehicle | null;
        return (
          <>
            {renderHeader(sv ? `${sv.merk} ${sv.model}` : TYPE_LABELS[type])}
            <div className="px-5 pb-5">
              <p className={labelCls}>Kies een datum</p>
              <div className="grid grid-cols-5 gap-1.5 max-h-[55vh] overflow-y-auto pr-1">
                {next30Days.slice(0, 25).map((d) => {
                  const sel = date && isSameDay(d, date);
                  return (
                    <button
                      key={d.toISOString()}
                      onClick={() => { setDate(d); setStep(3); }}
                      className={`flex flex-col items-center py-2 rounded-[8px] border transition-colors ${
                        sel ? "border-white bg-white text-black" : "border-white/10 hover:border-white/30 text-white"
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-wide opacity-70">{format(d, "EEE", { locale: nl })}</span>
                      <span className="text-sm font-semibold leading-tight">{format(d, "d")}</span>
                      <span className="text-[9px] uppercase opacity-60">{format(d, "MMM", { locale: nl })}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        );
      }

      // Step 3 — Tijd
      if (step === 3) {
        return (
          <>
            {renderHeader(date ? format(date, "EEE d MMM", { locale: nl }) : "Tijd")}
            <div className="px-5 pb-5">
              <p className={labelCls}>Kies een tijd</p>
              <div className="grid grid-cols-3 gap-2">
                {TIMESLOTS.map((s) => {
                  const taken = busy.includes(s);
                  return (
                    <button
                      key={s}
                      disabled={taken}
                      onClick={() => { setTime(s); setStep(4); }}
                      className={`px-2 py-3 rounded-[10px] text-sm font-medium border transition-colors ${
                        taken
                          ? "bg-white/[0.02] text-white/25 border-white/5 cursor-not-allowed line-through"
                          : "bg-white/[0.04] text-white border-white/10 hover:border-white/30"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        );
      }

      // Step 4 — Gegevens
      if (step === 4) {
        return (
          <>
            {renderHeader(time ? `${date ? format(date, "d MMM", { locale: nl }) : ""} · ${time}` : "Gegevens")}
            <div className="px-5 pb-5 space-y-2.5">
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
              {errMsg && <p className="text-[11px] text-red-400">{errMsg}</p>}
              <button
                onClick={submit}
                disabled={submitting}
                className="w-full mt-1 inline-flex items-center justify-center px-4 py-3 rounded-[10px] text-[12px] font-semibold tracking-[0.15em] uppercase bg-white text-black hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {submitting ? "Bezig..." : "Bevestig"}
              </button>
            </div>
          </>
        );
      }
    }

    // ===== FLOW B (request) =====
    if (!isFlowA && step === 1) {
      return (
        <>
          {renderHeader(TYPE_LABELS[type!])}
          <div className="px-5 pb-5 space-y-2.5">
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
              <label className={labelCls}>Omschrijving</label>
              <textarea
                rows={3}
                className={`${fieldCls} resize-none`}
                value={form.omschrijving}
                onChange={(e) => setForm({ ...form, omschrijving: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Voorkeursdatum (optioneel)</label>
              <input type="date" className={fieldCls} value={form.voorkeursdatum} onChange={(e) => setForm({ ...form, voorkeursdatum: e.target.value })} />
            </div>
            {errMsg && <p className="text-[11px] text-red-400">{errMsg}</p>}
            <button
              onClick={submit}
              disabled={submitting}
              className="w-full mt-1 inline-flex items-center justify-center px-4 py-3 rounded-[10px] text-[12px] font-semibold tracking-[0.15em] uppercase bg-white text-black hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {submitting ? "Bezig..." : "Verstuur aanvraag"}
            </button>
          </div>
        </>
      );
    }

    return null;
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ duration: 0.35, ease }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.25 }}
            onDragEnd={handleDragEnd}
            className="fixed left-0 right-0 bottom-0 z-[80] bg-[#111111] border-t border-x border-white/10 shadow-2xl"
            style={{
              borderTopLeftRadius: 16, borderTopRightRadius: 16,
              maxHeight: "85vh", overflow: "hidden",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
              willChange: "transform",
            }}
            role="dialog"
            aria-label="Afspraak maken"
          >
            {/* Drag handle */}
            <div className="pt-2.5 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 h-8 w-8 inline-flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Sluiten"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Animated-height content area */}
            <AnimatedHeight stepKey={`${step}-${type}-${done}`}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${step}-${type}-${done}`}
                  variants={slideVariants}
                  custom={1}
                  initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.25, ease }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </AnimatedHeight>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default MobileBookingSheet;

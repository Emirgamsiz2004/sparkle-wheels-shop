import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { X, CalendarClock } from "lucide-react";
import {
  APPOINTMENT_ONLY,
  appointmentOnlySignature,
  isAppointmentOnlyActive,
  isAppointmentOnlyUpcoming,
} from "@/config/appointmentOnly";

// Herexporteren zodat bestaande imports blijven werken.
export { isAppointmentOnlyActive as isAppointmentOnlyToday, isAppointmentOnlyUpcoming };

const STORAGE_KEY = "appointment-only-notice-dismissed";

const AppointmentOnlyNotice = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAppointmentOnlyUpcoming()) return;
    if (location.pathname.startsWith("/admin")) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === appointmentOnlySignature) return;
    } catch {
      // ignore
    }
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [location.pathname]);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, appointmentOnlySignature);
    } catch {
      // ignore
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="appointment-only-title"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[420px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
      >
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <button
          onClick={close}
          aria-label="Sluiten"
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-300"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-7 md:p-9">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 mb-5">
            <CalendarClock className="w-5 h-5 text-primary" />
          </div>

          <p className="text-[10px] tracking-[0.35em] uppercase font-body font-medium text-muted-foreground mb-2">
            {APPOINTMENT_ONLY.periodLabel}
          </p>

          <h2
            id="appointment-only-title"
            className="font-display text-xl md:text-2xl font-bold text-foreground tracking-tight mb-3"
          >
            {APPOINTMENT_ONLY.title}
          </h2>

          <p className="text-sm font-body font-light text-muted-foreground leading-relaxed mb-7">
            {APPOINTMENT_ONLY.body}
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <a
              href={APPOINTMENT_ONLY.ctaHref}
              onClick={close}
              className="flex-1 inline-flex items-center justify-center px-5 py-3 rounded-xl bg-foreground text-background text-xs font-semibold tracking-[0.15em] uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            >
              {APPOINTMENT_ONLY.ctaLabel}
            </a>
            <button
              onClick={close}
              className="sm:flex-none inline-flex items-center justify-center px-5 py-3 rounded-xl border border-border text-foreground text-xs font-semibold tracking-[0.15em] uppercase hover:border-foreground transition-all duration-300"
            >
              Sluiten
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentOnlyNotice;

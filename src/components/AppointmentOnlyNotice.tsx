import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { X, CalendarClock } from "lucide-react";

// Tijdelijke melding: pas deze datums aan of zet APPOINTMENT_ONLY_DATES leeg om uit te zetten.
// Formaat: YYYY-MM-DD (lokale datum).
export const APPOINTMENT_ONLY_DATES = ["2026-06-25", "2026-06-26"];

const todayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const isAppointmentOnlyToday = () =>
  APPOINTMENT_ONLY_DATES.includes(todayStr());

export const isAppointmentOnlyUpcoming = () => {
  const today = todayStr();
  return APPOINTMENT_ONLY_DATES.some((d) => d >= today);
};

const STORAGE_KEY = "appointment-only-notice-dismissed-v1";
// Storage value = comma-joined APPOINTMENT_ONLY_DATES; reset wanneer datums veranderen.
const currentSig = APPOINTMENT_ONLY_DATES.join(",");

const AppointmentOnlyNotice = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAppointmentOnlyUpcoming()) return;
    if (location.pathname.startsWith("/admin")) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === currentSig) return;
    } catch {
      // ignore
    }
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [location.pathname]);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, currentSig);
    } catch {
      // ignore
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-300">
        <button
          onClick={close}
          aria-label="Sluiten"
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <CalendarClock className="w-6 h-6 text-primary" />
        </div>

        <h2 className="font-heading text-xl md:text-2xl text-foreground mb-2">
          Donderdag &amp; vrijdag enkel op afspraak
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Aanstaande <strong className="text-foreground">donderdag 25</strong> en{" "}
          <strong className="text-foreground">vrijdag 26 juni</strong> zijn wij uitsluitend
          geopend op afspraak. Plan eenvoudig een moment in dat jou uitkomt.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href="/afspraak"
            onClick={close}
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Afspraak maken
          </a>
          <button
            onClick={close}
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentOnlyNotice;

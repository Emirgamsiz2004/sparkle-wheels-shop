import { CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";
import { APPOINTMENT_ONLY, isAppointmentOnlyActive } from "@/config/appointmentOnly";

/**
 * Compacte inline melding voor pagina's met openingstijden / afspraken.
 * Verdwijnt automatisch zodra de periode voorbij is of `enabled` false staat.
 */
const AppointmentOnlyBanner = ({ className = "" }: { className?: string }) => {
  if (!isAppointmentOnlyActive()) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3.5 ${className}`}
    >
      <CalendarClock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <p className="text-xs md:text-sm font-body font-light text-muted-foreground leading-relaxed">
        <span className="font-medium text-foreground">{APPOINTMENT_ONLY.title}</span>{" "}
        ({APPOINTMENT_ONLY.periodLabel}) — wegens vakantie.{" "}
        <Link
          to={APPOINTMENT_ONLY.ctaHref}
          className="text-foreground underline underline-offset-4 hover:text-primary transition-colors duration-300"
        >
          {APPOINTMENT_ONLY.ctaLabel}
        </Link>
      </p>
    </div>
  );
};

export default AppointmentOnlyBanner;

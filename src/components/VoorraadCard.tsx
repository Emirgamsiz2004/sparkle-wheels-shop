import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, Fuel, Gauge, Car, Settings2 } from "lucide-react";
import type { VoorraadVoertuig } from "@/hooks/useVoorraadFeed";

interface Props {
  voertuig: VoorraadVoertuig;
  index: number;
}

const fmt = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 0 });

const Spec = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) =>
  label ? (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  ) : null;

const VoorraadCard = ({ voertuig, index }: Props) => {
  const title = [voertuig.merk, voertuig.model].filter(Boolean).join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <Link
        to={`/voorraad/${voertuig.id}`}
        className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card hover:border-accent/40 transition-colors duration-300"
      >
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
          {voertuig.afbeelding ? (
            <img
              src={voertuig.afbeelding}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-5 gap-3">
          <h3 className="font-display text-base md:text-lg font-bold text-accent tracking-tight leading-tight line-clamp-1">
            {title || "Onbekend voertuig"}
          </h3>

          {voertuig.type && (
            <p className="text-[11px] text-muted-foreground tracking-wide uppercase -mt-1 line-clamp-1">
              {voertuig.type}
            </p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            <Spec icon={Calendar} label={voertuig.bouwjaar} />
            <Spec icon={Fuel} label={voertuig.brandstof} />
            <Spec icon={Settings2} label={voertuig.transmissie?.replace(/,?\s*\d+\s*versnellingen?/i, "").trim() || ""} />
            <Spec icon={Gauge} label={voertuig.kilometerstand ? `${Number(voertuig.kilometerstand).toLocaleString("nl-NL")} km` : ""} />
            {voertuig.carrosserie && <Spec icon={Car} label={voertuig.carrosserie} />}
          </div>

          <div className="mt-auto pt-3 flex items-end justify-between gap-3">
            <span className="font-display text-xl md:text-2xl font-bold text-accent tracking-tight">
              {voertuig.prijs > 0 ? fmt.format(voertuig.prijs) : "Op aanvraag"}
            </span>

            <span className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 border border-border text-[10px] tracking-[0.15em] uppercase font-body font-semibold text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors duration-300">
              Meer info →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default VoorraadCard;

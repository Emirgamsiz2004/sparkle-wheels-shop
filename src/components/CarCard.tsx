import { Link } from "react-router-dom";
import { Car } from "@/data/cars";
import { Calendar, Gauge, Fuel, Settings2, ShieldCheck, ExternalLink } from "lucide-react";

interface CarCardProps {
  car: Car;
}

const CarCard = ({ car }: CarCardProps) => {
  return (
    <div className="group bg-background flex flex-col h-full">
      <Link
        to={`/voorraad/${car.id}`}
        className="block"
      >
        <div className="aspect-[16/10] overflow-hidden relative">
          <img
            src={car.image}
            alt={car.title}
            className="w-full h-full object-cover transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-500" />
          {car.nap && (
            <span className="absolute top-3 left-3 flex items-center gap-1 bg-background/90 backdrop-blur-sm px-2 py-1 text-[9px] font-body font-semibold tracking-wider uppercase text-foreground">
              <ShieldCheck className="w-3 h-3" />
              NAP
            </span>
          )}
        </div>
        <div className="p-4 md:p-6 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-4">
            <h3 className="text-sm md:text-base font-display font-semibold text-foreground leading-tight">
              {car.title}
            </h3>
            <p className="text-sm md:text-base font-display font-bold text-foreground whitespace-nowrap">
              € {car.price.toLocaleString("nl-NL")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 border-t border-border pt-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-3 h-3 shrink-0" />
              <span className="text-[10px] md:text-[11px] font-body tracking-wide">{car.year}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Gauge className="w-3 h-3 shrink-0" />
              <span className="text-[10px] md:text-[11px] font-body tracking-wide">{car.mileage.toLocaleString("nl-NL")} km</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Settings2 className="w-3 h-3 shrink-0" />
              <span className="text-[10px] md:text-[11px] font-body tracking-wide">{car.transmission}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Fuel className="w-3 h-3 shrink-0" />
              <span className="text-[10px] md:text-[11px] font-body tracking-wide">{car.engine}</span>
            </div>
          </div>
        </div>
      </Link>
      <div className="px-4 md:px-6 pb-4 md:pb-6 mt-auto flex items-center gap-2">
        <Link
          to={`/voorraad/${car.id}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-foreground text-background hover:bg-primary hover:text-primary-foreground px-3 py-2 text-[10px] font-body font-medium tracking-[0.15em] uppercase transition-all"
        >
          Bekijk Details
        </Link>
        <a
          href="https://www.marktplaats.nl"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center justify-center gap-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 px-2.5 py-2 text-[9px] font-body font-medium tracking-[0.1em] uppercase transition-all"
        >
          Marktplaats
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
};

export default CarCard;

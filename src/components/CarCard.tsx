import { Link } from "react-router-dom";
import { Car } from "@/data/cars";
import { Calendar, Gauge, Fuel, Settings2, ShieldCheck } from "lucide-react";

interface CarCardProps {
  car: Car;
}

const CarCard = ({ car }: CarCardProps) => {
  return (
    <Link
      to={`/voorraad/${car.id}`}
      className="group bg-background block h-full flex flex-col"
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
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-sm md:text-base font-display font-semibold text-foreground leading-tight">
            {car.title}
          </h3>
          <p className="text-sm md:text-base font-display font-bold text-foreground whitespace-nowrap">
            € {car.price.toLocaleString("nl-NL")}
          </p>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground border-t border-border pt-3 mt-auto flex-wrap">
          <span className="flex items-center gap-1.5 text-[10px] md:text-[11px] font-body tracking-wide">
            <Calendar className="w-3 h-3" />
            {car.year}
          </span>
          <span className="w-px h-3 bg-border" />
          <span className="flex items-center gap-1.5 text-[10px] md:text-[11px] font-body tracking-wide">
            <Gauge className="w-3 h-3" />
            {car.mileage.toLocaleString("nl-NL")} km
          </span>
          <span className="w-px h-3 bg-border" />
          <span className="flex items-center gap-1.5 text-[10px] md:text-[11px] font-body tracking-wide">
            <Settings2 className="w-3 h-3" />
            {car.transmission}
          </span>
          <span className="w-px h-3 bg-border" />
          <span className="flex items-center gap-1.5 text-[10px] md:text-[11px] font-body tracking-wide">
            <Fuel className="w-3 h-3" />
            {car.engine}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CarCard;
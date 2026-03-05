import { Link } from "react-router-dom";
import { Car } from "@/data/cars";
import { Calendar, Gauge, Fuel } from "lucide-react";

interface CarCardProps {
  car: Car;
}

const CarCard = ({ car }: CarCardProps) => {
  return (
    <Link
      to={`/voorraad/${car.id}`}
      className="group bg-background block"
    >
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={car.image}
          alt={car.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      </div>
      <div className="p-4 md:p-6">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-sm md:text-base font-display font-semibold text-foreground group-hover:text-foreground/80 transition-colors leading-tight">
            {car.title}
          </h3>
          <p className="text-sm md:text-base font-display font-bold text-foreground whitespace-nowrap">
            € {car.price.toLocaleString("nl-NL")}
          </p>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground border-t border-border pt-3">
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
            <Fuel className="w-3 h-3" />
            {car.fuel}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CarCard;
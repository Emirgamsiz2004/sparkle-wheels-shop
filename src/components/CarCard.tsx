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
      <div className="p-6">
        <h3 className="text-base font-display font-semibold text-foreground mb-2 group-hover:text-foreground/80 transition-colors">
          {car.title}
        </h3>
        <p className="text-lg font-display font-bold text-foreground mb-4">
          € {car.price.toLocaleString("nl-NL")}
        </p>
        <div className="flex items-center gap-4 text-muted-foreground">
          <span className="flex items-center gap-1.5 text-[11px] font-body">
            <Calendar className="w-3 h-3" />
            {car.year}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-body">
            <Gauge className="w-3 h-3" />
            {car.mileage.toLocaleString("nl-NL")} km
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-body">
            <Fuel className="w-3 h-3" />
            {car.fuel}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CarCard;
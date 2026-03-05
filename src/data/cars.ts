import car1 from "@/assets/cars/car1.jpg";
import car2 from "@/assets/cars/car2.jpg";
import car3 from "@/assets/cars/car3.jpg";
import car4 from "@/assets/cars/car4.jpg";
import car5 from "@/assets/cars/car5.jpg";
import car6 from "@/assets/cars/car6.jpg";

export interface Car {
  id: string;
  title: string;
  price: number;
  year: number;
  mileage: number;
  fuel: string;
  transmission: string;
  engine: string;
  nap: boolean;
  image: string;
}

export const placeholderCars: Car[] = [
  {
    id: "1",
    title: "Volkswagen Golf 1.4 TSI",
    price: 14950,
    year: 2019,
    mileage: 68000,
    fuel: "Benzine",
    transmission: "Handgeschakeld",
    engine: "1.4 TSI 150pk",
    nap: true,
    image: car1,
  },
  {
    id: "2",
    title: "BMW 320i Sedan M-Sport",
    price: 22950,
    year: 2020,
    mileage: 54000,
    fuel: "Benzine",
    transmission: "Automaat",
    engine: "2.0i 184pk",
    nap: true,
    image: car2,
  },
  {
    id: "3",
    title: "Mercedes-Benz A180 AMG Line",
    price: 19750,
    year: 2021,
    mileage: 42000,
    fuel: "Benzine",
    transmission: "Automaat",
    engine: "1.3 136pk",
    nap: true,
    image: car3,
  },
  {
    id: "4",
    title: "Audi A3 Limousine 35 TFSI",
    price: 21500,
    year: 2020,
    mileage: 61000,
    fuel: "Benzine",
    transmission: "Automaat",
    engine: "1.5 TFSI 150pk",
    nap: true,
    image: car4,
  },
  {
    id: "5",
    title: "Seat Leon 1.5 TSI FR",
    price: 16950,
    year: 2019,
    mileage: 72000,
    fuel: "Benzine",
    transmission: "Handgeschakeld",
    engine: "1.5 TSI 130pk",
    nap: true,
    image: car5,
  },
  {
    id: "6",
    title: "Opel Astra 1.2 Turbo",
    price: 13450,
    year: 2020,
    mileage: 58000,
    fuel: "Benzine",
    transmission: "Handgeschakeld",
    engine: "1.2 Turbo 110pk",
    nap: true,
    image: car6,
  },
];
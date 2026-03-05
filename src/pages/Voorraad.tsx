import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import { placeholderCars } from "@/data/cars";

const Voorraad = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-28 lg:pb-36">
        <div className="container mx-auto px-6 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Terug naar home
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Ons Aanbod
            </p>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground tracking-tight mb-4">
              Voorraad
            </h1>
            <p className="text-muted-foreground font-body font-light max-w-lg">
              Bekijk ons huidige aanbod. Alle auto's zijn gecontroleerd en rijklaar.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {placeholderCars.map((car, i) => (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <CarCard car={car} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Voorraad;
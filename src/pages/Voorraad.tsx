import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import { placeholderCars } from "@/data/cars";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const Voorraad = () => {
  const { data: dbVehicles } = useQuery({
    queryKey: ["voorraad-vehicles"],
    queryFn: async () => {
      const { data: vehicles, error } = await supabase
        .from("vehicles")
        .select("*, vehicle_photos(file_path, is_hoofdfoto, volgorde)")
        .in("status", ["in_voorraad", "in voorraad", "gepubliceerd", "te_koop"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return vehicles;
    },
  });

  const getPhotoUrl = (filePath: string) => {
    if (filePath.startsWith("http")) return filePath;
    return `${SUPABASE_URL}/storage/v1/object/public/vehicle-photos/${filePath}`;
  };

  // Map Supabase vehicles to CarCard format
  const supabaseCars = (dbVehicles ?? []).map((v) => {
    const mainPhoto = v.vehicle_photos?.find((p: any) => p.is_hoofdfoto) ?? v.vehicle_photos?.[0];
    return {
      id: v.id,
      title: `${v.merk} ${v.model}`,
      price: v.verkoopprijs ?? 0,
      year: v.bouwjaar ?? 0,
      mileage: v.kilometerstand ?? 0,
      fuel: v.brandstof ?? "",
      transmission: "",
      engine: v.brandstof ?? "",
      nap: true,
      image: mainPhoto ? getPhotoUrl(mainPhoto.file_path) : "/placeholder.svg",
    };
  });

  // Use DB vehicles if available, otherwise show placeholders
  const cars = supabaseCars.length > 0 ? supabaseCars : placeholderCars;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Occasions Voorraad | Platin Automotive Roelofarendsveen</title>
        <meta name="description" content="Bekijk ons actuele aanbod occasions in Roelofarendsveen. Alle auto's zijn gecontroleerd en rijklaar. Platin Automotive — eerlijke prijzen." />
        <link rel="canonical" href="https://platinautomotive.nl/voorraad" />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <Navbar />

      <section className="pt-32 pb-28 lg:pb-36">
        <div className="container mx-auto px-6 lg:px-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-4">
            <Link to="/" className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground hover:text-foreground transition-colors mb-8">
              <ArrowLeft className="w-3.5 h-3.5" />
              Terug naar home
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mb-16">
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">Ons Aanbod</p>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground tracking-tight mb-4">Voorraad</h1>
            <p className="text-muted-foreground font-body font-light max-w-lg">Bekijk ons huidige aanbod. Alle auto's zijn gecontroleerd en rijklaar.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {cars.map((car, i) => (
              <motion.div key={car.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }}>
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

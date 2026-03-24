import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Voorraad = () => {
  useEffect(() => {
    // jQuery is required by VWE voorraadlijst plugin
    const jquery = document.createElement("script");
    jquery.src = "https://code.jquery.com/jquery-3.3.1.min.js";
    jquery.integrity = "sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=";
    jquery.crossOrigin = "anonymous";
    document.body.appendChild(jquery);

    jquery.onload = () => {
      // Load VWE voorraadlijst script after jQuery is ready
      const vwe = document.createElement("script");
      vwe.src = "//svl.autodealers.nl/jsVoorraadPlugin.ashx?did=91347";
      document.body.appendChild(vwe);
    };

    return () => {
      // Cleanup scripts on unmount
      document.querySelectorAll('script[src*="jquery"], script[src*="autodealers"]').forEach(s => s.remove());
    };
  }, []);

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

          {/* VWE Voorraadlijst container */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            id="svl-container"
            className="min-h-[400px]"
          />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Voorraad;

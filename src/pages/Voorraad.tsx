import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Car, Clock, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Voorraad = () => {
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

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="border border-border rounded-2xl bg-card p-10 md:p-16 lg:p-20 text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-accent/50 flex items-center justify-center">
                <Car className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </div>
            </div>

            <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-3">
              Binnenkort beschikbaar
            </h3>
            <p className="text-muted-foreground font-body font-light max-w-md mx-auto mb-2">
              We werken hard aan het samenstellen van onze voorraad. Binnenkort vind je hier ons actuele aanbod occasions.
            </p>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/70 mb-8">
              <Clock className="w-3.5 h-3.5" />
              <span className="tracking-wide uppercase">Wordt bijgewerkt</span>
            </div>

            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            >
              Neem Contact Op
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Voorraad;

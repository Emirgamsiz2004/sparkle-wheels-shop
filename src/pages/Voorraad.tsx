import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const VWE_IFRAME_SRC = "https://svl.autodealers.nl/occasions.aspx?did=91347&zoek=1";

const Voorraad = () => {
  const [frameHeight, setFrameHeight] = useState(2600);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes("autodealers.nl") || !event.data) return;

      if (event.data.id === "ResizeFrame" && Number(event.data.height) > 150) {
        setFrameHeight(Number(event.data.height) + 20);
      }

      if (event.data.id === "ScrollFrameTop") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Occasions Voorraad | Platin Automotive Roelofarendsveen</title>
        <meta
          name="description"
          content="Bekijk ons actuele aanbod occasions in Roelofarendsveen. Alle auto's zijn gecontroleerd en rijklaar. Platin Automotive — eerlijke prijzen."
        />
        <link rel="canonical" href="https://platinautomotive.nl/voorraad" />
        <meta name="robots" content="index, follow" />
      </Helmet>

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
            className="mb-12"
          >
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Ons Aanbod
            </p>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground tracking-tight mb-4">
              Voorraad
            </h1>
            <p className="text-muted-foreground font-body font-light max-w-2xl">
              Bekijk hieronder direct ons actuele aanbod occasions via onze gekoppelde voorraadlijst.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          >
            <iframe
              id="autodealers_frame"
              title="Platin Automotive voorraadlijst"
              src={VWE_IFRAME_SRC}
              className="w-full border-0 bg-background"
              style={{ height: `${frameHeight}px` }}
              loading="lazy"
            />
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Voorraad;

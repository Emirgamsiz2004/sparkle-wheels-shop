import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VoorraadCard from "@/components/VoorraadCard";
import { useVoorraadFeed } from "@/hooks/useVoorraadFeed";

const Voorraad = () => {
  const { data: voertuigen, isLoading, isError, error } = useVoorraadFeed();

  const beschikbaar = voertuigen?.filter((v) => v.dbStatus !== "verkocht") ?? [];
  const verkocht = voertuigen?.filter((v) => v.dbStatus === "verkocht") ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Occasions Kopen Roelofarendsveen | Platin Automotive</title>
        <meta name="description" content="Bekijk ons actuele aanbod tweedehands auto's. Alle merken, eerlijke prijzen, APK-gekeurd. Platin Automotive in Roelofarendsveen." />
        <link rel="canonical" href="https://platinautomotive.nl/voorraad" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <Navbar />

      <section className="pt-32 pb-28 lg:pb-36">
        <div className="container mx-auto px-6 lg:px-16">
          {/* Back link */}
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

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Voorraad
            </p>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground tracking-tight mb-4">
              Onze auto's
            </h1>
            <p className="text-muted-foreground font-body font-light max-w-2xl">
              Bekijk hieronder ons actuele aanbod occasions — alle auto's zijn gecontroleerd en rijklaar.
            </p>
          </motion.div>

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground font-body">Voorraad laden…</p>
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              <p className="text-sm text-muted-foreground font-body max-w-md">
                De voorraad kon niet geladen worden. Probeer het later opnieuw.
              </p>
              <p className="text-xs text-muted-foreground/60 font-body">
                {(error as Error)?.message}
              </p>
            </div>
          )}

          {/* Available vehicles grid */}
          {beschikbaar.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {beschikbaar.map((v, i) => (
                <VoorraadCard key={v.id} voertuig={v} index={i} />
              ))}
            </div>
          )}

          {/* Empty */}
          {voertuigen && beschikbaar.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
              <p className="text-sm text-muted-foreground font-body">
                Er staan momenteel geen voertuigen in de voorraad.
              </p>
            </div>
          )}

          {/* Sold vehicles section */}
          {verkocht.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-20"
            >
              <div className="mb-10">
                <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
                  Recent verkocht
                </p>
                <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight">
                  Eerder verkocht
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {verkocht.map((v, i) => (
                  <VoorraadCard key={v.id} voertuig={v} index={i} />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Voorraad;

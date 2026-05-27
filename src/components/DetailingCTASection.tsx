import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Calculator, Info, X } from "lucide-react";
import DetailingConfigurator from "./DetailingConfigurator";
import polishImg from "@/assets/detailing/polish.webp";
import foamFrontImg from "@/assets/detailing/foam-front.webp";
import interiorImg from "@/assets/detailing/interior.webp";

const DetailingCTASection = () => {
  const [expanded, setExpanded] = useState(false);
  const configRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    setExpanded((v) => {
      const next = !v;
      if (next && typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
        setTimeout(() => {
          configRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 350);
      }
      return next;
    });
  };

  return (
    <section className="py-16 md:py-24 bg-background border-t border-border">
      <div className="container mx-auto px-6 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden border border-border bg-gradient-to-br from-card via-card to-background"
        >
          {/* Decorative amber accent */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Compact CTA header */}
          <div className="relative p-8 md:p-12 lg:p-16">
            <div className="grid lg:grid-cols-[1.2fr_auto] gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-amber-400">
                    Auto Detailing
                  </p>
                </div>
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground tracking-tight mb-4 leading-tight">
                  Stel uw detailing&shy;pakket samen
                </h2>
                <p className="text-muted-foreground font-body font-light max-w-xl text-base md:text-lg leading-relaxed mb-8">
                  Bereken direct de prijs voor uw voertuig, kies extras en boek
                  eenvoudig een afspraak. Transparant, snel en zonder verrassingen.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="group inline-flex items-center justify-center gap-2 px-6 py-4 bg-amber-400 text-background font-display font-semibold text-sm hover:bg-amber-300 transition-colors"
                  >
                    {expanded ? (
                      <>
                        <X className="w-4 h-4" />
                        Sluit configurator
                      </>
                    ) : (
                      <>
                        <Calculator className="w-4 h-4" />
                        Stel pakket samen
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                  <Link
                    to="/diensten/auto-detailing"
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 border border-border text-foreground font-display font-semibold text-sm hover:border-foreground/40 hover:bg-card transition-colors"
                  >
                    <Info className="w-4 h-4" />
                    Meer informatie
                  </Link>
                </div>
              </div>

              {!expanded && (
                <div className="hidden lg:grid grid-cols-2 grid-rows-2 gap-2 w-[320px] h-[320px]">
                  <div className="row-span-2 overflow-hidden group">
                    <img
                      src={foamFrontImg}
                      alt="Foamwash van een BMW in de detailing studio"
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="overflow-hidden group">
                    <img
                      src={polishImg}
                      alt="Polijstmachine op zwarte autolak"
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="overflow-hidden group">
                    <img
                      src={interiorImg}
                      alt="Gereinigd lederen interieur"
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Expandable configurator */}
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="configurator"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="overflow-hidden border-t border-border"
              >
                <div className="relative">
                  <DetailingConfigurator embedded />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default DetailingCTASection;

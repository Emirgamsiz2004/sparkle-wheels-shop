import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import polishImg from "@/assets/detailing/polish.webp";
import interiorImg from "@/assets/detailing/interior.webp";

const DetailingCTASection = () => {
  return (
    <section className="py-16 md:py-24 bg-background border-t border-border">
      <div className="mx-auto px-5 md:px-[90px] max-w-[1920px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center"
        >
          {/* Text */}
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-amber-400">
                Auto Detailing
              </p>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-5 leading-tight">
              Uw auto als nieuw.
            </h2>
            <p className="text-muted-foreground font-body font-light leading-relaxed mb-8 max-w-xl">
              Interieur, exterieur, polijsten en keramische bescherming — onze
              detailingpakketen maken uw auto weer showroomwaardig. Bereken direct
              de prijs voor uw voertuig.
            </p>
            <Link
              to="/diensten/auto-detailing"
              className="group inline-flex items-center gap-3 bg-foreground text-background px-7 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            >
              Bekijk pakketten
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Images */}
          <div className="grid grid-cols-2 gap-3">
            <div className="row-span-2 overflow-hidden">
              <img
                src={interiorImg}
                alt="Gereinigd lederen interieur"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="overflow-hidden">
              <img
                src={polishImg}
                alt="Polijstmachine op zwarte autolak"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="overflow-hidden bg-card border border-border flex items-center justify-center p-6">
              <p className="text-center text-sm font-display font-semibold text-foreground leading-tight">
                Interieur
                <br />
                <span className="text-muted-foreground font-body font-light">+</span>
                <br />
                Exterieur
                <br />
                <span className="text-muted-foreground font-body font-light">+</span>
                <br />
                Polijsten
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DetailingCTASection;

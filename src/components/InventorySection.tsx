import { motion } from "framer-motion";
import { Car, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const InventorySection = () => {
  return (
    <section id="voorraad" className="py-16 md:py-28 lg:py-36 bg-card">
      <div className="mx-auto px-5 md:px-[90px] max-w-[1920px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16"
        >
          <div>
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Voorraad
            </p>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
              Onze auto's
            </h2>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="border border-border rounded-2xl bg-background p-10 md:p-16 lg:p-20 text-center"
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
  );
};

export default InventorySection;
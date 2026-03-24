import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
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
          <Link
            to="/voorraad"
            className="inline-flex items-center gap-2 mt-6 md:mt-0 text-xs font-semibold tracking-[0.15em] uppercase text-foreground hover:text-primary transition-colors"
          >
            Bekijk alle auto's
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="border border-border rounded-2xl bg-background p-10 md:p-16 lg:p-20 text-center"
        >
          <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-3">
            Op zoek naar een occasion?
          </h3>
          <p className="text-muted-foreground font-body font-light max-w-md mx-auto mb-8">
            Bekijk ons actuele aanbod op de voorraadpagina. Alle auto's zijn gecontroleerd en rijklaar.
          </p>

          <Link
            to="/voorraad"
            className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          >
            Bekijk Voorraad
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default InventorySection;

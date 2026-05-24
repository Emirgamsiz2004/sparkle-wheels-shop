import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ConsignatieSection = () => {
  return (
    <section id="consignatie" className="py-10 md:py-14 bg-card border-y border-border/60">
      <div className="mx-auto px-5 md:px-[90px] max-w-[1920px]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-5"
        >
          <div className="max-w-2xl">
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-2">
              Consignatie
            </p>
            <h2 className="text-xl md:text-2xl font-display font-semibold text-foreground tracking-tight mb-2">
              Uw auto verkopen zonder gedoe?
            </h2>
            <p className="text-sm font-body font-light text-muted-foreground leading-relaxed">
              Wij regelen het volledige verkoopproces — van taxatie tot overdracht. U betaalt pas bij succes.
            </p>
          </div>
          <Link
            to="/consignatie"
            className="group inline-flex items-center gap-2 border border-border/70 hover:border-foreground text-foreground px-5 py-3 text-[11px] font-semibold tracking-[0.15em] uppercase transition-colors shrink-0"
          >
            Meer info
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ConsignatieSection;

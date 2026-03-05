import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Aanmelden",
    description: "Neem contact met ons op en vertel ons over uw auto. Wij reageren binnen 24 uur.",
  },
  {
    number: "02",
    title: "Taxatie",
    description: "Wij bekijken uw auto en geven een eerlijke marktwaarde-indicatie.",
  },
  {
    number: "03",
    title: "Verkoop",
    description: "Wij plaatsen uw auto in ons aanbod en regelen de volledige verkoop voor u.",
  },
];

const ConsignatieSection = () => {
  return (
    <section id="consignatie" className="py-28 lg:py-36 bg-background">
      <div className="container mx-auto px-6 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
            Consignatie
          </p>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
            Wilt u uw auto verkopen?
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-px bg-border">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="bg-card p-10 group"
            >
              <span className="text-[10px] font-body font-medium tracking-[0.3em] text-muted-foreground">
                {step.number}
              </span>
              <h3 className="text-xl font-display font-semibold text-foreground mt-4 mb-3">
                {step.title}
              </h3>
              <p className="text-sm font-body font-light text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12"
        >
          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Meld uw auto aan
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default ConsignatieSection;

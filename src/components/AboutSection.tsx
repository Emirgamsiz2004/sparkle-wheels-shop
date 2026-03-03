import { motion } from "framer-motion";
import { Shield, Heart, Award } from "lucide-react";

const values = [
  { icon: Shield, label: "Betrouwbaar" },
  { icon: Heart, label: "Persoonlijk" },
  { icon: Award, label: "Vakkundig" },
];

const AboutSection = () => {
  return (
    <section id="over-ons" className="py-24 lg:py-32 bg-card">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs tracking-[0.4em] uppercase font-body font-medium text-muted-foreground mb-3">
              Over Ons
            </p>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6 text-foreground">
              Passie voor Auto's
            </h2>
            <p className="text-muted-foreground font-body font-light leading-relaxed mb-4">
              Wij zijn een jong en ambitieus autobedrijf met een passie voor kwaliteit.
              Hoewel we nog aan het begin staan, werken we met dezelfde toewijding en
              professionaliteit als de gevestigde namen in de branche.
            </p>
            <p className="text-muted-foreground font-body font-light leading-relaxed mb-8">
              Bij ons draait alles om eerlijkheid, transparantie en persoonlijke aandacht.
              Of u nu op zoek bent naar een betrouwbare auto, onderhoud nodig heeft of uw
              auto weer als nieuw wilt laten glimmen — wij staan voor u klaar.
            </p>

            <div className="flex gap-8">
              {values.map((v) => (
                <div key={v.label} className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 flex items-center justify-center border border-border">
                    <v.icon className="w-5 h-5 text-foreground/70" />
                  </div>
                  <span className="text-xs tracking-[0.15em] uppercase font-body font-medium text-muted-foreground">
                    {v.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-square bg-secondary border border-border overflow-hidden">
              <div className="w-full h-full flex items-center justify-center bg-gradient-dark">
                <div className="text-center p-8">
                  <p className="text-6xl md:text-8xl font-display font-bold text-foreground">
                    PLA
                  </p>
                  <p className="text-xs tracking-[0.5em] uppercase font-body text-muted-foreground mt-2">
                    Auto's
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-full h-full border border-foreground/10 -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;

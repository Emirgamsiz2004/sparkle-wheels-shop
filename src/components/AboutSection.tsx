import { motion } from "framer-motion";
import aboutImg from "@/assets/about.jpg";

const stats = [
  { value: "100%", label: "Transparant" },
  { value: "∞", label: "Passie" },
  { value: "24/7", label: "Bereikbaar" },
];

const AboutSection = () => {
  return (
    <section id="over-ons" className="py-16 md:py-28 lg:py-36 bg-card">
      <div className="mx-auto px-5 md:px-[90px] max-w-[1920px]">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Over Ons
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-8 text-foreground tracking-tight leading-tight">
              Jong, ambitieus
              <br />
              & gedreven.
            </h2>
            <div className="space-y-4 mb-10">
              <p className="text-muted-foreground font-body font-light leading-relaxed">
                Wij zijn een startend autobedrijf met een grote passie voor kwaliteit.
                Hoewel we nog aan het begin staan, werken we met dezelfde toewijding en
                professionaliteit als de gevestigde namen.
              </p>
              <p className="text-muted-foreground font-body font-light leading-relaxed">
                Eerlijkheid, transparantie en persoonlijke aandacht — dat is waar wij voor staan.
                Of u nu zoekt naar een betrouwbare auto, onderhoud of detailing.
              </p>
            </div>

            <div className="flex gap-8 md:gap-12 pt-8 border-t border-border">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
                    {stat.value}
                  </p>
                  <p className="text-[10px] tracking-[0.3em] uppercase font-body text-muted-foreground">
                    {stat.label}
                  </p>
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
            <div className="aspect-[4/3] lg:aspect-[3/4] overflow-hidden">
              <img
                src={aboutImg}
                alt="Platin Automotive werkplaats Roelofarendsveen"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden lg:block absolute -bottom-4 -right-4 w-full h-full border border-foreground/8 -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
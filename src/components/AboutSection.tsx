import { motion } from "framer-motion";

const stats = [
  { value: "100%", label: "Transparant" },
  { value: "∞", label: "Passie" },
  { value: "24/7", label: "Bereikbaar" },
];

const AboutSection = () => {
  return (
    <section
      id="over-ons"
      className="bg-card border-y border-border/60"
    >
      <div className="mx-auto px-5 md:px-[90px] max-w-[1920px]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6 py-4 md:py-3"
          style={{ minHeight: 64 }}
        >
          <p className="text-xs md:text-sm font-body text-muted-foreground tracking-tight">
            Jong, ambitieus &amp; gedreven autobedrijf in Roelofarendsveen.
          </p>

          <div className="flex items-center divide-x divide-border/60">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-baseline gap-2 px-4 first:pl-0 last:pr-0"
              >
                <span className="text-base md:text-lg font-display font-bold text-foreground leading-none">
                  {stat.value}
                </span>
                <span className="text-[9px] md:text-[10px] tracking-[0.25em] uppercase font-body text-muted-foreground leading-none">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;

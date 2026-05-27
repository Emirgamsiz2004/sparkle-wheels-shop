import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Sparkles, Users } from "lucide-react";

const pillars = [
  {
    icon: ShieldCheck,
    title: "Betrouwbaar",
    text: "RDW-erkend, eerlijke marges en een volledig transparante voertuighistorie.",
  },
  {
    icon: Sparkles,
    title: "Vakmanschap",
    text: "Iedere auto wordt vooraf grondig nagelopen en tot in de finesse gedetailleerd.",
  },
  {
    icon: Users,
    title: "Persoonlijk",
    text: "Een familiair team dat de tijd voor u neemt om u écht verder te helpen.",
  },
];

const HomeAboutSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background border-t border-border">
      <div className="container mx-auto px-6 lg:px-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left — narrative */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-6 space-y-8"
          >
            <div className="space-y-4">
              <span className="block text-[10px] tracking-[0.4em] uppercase font-body font-semibold text-gold">
                Over ons
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground tracking-tight leading-[1.15]">
                Jong, ambitieus &amp;
                <br />
                <span className="text-muted-foreground">
                  met passie voor auto&apos;s.
                </span>
              </h2>
            </div>

            <p className="text-base md:text-lg font-body font-light text-muted-foreground leading-relaxed max-w-xl">
              Platin Automotive is een familiair autobedrijf uit Roelofarendsveen,
              direct aan de A4. We combineren in- en verkoop met detailing,
              consignatie en onderhoud — altijd met een persoonlijke aanpak en oog
              voor detail.
            </p>

            <Link
              to="/over-ons"
              className="group inline-flex items-center gap-3 font-body font-medium"
            >
              <span className="text-sm tracking-[0.2em] uppercase italic text-foreground border-b border-foreground/20 pb-1 transition-colors duration-500 group-hover:border-gold group-hover:text-gold">
                Leer ons kennen
              </span>
              <ArrowRight className="w-4 h-4 text-gold transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Right — pillars */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {pillars.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="group p-6 flex gap-5 items-start bg-foreground/[0.02] border border-foreground/5 hover:bg-foreground/[0.04] transition-all duration-500"
                >
                  <Icon
                    className="w-5 h-5 mt-1 shrink-0 text-muted-foreground group-hover:text-gold transition-colors duration-500"
                    strokeWidth={1.5}
                  />
                  <div>
                    <h3 className="text-sm font-display font-semibold tracking-widest uppercase text-foreground mb-2">
                      {p.title}
                    </h3>
                    <p className="text-sm font-body font-light text-muted-foreground leading-relaxed">
                      {p.text}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeAboutSection;

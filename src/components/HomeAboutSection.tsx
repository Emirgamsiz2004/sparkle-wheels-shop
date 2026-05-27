import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Sparkles, Users } from "lucide-react";

const pillars = [
  {
    icon: ShieldCheck,
    title: "Betrouwbaar",
    text: "RDW-erkend, eerlijke marges en transparante voertuighistorie.",
  },
  {
    icon: Sparkles,
    title: "Vakmanschap",
    text: "Iedere auto wordt vooraf grondig nagelopen en gedetaild.",
  },
  {
    icon: Users,
    title: "Persoonlijk",
    text: "Een familiair team dat de tijd neemt om je écht te helpen.",
  },
];

const HomeAboutSection = () => {
  return (
    <section id="over-ons-home" className="py-20 md:py-28 lg:py-36 bg-background">
      <div className="mx-auto px-5 md:px-[90px] max-w-[1920px]">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left: Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5"
          >
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-4">
              Over ons
            </p>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight leading-[1.05] mb-6">
              Jong, ambitieus &amp; met passie voor auto's.
            </h2>
            <p className="text-base md:text-lg font-body font-light text-muted-foreground leading-relaxed mb-8">
              Platin Automotive is een familiair autobedrijf uit Roelofarendsveen,
              direct aan de A4. We combineren in- en verkoop met detailing,
              consignatie en onderhoud — altijd met een persoonlijke aanpak en
              oog voor detail.
            </p>
            <Link
              to="/over-ons"
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase text-foreground hover:text-primary transition-colors duration-500"
            >
              Leer ons kennen
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>

          {/* Right: Pillars */}
          <div className="lg:col-span-7 grid sm:grid-cols-3 gap-5">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.1 }}
                className="border border-border bg-card rounded-xl p-6 md:p-7 hover:border-primary/60 transition-colors duration-500"
              >
                <p.icon className="w-6 h-6 text-primary mb-5" strokeWidth={1.5} />
                <h3 className="text-base md:text-lg font-display font-bold text-foreground mb-2">
                  {p.title}
                </h3>
                <p className="text-sm font-body font-light text-muted-foreground leading-relaxed">
                  {p.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeAboutSection;

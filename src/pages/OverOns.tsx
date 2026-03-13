import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowRight, Heart, Users, Shield, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import aboutImg from "@/assets/about.jpg";
import heroBg from "@/assets/hero-bg.jpg";

const values = [
  {
    icon: Heart,
    title: "Passie",
    description: "Wat begon als een hobby is uitgegroeid tot een echt bedrijf. Onze liefde voor auto's zit in alles wat we doen.",
  },
  {
    icon: Users,
    title: "Familie",
    description: "Platin Automotive is een familiebedrijf. Dat betekent korte lijnen, persoonlijke aandacht en oprechte betrokkenheid.",
  },
  {
    icon: Shield,
    title: "Vertrouwen",
    description: "Geen verborgen gebreken, geen kleine lettertjes. Eerlijkheid en transparantie staan bij ons voorop.",
  },
  {
    icon: Wrench,
    title: "Vakmanschap",
    description: "Elke auto wordt grondig gecontroleerd en waar nodig hersteld voordat deze bij u op de oprit staat.",
  },
];

const timeline = [
  {
    year: "Het Begin",
    title: "Van hobby naar passie",
    description: "Het begon met het opknappen van auto's in de weekenden. Een hobby die al snel een serieuze passie werd.",
  },
  {
    year: "De Groei",
    title: "Een familiebedrijf",
    description: "Samen met familie hebben we de stap gezet om van onze passie een echt bedrijf te maken. Platin Automotive was geboren.",
  },
  {
    year: "Vandaag",
    title: "Kwaliteit als standaard",
    description: "We staan nu aan de Cilinderweg in Roelofarendsveen met een groeiend aanbod en tevreden klanten. En we zijn nog lang niet klaar.",
  },
];

const OverOns = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBg})` }}
        >
          <div className="absolute inset-0 bg-background/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
        <div className="relative z-10 flex flex-col justify-end h-full container mx-auto px-6 lg:px-16 pb-16 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              Terug naar home
            </Link>
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Over Ons
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground tracking-tight mb-5">
              Gebouwd op
              <br />
              passie.
            </h1>
            <p className="text-muted-foreground font-body font-light max-w-lg leading-relaxed">
              Een familiebedrijf met een grote liefde voor auto's. Geen corporate gedoe — gewoon eerlijke mensen die graag mooie auto's leveren.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story section */}
      <section className="py-16 md:py-28 lg:py-36 bg-card">
        <div className="container mx-auto px-6 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
                Ons Verhaal
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground tracking-tight mb-8 leading-tight">
                Van de garage
                <br />
                naar de showroom.
              </h2>
              <div className="space-y-5">
                <p className="text-muted-foreground font-body font-light leading-relaxed">
                  Platin Automotive is geboren uit een simpele passie: de liefde voor auto's. 
                  Wat begon met het opknappen van auto's in onze vrije tijd, groeide al snel uit 
                  tot iets groters. We merkten dat we niet alleen plezier hadden in het werk, 
                  maar dat mensen ons ook vertrouwden.
                </p>
                <p className="text-muted-foreground font-body font-light leading-relaxed">
                  Als familiebedrijf doen we dingen anders. Geen agressieve verkooppraatjes, 
                  geen druk. Gewoon eerlijk advies, persoonlijke aandacht en auto's waar we 
                  zelf achter staan. Elke auto die we verkopen zou onze eigen familie veilig 
                  van A naar B moeten brengen — dat is onze maatstaf.
                </p>
                <p className="text-muted-foreground font-body font-light leading-relaxed">
                  We zijn jong, ambitieus en we hebben nog een lange weg te gaan. Maar 
                  juist dat maakt ons hongerig om het elke dag beter te doen.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="aspect-[4/3] lg:aspect-[3/4] overflow-hidden">
                <img
                  src={aboutImg}
                  alt="Platin Automotive werkplaats"
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <div className="hidden lg:block absolute -bottom-4 -right-4 w-full h-full border border-foreground/8 -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 md:py-28 lg:py-36 bg-background">
        <div className="container mx-auto px-6 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-12 md:mb-16"
          >
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Ons Pad
            </p>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
              Hoe het begon
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-px bg-border">
            {timeline.map((item, i) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="bg-card p-6 md:p-10 group"
              >
                <span className="text-[10px] font-body font-medium tracking-[0.3em] text-muted-foreground uppercase">
                  {item.year}
                </span>
                <h3 className="text-xl font-display font-semibold text-foreground mt-4 mb-3">
                  {item.title}
                </h3>
                <p className="text-sm font-body font-light text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-28 lg:py-36 bg-card">
        <div className="container mx-auto px-6 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-12 md:mb-16"
          >
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Waar We Voor Staan
            </p>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
              Onze waarden
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-background p-6 md:p-8 group"
              >
                <value.icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground mb-6 transition-colors duration-300" />
                <h3 className="text-base font-display font-semibold text-foreground mb-3">
                  {value.title}
                </h3>
                <p className="text-sm font-body font-light text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-28 lg:py-36 bg-background">
        <div className="container mx-auto px-6 lg:px-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-5">
              Benieuwd naar
              <br />
              ons aanbod?
            </h2>
            <p className="text-muted-foreground font-body font-light max-w-md mx-auto leading-relaxed mb-10">
              Bekijk onze voorraad of neem contact met ons op. We helpen u graag persoonlijk verder.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/voorraad"
                className="group inline-flex items-center gap-3 bg-foreground text-background px-8 py-4 text-xs font-semibold tracking-[0.15em] uppercase hover:bg-foreground/90 transition-all duration-300"
              >
                Bekijk Voorraad
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/contact"
                className="group inline-flex items-center gap-3 border border-foreground/20 hover:border-foreground/50 text-foreground px-8 py-4 text-xs font-semibold tracking-[0.15em] uppercase transition-all duration-300"
              >
                Neem Contact Op
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OverOns;

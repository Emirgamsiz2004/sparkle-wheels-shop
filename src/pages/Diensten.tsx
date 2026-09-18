import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Car, Sparkles, Percent, Wrench, Search, Paintbrush, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import verkoopImg from "@/assets/service-verkoop.webp";
import detailingImg from "@/assets/service-detailing.webp";
import financieringImg from "@/assets/hero-slide-1.webp";
import onderhoudImg from "@/assets/service-onderhoud.webp";
import customizingImg from "@/assets/service-customizing.webp";
import autoZoekenImg from "@/assets/service-zoeken.webp";
import consignatieImg from "@/assets/service-verkoop.webp";

interface MainService {
  title: string;
  href: string;
  description: string;
  image: string;
  icon: React.ElementType;
}

interface SecondaryService {
  title: string;
  href: string;
  description: string;
  image: string;
  icon: React.ElementType;
}

const mainServices: MainService[] = [
  {
    title: "Occasions",
    href: "/voorraad",
    description: "Betrouwbare in- en verkoop van occasions. Persoonlijk advies, eerlijke prijzen en een AutoTrust-garantie op geschikte auto's.",
    image: verkoopImg,
    icon: Car,
  },
  {
    title: "Auto Detailing",
    href: "/diensten/auto-detailing",
    description: "Interieur, exterieur, polijsten en keramische bescherming. Pakketten voor ieder voertuig, van compact tot SUV.",
    image: detailingImg,
    icon: Sparkles,
  },
  {
    title: "Financiering",
    href: "/financiering",
    description: "Zakelijke financial lease, een mogelijkheid met vaste kredietvergoeding en private lease voor auto's uit onze eigen voorraad.",
    image: financieringImg,
    icon: Percent,
  },
];

const secondaryServices: SecondaryService[] = [
  {
    title: "Onderhoud & Reparatie",
    href: "/diensten/onderhoud-reparatie",
    description: "Periodiek onderhoud en kleine reparaties met oog voor detail.",
    image: onderhoudImg,
    icon: Wrench,
  },
  {
    title: "Auto Customizing",
    href: "/diensten/auto-customizing",
    description: "Velgen, wrap, tint en interieur-upgrades naar uw smaak.",
    image: customizingImg,
    icon: Paintbrush,
  },
  {
    title: "Auto op Aanvraag",
    href: "/diensten/auto-zoeken",
    description: "Wij zoeken en onderhandelen voor de auto die u zoekt.",
    image: autoZoekenImg,
    icon: Search,
  },
  {
    title: "Consignatie",
    href: "/consignatie",
    description: "Verkoop uw auto via ons zonder gedoe, tegen een afgesproken opbrengst.",
    image: consignatieImg,
    icon: FileText,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Diensten() {
  return (
    <>
      <Helmet>
        <title>Diensten | Platin Automotive</title>
        <meta
          name="description"
          content="Occasions, detailing, financiering, onderhoud, customizing en consignatie. Ontdek het complete aanbod van Platin Automotive in Roelofarendsveen."
        />
      </Helmet>
      <Navbar />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 bg-card border-b border-border overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
          </div>
          <div className="mx-auto px-5 md:px-[90px] max-w-[1920px] relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
                Wat wij doen
              </p>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-semibold text-foreground tracking-tight max-w-3xl">
                Alles voor uw auto onder één dak.
              </h1>
              <p className="mt-4 md:mt-6 text-base md:text-lg font-body text-muted-foreground max-w-2xl leading-relaxed">
                Onze kern is occasions, detailing en financiering. Daarnaast helpen we u ook met onderhoud, customizing, auto op aanvraag en consignatie.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Main services */}
        <section className="py-16 md:py-24 bg-background">
          <div className="mx-auto px-5 md:px-[90px] max-w-[1920px]">
            <div className="mb-8 md:mb-12">
              <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-2">
                Kern van ons bedrijf
              </p>
              <h2 className="text-xl md:text-3xl font-display font-semibold text-foreground tracking-tight">
                Onze hoofddiensten
              </h2>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-6"
            >
              {mainServices.map((service) => (
                <motion.div
                  key={service.title}
                  variants={itemVariants}
                  className="group bg-card border border-border hover:border-primary/30 transition-colors duration-300"
                >
                  <Link to={service.href} className="block">
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-5 md:p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <service.icon className="w-4 h-4 text-accent" />
                        <h3 className="text-lg md:text-xl font-display font-semibold text-foreground">
                          {service.title}
                        </h3>
                      </div>
                      <p className="text-sm font-body text-muted-foreground leading-relaxed mb-4">
                        {service.description}
                      </p>
                      <span className="inline-flex items-center gap-2 text-[11px] font-body font-semibold tracking-[0.15em] uppercase text-foreground group-hover:text-accent transition-colors duration-300">
                        Bekijk {service.title.toLowerCase()}
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Secondary services */}
        <section className="py-16 md:py-24 bg-card border-y border-border">
          <div className="mx-auto px-5 md:px-[90px] max-w-[1920px]">
            <div className="mb-8 md:mb-12">
              <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-2">
                Daarnaast
              </p>
              <h2 className="text-xl md:text-3xl font-display font-semibold text-foreground tracking-tight">
                Meer mogelijkheden
              </h2>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border"
            >
              {secondaryServices.map((service) => (
                <motion.div
                  key={service.title}
                  variants={itemVariants}
                  className="group bg-background hover:bg-card transition-colors duration-300"
                >
                  <Link to={service.href} className="block h-full p-5 md:p-6">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <service.icon className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors duration-300" />
                        <h3 className="text-sm md:text-base font-display font-semibold text-foreground">
                          {service.title}
                        </h3>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent transition-colors duration-300 shrink-0" />
                    </div>
                    <p className="text-sm font-body text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 bg-background">
          <div className="mx-auto px-5 md:px-[90px] max-w-[1920px]">
            <div className="bg-card border border-border p-8 md:p-12 text-center">
              <h2 className="text-xl md:text-3xl font-display font-semibold text-foreground tracking-tight mb-3">
                Klaar om uw auto naar het volgende niveau te brengen?
              </h2>
              <p className="text-sm md:text-base font-body text-muted-foreground max-w-2xl mx-auto mb-6">
                Of u nu een occasion zoekt, uw auto wilt laten detaillen of een financiering wilt berekenen — we helpen u graag.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/voorraad"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background text-[11px] font-body font-semibold tracking-[0.15em] uppercase hover:bg-foreground/90 transition-colors duration-300"
                >
                  Bekijk voorraad
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border text-[11px] font-body font-semibold tracking-[0.15em] uppercase text-foreground hover:border-primary/30 hover:text-accent transition-colors duration-300"
                >
                  Neem contact op
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

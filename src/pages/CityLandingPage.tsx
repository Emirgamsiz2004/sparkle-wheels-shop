import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, Check, Route, Wrench, ShieldCheck, Sparkles, Settings, Car, Calendar } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

interface CityPageProps {
  city: string;
  metaTitle: string;
  metaDescription: string;
  canonical: string;
  heading: string;
  intro: string;
  bulletHeading?: string;
  bullets: string[];
  outro?: string;
  driveMinutes: number;
  routeDescription: string;
  services?: { label: string; to: string }[];
  whyChooseText?: string;
  detailingSection?: { title: string; text: string };
  onderhoudSection?: { title: string; text: string };
  occasionsSection?: { title: string; text: string };
  appointmentSection?: { title: string; text: string };
}

const defaultServices = [
  { label: "Occasions", to: "/voorraad" },
  { label: "Auto Detailing", to: "/auto-detailing" },
  { label: "Onderhoud & Reparatie", to: "/onderhoud-reparatie" },
  { label: "Financiering", to: "/contact" },
];

const CityLandingPage = ({
  city,
  metaTitle,
  metaDescription,
  canonical,
  heading,
  intro,
  bulletHeading,
  bullets,
  outro,
  driveMinutes,
  routeDescription,
  services = defaultServices,
  whyChooseText,
}: CityPageProps) => {
  const whyText =
    whyChooseText ??
    `Platin Automotive is een RDW-erkend familiebedrijf. U praat direct met de eigenaar — geen verkoopafdeling, geen tussenpersonen. Elke auto die we verkopen wordt geleverd met officiële AutoTrust garantie (BOVAG), zodat klanten uit ${city} met een gerust hart de weg op gaan.`;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <Navbar />

      <section className="pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="container mx-auto px-6 lg:px-16 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              {city}
            </p>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-8">
              {heading}
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {intro.split("\n\n").map((paragraph, i) => (
              <p key={i} className="text-muted-foreground font-body font-light leading-relaxed text-base md:text-lg">
                {paragraph}
              </p>
            ))}

            {bulletHeading && (
              <p className="text-foreground font-body font-semibold text-base md:text-lg pt-2">
                {bulletHeading}
              </p>
            )}

            <ul className="space-y-3">
              {bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-3 text-muted-foreground font-body font-light">
                  <Check className="w-4 h-4 text-primary mt-1 shrink-0" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            {outro && (
              <p className="text-muted-foreground font-body font-light leading-relaxed text-base md:text-lg">
                {outro}
              </p>
            )}

            <div className="border border-border rounded-lg p-6 bg-card mt-8 space-y-3">
              <div className="flex items-center gap-3 text-foreground font-body">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Cilinderweg 99, 2371 DZ Roelofarendsveen</span>
              </div>
              <div className="flex items-center gap-3 text-foreground font-body">
                <Phone className="w-4 h-4 text-primary" />
                <a href="tel:+31717812525" className="hover:text-primary transition-colors">071-781 25 25</a>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button asChild>
                <Link to="/voorraad">Bekijk ons aanbod</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/contact">Neem contact op</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Hoe werkt het */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-6 lg:px-16 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight mb-6">
            Occasions kopen bij {city} — hoe werkt het?
          </h2>
          <div className="space-y-4 text-muted-foreground font-body font-light leading-relaxed text-base md:text-lg">
            <p>
              Wij zijn gevestigd in Roelofarendsveen, op slechts {driveMinutes} minuten rijden van {city}. U maakt vrijblijvend een afspraak, komt langs voor een bezichtiging en neemt rustig de tijd om de auto te bekijken.
            </p>
            <p>
              Gratis proefrit en thuisbezorging zijn mogelijk. Past de auto bij u? Dan regelen we de financiering, garantie en eventuele inruil van uw huidige auto in één afspraak.
            </p>
          </div>
        </div>
      </section>

      {/* Diensten */}
      <section className="py-16 border-t border-border bg-card/30">
        <div className="container mx-auto px-6 lg:px-16 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight mb-6">
            Onze diensten voor klanten uit {city}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((s, i) => (
              <li key={i}>
                <Link
                  to={s.to}
                  className="flex items-center gap-3 p-4 border border-border rounded-lg bg-background hover:border-primary transition-colors text-foreground font-body"
                >
                  <Wrench className="w-4 h-4 text-primary shrink-0" />
                  <span>{s.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Rijroute */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-6 lg:px-16 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight mb-6 flex items-center gap-3">
            <Route className="w-6 h-6 text-primary" />
            Rijroute vanuit {city}
          </h2>
          <p className="text-muted-foreground font-body font-light leading-relaxed text-base md:text-lg">
            {routeDescription}
          </p>
        </div>
      </section>

      {/* Waarom Platin */}
      <section className="py-16 border-t border-border bg-card/30">
        <div className="container mx-auto px-6 lg:px-16 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight mb-6 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Waarom klanten uit {city} voor Platin kiezen
          </h2>
          <p className="text-muted-foreground font-body font-light leading-relaxed text-base md:text-lg">
            {whyText}
          </p>
          <div className="flex flex-wrap gap-4 pt-8">
            <Button asChild>
              <Link to="/voorraad">Bekijk ons aanbod</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/contact">Plan een afspraak</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CityLandingPage;

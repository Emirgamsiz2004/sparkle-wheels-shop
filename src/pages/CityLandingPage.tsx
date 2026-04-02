import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, Check } from "lucide-react";
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
}

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
}: CityPageProps) => {
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

      <section className="pt-32 pb-16 md:pt-40 md:pb-28">
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

            <p className="text-muted-foreground font-body font-light leading-relaxed text-base md:text-lg">
              Liever niet zelf rijden? Wij bezorgen de auto ook bij u thuis of op het werk. Vraag naar de mogelijkheden en bezorgkosten tijdens uw bezoek of via telefoon.
            </p>

            <div className="border border-border rounded-lg p-6 bg-card mt-8 space-y-3">
              <div className="flex items-center gap-3 text-foreground font-body">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Cilinderweg 99, 2371 DZ Roelofarendsveen</span>
              </div>
              <div className="flex items-center gap-3 text-foreground font-body">
                <Phone className="w-4 h-4 text-primary" />
                <a href="tel:+31612693825" className="hover:text-primary transition-colors">06-12693825</a>
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

      <Footer />
    </div>
  );
};

export default CityLandingPage;

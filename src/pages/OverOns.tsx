import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Phone, Mail, Clock, ShieldCheck, Users, Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import aboutImg from "@/assets/about.jpg";
import heroBg from "@/assets/hero-bg.jpg";

const OverOns = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Over Ons | Platin Automotive Roelofarendsveen</title>
        <meta name="description" content="Platin Automotive is een eerlijk en persoonlijk autobedrijf in Roelofarendsveen. RDW-erkend, topbeoordeeld door klanten uit heel Zuid-Holland." />
        <link rel="canonical" href="https://platinautomotive.nl/over-ons" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Over Ons | Platin Automotive Roelofarendsveen" />
        <meta property="og:description" content="Platin Automotive is een eerlijk en persoonlijk autobedrijf in Roelofarendsveen. RDW-erkend, topbeoordeeld door klanten uit heel Zuid-Holland." />
        <meta property="og:url" content="https://platinautomotive.nl/over-ons" />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content="Over Ons | Platin Automotive Roelofarendsveen" />
        <meta name="twitter:description" content="Platin Automotive is een eerlijk en persoonlijk autobedrijf in Roelofarendsveen. RDW-erkend, topbeoordeeld door klanten uit heel Zuid-Holland." />

      </Helmet>
      <Navbar />

      {/* SECTIE 1 — Hero */}
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
              Een familiebedrijf met een oprechte liefde voor auto's.
            </p>
          </motion.div>
        </div>
      </section>

      {/* SECTIE 2 — Ons Verhaal */}
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
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground tracking-tight mb-6 leading-tight">
                Van passie
                <br />
                naar bedrijf.
              </h2>
              <p className="text-muted-foreground font-body font-light leading-relaxed text-lg mb-6">
                Platin Automotive is wat er gebeurt als je een levenslange passie eindelijk serieus neemt.
              </p>
              <div className="space-y-5">
                <p className="text-muted-foreground font-body font-light leading-relaxed">
                  De liefde voor auto's zit er bij ons al jaren in. Altijd zelf in mooie auto's gereden, altijd dat gevoel gehad dat een auto meer is dan vervoer — het is een uitstraling, een gevoel, iets waar je trots op staat.
                </p>
                <p className="text-muted-foreground font-body font-light leading-relaxed">
                  Het idee om daar iets mee te doen was er al lang. Uiteindelijk hebben we de knoop doorgehakt: een locatie gezocht, gevonden, en gestart. Platin Automotive aan de Cilinderweg in Roelofarendsveen is het resultaat van die keuze.
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

      {/* SECTIE 3 — Wat Wij Anders Doen + SECTIE 4 — Erkend */}
      <section className="py-16 md:py-28 lg:py-36 bg-background">
        <div className="container mx-auto px-6 lg:px-16">
          <div className="grid md:grid-cols-2 gap-px bg-border">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-card p-8 md:p-12"
            >
              <Star className="w-5 h-5 text-muted-foreground mb-6" />
              <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
                Onze Aanpak
              </p>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight mb-6 leading-tight">
                Wat Wij Anders Doen
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground font-body font-light leading-relaxed">
                  Ons principe is simpel: <span className="font-semibold text-foreground">we verkopen alleen auto's die we zelf ook zouden kopen.</span>
                </p>
                <p className="text-muted-foreground font-body font-light leading-relaxed">
                  Wij selecteren op uitvoering, opties en staat van onderhoud. Geen kale basisversies — maar goed uitgeruste auto's met uitstraling, waar je trots op rijdt. Elke auto in ons aanbod is bewust gekozen. Dat is het verschil tussen een dealer die volume draait en een bedrijf dat echt selecteert.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="bg-card p-8 md:p-12"
            >
              <ShieldCheck className="w-5 h-5 text-muted-foreground mb-6" />
              <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
                Gecertificeerd
              </p>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight mb-6 leading-tight">
                Erkend & Betrouwbaar
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground font-body font-light leading-relaxed">
                  Platin Automotive beschikt over de officiële <span className="font-semibold text-foreground">RDW-erkenning</span> voor de autogarage. Dit betekent dat wij voldoen aan de eisen die de Nederlandse overheid stelt aan autobedrijven.
                </p>
                <p className="text-muted-foreground font-body font-light leading-relaxed">
                  U koopt bij ons met de zekerheid van een erkend en gecertificeerd bedrijf.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTIE 5 — Familiebedrijf */}
      <section className="py-16 md:py-28 lg:py-36 bg-card">
        <div className="container mx-auto px-6 lg:px-16">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <Users className="w-6 h-6 text-muted-foreground mx-auto mb-6" />
              <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
                Persoonlijk
              </p>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-8">
                Familiebedrijf —<br />Dat Merk Je
              </h2>
              <p className="text-muted-foreground font-body font-light leading-relaxed text-lg mb-4">
                U praat bij ons direct met de eigenaar. Geen tussenpersonen, geen verkoopdruk — persoonlijke aandacht en eerlijk advies. We nemen de tijd voor uw vragen en staan achter elke auto die we verkopen.
              </p>
              <p className="text-foreground font-display font-semibold text-lg">
                Dat is wat een familiebedrijf onderscheidt.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTIE 6 — Contact / Kom Langs */}
      <section className="py-16 md:py-28 lg:py-36 bg-background">
        <div className="container mx-auto px-6 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 md:mb-16"
          >
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Contact
            </p>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-5">
              Kom Gerust Langs
            </h2>
            <p className="text-muted-foreground font-body font-light max-w-xl mx-auto leading-relaxed">
              We staan voor u klaar aan de Cilinderweg in Roelofarendsveen. Bel, mail of kom langs — we helpen u graag persoonlijk verder.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border max-w-4xl mx-auto"
          >
            <div className="bg-card p-6 text-center group">
              <MapPin className="w-4 h-4 text-muted-foreground mx-auto mb-3 group-hover:text-foreground transition-colors" />
              <p className="text-xs font-body font-light text-muted-foreground leading-relaxed">
                Cilinderweg 99<br />2371 DZ Roelofarendsveen
              </p>
            </div>
            <div className="bg-card p-6 text-center group">
              <Phone className="w-4 h-4 text-muted-foreground mx-auto mb-3 group-hover:text-foreground transition-colors" />
              <a href="tel:+31612693825" className="text-xs font-body font-light text-muted-foreground hover:text-foreground transition-colors">
                06-12693825
              </a>
            </div>
            <div className="bg-card p-6 text-center group">
              <Mail className="w-4 h-4 text-muted-foreground mx-auto mb-3 group-hover:text-foreground transition-colors" />
              <a href="mailto:info@platinautomotive.nl" className="text-xs font-body font-light text-muted-foreground hover:text-foreground transition-colors">
                info@platinautomotive.nl
              </a>
            </div>
            <div className="bg-card p-6 text-center group">
              <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-3 group-hover:text-foreground transition-colors" />
              <p className="text-xs font-body font-light text-muted-foreground leading-relaxed">
                Ma–vr: 09:00–18:00<br />Za & zo: 10:00–17:00
              </p>
            </div>
          </motion.div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
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
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OverOns;

import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { ShieldCheck, CheckCircle, AlertTriangle, Globe, FileDown, Phone, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import logoAutotrust from "@/assets/logo-autotrust.png";

const Garantie = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>AutoTrust Garantie | Platin Automotive</title>
        <meta
          name="description"
          content="Zorgeloos rijden met een AutoTrust garantie via Platin Automotive. Instap en Uitgebreid garantiepakketten voor uw occasion."
        />
        <link rel="canonical" href="https://platinautomotive.nl/garantie" />
      </Helmet>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.img
            src={logoAutotrust}
            alt="AutoTrust logo"
            className="h-12 mx-auto mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          />
          <motion.h1
            className="text-3xl md:text-4xl font-bold text-foreground mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Zorgeloos rijden met een AutoTrust Garantie!
          </motion.h1>
          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Wil jij zonder zorgen genieten van je nieuwe auto? Dat kan met een
            passende garantie. In samenwerking met AutoTrust bieden wij
            verschillende mogelijkheden voor garantie aan.
          </motion.p>
        </div>
      </section>

      {/* Garantie pakketten */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground text-center mb-3">
            Kies de garantie die past bij uw auto
          </h2>
          <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
            Niet alle auto's zijn gelijk. Daarom zijn de garanties van AutoTrust
            gebaseerd op de leeftijd en kilometerstand bij aflevering van de
            auto.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Instap */}
            <motion.div
              className="rounded-2xl border border-border bg-card p-8 shadow-sm hover:shadow-md transition-shadow"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-bold text-foreground">Instap</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                De meest gekozen garantie voor auto's tot{" "}
                <strong>12 jaar</strong> en <strong>200.000 km</strong>.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  Geschikt voor een breed scala aan occasions
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  Dekking op de belangrijkste onderdelen
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  Reparatie bij een garage naar keuze
                </li>
              </ul>
            </motion.div>

            {/* Uitgebreid */}
            <motion.div
              className="rounded-2xl border-2 border-primary bg-card p-8 shadow-sm hover:shadow-md transition-shadow relative"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="absolute -top-3 right-6 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                Meest gekozen
              </span>
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-bold text-foreground">Uitgebreid</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                De meest gekozen garantie voor auto's tot{" "}
                <strong>8 jaar</strong> en <strong>150.000 km</strong>.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  Uitgebreide dekking op meer onderdelen
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  Hogere vergoedingslimieten
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  Ideaal voor nieuwere occasions
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Overzichtskaart */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            className="bg-card rounded-2xl border border-border p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <FileDown className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Garantie Overzichtskaart
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Bekijk in één oogopslag wat er gedekt wordt bij de Instap en Uitgebreide garantiepakketten. Download de overzichtskaart voor alle details.
            </p>
            <a
              href="/garantie-overzichtskaart.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              <FileDown className="h-4 w-4" />
              Overzichtskaart bekijken (PDF)
            </a>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">
                Wilt u weten welk garantiepakket het beste past bij uw voertuig? Neem vrijblijvend contact met ons op.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="tel:+31713018060"
                  className="btn-public btn-primary-public"
                >
                  <Phone className="h-4 w-4" />
                  Bel ons: 071 - 301 80 60
                </a>
                <a
                  href="https://wa.me/31612345678"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-border font-medium rounded-lg hover:bg-accent transition-colors text-sm text-foreground"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-border font-medium rounded-lg hover:bg-accent transition-colors text-sm text-foreground"
                >
                  Contactformulier
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Claimproces */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground text-center mb-3">
            Eenvoudig uw claim melden
          </h2>
          <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
            Is er iets mis met uw auto? Dan kunt u dit eenvoudig melden via het
            claimportal van AutoTrust.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card rounded-xl p-6 text-center border border-border">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 font-bold">
                1
              </div>
              <h3 className="font-semibold text-foreground mb-2">Defect melden</h3>
              <p className="text-sm text-muted-foreground">
                Meld het defect zodra u het opmerkt via het AutoTrust
                Claimportal.
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 text-center border border-border">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 font-bold">
                2
              </div>
              <h3 className="font-semibold text-foreground mb-2">Garage kiezen</h3>
              <p className="text-sm text-muted-foreground">
                Kies een garage bij u in de buurt voor de reparatie.
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 text-center border border-border">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 font-bold">
                3
              </div>
              <h3 className="font-semibold text-foreground mb-2">Reparatie</h3>
              <p className="text-sm text-muted-foreground">
                Uw auto wordt gerepareerd — gedekt door uw garantie.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4 text-primary" />
              <span>Garantie geldig in heel Europa</span>
            </div>
            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span className="text-amber-800 dark:text-amber-200">
                Belangrijk: meld het defect <strong>voordat</strong> u overgaat
                tot reparatie.
              </span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Garantie;

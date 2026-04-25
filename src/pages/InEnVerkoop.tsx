import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, FileCheck, Eye, Handshake, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import verkoopImg from "@/assets/verkoop.jpg";

const usps = [
  {
    icon: ShieldCheck,
    title: "Gecontroleerd & Rijklaar",
    description: "Elke auto wordt grondig geïnspecteerd en rijklaar afgeleverd. Geen verrassingen achteraf.",
  },
  {
    icon: FileCheck,
    title: "NAP & RDW Gecontroleerd",
    description: "Alle voertuigen worden gecheckt op tellerstanden en registratie. Volledige transparantie gegarandeerd.",
  },
  {
    icon: Eye,
    title: "Eerlijke Prijzen",
    description: "Geen verborgen kosten of trucs. De prijs die u ziet is de prijs die u betaalt.",
  },
  {
    icon: Handshake,
    title: "Persoonlijk Advies",
    description: "Geen verkooppraatjes maar oprecht advies. Wij helpen u de juiste auto te vinden voor uw situatie.",
  },
];

const InEnVerkoop = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Auto Inkopen & Verkopen Roelofarendsveen | Platin Automotive</title>
        <meta name="description" content="Platin Automotive koopt en verkoopt auto's in Roelofarendsveen. Eerlijke inruilprijs, snelle afhandeling. Verkoop je auto vandaag – gratis waardebepaling!" />
        <link rel="canonical" href="https://platinautomotive.nl/diensten/in-en-verkoop" />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <Navbar />

      {/* Hero */}
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${verkoopImg})` }}
        >
          <div className="absolute inset-0 bg-background/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
        <div className="relative z-10 flex flex-col justify-end h-full container mx-auto px-6 lg:px-16 pb-12 md:pb-16">
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
              Diensten
            </p>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight">
              In- & Verkoop
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-16 md:py-28 bg-card">
        <div className="container mx-auto px-6 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight mb-6 leading-tight">
                Betrouwbare occasions
                <br />
                voor eerlijke prijzen.
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground font-body font-light leading-relaxed">
                  Bij Platin Automotive draait alles om kwaliteit en vertrouwen. 
                  Wij selecteren onze auto's zorgvuldig en bieden alleen voertuigen aan 
                  waar we volledig achter staan. Geen auto's met verborgen gebreken — 
                  elke auto is gecontroleerd, eerlijk geprijsd en rijklaar.
                </p>
                <p className="text-muted-foreground font-body font-light leading-relaxed">
                  Of u nu op zoek bent naar uw eerste auto of een betrouwbare gezinsauto, 
                  wij denken graag met u mee. Persoonlijk, eerlijk en zonder druk.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-4"
            >
              <p className="text-muted-foreground font-body font-light leading-relaxed">
                Wilt u uw huidige auto verkopen? Ook dat kan bij ons. Wij bieden een 
                eerlijke prijs en regelen de volledige afhandeling. Snel, transparant 
                en zonder gedoe.
              </p>
              <p className="text-muted-foreground font-body font-light leading-relaxed">
                Bent u benieuwd naar ons aanbod? Bekijk onze voorraad online of 
                kom langs in onze showroom aan de Cilinderweg 99 in Roelofarendsveen. 
                We ontvangen u graag voor een vrijblijvend gesprek of proefrit.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* USPs */}
      <section className="py-16 md:py-28 bg-background">
        <div className="container mx-auto px-6 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-12 md:mb-16"
          >
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Waarom Platin
            </p>
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight">
              Waar wij voor staan
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {usps.map((usp, i) => (
              <motion.div
                key={usp.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-card p-6 md:p-8 group"
              >
                <usp.icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground mb-5 transition-colors duration-300" />
                <h3 className="text-sm font-display font-semibold text-foreground mb-2">
                  {usp.title}
                </h3>
                <p className="text-xs font-body font-light text-muted-foreground leading-relaxed">
                  {usp.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Showroom CTA */}
      <section className="py-16 md:py-28 bg-card">
        <div className="container mx-auto px-6 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid lg:grid-cols-2 gap-px bg-border"
          >
            <div className="bg-background p-8 md:p-12 flex flex-col justify-center">
              <MapPin className="w-5 h-5 text-muted-foreground mb-5" />
              <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight mb-4 leading-tight">
                Bezoek onze
                <br />
                showroom.
              </h3>
              <p className="text-muted-foreground font-body font-light leading-relaxed mb-8 max-w-md">
                Kom vrijblijvend langs en bekijk onze auto's in het echt. 
                Wij nemen de tijd voor u en beantwoorden al uw vragen. 
                Een proefrit? Dat regelen we ter plekke.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/voorraad"
                  className="btn-public btn-primary-public group"
                >
                  Bekijk Voorraad
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/contact"
                  className="group inline-flex items-center gap-3 border border-foreground/20 hover:border-foreground/50 text-foreground px-7 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase transition-all duration-300"
                >
                  Plan Een Bezoek
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            <div className="bg-background p-8 md:p-12">
              <div className="space-y-0">
                {[
                  { label: "Adres", value: "Cilinderweg 99, 2371 DZ Roelofarendsveen" },
                  { label: "Telefoon", value: "06-12693825" },
                  { label: "E-mail", value: "info@platinautomotive.nl" },
                  { label: "Ma t/m Vr", value: "09:00 - 18:00" },
                  { label: "Za & Zo", value: "10:00 - 17:00" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
                    <span className="text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-body text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default InEnVerkoop;

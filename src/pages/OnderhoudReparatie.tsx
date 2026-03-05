import { motion } from "framer-motion";
import { ArrowRight, Wrench, Clock, Euro, MessageCircle, Phone, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceForm from "@/components/ServiceForm";
import FloatingCTA from "@/components/FloatingCTA";
import onderhoudImg from "@/assets/onderhoud.jpg";

const diensten = [
  "Olie verversen",
  "Filters vervangen",
  "Remblokken & schijven",
  "Banden wisselen",
  "Airco service",
  "Vloeistoffen bijvullen",
  "Bougies vervangen",
  "Accu vervangen",
];

const OnderhoudReparatie = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <FloatingCTA targetId="afspraak" label="Afspraak maken" />

      {/* Hero */}
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${onderhoudImg})` }}
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
              Onderhoud & Reparatie
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
                Betrouwbaar onderhoud
                <br />
                voor uw auto.
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground font-body font-light leading-relaxed">
                  Bij Platin Automotive kunt u terecht voor al uw klein onderhoud. 
                  Van een oliewissel tot het vervangen van remblokken — wij zorgen ervoor 
                  dat uw auto in topconditie blijft.
                </p>
                <p className="text-muted-foreground font-body font-light leading-relaxed">
                  Wij richten ons bewust op onderhoud en kleine reparaties. 
                  Geen onnodige werkzaamheden, geen verrassingen op de factuur. 
                  Altijd vooraf een duidelijke prijsindicatie.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="grid grid-cols-3 gap-px bg-border">
                {[
                  { icon: Euro, label: "Scherpe prijzen" },
                  { icon: Clock, label: "Snel geholpen" },
                  { icon: Wrench, label: "Vakwerk" },
                ].map((item) => (
                  <div key={item.label} className="bg-background p-5 md:p-6 flex flex-col items-center text-center">
                    <item.icon className="w-5 h-5 text-muted-foreground mb-3" />
                    <span className="text-[10px] tracking-[0.15em] uppercase font-body font-medium text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Diensten overzicht */}
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
              Werkzaamheden
            </p>
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight">
              Wat wij voor u doen
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {diensten.map((dienst, i) => (
              <motion.div
                key={dienst}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="bg-card p-5 md:p-6 flex items-center gap-3 group"
              >
                <CheckCircle className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                <span className="text-sm font-body text-foreground">{dienst}</span>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-xs font-body font-light text-muted-foreground mt-6"
          >
            Staat uw werkzaamheid er niet bij? Neem contact op — wij kijken graag wat we voor u kunnen betekenen.
          </motion.p>
        </div>
      </section>

      {/* Afspraak + Quick contact */}
      <section id="afspraak" className="py-16 md:py-28 bg-card">
        <div className="container mx-auto px-6 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-px bg-border">
            {/* Afspraak formulier */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-background p-6 md:p-10"
            >
              <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground mb-2">
                Direct inplannen
              </p>
              <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-2">
                Maak een afspraak
              </h3>
              <p className="text-xs font-body font-light text-muted-foreground leading-relaxed mb-8">
                Kies een datum en tijd die u uitkomt. Wij bevestigen uw afspraak zo snel mogelijk. Vrijblijvend en zonder verplichtingen.
              </p>
              <ServiceForm dienst="onderhoud" />
            </motion.div>

            {/* Snel contact */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-background p-6 md:p-10 flex flex-col"
            >
              <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground mb-2">
                Snel contact
              </p>
              <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-2">
                Liever direct contact?
              </h3>
              <p className="text-xs font-body font-light text-muted-foreground leading-relaxed mb-8">
                Bel ons of stuur een WhatsApp berichtje. Wij reageren snel en kunnen u direct een inschatting geven.
              </p>

              <div className="space-y-4 mb-8">
                <a
                  href="tel:+31612693825"
                  className="group flex items-center gap-4 p-4 border border-border hover:border-foreground/30 transition-all duration-300"
                >
                  <Phone className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <div>
                    <p className="text-sm font-display font-semibold text-foreground">Bel ons</p>
                    <p className="text-xs font-body text-muted-foreground">06 - 1269 3825</p>
                  </div>
                </a>
                <a
                  href="https://wa.me/31612693825?text=Hallo%2C%20ik%20wil%20graag%20een%20afspraak%20voor%20onderhoud."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 border border-border hover:border-foreground/30 transition-all duration-300"
                >
                  <MessageCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-display font-semibold text-foreground">WhatsApp</p>
                    <p className="text-xs font-body text-muted-foreground">Stuur een berichtje</p>
                  </div>
                </a>
              </div>

              <div className="mt-auto pt-8 border-t border-border">
                <p className="text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground mb-4">
                  Openingstijden
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Ma t/m Vr</span>
                    <span className="text-foreground">09:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Za & Zo</span>
                    <span className="text-foreground">10:00 - 17:00</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OnderhoudReparatie;

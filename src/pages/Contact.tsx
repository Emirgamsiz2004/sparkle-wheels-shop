import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, ArrowRight, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const contactDetails = [
  {
    icon: Phone,
    label: "Telefoon",
    value: "06 - 1269 3825",
    href: "tel:+31612693825",
    description: "Bel ons direct voor vragen of een afspraak",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "06 - 1269 3825",
    href: "https://wa.me/31612693825?text=Hallo%2C%20ik%20heb%20een%20vraag%20over%20een%20auto.",
    description: "Stuur ons een berichtje via WhatsApp",
    highlight: true,
  },
  {
    icon: Mail,
    label: "E-mail",
    value: "info@platinautomotive.nl",
    href: "mailto:info@platinautomotive.nl",
    description: "Stuur ons een e-mail, we reageren binnen 24 uur",
  },
  {
    icon: MapPin,
    label: "Adres",
    value: "Cilinderweg 99, 2371 DZ Roelofarendsveen",
    href: "https://maps.google.com/?q=Cilinderweg+99+2371DZ+Roelofarendsveen",
    description: "Bezoek onze showroom op afspraak",
  },
];

const openingHours = [
  { day: "Maandag", time: "09:00 - 18:00" },
  { day: "Dinsdag", time: "09:00 - 18:00" },
  { day: "Woensdag", time: "09:00 - 18:00" },
  { day: "Donderdag", time: "09:00 - 18:00" },
  { day: "Vrijdag", time: "09:00 - 18:00" },
  { day: "Zaterdag", time: "10:00 - 18:00" },
  { day: "Zondag", time: "10:00 - 18:00" },
];

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-16 md:pb-28 lg:pb-36">
        <div className="container mx-auto px-6 lg:px-16">
          {/* Back link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              Terug naar home
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-16 md:mb-20"
          >
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Contact
            </p>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground tracking-tight mb-5">
              Neem contact op
            </h1>
            <p className="text-muted-foreground font-body font-light max-w-lg leading-relaxed">
              Heeft u vragen, wilt u een proefrit plannen of een afspraak maken?
              Wij staan graag voor u klaar.
            </p>
          </motion.div>

          {/* Contact cards */}
          <div className="grid sm:grid-cols-2 gap-px bg-border mb-16 md:mb-20">
            {contactDetails.map((item, i) => (
              <motion.a
                key={item.label}
                href={item.href}
                target={item.label === "WhatsApp" ? "_blank" : undefined}
                rel={item.label === "WhatsApp" ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`group bg-card p-6 md:p-8 transition-all duration-300 hover:bg-accent ${
                  item.highlight ? "relative" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-5">
                  <item.icon className={`w-5 h-5 transition-colors ${
                    item.highlight
                      ? "text-green-500"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`} />
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-300" />
                </div>
                <p className="text-[10px] tracking-[0.3em] uppercase font-body text-muted-foreground mb-2">
                  {item.label}
                </p>
                <p className="text-sm md:text-base font-display font-semibold text-foreground mb-2">
                  {item.value}
                </p>
                <p className="text-xs font-body font-light text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </motion.a>
            ))}
          </div>

          {/* Bottom section: Opening hours + Map */}
          <div className="grid lg:grid-cols-2 gap-px bg-border">
            {/* Opening hours */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-card p-6 md:p-10"
            >
              <div className="flex items-center gap-3 mb-8">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground">
                  Openingstijden
                </p>
              </div>
              <div className="space-y-0">
                {openingHours.map((item) => (
                  <div
                    key={item.day}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <span className="text-sm font-body text-foreground">{item.day}</span>
                    <span className="text-sm font-body font-medium text-foreground">{item.time}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Map */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-card"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2446.5!2d4.6294!3d52.1969!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c5c6f5a5a5a5a5%3A0x0!2sCilinderweg%2099%2C%202371%20DZ%20Roelofarendsveen!5e0!3m2!1snl!2snl!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "400px", filter: "grayscale(1) invert(0.92) contrast(0.9)" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Locatie Platin Automotive"
              />
            </motion.div>
          </div>

          {/* WhatsApp CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 md:mt-20 text-center"
          >
            <p className="text-muted-foreground font-body font-light mb-6 text-sm">
              Liever direct appen? Stuur ons een WhatsApp bericht.
            </p>
            <a
              href="https://wa.me/31612693825?text=Hallo%2C%20ik%20heb%20een%20vraag%20over%20een%20auto."
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-xs font-semibold tracking-[0.15em] uppercase transition-all duration-300"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Ons
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;

import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, ArrowRight } from "lucide-react";

const contactInfo = [
  { icon: Phone, label: "Telefoon", value: "06 - 1269 3825", href: "tel:+31612693825" },
  { icon: Mail, label: "E-mail", value: "info@platinautomotive.nl", href: "mailto:info@platinautomotive.nl" },
  { icon: MapPin, label: "Adres", value: "Cilinderweg 99, Roelofarendsveen", href: "https://maps.google.com/?q=Cilinderweg+99+Roelofarendsveen" },
  { icon: Clock, label: "Openingstijden", value: "Ma t/m Vr: 09:00 - 18:00\nZa & Zo: 10:00 - 18:00", href: "#" },
];

const ContactSection = () => {
  return (
    <section id="contact" className="py-16 md:py-28 lg:py-36 bg-background">
      <div className="container mx-auto px-6 lg:px-16">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Contact
            </p>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-6">
              Laten we
              <br />
              praten.
            </h2>
            <p className="text-muted-foreground font-body font-light leading-relaxed mb-10 max-w-sm">
              Heeft u vragen of wilt u een afspraak maken? Wij helpen u graag verder.
            </p>
            <a
              href="tel:+31612693825"
              className="group inline-flex items-center gap-3 bg-foreground text-background px-7 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase hover:bg-foreground/90 transition-all duration-300"
            >
              <Phone className="w-3.5 h-3.5" />
              Bel Direct
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border"
          >
            {contactInfo.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="group bg-card hover:bg-accent p-6 md:p-8 transition-all duration-300"
              >
                <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground mb-6 transition-colors" />
                <p className="text-[10px] tracking-[0.3em] uppercase font-body text-muted-foreground mb-2">
                  {item.label}
                </p>
                <p className="text-sm font-body font-medium text-foreground whitespace-pre-line">
                  {item.value}
                </p>
              </a>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
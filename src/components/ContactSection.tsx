import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

const contactInfo = [
  { icon: Phone, label: "Telefoon", value: "+31 6 00 00 00 00", href: "tel:+31600000000" },
  { icon: Mail, label: "E-mail", value: "info@plaautos.nl", href: "mailto:info@plaautos.nl" },
  { icon: MapPin, label: "Adres", value: "Straatnaam 1, Stad", href: "#" },
  { icon: Clock, label: "Openingstijden", value: "Ma-Za: 09:00 - 18:00", href: "#" },
];

const ContactSection = () => {
  return (
    <section id="contact" className="py-24 lg:py-32 bg-gradient-dark">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-xs tracking-[0.4em] uppercase font-body font-medium text-muted-foreground mb-3">
            Neem Contact Op
          </p>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground">
            Wij staan klaar
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactInfo.map((item, i) => (
            <motion.a
              key={item.label}
              href={item.href}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group bg-card border border-border hover:border-foreground/25 p-8 text-center transition-all duration-300"
            >
              <item.icon className="w-7 h-7 text-foreground/60 mx-auto mb-4 group-hover:text-foreground transition-colors" />
              <p className="text-xs tracking-[0.2em] uppercase font-body text-muted-foreground mb-2">
                {item.label}
              </p>
              <p className="text-sm font-body font-medium text-foreground">
                {item.value}
              </p>
            </motion.a>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground font-body font-light mb-6 max-w-lg mx-auto">
            Heeft u vragen of wilt u een afspraak maken? Neem gerust contact met ons op.
            Wij helpen u graag verder!
          </p>
          <a
            href="tel:+31600000000"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase hover:bg-foreground/90 transition-all duration-300"
          >
            <Phone className="w-3.5 h-3.5" />
            Bel Direct
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;

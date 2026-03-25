import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, ArrowRight, MessageCircle } from "lucide-react";

const contactInfo = [
  { icon: Phone, label: "Telefoon", value: "06 - 1269 3825", href: "tel:+31612693825" },
  { icon: MessageCircle, label: "WhatsApp", value: "Stuur een bericht", href: "https://wa.me/31612693825" },
  { icon: Mail, label: "E-mail", value: "info@platinautomotive.nl", href: "mailto:info@platinautomotive.nl" },
  { icon: MapPin, label: "Adres", value: "Cilinderweg 99, Roelofarendsveen", href: "https://maps.google.com/?q=Cilinderweg+99+Roelofarendsveen" },
];

const ContactSection = () => {
  return (
    <section id="contact" className="py-16 md:py-28 lg:py-36 bg-background">
      <div className="mx-auto px-5 md:px-[90px] max-w-[1920px]">
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
            <div className="flex flex-wrap gap-3">
              <a
                href="tel:+31612693825"
                className="group inline-flex items-center gap-3 bg-foreground text-background px-7 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                <Phone className="w-3.5 h-3.5" />
                Bel Direct
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="https://wa.me/31612693825"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 border border-border text-foreground px-7 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase hover:border-foreground hover:bg-foreground hover:text-background transition-all duration-300"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col gap-px bg-border"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px">
              {contactInfo.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="group bg-card active:bg-primary md:hover:bg-primary p-6 md:p-8 transition-all duration-300"
                >
                  <item.icon className="w-5 h-5 text-muted-foreground group-active:text-primary-foreground md:group-hover:text-primary-foreground mb-6 transition-colors" />
                  <p className="text-[10px] tracking-[0.3em] uppercase font-body text-muted-foreground group-active:text-primary-foreground/70 md:group-hover:text-primary-foreground/70 mb-2 transition-colors">
                    {item.label}
                  </p>
                  <p className="text-sm font-body font-medium text-foreground group-active:text-primary-foreground md:group-hover:text-primary-foreground whitespace-pre-line transition-colors">
                    {item.value}
                  </p>
                </a>
              ))}
            </div>
            <div className="bg-card px-6 md:px-8 py-4">
              <div className="flex items-center gap-2 mb-2 md:mb-0">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <p className="text-[10px] tracking-[0.3em] uppercase font-body text-muted-foreground">Openingstijden</p>
              </div>
              <div className="flex items-center gap-2 md:gap-3 mt-1.5 text-xs font-body text-foreground">
                <span>Ma–Vr: 10:00 – 18:00</span>
                <span className="text-border">·</span>
                <span>Za: 10:00 – 17:00</span>
                <span className="text-border">·</span>
                <span>Zo: Gesloten</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
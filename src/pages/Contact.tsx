import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, ArrowRight, MessageCircle, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const contactFormSchema = z.object({
  naam: z.string().trim().min(1, "Vul uw naam in").max(100),
  email: z.string().trim().email("Vul een geldig e-mailadres in").max(255),
  telefoon: z.string().trim().max(20).optional(),
  bericht: z.string().trim().min(1, "Vul een bericht in").max(2000),
});

const contactDetails = [
  {
    icon: Phone,
    label: "Telefoon",
    value: "06-12693825",
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
  { day: "Maandag", time: "10:00 - 18:00" },
  { day: "Dinsdag", time: "10:00 - 18:00" },
  { day: "Woensdag", time: "10:00 - 18:00" },
  { day: "Donderdag", time: "10:00 - 18:00" },
  { day: "Vrijdag", time: "10:00 - 18:00" },
  { day: "Zaterdag", time: "10:00 - 17:00" },
  { day: "Zondag", time: "Gesloten" },
];

const ContactForm = () => {
  const [formData, setFormData] = useState({ naam: "", email: "", telefoon: "", bericht: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const message = `Hallo, ik ben ${encodeURIComponent(result.data.naam)}.%0A%0AE-mail: ${encodeURIComponent(result.data.email)}${result.data.telefoon ? `%0ATelefoon: ${encodeURIComponent(result.data.telefoon)}` : ""}%0A%0A${encodeURIComponent(result.data.bericht)}`;
    window.open(`https://wa.me/31612693825?text=${message}`, "_blank");

    setSubmitted(true);
    toast({ title: "Bericht verstuurd", description: "We nemen zo snel mogelijk contact met u op." });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 border-2 border-foreground flex items-center justify-center mb-4">
          <Send className="w-5 h-5 text-foreground" />
        </div>
        <p className="text-foreground font-display font-semibold mb-2">Bedankt voor uw bericht!</p>
        <p className="text-muted-foreground font-body text-sm font-light">We nemen zo snel mogelijk contact met u op.</p>
        <button
          onClick={() => { setSubmitted(false); setFormData({ naam: "", email: "", telefoon: "", bericht: "" }); }}
          className="mt-6 text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Nog een bericht sturen
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground mb-2">Naam *</label>
          <input type="text" name="naam" value={formData.naam} onChange={handleChange} className="w-full bg-background border border-border px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/30 transition-colors" placeholder="Uw naam" />
          {errors.naam && <p className="text-xs text-red-400 mt-1 font-body">{errors.naam}</p>}
        </div>
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground mb-2">E-mail *</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-background border border-border px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/30 transition-colors" placeholder="uw@email.nl" />
          {errors.email && <p className="text-xs text-red-400 mt-1 font-body">{errors.email}</p>}
        </div>
      </div>
      <div>
        <label className="block text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground mb-2">Telefoon</label>
        <input type="tel" name="telefoon" value={formData.telefoon} onChange={handleChange} className="w-full bg-background border border-border px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/30 transition-colors" placeholder="06 - 0000 0000" />
      </div>
      <div>
        <label className="block text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground mb-2">Bericht *</label>
        <textarea name="bericht" value={formData.bericht} onChange={handleChange} rows={5} className="w-full bg-background border border-border px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/30 transition-colors resize-none" placeholder="Waar kunnen wij u mee helpen?" />
        {errors.bericht && <p className="text-xs text-red-400 mt-1 font-body">{errors.bericht}</p>}
      </div>
      <button type="submit" className="group inline-flex items-center gap-3 bg-foreground text-background px-7 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase hover:bg-foreground/90 transition-all duration-300">
        <Send className="w-3.5 h-3.5" />
        Verstuur Bericht
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </button>
    </form>
  );
};

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Contact | Platin Automotive Roelofarendsveen</title>
        <meta name="description" content="Neem contact op met Platin Automotive in Roelofarendsveen. Bel 06-12693825, stuur een WhatsApp of kom langs op Cilinderweg 99." />
        <link rel="canonical" href="https://platinautomotive.nl/contact" />
        <meta name="robots" content="index, follow" />
      </Helmet>
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
                src="https://maps.google.com/maps?q=Cilinderweg+99,+2371+DZ+Roelofarendsveen&t=&z=15&ie=UTF8&iwloc=&output=embed"
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

          {/* Contact form + WhatsApp */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 md:mt-20"
          >
            <div className="grid lg:grid-cols-2 gap-px bg-border">
              {/* Form */}
              <div className="bg-card p-6 md:p-10">
                <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground mb-2">
                  Bericht
                </p>
                <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-6">
                  Stuur ons een bericht
                </h3>
                <ContactForm />
              </div>

              {/* WhatsApp CTA side */}
              <div className="bg-card p-6 md:p-10 flex flex-col items-center justify-center text-center">
                <MessageCircle className="w-10 h-10 text-green-500 mb-6" />
                <h3 className="text-xl font-display font-bold text-foreground mb-3">
                  Liever direct appen?
                </h3>
                <p className="text-muted-foreground font-body font-light mb-8 text-sm max-w-xs leading-relaxed">
                  Stuur ons een WhatsApp bericht en we reageren zo snel mogelijk.
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
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;

import { motion } from "framer-motion";
import { Car, Wrench, Sparkles } from "lucide-react";
import verkoopImg from "@/assets/verkoop.jpg";
import onderhoudImg from "@/assets/onderhoud.jpg";
import detailingImg from "@/assets/detailing.jpg";

const services = [
  {
    icon: Car,
    title: "In- & Verkoop",
    description: "Wij kopen en verkopen betrouwbare auto's tegen scherpe prijzen. Persoonlijk advies en volledige transparantie staan bij ons centraal.",
    image: verkoopImg,
  },
  {
    icon: Wrench,
    title: "Onderhoud & Reparatie",
    description: "Klein onderhoud en reparaties door ervaren vakmensen. Van olie verversen tot remmen en distributieriem.",
    image: onderhoudImg,
  },
  {
    icon: Sparkles,
    title: "Auto Detailing",
    description: "Professionele reiniging van interieur en exterieur. Uw auto ziet er weer als nieuw uit met onze detailing service.",
    image: detailingImg,
  },
];

const ServicesSection = () => {
  return (
    <section id="diensten" className="py-24 lg:py-32 bg-gradient-dark">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-sm tracking-[0.3em] uppercase font-body font-medium text-primary mb-3">
            Wat wij bieden
          </p>
          <h2 className="text-3xl md:text-5xl font-display font-bold">
            Onze <span className="text-gradient-gold">Diensten</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="group relative overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-500"
            >
              <div className="h-56 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-6 lg:p-8">
                <service.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-display font-semibold mb-3">
                  {service.title}
                </h3>
                <p className="text-muted-foreground font-body font-light leading-relaxed text-sm">
                  {service.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;

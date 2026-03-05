import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import verkoopImg from "@/assets/verkoop.jpg";
import onderhoudImg from "@/assets/onderhoud.jpg";
import detailingImg from "@/assets/detailing.jpg";

const services = [
  {
    num: "01",
    title: "In- & Verkoop",
    description: "Betrouwbare auto's tegen eerlijke prijzen. Persoonlijk advies en volledige transparantie.",
    image: verkoopImg,
  },
  {
    num: "02",
    title: "Onderhoud & Reparatie",
    description: "Klein onderhoud en reparaties door vakmensen. Van olie verversen tot remmen.",
    image: onderhoudImg,
  },
  {
    num: "03",
    title: "Auto Detailing",
    description: "Professionele reiniging van interieur en exterieur. Uw auto als nieuw.",
    image: detailingImg,
  },
];

const ServicesSection = () => {
  return (
    <section id="diensten" className="py-16 md:py-28 lg:py-36 bg-background">
      <div className="container mx-auto px-6 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16"
        >
          <div>
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Diensten
            </p>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
              Wat wij doen
            </h2>
          </div>
          <div className="hidden md:block w-24 h-px bg-border" />
        </motion.div>

        <div className="grid md:grid-cols-3 gap-px bg-border">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="group bg-background"
            >
              <div className="h-48 md:h-64 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 grayscale group-hover:grayscale-0"
                />
              </div>
              <div className="p-5 md:p-8">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-[10px] font-body font-medium text-muted-foreground tracking-wider">
                    {service.num}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-300" />
                </div>
                <h3 className="text-lg font-display font-semibold mb-3 text-foreground">
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
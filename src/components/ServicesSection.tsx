import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import verkoopImg from "@/assets/verkoop.jpg";
import onderhoudImg from "@/assets/onderhoud.jpg";
import detailingImg from "@/assets/detailing.jpg";

const services = [
  {
    num: "01",
    title: "In- & Verkoop",
    description: "Betrouwbare auto's tegen eerlijke prijzen. Persoonlijk advies en volledige transparantie.",
    image: verkoopImg,
    href: "/diensten/in-en-verkoop",
  },
  {
    num: "02",
    title: "Onderhoud & Reparatie",
    description: "Klein onderhoud en reparaties door vakmensen. Van olie verversen tot remmen.",
    image: onderhoudImg,
    href: "/diensten/onderhoud-reparatie",
  },
  {
    num: "03",
    title: "Auto Detailing",
    description: "Professionele reiniging van interieur en exterieur. Uw auto als nieuw.",
    image: detailingImg,
    href: "/diensten/auto-detailing",
  },
];

const ServicesSection = () => {
  return (
    <section id="diensten" className="py-20 md:py-32 lg:py-40 bg-background">
      <div className="mx-auto px-6 md:px-[90px] max-w-[1920px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-14 md:mb-20"
        >
          <div>
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Diensten
            </p>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight">
              Wat wij doen
            </h2>
          </div>
          <div className="hidden md:block w-24 h-px bg-border" />
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-0 md:gap-x-px bg-background md:bg-border">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="group bg-background"
            >
              <Link to={service.href} className="block">
                <div className="relative h-56 md:h-72 lg:h-80 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 grayscale group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-background/20 group-hover:bg-transparent transition-colors duration-500" />
                </div>
                <div className="py-6 md:py-8 md:pr-6">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-[10px] font-body font-medium text-muted-foreground tracking-wider">
                      {service.num}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-300" />
                  </div>
                  <h3 className="text-lg md:text-xl font-display font-semibold mb-3 text-foreground group-hover:text-foreground/80 transition-colors duration-300">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground font-body font-light leading-relaxed text-sm">
                    {service.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
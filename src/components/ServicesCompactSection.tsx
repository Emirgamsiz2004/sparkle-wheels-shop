import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import verkoopImg from "@/assets/service-verkoop.webp";
import onderhoudImg from "@/assets/service-onderhoud.webp";
import detailingImg from "@/assets/service-detailing.webp";
import autoZoekenImg from "@/assets/service-zoeken.webp";
import customizingImg from "@/assets/service-customizing.webp";
import consignatieImg from "@/assets/service-verkoop.webp";

interface Service {
  title: string;
  href: string;
  image: string;
  alt: string;
}

const services: Service[] = [
  { title: "In- & Verkoop", href: "/diensten/in-en-verkoop", image: verkoopImg, alt: "In- en verkoop auto's" },
  { title: "Onderhoud", href: "/diensten/onderhoud-reparatie", image: onderhoudImg, alt: "Auto onderhoud en reparatie" },
  { title: "Detailing", href: "/diensten/auto-detailing", image: detailingImg, alt: "Auto detailing" },
  { title: "Customizing", href: "/diensten/auto-customizing", image: customizingImg, alt: "Auto customizing" },
  { title: "Auto op Aanvraag", href: "/diensten/auto-zoeken", image: autoZoekenImg, alt: "Auto op aanvraag" },
  { title: "Consignatie", href: "/consignatie", image: consignatieImg, alt: "Auto consignatie" },
];

const CompactServiceCard = ({ service, delay }: { service: Service; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="group bg-card hover:bg-background transition-colors duration-300"
  >
    <Link to={service.href} className="block p-4 md:p-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 shrink-0 overflow-hidden">
          <img
            src={service.image}
            alt={service.alt}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            width={96}
            height={96}
            loading="lazy"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-display font-semibold text-foreground truncate">
              {service.title}
            </h3>
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent transition-colors duration-300 shrink-0" />
          </div>
          <p className="text-[10px] font-body text-muted-foreground/70 mt-0.5">
            Bekijk dienst
          </p>
        </div>
      </div>
    </Link>
  </motion.div>
);

const ServicesCompactSection = () => {
  return (
    <section className="py-12 md:py-16 bg-background border-t border-border">
      <div className="mx-auto px-5 md:px-[90px] max-w-[1920px]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-2">
              Compleet aanbod
            </p>
            <h2 className="text-xl md:text-2xl font-display font-semibold text-foreground tracking-tight">
              Alle diensten op een rij
            </h2>
          </div>
          <Link
            to="/diensten"
            className="group inline-flex items-center gap-2 text-[11px] font-body font-semibold tracking-[0.15em] uppercase text-foreground hover:text-accent transition-colors duration-300"
          >
            Naar dienstenpagina
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-border">
          {services.map((service, i) => (
            <CompactServiceCard key={service.title} service={service} delay={i * 0.06} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesCompactSection;

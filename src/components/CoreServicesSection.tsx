import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import verkoopImg from "@/assets/service-verkoop.webp";
import detailingImg from "@/assets/service-detailing.webp";
import financieringImg from "@/assets/service-zoeken.webp";

interface CoreService {
  title: string;
  description: string;
  image: string;
  alt: string;
  href: string;
}

const coreServices: CoreService[] = [
  {
    title: "Occasions",
    description: "Betrouwbare auto's tegen eerlijke prijzen. Kopen, verkopen of inruilen — persoonlijk advies.",
    image: verkoopImg,
    alt: "Occasions kopen en verkopen Roelofarendsveen",
    href: "/voorraad",
  },
  {
    title: "Detailing",
    description: "Professionele reiniging, polijsten en bescherming. Uw auto als nieuw, van binnen en buiten.",
    image: detailingImg,
    alt: "Professionele auto detailing Roelofarendsveen",
    href: "/diensten/auto-detailing",
  },
  {
    title: "Financiering",
    description: "Financial lease voor ondernemers, private lease voor particulieren. Vaste lage rente, snel akkoord.",
    image: financieringImg,
    alt: "Auto financiering en lease aanbod",
    href: "/financiering",
  },
];

const CoreServiceCard = ({ service, delay }: { service: CoreService; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    className="group bg-card hover:bg-background transition-colors duration-500"
  >
    <Link to={service.href} className="block">
      <div className="h-36 md:h-44 overflow-hidden relative">
        <img
          src={service.image}
          alt={service.alt}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          width={600}
          height={400}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-card/20 to-transparent" />
      </div>
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg md:text-xl font-display font-semibold text-foreground">
            {service.title}
          </h3>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-500" />
        </div>
        <p className="text-muted-foreground font-body font-light leading-relaxed text-sm mb-4">
          {service.description}
        </p>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-foreground group-hover:text-accent transition-colors duration-300">
          Bekijk {service.title.toLowerCase()}
          <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  </motion.div>
);

const CoreServicesSection = () => {
  return (
    <section id="diensten" className="py-16 md:py-24 bg-background">
      <div className="mx-auto px-5 md:px-[90px] max-w-[1920px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-10 md:mb-14"
        >
          <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
            Onze kern
          </p>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
            Waarvoor komt u?
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-px bg-border">
          {coreServices.map((service, i) => (
            <CoreServiceCard key={service.title} service={service} delay={i * 0.12} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoreServicesSection;

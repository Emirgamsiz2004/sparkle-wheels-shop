import { motion } from "framer-motion";
import { Truck, MapPin, Shield } from "lucide-react";
import afleveringImg from "@/assets/aflevering-op-locatie.jpg";

const features = [
  {
    icon: Truck,
    title: "Eigen transport",
    description: "Wij leveren uw auto met onze eigen aanhanger veilig en netjes af.",
  },
  {
    icon: MapPin,
    title: "Heel Nederland",
    description: "Bezorging op de gewenste locatie — bij u thuis of op het werk.",
  },
  {
    icon: Shield,
    title: "Veilig & verzekerd",
    description: "Uw auto wordt zorgvuldig vastgezet en verzekerd vervoerd.",
  },
];

const AfleveringSection = () => {
  return (
    <section className="py-8 md:py-[60px] bg-background">
      <div className="mx-auto px-5 md:px-[90px] max-w-[1920px]">
        <div className="grid lg:grid-cols-[40%_1fr] gap-6 lg:gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative overflow-hidden max-h-[300px]">
              <img
                src={afleveringImg}
                alt="Platin Automotive levert een rode Volkswagen Polo GTI af op locatie met eigen autotransporter"
                className="w-full h-auto object-cover max-h-[300px]"
                loading="lazy"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-2">
              Extra Service
            </p>
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground tracking-tight mb-3">
              Aflevering op locatie.
            </h2>
            <p className="text-sm font-body font-light text-muted-foreground leading-relaxed max-w-2xl mb-5">
              Geen tijd om uw nieuwe auto op te halen? Wij leveren uw aankoop
              persoonlijk af op de gewenste locatie — overal in Nederland.
            </p>

            <div className="grid sm:grid-cols-3 gap-px bg-border">
              {features.map((feature, idx) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="bg-card p-3 md:p-4 flex gap-3 items-start"
                >
                  <feature.icon className="w-4 h-4 text-foreground mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                  <div>
                    <h3 className="text-xs md:text-sm font-display font-semibold text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-[11px] md:text-xs font-body font-light text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <p className="mt-5 text-xs font-body text-muted-foreground/80">
              Aflevering op locatie is beschikbaar bij aankoop van een voertuig. Vraag ernaar tijdens uw afspraak.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AfleveringSection;

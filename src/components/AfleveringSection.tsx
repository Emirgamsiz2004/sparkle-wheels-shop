import { motion } from "framer-motion";
import { ArrowRight, Truck, MapPin, Shield } from "lucide-react";
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
    <section className="py-16 md:py-28 lg:py-36 bg-background">
      <div className="mx-auto px-5 md:px-[90px] max-w-[1920px]">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative overflow-hidden">
              <img
                src={afleveringImg}
                alt="Platin Automotive levert een rode Volkswagen Polo GTI af op locatie met eigen autotransporter"
                className="w-full h-auto object-cover aspect-[4/3]"
                loading="lazy"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Extra Service
            </p>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-5">
              Aflevering op locatie.
            </h2>
            <p className="text-sm md:text-base font-body font-light text-muted-foreground leading-relaxed max-w-2xl mb-10">
              Geen tijd om uw nieuwe auto op te halen? Geen probleem. Wij leveren
              uw aankoop persoonlijk af op de gewenste locatie — overal in
              Nederland. Met onze eigen autotransporter zorgen we ervoor dat uw
              auto veilig, schoon en klaar voor gebruik bij u arriveert.
            </p>

            <div className="grid sm:grid-cols-1 gap-px bg-border">
              {features.map((feature, idx) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="bg-card p-6 md:p-8 flex gap-5 items-start"
                >
                  <feature.icon className="w-5 h-5 text-foreground mt-1 flex-shrink-0" strokeWidth={1.5} />
                  <div>
                    <h3 className="text-base font-display font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm font-body font-light text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10"
            >
              <a
                href="https://wa.me/31618233606?text=Hallo,%20ik%20heb%20een%20vraag%20over%20aflevering%20op%20locatie."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Vraag aflevering aan
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AfleveringSection;

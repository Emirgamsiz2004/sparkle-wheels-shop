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
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <img
                src={afleveringImg}
                alt="Platin Automotive levert een rode Volkswagen Polo GTI af op locatie met eigen autotransporter"
                className="w-full h-auto object-cover aspect-[4/3]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground px-6 py-4 rounded-xl shadow-xl hidden md:block">
              <p className="font-display font-bold text-2xl leading-none">100%</p>
              <p className="font-body text-xs uppercase tracking-wider mt-1">Service</p>
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
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6 text-foreground tracking-tight leading-tight">
              Aflevering
              <br />
              op locatie.
            </h2>
            <p className="text-muted-foreground font-body font-light leading-relaxed mb-10 text-lg">
              Geen tijd om uw nieuwe auto op te halen? Geen probleem. Wij leveren uw
              aankoop persoonlijk af op de gewenste locatie — overal in Nederland. Met
              onze eigen autotransporter zorgen we ervoor dat uw auto veilig, schoon en
              klaar voor gebruik bij u arriveert.
            </p>

            <div className="space-y-6">
              {features.map((feature, idx) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="flex gap-4 items-start"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground font-body font-light text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <a
              href="https://wa.me/31618233606?text=Hallo,%20ik%20heb%20een%20vraag%20over%20aflevering%20op%20locatie."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-10 px-6 py-3 bg-primary text-primary-foreground font-body font-medium rounded-xl hover:bg-primary/90 transition-colors duration-500"
            >
              Vraag aflevering aan
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AfleveringSection;

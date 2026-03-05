import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section id="home" className="relative h-screen w-full overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-background/75" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold leading-[0.95] mb-12 text-foreground tracking-tight"
        >
          Exclusieve Auto's
        </motion.h1>

        <motion.a
          href="#voorraad"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="group flex items-center gap-3 border-b-2 border-foreground/50 hover:border-foreground pb-3 text-sm md:text-base font-body font-medium tracking-[0.3em] uppercase text-foreground/80 hover:text-foreground transition-all duration-300"
        >
          Bekijk Ons Aanbod
        </motion.a>
      </div>

      {/* Scroll indicator */}
      <motion.a
        href="#diensten"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-foreground/25 hover:text-foreground/50 transition-colors"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.a>
    </section>
  );
};

export default HeroSection;
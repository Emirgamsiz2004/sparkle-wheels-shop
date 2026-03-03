import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section id="home" className="relative h-screen w-full overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-background/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-xs md:text-sm tracking-[0.4em] uppercase font-body font-medium text-muted-foreground mb-6"
        >
          Kwaliteit & Vakmanschap
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6 text-foreground"
        >
          Auto's, Service
          <br />
          & Detailing
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="w-16 h-px bg-foreground/40 mb-6"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-sm md:text-base text-muted-foreground max-w-md mb-10 font-body font-light"
        >
          In- en verkoop van auto's, klein onderhoud, reparaties en professionele auto detailing.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <a
            href="#diensten"
            className="bg-primary text-primary-foreground px-8 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase hover:bg-foreground/90 transition-all duration-300"
          >
            Onze Diensten
          </a>
          <a
            href="#contact"
            className="border border-foreground/25 text-foreground px-8 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase hover:border-foreground/60 transition-all duration-300"
          >
            Contact
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.a
        href="#diensten"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-foreground/30 hover:text-foreground/60 transition-colors"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.a>
    </section>
  );
};

export default HeroSection;
